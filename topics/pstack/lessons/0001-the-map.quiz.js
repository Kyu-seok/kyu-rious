window.QUIZ = [
  {
    id: "pstack/1/q1",
    stem: "You've installed pstack in Claude Code. What do you type to start the router?",
    options: ["<code>/poteto-mode</code>", "<code>/pstack:poteto-mode</code>", "<code>/plugin poteto-mode</code>", "<code>/pstack poteto-mode</code>"],
    answer: 1,
    why: "Claude Code prefixes plugin commands with the plugin name, so <code>/poteto-mode</code> becomes <code>/pstack:poteto-mode</code>. The same goes for every other pstack skill."
  },
  {
    id: "pstack/1/q2",
    stem: "pstack's default sends code delegates to Grok. You only have a Claude subscription. What happens to those roles in Claude Code?",
    options: ["The run stops with an error", "They get sent to Cursor's cloud", "Those steps are skipped with notes", "They run on the session model"],
    answer: 3,
    why: "The adapter maps any non-Claude slug to \"omit <code>model</code>\", so the subagent inherits your session model. <code>/pstack:setup-pstack</code> writes these roles as <code>inherit-parent</code>."
  },
  {
    id: "pstack/1/q3",
    stem: "Which part of pstack loses the most when every role runs on Claude?",
    options: ["Playbook routing and todo lists", "Reading the principle index first", "Cross-model review on review panels", "Opening pull requests with gh"],
    answer: 2,
    why: "\"A second opinion is the same prompt against a different model. Agreement is high-signal.\" With two Claude reviewers, agreement tells you less. Routing, principles and PRs don't depend on the vendor."
  },
  {
    id: "pstack/1/q4",
    stem: "<code>/pstack:poteto-mode the signup form accepts empty emails. repro first, then fix and verify.</code> Which playbook does it match?",
    options: ["Bug fix", "Feature", "Refactoring", "Investigation"],
    answer: 0,
    why: "It's a reported defect, and \"repro first\" is the Bug fix playbook's step 1. The form is supposed to reject empty emails and doesn't, so this is a defect, not new behavior."
  },
  {
    id: "pstack/1/q5",
    stem: "<code>/pstack:poteto-mode how does the cache decide an entry has expired? don't change any code yet.</code> Which playbook does it match?",
    options: ["Bug fix", "Feature", "Prototype", "Investigation"],
    answer: 3,
    why: "A read-only question (\"how does X work\") plus \"don't change any code yet\" pins it to Investigation. The deliverable is a cited answer, not a diff."
  },
  {
    id: "pstack/1/q6",
    stem: "The todo list shows <code>skip: no UI surface in this change</code> on one of the playbook's steps. What does that tell you?",
    options: ["The run failed at this step", "The agent chose to skip it", "You must do that step yourself", "The playbook file has a bug"],
    answer: 1,
    why: "Skipped steps stay visible on purpose, with a reason, so you can audit what the agent chose not to do. If the reason is wrong, tell it to do the step."
  },
  {
    id: "pstack/1/q7",
    stem: "Your solo project has no GitHub remote. Every code playbook ends with Opening a PR. What do you add to the prompt?",
    options: ["Nothing, it creates a remote itself", "Run the babysit playbook after it", "Solo repo, no PR, commit locally", "Name every skill it should run"],
    answer: 2,
    why: "pstack assumes a team workflow with <code>gh</code>. Say so when your setup differs. Listing skills is a known pitfall, because the playbook already orders them."
  },
  {
    id: "pstack/1/q8",
    stem: "You'll be away all afternoon. You want every caller moved from a sync store to a new async one, with behavior unchanged. Where does poteto-mode route this?",
    options: ["<code>figure-it-out</code>", "Feature", "Refactoring", "Prototype"],
    answer: 0,
    why: "Large, cross-cutting work, and work you step away from and trust later, goes to <code>figure-it-out</code> \"even when a narrower playbook like Feature fits\". It designs a custom playbook and keeps a decision log."
  }
];
