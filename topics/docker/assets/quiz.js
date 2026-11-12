/* Reusable quiz. Usage: Quiz.mount(element, [{stem, options:[...], answer:index, why:"html"}]) */
const Quiz = {
  mount(root, questions) {
    const render = () => {
      root.textContent = '';
      let answered = 0, right = 0;
      const score = document.createElement('p');
      score.className = 'quiz-score';
      score.setAttribute('aria-live', 'polite');
      questions.forEach((q, n) => {
        const box = document.createElement('div');
        box.className = 'q';
        const stem = document.createElement('p');
        stem.className = 'q-stem';
        stem.innerHTML = `${n + 1}. ${q.stem}`;
        box.append(stem);
        const buttons = q.options.map((text, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'q-opt';
          b.innerHTML = text;
          b.addEventListener('click', () => {
            buttons.forEach(x => { x.disabled = true; });
            buttons[q.answer].classList.add('is-right');
            const correct = i === q.answer;
            if (!correct) b.classList.add('is-wrong');
            answered++; if (correct) right++;
            const why = document.createElement('p');
            why.className = 'q-why';
            why.innerHTML = `<b class="${correct ? 'right' : 'wrong'}">${correct ? 'Correct.' : 'Not quite.'}</b> ${q.why}`;
            box.append(why);
            if (answered === questions.length) score.textContent = `Score: ${right} of ${questions.length}. Tell your teacher this score and which ones you missed.`;
          });
          box.append(b);
          return b;
        });
        root.append(box);
      });
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'quiz-reset';
      reset.textContent = 'Reset quiz';
      reset.addEventListener('click', render);
      root.append(score, reset);
    };
    render();
  }
};
