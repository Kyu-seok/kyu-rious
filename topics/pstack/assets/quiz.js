// Reusable retrieval-practice components.
//
// Quiz:   <div class="quiz" data-quiz="ID"></div>
//         Quiz.register("ID", [{ q, options: [...], answer: index, why }]);
//         Every option should have the same word count; vary the answer position.
//
// Recall: <div class="recall"><textarea></textarea><button>Reveal</button>
//         <div class="answer">...</div></div>   (wired automatically)

const Quiz = (() => {
  const banks = {};

  function register(id, questions) {
    banks[id] = questions;
    const mount = () => render(id);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }

  function render(id) {
    const root = document.querySelector(`.quiz[data-quiz="${id}"]`);
    if (!root) return;
    const questions = banks[id];
    let answered = 0, correct = 0;
    const score = el("div", "quiz-score");
    score.textContent = `0 / ${questions.length} answered`;

    questions.forEach((item, qi) => {
      const box = el("div", "quiz-q");
      box.append(el("div", "num", `QUESTION ${qi + 1}`));
      const prompt = el("div", "prompt");
      prompt.innerHTML = item.stem ?? item.q;
      box.append(prompt);
      const opts = el("div", "quiz-opts");
      const fb = el("div", "quiz-fb");
      item.options.forEach((text, oi) => {
        const b = el("button");
        b.type = "button";
        b.innerHTML = text;
        b.addEventListener("click", () => {
          const ok = oi === item.answer;
          opts.querySelectorAll("button").forEach((x, xi) => {
            x.disabled = true;
            if (xi === item.answer) x.classList.add("correct");
          });
          if (!ok) b.classList.add("wrong");
          fb.className = `quiz-fb show ${ok ? "ok" : "no"}`;
          fb.innerHTML = `<span class="verdict">${ok ? "Correct" : "Not quite"}</span> ${item.why || ""}`;
          answered++; if (ok) correct++;
          score.textContent = answered === questions.length
            ? `Score: ${correct} / ${questions.length}${correct === questions.length ? " (all correct)" : ". Reload the page to retry the misses later."}`
            : `${answered} / ${questions.length} answered`;
        });
        opts.append(b);
      });
      box.append(opts, fb);
      root.append(box);
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".recall").forEach((r) => {
    const btn = r.querySelector("button");
    const ans = r.querySelector(".answer");
    if (btn && ans) btn.addEventListener("click", () => {
      ans.classList.toggle("show");
      btn.textContent = ans.classList.contains("show") ? "Hide answer" : "Reveal answer";
    });
  });
});
