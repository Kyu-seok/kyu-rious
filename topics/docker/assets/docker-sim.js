/* Docker simulator: a small typed terminal plus a picture of images and containers,
   with optional auto-checked challenges.

   Usage:
     DockerSim.mount(element, {
       images: ["alpine:3.20"],          // already pulled (optional)
       challenges: [{ text: "html", check: (sim) => boolean }],
       hint: "docker run alpine:3.20 echo hi"   // placeholder text (optional)
     });

   A check receives { state, events, after(i, pred) } where events is a list of
   { i, kind, ...details } in the order they happened. Kinds: run, ps, exec, read,
   write, diff, stop, start, restart, rm, rmi, pull, logs.
*/
const DockerSim = (() => {
  const CATALOG = {
    "alpine:3.20": { id: "ab3fe4defd29", size: "7.8MB", cmd: ["/bin/sh"], files: { "/etc/os-release": 'NAME="Alpine Linux"\nVERSION_ID=3.20', "/etc/motd": "Welcome to Alpine!" } },
    "alpine:latest": { id: "b0c9d60fc5e3", size: "7.8MB", cmd: ["/bin/sh"], files: { "/etc/os-release": 'NAME="Alpine Linux"\nVERSION_ID=3.22', "/etc/motd": "Welcome to Alpine!" } },
    "nginx:alpine": { id: "4ff102c5d78d", size: "48.3MB", cmd: ["nginx", "-g", "daemon off;"], files: { "/etc/os-release": 'NAME="Alpine Linux"', "/usr/share/nginx/html/index.html": "<h1>Welcome to nginx!</h1>" } },
    "eclipse-temurin:21-jre": { id: "9a1c7e0d2b11", size: "262MB", cmd: ["jshell"], files: { "/etc/os-release": 'NAME="Ubuntu"', "/opt/java/openjdk/release": 'JAVA_VERSION="21"' } },
  };
  const ADJ = ["brave", "calm", "eager", "fervent", "jolly", "keen", "nifty", "quirky", "serene", "zealous"];
  const SCI = ["turing", "hopper", "lovelace", "curie", "noether", "knuth", "ritchie", "liskov", "dijkstra", "shannon"];
  const hex = (n) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ref = (r) => (r.includes(":") ? r : r + ":latest");

  // Split a command line into words, honouring quotes. Unquoted ; && > >> become their own tokens.
  function tokenize(line) {
    const out = []; let cur = null, q = null;
    const push = () => { if (cur !== null) out.push(cur); cur = null; };
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === q) q = null; else cur += c; continue; }
      if (c === "'" || c === '"') { q = c; if (cur === null) cur = ""; continue; }
      if (/\s/.test(c)) { push(); continue; }
      if (c === ";") { push(); out.push({ op: ";" }); continue; }
      if (c === "&" && line[i + 1] === "&") { push(); out.push({ op: "&&" }); i++; continue; }
      if (c === ">") { push(); if (line[i + 1] === ">") { out.push({ op: ">>" }); i++; } else out.push({ op: ">" }); continue; }
      cur = (cur ?? "") + c;
    }
    push();
    return out;
  }
  const words = (toks) => toks.map((t) => (typeof t === "string" ? t : t.op));

  function mount(root, opts = {}) {
    let state, events, n;
    const reset = () => {
      state = { images: {}, containers: [] };
      (opts.images || []).forEach((r) => { if (CATALOG[ref(r)]) state.images[ref(r)] = CATALOG[ref(r)]; });
      events = []; n = 0;
    };
    reset();
    const log = (kind, d = {}) => events.push({ i: n++, kind, ...d });
    const api = () => ({ state, events, after: (i, pred) => events.find((e) => e.i > i && pred(e)) });

    // ---- DOM
    root.classList.add("dsim");
    root.innerHTML = `
      <div class="dsim-term" role="log" aria-live="polite"></div>
      <form class="dsim-prompt"><span aria-hidden="true">$</span>
        <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type a docker command">
        <button type="submit">Run</button></form>
      <div class="dsim-world"><div class="dsim-col"><h4>Images <small>read-only</small></h4><div class="dsim-images"></div></div>
        <div class="dsim-col"><h4>Containers</h4><div class="dsim-containers"></div></div></div>
      <ol class="dsim-goals"></ol>
      <button type="button" class="dsim-reset">Reset simulator</button>`;
    const term = root.querySelector(".dsim-term");
    const input = root.querySelector("input");
    input.placeholder = opts.hint || "docker run alpine:3.20 echo hello";
    const history = []; let hpos = 0;

    const print = (text, cls = "") => {
      const p = document.createElement("pre");
      if (cls) p.className = cls;
      p.textContent = text;
      term.append(p);
      term.scrollTop = term.scrollHeight;
    };
    const note = (text) => print(text, "dsim-note");
    const err = (text) => print(text, "dsim-err");

    const byName = (k) => state.containers.find((c) => c.name === k || c.id.startsWith(k) && k.length >= 3);
    const usersOf = (r) => state.containers.filter((c) => c.image === r);

    // ---- the tiny shell that runs inside a container
    function fsRead(c, path) {
      if (path in c.layer) return c.layer[path] === null ? undefined : c.layer[path];
      return CATALOG[c.image].files[path];
    }
    function runScript(c, toks, from) {
      const out = []; let code = 0, longRunning = false;
      const cmds = [[]];
      toks.forEach((t) => { if (t.op === ";" || t.op === "&&") cmds.push([]); else cmds[cmds.length - 1].push(t); });
      for (const cmd of cmds) {
        if (!cmd.length) continue;
        let redir = null, target = null;
        const k = cmd.findIndex((t) => t.op === ">" || t.op === ">>");
        const argv = words(k >= 0 ? cmd.slice(0, k) : cmd);
        if (k >= 0) { redir = cmd[k].op; target = words(cmd.slice(k + 1))[0]; }
        const [prog, ...args] = argv;
        let text = null; code = 0;
        const expand = (s) => s.replace(/\$(\w+)/g, (_, v) => c.env[v] ?? "");
        switch (prog) {
          case "echo": text = args.map(expand).join(" "); break;
          case "cat": {
            const v = fsRead(c, args[0]);
            log("read", { name: c.name, image: c.image, path: args[0], found: v !== undefined, from });
            if (v === undefined) { out.push(`cat: can't open '${args[0]}': No such file or directory`); code = 1; } else text = v;
            break;
          }
          case "touch": c.layer[args[0]] = fsRead(c, args[0]) ?? ""; log("write", { name: c.name, path: args[0] }); break;
          case "rm": if (fsRead(c, args[0]) === undefined) { out.push(`rm: can't remove '${args[0]}': No such file or directory`); code = 1; } else { c.layer[args[0]] = null; log("write", { name: c.name, path: args[0] }); } break;
          case "ls": {
            const all = new Set([...Object.keys(CATALOG[c.image].files), ...Object.keys(c.layer)]);
            const dir = (args[0] || "/").replace(/\/?$/, "/");
            const names = [...all].filter((p) => fsRead(c, p) !== undefined && p.startsWith(dir)).map((p) => p.slice(dir.length).split("/")[0]);
            text = [...new Set(names)].sort().join("  ");
            break;
          }
          case "hostname": text = c.id.slice(0, 12); break;
          case "whoami": text = "root"; break;
          case "pwd": text = "/"; break;
          case "env": case "printenv": text = Object.entries(c.env).map(([a, b]) => `${a}=${b}`).concat("HOSTNAME=" + c.id.slice(0, 12)).join("\n"); break;
          case "true": break;
          case "false": code = 1; break;
          case "sleep": case "nginx": case "jshell": case "tail": longRunning = true; break;
          case "sh": case "/bin/sh":
            if (args[0] === "-c" && args[1] !== undefined) { const r = runScript(c, tokenize(args[1]), from); out.push(...r.out); code = r.code; longRunning = r.longRunning; }
            else if (from !== "exec") { /* sh with no terminal reads nothing and exits */ }
            else { out.push("(sim) Interactive shells aren't simulated. Run one command at a time: docker exec NAME ls /"); }
            break;
          default:
            return { out, code: 127, longRunning: false, notFound: prog };
        }
        if (text !== null) {
          if (redir) {
            c.layer[target] = redir === ">>" ? (fsRead(c, target) ?? "") + text + "\n" : text + "\n";
            log("write", { name: c.name, path: target });
          } else out.push(text);
        }
        if (code !== 0 || longRunning) break;
      }
      return { out, code, longRunning };
    }

    // ---- docker commands
    function pull(r, quiet) {
      if (state.images[r]) return true;
      if (!CATALOG[r]) { err(`Error response from daemon: pull access denied for ${r.split(":")[0]}, repository does not exist or may require 'docker login'`); return false; }
      if (!quiet) note(`${r.split(":")[1]}: Pulling from library/${r.split(":")[0]}\nStatus: Downloaded newer image for ${r}`);
      state.images[r] = CATALOG[r];
      log("pull", { image: r });
      return true;
    }

    function cmdRun(args) {
      const o = { d: false, rm: false, it: false, name: null, env: {}, ports: [] };
      let i = 0;
      for (; i < args.length && args[i].startsWith("-"); i++) {
        const a = args[i];
        if (a === "-d" || a === "--detach") o.d = true;
        else if (a === "--rm") o.rm = true;
        else if (/^-[it]+$/.test(a) || a === "--interactive" || a === "--tty") o.it = true;
        else if (a === "-dit" || a === "-itd") { o.d = true; o.it = true; }
        else if (a === "--name") o.name = args[++i];
        else if (a === "-e" || a === "--env") { const [k, ...v] = (args[++i] || "").split("="); o.env[k] = v.join("="); }
        else if (a === "-p" || a === "--publish") o.ports.push(args[++i]);
        else return err(`unknown flag: ${a}\nSee 'docker run --help'.`);
      }
      const image = args[i] && ref(args[i]);
      if (!image) return err('"docker run" requires at least 1 argument.\nUsage:  docker run [OPTIONS] IMAGE [COMMAND] [ARG...]');
      if (o.name && byName(o.name)) {
        return err(`docker: Error response from daemon: Conflict. The container name "/${o.name}" is already in use by container "${byName(o.name).id}". You have to remove (or rename) that container to be able to reuse that name.`);
      }
      if (!state.images[image]) {
        note(`Unable to find image '${image}' locally`);
        if (!pull(image)) return;
      }
      const cmd = args.slice(i + 1);
      const c = {
        id: hex(64), name: o.name || `${ADJ[Math.floor(Math.random() * 10)]}_${SCI[Math.floor(Math.random() * 10)]}`,
        image, cmd: cmd.length ? cmd : CATALOG[image].cmd, env: o.env, ports: o.ports, layer: {}, running: false, exit: 0, logs: [], starts: 0,
      };
      const r = startProc(c, "run");
      if (r.notFound) {
        err(`docker: Error response from daemon: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: "${r.notFound}": executable file not found in $PATH: unknown.`);
        c.exit = 127;
        if (!o.rm) state.containers.push(c);
        log("run", { name: c.name, image, detached: o.d, rm: o.rm, running: false, exit: 127 });
        return;
      }
      if (o.d) print(c.id);
      else if (r.out.length) print(r.out.join("\n"));
      if (!o.d && c.running) note("(sim) Without -d this would hold your terminal until the process ends (Ctrl+C). Here it keeps running in the background so you can carry on.");
      if (o.it && CATALOG[image].cmd[0] === "/bin/sh" && !cmd.length) note("(sim) Interactive shells aren't simulated, so this container exited straight away. Use docker exec NAME COMMAND instead.");
      if (o.rm && !c.running) note(`(--rm) Container ${c.name} was removed as soon as it exited.`);
      else state.containers.push(c);
      if (o.rm && c.running) { c.autoRemove = true; }
      log("run", { name: c.name, image, detached: o.d, rm: o.rm, running: c.running, exit: c.exit, cmd: words(cmd).join(" ") });
    }

    function startProc(c, from) {
      const r = runScript(c, c.cmd, from);
      c.starts++;
      c.logs.push(...r.out);
      c.running = r.longRunning;
      c.exit = r.longRunning ? 0 : r.code;
      return r;
    }

    function cmdPs(args) {
      const all = args.includes("-a") || args.includes("--all");
      const rows = state.containers.filter((c) => all || c.running);
      const pad = (s, w) => (s.length > w ? s.slice(0, w - 1) + "…" : s.padEnd(w));
      const lines = [pad("CONTAINER ID", 14) + pad("IMAGE", 14) + pad("COMMAND", 18) + pad("STATUS", 12) + "NAMES"];
      rows.forEach((c) => lines.push(pad(c.id.slice(0, 12), 14) + pad(c.image, 14) + pad(`"${c.cmd.join(" ")}"`, 18) + pad(c.running ? "Up" : `Exited (${c.exit})`, 12) + c.name));
      print(lines.join("\n"));
      log("ps", { all, showedExited: rows.some((c) => !c.running) });
    }

    function needC(k) {
      const c = k && byName(k);
      if (!c) err(`Error response from daemon: No such container: ${k || ""}`);
      return c;
    }

    function cmdExec(args) {
      const flags = []; let i = 0;
      while (args[i] && args[i].startsWith("-")) flags.push(args[i++]);
      const c = needC(args[i]); if (!c) return;
      if (!c.running) return err(`Error response from daemon: Container ${c.id} is not running`);
      const rest = args.slice(i + 1);
      if (!rest.length) return err('"docker exec" requires at least 2 arguments.');
      if (rest[0] === "sh" && rest[1] === undefined) return note("(sim) Interactive shells aren't simulated. Run one command at a time: docker exec NAME ls /");
      const r = runScript(c, rest, "exec");
      if (r.notFound) return err(`OCI runtime exec failed: exec failed: unable to start container process: exec: "${r.notFound}": executable file not found in $PATH: unknown`);
      if (r.out.length) print(r.out.join("\n"));
      log("exec", { name: c.name, cmd: rest.join(" ") });
    }

    function cmdStop(args) {
      args.filter((a) => !a.startsWith("-")).forEach((k) => {
        const c = needC(k); if (!c) return;
        if (c.running && /sleep|tail/.test(c.cmd.join(" "))) note(`(sim) ${c.cmd[0] === "sh" ? "The shell" : "sleep"} runs as PID 1 and ignores SIGTERM, so Docker waited the 10-second grace period, then sent SIGKILL. Lesson 7 covers why.`);
        const wasRunning = c.running;
        c.running = false; c.exit = wasRunning ? (/sleep|tail/.test(c.cmd.join(" ")) ? 137 : 0) : c.exit;
        print(k);
        log("stop", { name: c.name });
        if (c.autoRemove) { state.containers = state.containers.filter((x) => x !== c); note(`(--rm) ${c.name} was removed when it stopped.`); log("rm", { name: c.name }); }
      });
    }

    function cmdStart(args, kind = "start") {
      args.filter((a) => !a.startsWith("-")).forEach((k) => {
        const c = needC(k); if (!c) return;
        if (kind === "restart" && c.running) c.running = false;
        if (!c.running) startProc(c, "start");
        print(k);
        if (!c.running) note(`(sim) ${c.name} started, ran its command (${c.cmd.join(" ")}), and exited again.`);
        log(kind, { name: c.name, running: c.running });
      });
    }

    function cmdRm(args) {
      const force = args.includes("-f") || args.includes("--force");
      args.filter((a) => !a.startsWith("-")).forEach((k) => {
        const c = needC(k); if (!c) return;
        if (c.running && !force) return err(`Error response from daemon: You cannot remove a running container ${c.id}. Stop the container before attempting removal or force remove`);
        state.containers = state.containers.filter((x) => x !== c);
        print(k);
        log("rm", { name: c.name, layer: Object.keys(c.layer) });
      });
    }

    function cmdRmi(args) {
      const force = args.includes("-f") || args.includes("--force");
      args.filter((a) => !a.startsWith("-")).forEach((k) => {
        const r = ref(k);
        if (!state.images[r]) return err(`Error response from daemon: No such image: ${r}`);
        const u = usersOf(r);
        if (u.length && !force) return err(`Error response from daemon: conflict: unable to remove repository reference "${k}" (must force) - container ${u[0].id.slice(0, 12)} is using its referenced image ${state.images[r].id}`);
        delete state.images[r];
        print(`Untagged: ${r}\nDeleted: sha256:${CATALOG[r].id}…`);
        log("rmi", { image: r });
      });
    }

    function cmdDiff(args) {
      const c = needC(args[0]); if (!c) return;
      const lines = Object.entries(c.layer).map(([p, v]) => {
        const inImage = p in CATALOG[c.image].files;
        return (v === null ? "D " : inImage ? "C " : "A ") + p;
      });
      if (lines.length) print(lines.join("\n"));
      log("diff", { name: c.name, entries: lines });
    }

    function cmdImages() {
      const lines = ["REPOSITORY        TAG      IMAGE ID       SIZE"];
      Object.entries(state.images).forEach(([r, im]) => { const [repo, tag] = r.split(":"); lines.push(repo.padEnd(18) + tag.padEnd(9) + im.id.padEnd(15) + im.size); });
      print(lines.join("\n"));
      log("images");
    }

    const HELP = `Supported: docker run [-d] [--rm] [--name N] [-e K=V] [-p H:C] IMAGE [COMMAND...]
  docker ps [-a] · docker exec NAME COMMAND · docker stop|start|restart NAME
  docker rm [-f] NAME · docker images · docker pull IMAGE · docker rmi IMAGE
  docker diff NAME · docker logs NAME · docker top NAME · clear
Inside containers: echo, cat, touch, rm, ls, hostname, env, sleep, sh -c '...'
Images you can pull: ${Object.keys(CATALOG).join(", ")}`;

    function exec(line) {
      print("$ " + line, "dsim-cmd");
      const toks = tokenize(line);
      const w = words(toks);
      if (!w.length) return;
      if (w[0] === "clear") { term.textContent = ""; return; }
      if (w[0] === "help") return print(HELP);
      if (w[0] !== "docker") return err(`(sim) Only docker commands run here. Type help for the list.`);
      if (toks.some((t) => t.op === ">" || t.op === ">>")) {
        note("(sim) The > is outside quotes, so your Mac's shell would handle it and write the file on your Mac, not in the container. Quote the whole command: docker exec NAME sh -c 'echo hi > /note.txt'");
        const k = toks.findIndex((t) => t.op);
        return exec(words(toks.slice(0, k)).map((x) => (/\s/.test(x) ? `'${x}'` : x)).join(" "));
      }
      let [, sub, ...args] = w;
      if (sub === "container" || sub === "image") {
        const map = { ls: sub === "image" ? "images" : "ps", rm: sub === "image" ? "rmi" : "rm" };
        sub = map[args[0]] || args[0]; args = args.slice(1);
      }
      const rawArgs = toks.slice(2);
      switch (sub) {
        case "run": return cmdRun(rawArgs.map((t) => (typeof t === "string" ? t : t.op)));
        case "ps": return cmdPs(args);
        case "exec": return cmdExec(args);
        case "stop": case "kill": return cmdStop(args);
        case "start": return cmdStart(args);
        case "restart": return cmdStart(args, "restart");
        case "rm": return cmdRm(args);
        case "rmi": return cmdRmi(args);
        case "images": return cmdImages();
        case "pull": { const r = ref(args[0] || ""); if (state.images[r]) return print(`Status: Image is up to date for ${r}`); return pull(r); }
        case "diff": return cmdDiff(args);
        case "logs": { const c = needC(args.find((a) => !a.startsWith("-"))); if (!c) return; if (c.logs.length) print(c.logs.join("\n")); log("logs", { name: c.name }); return; }
        case "top": { const c = needC(args[0]); if (!c) return; if (!c.running) return err(`Error response from daemon: Container ${c.id} is not running`); return print(`UID    PID    CMD\nroot   ${2400 + c.starts * 7}   ${c.cmd.join(" ")}`); }
        default: return err(`docker: '${sub}' isn't supported in this simulator. Type help for the list.`);
      }
    }

    // ---- render the world and the goals
    function render() {
      const imgs = root.querySelector(".dsim-images");
      const list = Object.keys(state.images);
      imgs.innerHTML = list.length ? list.map((r) => `<div class="dsim-image"><b>${esc(r)}</b><small>${esc(state.images[r].id)} · used by ${usersOf(r).length}</small></div>`).join("") : `<p class="dsim-empty">No images yet</p>`;
      const cs = root.querySelector(".dsim-containers");
      cs.innerHTML = state.containers.length ? state.containers.map((c) => {
        const files = Object.entries(c.layer).map(([p, v]) => `<li>${v === null ? "deleted " : ""}${esc(p)}</li>`).join("");
        return `<div class="dsim-c ${c.running ? "is-up" : "is-down"}">
          <div class="dsim-c-head"><b>${esc(c.name)}</b><span>${c.running ? "running" : `exited (${c.exit})`}</span></div>
          <div class="dsim-layer"><small>writable layer</small>${files ? `<ul>${files}</ul>` : `<p class="dsim-empty">no changes</p>`}</div>
          <div class="dsim-base"><small>image ${esc(c.image)} (read-only)</small></div></div>`;
      }).join("") : `<p class="dsim-empty">No containers</p>`;
      const goals = root.querySelector(".dsim-goals");
      const ch = opts.challenges || [];
      goals.hidden = !ch.length;
      let done = 0;
      goals.innerHTML = ch.map((g) => { const ok = !!g.done || (g.done = safe(g.check)); if (ok) done++; return `<li class="${ok ? "is-done" : ""}">${g.text}</li>`; }).join("");
      if (ch.length) goals.insertAdjacentHTML("afterbegin", `<p class="dsim-progress">Challenges: ${done} of ${ch.length} done</p>`);
    }
    const safe = (f) => { try { return !!f(api()); } catch { return false; } };

    root.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const line = input.value.trim(); if (!line) return;
      history.push(line); hpos = history.length; input.value = "";
      exec(line); render();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && hpos > 0) { input.value = history[--hpos]; e.preventDefault(); }
      if (e.key === "ArrowDown") { hpos = Math.min(history.length, hpos + 1); input.value = history[hpos] || ""; e.preventDefault(); }
    });
    root.querySelector(".dsim-reset").addEventListener("click", () => {
      reset(); (opts.challenges || []).forEach((g) => { g.done = false; }); term.textContent = "";
      note("Fresh Docker host. Type help to see what the simulator understands."); render();
    });
    note("Fresh Docker host. Type help to see what the simulator understands.");
    render();
    return { exec: (l) => { exec(l); render(); }, state: () => state, events: () => events };
  }
  return { mount, tokenize };
})();
