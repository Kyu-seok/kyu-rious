// Decision-tree walk: answer an ordered list of yes/no questions for a scenario.
// The first correct "yes" ends the walk at that step's outcome. Every click gets feedback.
//
// Usage: <div class="walk" data-walk="ID"></div>
//        Walk.register("ID", {
//          steps: [{ q: "Question 1?", outcome: "Continue" }, ...],   // asked in this order
//          scenarios: [{ text, stop: stepIndex, why: { [stepIndex]: "reason" } }]
//        });
//        `stop` is the step whose answer is "yes"; every earlier step is "no".

const Walk = (() => {
  function register(id, spec) {
    const mount = () => render(id, spec);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }

  function render(id, { steps, scenarios }) {
    const root = document.querySelector(`.walk[data-walk="${id}"]`);
    if (!root) return;
    let done = 0, clean = 0;
    const score = el("div", "quiz-score", `0 / ${scenarios.length} walked`);

    scenarios.forEach((sc, si) => {
      const box = el("div", "walk-sc");
      box.append(el("div", "num", `SCENARIO ${si + 1}`));
      const text = el("div", "prompt");
      text.innerHTML = sc.text;
      box.append(text);
      const trail = el("div", "walk-trail");
      box.append(trail);
      root.append(box);
      let misses = 0;

      const ask = (i) => {
        const row = el("div", "walk-step");
        const q = el("div", "walk-q");
        q.innerHTML = `<span class="walk-n">${i + 1}</span> ${steps[i].q}`;
        const opts = el("div", "sort-opts");
        const fb = el("div", "quiz-fb");
        row.append(q, opts, fb);
        trail.append(row);
        const truth = i === sc.stop;
        ["Yes", "No"].forEach((label) => {
          const b = el("button", null, label);
          b.type = "button";
          b.addEventListener("click", () => {
            const said = label === "Yes";
            const ok = said === truth;
            opts.querySelectorAll("button").forEach((x) => {
              x.disabled = true;
              if ((x.textContent === "Yes") === truth) x.classList.add("correct");
            });
            if (!ok) { b.classList.add("wrong"); misses++; }
            fb.className = `quiz-fb show ${ok ? "ok" : "no"}`;
            fb.innerHTML = `<span class="verdict">${ok ? "Correct" : `Not quite: ${truth ? "yes" : "no"}`}</span> ${(sc.why && sc.why[i]) || ""}`;
            if (truth) finish(); else ask(i + 1);
          });
          opts.append(b);
        });
      };

      const finish = () => {
        const out = el("div", "walk-out");
        out.innerHTML = `→ <strong>${steps[sc.stop].outcome}</strong>${misses ? ` <span class="muted">(${misses} miss${misses > 1 ? "es" : ""})</span>` : ""}`;
        trail.append(out);
        done++; if (!misses) clean++;
        score.textContent = done === scenarios.length
          ? `Clean walks: ${clean} / ${scenarios.length}${clean === scenarios.length ? " (all correct)" : ". Reload the page to retry the misses later."}`
          : `${done} / ${scenarios.length} walked`;
      };

      ask(0);
    });
    root.append(score);
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  return { register };
})();
