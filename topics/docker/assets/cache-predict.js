/* Build-cache prediction: the learner marks which Dockerfile steps will rerun, then checks.

   Usage:
     CachePredict.mount(element, {
       lines: [
         { text: "FROM maven:3.9-eclipse-temurin-21 AS build" },
         { text: "EXPOSE 8080", meta: true },   // a recorded setting, not a build step: not clickable
         null,                                  // a blank line between stages
       ],
       scenarios: [
         { label: "You edit App.java", reruns: [4, 5, 9], why: "html shown after checking" },
       ],
     });

   Indexes in `reruns` count every entry of `lines`, including nulls.
*/
const CachePredict = (() => {
  function mount(root, opts) {
    root.classList.add("cp");
    let current = 0;

    function render() {
      const sc = opts.scenarios[current];
      const picked = new Set();
      let checked = false;
      root.innerHTML = `
        ${opts.scenarios.length > 1 ? `<div class="cp-tabs" role="tablist">${opts.scenarios.map((s, i) =>
          `<button type="button" role="tab" aria-selected="${i === current}" data-i="${i}">${i + 1}. ${s.label}</button>`).join("")}</div>` : ""}
        <p class="cp-task"><b>${sc.label}.</b> Then you run <code>docker build</code> again. Click every step that will <em>rerun</em>, then check. Leave them all unmarked if you think nothing reruns.</p>
        <ol class="cp-lines"></ol>
        <div class="cp-buttons"><button type="button" class="cp-check">Check</button><button type="button" class="cp-reset">Try again</button></div>
        <p class="cp-result" aria-live="polite"></p>`;
      root.querySelectorAll(".cp-tabs button").forEach((b) => b.addEventListener("click", () => { current = +b.dataset.i; render(); }));
      const list = root.querySelector(".cp-lines");
      opts.lines.forEach((ln, i) => {
        const li = document.createElement("li");
        if (!ln) { li.className = "cp-gap"; li.setAttribute("aria-hidden", "true"); list.append(li); return; }
        if (ln.meta) {
          li.className = "cp-meta";
          li.innerHTML = `<code></code><span class="cp-tag">setting</span>`;
          li.querySelector("code").textContent = ln.text;
          list.append(li);
          return;
        }
        li.innerHTML = `<button type="button" aria-pressed="false"><code></code><span class="cp-tag"></span></button>`;
        li.querySelector("code").textContent = ln.text;
        const btn = li.querySelector("button");
        btn.addEventListener("click", () => {
          if (checked) return;
          picked.has(i) ? picked.delete(i) : picked.add(i);
          btn.setAttribute("aria-pressed", picked.has(i));
          li.classList.toggle("is-picked", picked.has(i));
          li.querySelector(".cp-tag").textContent = picked.has(i) ? "reruns" : "";
        });
        li.dataset.i = i;
        list.append(li);
      });
      root.querySelector(".cp-check").addEventListener("click", () => {
        if (checked) return;
        checked = true;
        const truth = new Set(sc.reruns);
        let wrong = 0;
        list.querySelectorAll("li[data-i]").forEach((li) => {
          const i = +li.dataset.i, should = truth.has(i), did = picked.has(i);
          li.classList.add(should ? "is-run" : "is-cached");
          if (should !== did) { li.classList.add("is-miss"); wrong++; }
          li.querySelector(".cp-tag").textContent = should ? (did ? "reruns ✓" : "reruns, missed") : (did ? "cached, not a rerun" : "CACHED");
          li.querySelector("button").disabled = true;
        });
        root.querySelector(".cp-result").innerHTML = `<b class="${wrong ? "wrong" : "right"}">${wrong ? `${wrong} step${wrong > 1 ? "s" : ""} off.` : "All correct."}</b> ${sc.why || ""}`;
      });
      root.querySelector(".cp-reset").addEventListener("click", render);
    }
    render();
  }
  return { mount };
})();
