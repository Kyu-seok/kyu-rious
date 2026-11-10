// "Will it fit?" GPU memory calculator, using Huyen's back-of-the-napkin formulas (Ch. 7, Memory Math).
//
// Markup:
//   <div class="memcalc"
//        data-modes='["inference","full","lora"]'            (optional; which modes to offer)
//        data-challenges='[{"text":"Serve a 13B model on a 24 GB GPU.","params":13,"gpu":24,"modes":["inference"]}]'></div>
//
// Formulas (GB, with N in billions):
//   weights          = N × bytes per weight            (FP32 4, FP16/BF16 2, INT8 1, 4-bit 0.5)
//   inference extra  = 20% of weights                  (activations + KV cache, Huyen's rule of thumb)
//   training extra   = trainable × 3 values × 2 bytes  (gradient + two Adam states, 16-bit)
//   LoRA trainable   = 1% of N                         (an assumption; real adapters are often far smaller)
// Training activations are not counted (they can be large; see gradient checkpointing).
// Full finetuning below 16 bits is flagged as non-standard and never counts as fitting.
// Check judges only challenges whose model size and GPU match the knobs; one passes when its
// mode is allowed and the setup fits.
(function () {
  const css = `
  .memcalc{font:.92rem/1.45 var(--sans);background:var(--card);border:1px solid var(--rule);border-radius:6px;padding:1rem 1.1rem;margin:1.6rem 0}
  .memcalc .knobs{display:grid;grid-template-columns:auto 1fr;gap:.55rem .9rem;align-items:center}
  .memcalc .knobs label{font-weight:600}
  .memcalc .seg{display:flex;flex-wrap:wrap;gap:.3rem}
  .memcalc .seg button{font:.84rem var(--sans);padding:.3rem .6rem;border:1px solid var(--rule);border-radius:4px;background:var(--bg);color:var(--fg);cursor:pointer}
  .memcalc .seg button[aria-pressed=true]{border-color:var(--accent);background:var(--accent-soft);font-weight:600}
  .memcalc .bar{position:relative;height:30px;margin:1.1rem 0 .3rem;background:var(--bg);border:1px solid var(--rule);border-radius:4px;overflow:hidden}
  .memcalc .bar span{position:absolute;top:0;bottom:0}
  .memcalc .bar .w{background:var(--app)} .memcalc .bar .x{background:var(--model)}
  .memcalc .bar .cap{position:absolute;top:-1px;bottom:-1px;width:0;border-left:2px dashed var(--fg)}
  .memcalc .scale{display:flex;justify-content:space-between;font-size:.76rem;color:var(--muted)}
  .memcalc .legend{display:flex;flex-wrap:wrap;gap:.3rem 1rem;font-size:.82rem;margin:.5rem 0}
  .memcalc .legend i{display:inline-block;width:.75rem;height:.75rem;border-radius:2px;margin-right:.3rem;vertical-align:-1px}
  .memcalc .sum{font-size:1rem;margin:.6rem 0 .2rem}
  .memcalc .sum b{font:700 1.05rem var(--mono)}
  .memcalc .verdict{font-weight:700} .memcalc .verdict.ok{color:var(--ok)} .memcalc .verdict.no{color:var(--bad)}
  .memcalc .math{font:.8rem/1.6 var(--mono);color:var(--muted);margin:.3rem 0 0;overflow-wrap:anywhere}
  .memcalc .note{font-size:.82rem;color:var(--muted);margin:.4rem 0 0}
  .memcalc .challenges{margin-top:1rem;border-top:1px solid var(--rule);padding-top:.8rem}
  .memcalc .ch{display:flex;gap:.7rem;padding:.3rem 0}
  .memcalc .mark{flex:0 0 5.2rem;font-weight:600;color:var(--muted)}
  .memcalc .ch.done .mark{color:var(--ok)} .memcalc .mark.no{color:var(--bad)}
  .memcalc .actions{margin-top:.7rem;display:flex;gap:.6rem}
  .memcalc .actions button{font:600 .85rem var(--sans);cursor:pointer;background:none;border:1px solid var(--rule);border-radius:4px;padding:.35rem .8rem;color:var(--fg)}
  .memcalc .actions button:hover{border-color:var(--accent)}
  @media (max-width:560px){.memcalc .knobs{grid-template-columns:1fr}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const SIZES = [1, 7, 13, 65, 70];
  const PRECISIONS = [
    { id: 32, label: "FP32", bytes: 4 },
    { id: 16, label: "FP16 / BF16", bytes: 2 },
    { id: 8, label: "INT8", bytes: 1 },
    { id: 4, label: "4-bit", bytes: 0.5 },
  ];
  const MODES = { inference: "Inference", full: "Full finetuning (Adam)", lora: "LoRA finetuning (Adam)" };
  const GPUS = [24, 48, 80];
  const LORA_SHARE = 0.01;
  const fmt = (x) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.0+$|(\.\d*?)0+$/, "$1");

  function compute(s) {
    const p = PRECISIONS.find((x) => x.id === s.bits);
    const weights = s.params * p.bytes;
    let extra, extraLabel, math, invalid = false;
    if (s.mode === "inference") {
      extra = weights * 0.2; extraLabel = "Activations + KV cache (20%)";
      math = `${s.params}B × ${p.bytes} bytes = ${fmt(weights)} GB weights; × 1.2 = ${fmt(weights + extra)} GB`;
    } else {
      const trainable = s.mode === "full" ? s.params : s.params * LORA_SHARE;
      extra = trainable * 3 * 2; extraLabel = "Gradients + Adam states";
      math = `${s.params}B × ${p.bytes} bytes = ${fmt(weights)} GB weights; ${fmt(trainable)}B trainable × 3 values × 2 bytes = ${fmt(extra)} GB`;
      invalid = s.mode === "full" && s.bits < 16;
    }
    const total = weights + extra;
    return { weights, extra, extraLabel, total, math, invalid, fits: !invalid && total <= s.gpu };
  }

  function setup(el) {
    const allowed = el.dataset.modes ? JSON.parse(el.dataset.modes) : Object.keys(MODES);
    const challenges = el.dataset.challenges ? JSON.parse(el.dataset.challenges) : [];
    const s = { params: 7, bits: 16, mode: allowed[0], gpu: 24 };
    const seg = (key, items) => `<div class="seg" data-key="${key}">${items.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div>`;
    el.innerHTML = `
      <div class="knobs">
        <label>Model size</label>${seg("params", SIZES.map((n) => [n, n + "B"]))}
        <label>Weight format</label>${seg("bits", PRECISIONS.map((p) => [p.id, p.label]))}
        <label>Workload</label>${seg("mode", allowed.map((m) => [m, MODES[m]]))}
        <label>GPU memory</label>${seg("gpu", GPUS.map((g) => [g, g + " GB"]))}
      </div>
      <div class="bar"><span class="w"></span><span class="x"></span><i class="cap"></i></div>
      <div class="scale"><span>0</span><span class="max"></span></div>
      <div class="legend"><span><i style="background:var(--app)"></i>Weights</span><span><i style="background:var(--model)"></i><em class="xl"></em></span><span><i style="border-left:2px dashed var(--fg);width:0"></i>GPU limit</span></div>
      <p class="sum">Needs about <b class="tot"></b> on a <b class="cap-n"></b> GPU: <span class="verdict"></span></p>
      <p class="math"></p>
      <p class="note"></p>
      ${challenges.length ? `<div class="challenges"><span class="box-label">Challenges: set the knobs, then check</span>${challenges
        .map((c, i) => `<div class="ch" data-i="${i}"><span class="mark">○ To do</span><span>${c.text}</span></div>`).join("")}
        <div class="actions"><button data-a="check">Check</button></div></div>` : ""}`;

    const q = (sel) => el.querySelector(sel);
    const render = () => {
      el.querySelectorAll(".seg").forEach((g) => g.querySelectorAll("button").forEach((b) => {
        b.setAttribute("aria-pressed", String(String(s[g.dataset.key]) === b.dataset.v));
      }));
      const r = compute(s);
      const max = Math.max(r.total, s.gpu) * 1.08;
      q(".bar .w").style.cssText = `left:0;width:${(r.weights / max) * 100}%`;
      q(".bar .x").style.cssText = `left:${(r.weights / max) * 100}%;width:${(r.extra / max) * 100}%`;
      q(".bar .cap").style.left = `${(s.gpu / max) * 100}%`;
      q(".scale .max").textContent = `${fmt(max)} GB`;
      q(".xl").textContent = r.extraLabel;
      q(".tot").textContent = `${fmt(r.total)} GB`;
      q(".cap-n").textContent = `${s.gpu} GB`;
      const v = q(".verdict");
      v.className = "verdict " + (r.fits ? "ok" : "no");
      v.textContent = r.invalid ? "not a standard setup" : r.fits ? "fits" : `doesn't fit (${fmt(r.total - s.gpu)} GB over)`;
      q(".math").textContent = r.math;
      q(".note").textContent = r.invalid
        ? "Training is sensitive to precision, so full finetuning keeps 16-bit (or mixed) weights. To train on 4-bit weights, use LoRA on top of them: that's QLoRA."
        : s.mode === "inference"
          ? "Longer contexts and bigger batches need more than the 20% allowance."
          : s.mode === "lora"
            ? "Assumes LoRA trains about 1% of the parameters; real adapters are often far smaller. Activations are not counted."
            : "Activations are not counted, and they can exceed the weights. Gradient checkpointing trades time for that memory.";
    };

    el.querySelectorAll(".seg").forEach((g) => g.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const k = g.dataset.key;
      s[k] = k === "mode" ? b.dataset.v : Number(b.dataset.v);
      render();
    }));
    const check = el.querySelector('[data-a="check"]');
    if (check) check.addEventListener("click", () => {
      const r = compute(s);
      el.querySelectorAll(".ch").forEach((row) => {
        const c = challenges[Number(row.dataset.i)];
        if (row.classList.contains("done")) return;
        if (s.params !== c.params || s.gpu !== c.gpu) return; // only judge the challenge you're set up for
        const ok = r.fits && (!c.modes || c.modes.includes(s.mode));
        const mark = row.querySelector(".mark");
        mark.classList.toggle("no", !ok);
        if (ok) row.classList.add("done");
        mark.textContent = ok ? "✓ Solved" : "✗ Not yet";
      });
    });
    render();
  }
  document.querySelectorAll(".memcalc").forEach(setup);
})();
