This Topic covers pstack, Lauren Tan's set of agent skills, used from Claude Code on a Claude-only subscription. Instead of calling skills in order, you send work through one router, `poteto-mode`. It restates the goal, picks one of 23 playbooks (bug fix, feature, investigation, long autonomous runs and more), turns that playbook's steps into a visible todo list, and proves the result on the surface where the problem appeared. The Topic also covers what the Claude-only setup gives up and how pstack's "go deep first" approach compares with a plan-first workflow.

After this Topic you can:

- Install pstack in Claude Code and configure it for a Claude-only subscription, knowing what that loses compared with mixed-model review panels
- Write a `/pstack:poteto-mode` prompt from memory: goal, done check, proof, known facts and constraints
- Predict which playbook a task routes to, and read the todo list to catch a wrong route
- Use the read-only skills (`how`, `why`, `teach`, `recall`) on an unfamiliar codebase before changing it
- Steer a run mid-task by naming a principle, such as "prove it works" or "laziness protocol"
- Hand off a long run with a done predicate and a `show-me-your-work` decision log, then audit it afterwards
- Decide, for a given task, whether pstack or a plan-first flow fits better, and why
