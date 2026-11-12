/* Dockerfile exercise: the learner writes a Dockerfile, rules give instant feedback.

   Usage:
     DockerfileCheck.mount(element, {
       id: "lesson2",                 // key for saving the draft in this browser
       spec: "html shown above the editor (optional)",
       starter: "# FROM ...",
       rules: [{ text: "html", test: (df) => boolean, hint: "html shown when it fails" }],
       solution: "FROM ...\n..."      // revealed after the first check
     });

   A rule's test receives a parsed Dockerfile:
     df.list            [{ instr: "FROM", args: "eclipse-temurin:21-jdk", exec: null | ["java","App"], line: 1 }]
     df.all("RUN")      every RUN instruction
     df.first("CMD")    the first CMD or undefined
     df.last("CMD")     the last CMD or undefined
     df.pos(instr)      index of the first instr in df.list, or -1
*/
const DockerfileCheck = (() => {
  function parse(text) {
    const list = [];
    let buf = "", start = 0;
    text.split("\n").forEach((raw, i) => {
      const line = raw.trim();
      if (!buf && (!line || line.startsWith("#"))) return;
      if (!buf) start = i + 1;
      if (line.endsWith("\\")) { buf += line.slice(0, -1) + " "; return; }
      buf += line;
      const m = buf.match(/^(\w+)\s*(.*)$/);
      if (m) {
        const args = m[2].trim();
        let exec = null;
        if (args.startsWith("[")) { try { const j = JSON.parse(args); if (Array.isArray(j)) exec = j.map(String); } catch { exec = "invalid"; } }
        list.push({ instr: m[1].toUpperCase(), args, exec, line: start });
      }
      buf = "";
    });
    const all = (k) => list.filter((x) => x.instr === k);
    return { list, all, first: (k) => all(k)[0], last: (k) => all(k).slice(-1)[0], pos: (k) => list.findIndex((x) => x.instr === k) };
  }

  function mount(root, opts) {
    const key = "dockerfile-check:" + (opts.id || location.pathname);
    const load = () => { try { return localStorage.getItem(key); } catch { return null; } };
    const save = (v) => { try { localStorage.setItem(key, v); } catch { /* storage unavailable */ } };
    root.classList.add("dfc");
    root.innerHTML = `${opts.spec ? `<div class="dfc-spec">${opts.spec}</div>` : ""}
      <label class="dfc-label">Dockerfile</label>
      <textarea spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Your Dockerfile"></textarea>
      <div class="dfc-buttons"><button type="button" class="dfc-check">Check my Dockerfile</button>
        <button type="button" class="dfc-show" hidden>Show a model answer</button></div>
      <ul class="dfc-results" aria-live="polite"></ul>
      <pre class="dfc-solution" hidden><code></code></pre>`;
    const ta = root.querySelector("textarea");
    ta.value = load() ?? opts.starter ?? "";
    ta.rows = Math.max(8, (opts.solution || "").split("\n").length + 2);
    ta.addEventListener("input", () => save(ta.value));
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText("  ", s, ta.selectionEnd, "end"); }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); check(); }
    });
    const results = root.querySelector(".dfc-results");
    const show = root.querySelector(".dfc-show");
    const sol = root.querySelector(".dfc-solution");
    sol.querySelector("code").textContent = opts.solution || "";

    function check() {
      const df = parse(ta.value);
      let firstFail = true, passed = 0;
      results.innerHTML = opts.rules.map((r) => {
        let ok = false;
        try { ok = !!r.test(df); } catch { ok = false; }
        if (ok) { passed++; return `<li class="is-ok">${r.text}</li>`; }
        const hint = firstFail && r.hint ? `<span class="dfc-hint">${r.hint}</span>` : "";
        firstFail = false;
        return `<li class="is-fail">${r.text}${hint}</li>`;
      }).join("");
      results.insertAdjacentHTML("afterbegin", `<p class="dfc-score">${passed} of ${opts.rules.length} rules pass${passed === opts.rules.length ? ". This Dockerfile is ready to build." : ". The hint is for the first failing rule."}</p>`);
      if (opts.solution) show.hidden = false;
    }
    root.querySelector(".dfc-check").addEventListener("click", check);
    show.addEventListener("click", () => { sol.hidden = !sol.hidden; show.textContent = sol.hidden ? "Show a model answer" : "Hide the model answer"; });
  }
  return { mount, parse };
})();
