// Debug agent traces: click the first step that went wrong, name the failure mode, check.
//
// Markup:
//   <div class="tracer"
//        data-modes='["Invalid tool","Tool failure"]'
//        data-traces='[{
//          "task": "What is 120 lb in kg?",
//          "tools": ["lbs_to_kg(lbs)"],
//          "steps": [{"k":"thought","t":"Convert pounds."},{"k":"act","t":"lbs_to_kg(lbs=100)"},
//                    {"k":"obs","t":"45.36"},{"k":"answer","t":"About 45 kg."}],
//          "bad": 1, "mode": "Tool failure", "why": "…"
//        }]'></div>
//
// Step kinds: thought, act, obs, answer (the ReAct format). "bad" is the 0-based index of
// the first wrong step. Each trace is checked on its own: the step and the mode are marked
// right or wrong, then the explanation is shown. A running total sits at the bottom.
(function () {
  const css = `
  .tracer{font:.9rem/1.45 var(--sans);margin:1.6rem 0}
  .tracer .trace{background:var(--card);border:1px solid var(--rule);border-radius:6px;padding:1rem 1.1rem;margin:0 0 1.1rem}
  .tracer .head{display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap;margin-bottom:.4rem}
  .tracer .num{font:600 .72rem/1 var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .tracer .task{font:1rem/1.45 var(--serif);margin:0 0 .5rem}
  .tracer .tools{font-size:.8rem;color:var(--muted);margin:0 0 .7rem}
  .tracer .tools code{font-size:.78rem;margin-right:.3rem;white-space:nowrap}
  .tracer ol{list-style:none;margin:0;padding:0;border-left:2px solid var(--rule)}
  .tracer li{display:grid;grid-template-columns:6.2rem 1fr;gap:.6rem;padding:.4rem .6rem;cursor:pointer;border-radius:0 4px 4px 0}
  .tracer li:hover{background:var(--accent-soft)}
  .tracer li .k{font:600 .7rem/1.9 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  .tracer li.act .k{color:var(--app)} .tracer li.obs .k{color:var(--model)} .tracer li.answer .k{color:var(--ok)}
  .tracer li .t{overflow-wrap:anywhere}
  .tracer li.act .t,.tracer li.obs .t{font:.8rem/1.6 var(--mono)}
  .tracer li.picked{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--accent)}
  .tracer li.right{background:var(--ok-soft);box-shadow:inset 3px 0 0 var(--ok)}
  .tracer li.wrong{background:var(--bad-soft);box-shadow:inset 3px 0 0 var(--bad)}
  .tracer li.truth{box-shadow:inset 3px 0 0 var(--ok);outline:1px dashed var(--ok)}
  .tracer .row{margin-top:.8rem;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}
  .tracer select{font:.86rem var(--sans);padding:.35rem .5rem;border:1px solid var(--rule);border-radius:4px;background:var(--bg);color:var(--fg);min-width:14rem;max-width:100%}
  .tracer select.right{border-color:var(--ok);background:var(--ok-soft)} .tracer select.wrong{border-color:var(--bad);background:var(--bad-soft)}
  .tracer button{font:600 .85rem var(--sans);cursor:pointer;background:none;border:1px solid var(--rule);border-radius:4px;padding:.35rem .8rem;color:var(--fg)}
  .tracer button:hover{border-color:var(--accent)}
  .tracer .why{display:none;font-size:.86rem;margin-top:.7rem;padding:.6rem .8rem;border-radius:5px}
  .tracer .why.ok{display:block;background:var(--ok-soft)} .tracer .why.no{display:block;background:var(--bad-soft)}
  .tracer .total{font-weight:600}
  @media (max-width:560px){.tracer li{grid-template-columns:1fr;gap:0}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const LABEL = { thought: "Thought", act: "Act", obs: "Observation", answer: "Answer" };

  function setup(el) {
    const modes = JSON.parse(el.dataset.modes);
    const traces = JSON.parse(el.dataset.traces);
    const options = `<option value="">What kind of failure?</option>` + modes.map((m) => `<option>${esc(m)}</option>`).join("");
    el.innerHTML = traces.map((tr, i) => `
      <div class="trace" data-i="${i}">
        <div class="head"><span class="num">Trace ${i + 1} of ${traces.length}</span></div>
        <p class="task"><strong>Task:</strong> ${tr.task}</p>
        <p class="tools">Tool inventory: ${tr.tools.map((t) => `<code>${esc(t)}</code>`).join("")}</p>
        <ol>${tr.steps.map((s, j) => `<li class="${s.k}" data-j="${j}" tabindex="0" role="button"><span class="k">${LABEL[s.k] || s.k}</span><span class="t">${s.t}</span></li>`).join("")}</ol>
        <div class="row"><select aria-label="Failure mode">${options}</select><button data-a="check">Check</button><button data-a="retry">Retry</button></div>
        <div class="why"></div>
      </div>`).join("") + `<p class="total"></p>`;

    const results = traces.map(() => null);
    const total = el.querySelector(".total");
    const renderTotal = () => {
      const done = results.filter((r) => r !== null).length;
      const right = results.filter((r) => r === true).length;
      total.textContent = done ? `${right} of ${done} checked traces fully right (step and mode)` + (done < traces.length ? ` · ${traces.length - done} to go` : "") : "";
    };

    el.querySelectorAll(".trace").forEach((card) => {
      const i = Number(card.dataset.i);
      const tr = traces[i];
      const items = [...card.querySelectorAll("li")];
      const select = card.querySelector("select");
      const why = card.querySelector(".why");
      let picked = null, checked = false;

      const pick = (li) => {
        if (checked) return;
        items.forEach((x) => x.classList.remove("picked"));
        li.classList.add("picked");
        picked = Number(li.dataset.j);
      };
      items.forEach((li) => {
        li.addEventListener("click", () => pick(li));
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(li); } });
      });

      card.addEventListener("click", (e) => {
        const a = e.target.dataset && e.target.dataset.a;
        if (a === "check") {
          if (picked === null || !select.value) {
            why.className = "why no";
            why.textContent = "Click the first step that went wrong and choose a failure mode, then check.";
            return;
          }
          checked = true;
          const stepOk = picked === tr.bad, modeOk = select.value === tr.mode;
          items.forEach((x) => x.classList.remove("picked"));
          items[picked].classList.add(stepOk ? "right" : "wrong");
          if (!stepOk) items[tr.bad].classList.add("truth");
          select.classList.add(modeOk ? "right" : "wrong");
          why.className = "why " + (stepOk && modeOk ? "ok" : "no");
          const verdict = stepOk && modeOk ? "Correct." : `${stepOk ? "Right step" : `First wrong step: ${LABEL[tr.steps[tr.bad].k]} (outlined)`}; ${modeOk ? "right mode" : `mode: ${esc(tr.mode)}`}.`;
          why.innerHTML = `<strong>${verdict}</strong> ${tr.why}`;
          results[i] = stepOk && modeOk;
          renderTotal();
        } else if (a === "retry") {
          checked = false; picked = null;
          items.forEach((x) => x.classList.remove("picked", "right", "wrong", "truth"));
          select.value = ""; select.classList.remove("right", "wrong");
          why.className = "why"; why.textContent = "";
          results[i] = null;
          renderTotal();
        }
      });
    });
  }
  document.querySelectorAll(".tracer").forEach(setup);
})();
