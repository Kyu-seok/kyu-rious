# kyu-rious

A public second brain, generated from `/teach` workspaces: a Graph of every Published Topic, Lesson and Reference sheet with typed Relationships, and spaced-repetition Review of every Lesson's quiz questions, running in the reader's browser. Static site on GitHub Pages: https://kyu-seok.github.io/kyu-rious/

- `topics/<slug>/`: one `/teach` workspace per Topic, with a `topic.yaml` manifest that decides what is Published.
- `site/`: the Astro generator. `npm run dev` for a local preview, `npm run build` for `dist/`.
- `GLOSSARY.md` and `docs/adr/`: the vocabulary and the decisions behind the design.

## Working on the site

```bash
cd site
npm ci
npm run check         # typecheck
npm test              # build-seam tests (vitest)
npm run test:browser  # browser-seam tests (Playwright; builds and serves the site)
```

## Day-to-day skills

Type `/kyu-rious` in Claude Code for the list: `/kyu-rious-new-topic`, `/teach`, `/kyu-rious-publish-topic`, `/kyu-rious-ship`, `/kyu-rious-propose-relationships`, `/kyu-rious-backup-teach-notes`. The end-to-end walkthrough, with diagrams, is `docs/workflow.md`.

## Publishing a Topic

1. Put the workspace in `topics/<slug>/` and add `topic.yaml` with `title`, `summary` and `published: true`.
2. Keep each Lesson's Quiz in `lessons/<stem>.quiz.js` (see `CLAUDE.md`). `node site/scripts/migrate-quizzes.mjs` converts older inline quizzes once.
3. Push to `main`; the Pages workflow builds and deploys. In the repository settings, Pages must use "GitHub Actions" as its source.
