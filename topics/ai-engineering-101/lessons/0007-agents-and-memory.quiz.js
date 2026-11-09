window.QUIZ = [
  {
    id: "ai-engineering-101/7/q1",
    stem: "Your RAG bot quotes the wrong price. The logs show the correct pricing chunk <em>was</em> in the retrieved context. Where do you look first?",
    options: ["The generator, which had the right chunk","The retriever, because recall clearly failed","The chunker, because chunks were too small","The index, because the embeddings are stale"],
    answer: 0,
    why: "The fact reached the model, so retrieval did its job. This is a generation failure: look at the prompt, the position of the chunk (lost in the middle?) and the model. Compare Lesson 6, where the chunk was <em>missing</em>.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/7/q2",
    stem: "Users type “my bot keeps dying,” but your docs only say “battery drains.” Your BM25 search misses the article. Which Lesson 6 fix targets exactly this?",
    options: ["Make every chunk much smaller","Rerank the results by date","Cut top-k from five to one","Add embedding search (hybrid)"],
    answer: 3,
    why: "It's a paraphrase, which is term-based retrieval's blind spot. Embeddings match meaning. Contextual retrieval (adding “questions it answers”) would also help.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/7/q3",
    stem: "Labelers write ideal replies to 13,000 prompts. Which training stage uses that data? (Ask: who writes the answer?)",
    options: ["Pre-training on web text","Preference finetuning with RLHF","Supervised finetuning (SFT)","Training the reward model"],
    answer: 2,
    why: "A human writes the whole answer, so it's demonstration data for SFT. If they only <em>ranked</em> two replies, it would be comparison data for the reward model and preference finetuning.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/7/q4",
    stem: "Why does prompt injection (Lesson 5) become far more dangerous once the model can call tools?",
    options: ["Tools make the model hallucinate more","Tool calls raise the sampling temperature","Injected text can trigger real actions","Tools expose the model's own weights"],
    answer: 2,
    why: "Without tools, a hijacked model can only say bad things. With tools, it can send the email, run the code or move the money. That's today's lesson.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/7/q5",
    stem: "A support agent has four tools. Which one is a <em>write</em> action, the kind that deserves human approval?",
    options: ["Fetch the customer's order history","Search the refund policy documents","Issue a refund to their card","Check today's date and time"],
    answer: 2,
    why: "Read-only tools let the agent perceive its environment. Write tools change it. Huyen: you wouldn't let an intern delete the production database, so don't let an unreliable AI send money unsupervised.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q6",
    stem: "Each step of your agent is right 98% of the time, and a typical task takes 20 steps. Roughly what share of tasks finish with no mistake?",
    options: ["About 98%","About 67%","About 80%","About 20%"],
    answer: 1,
    why: "0.98 multiplied by itself 20 times ≈ 0.67. Per-step accuracy compounds: one step in three tasks goes wrong somewhere. That's why agents need stronger models, fewer steps and reflection.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q7",
    stem: "Your agent sometimes spends hours executing a long plan that never reaches the goal. What does Huyen recommend first?",
    options: ["Raise temperature for more varied plans","Give the agent many more tools","Drop reflection to save some tokens","Validate each plan before executing it"],
    answer: 3,
    why: "Decouple planning from execution. Check the plan with heuristics (only tools it has, no more than N steps) or an AI judge, and execute it only if it passes.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q8",
    stem: "Your billing bot must look up the account before every answer, never answering from memory. Which tool-use setting fits?",
    options: ["required","auto","none","parallel"],
    answer: 0,
    why: "<code>required</code> forces at least one tool call. <code>auto</code> lets the model decide, and it may skip the lookup. <code>none</code> forbids tools.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q9",
    stem: "An email assistant reads incoming mail, can search your private files and can send email. What's Simon Willison's advice?",
    options: ["Add a firmer warning to the prompt","Remove one of the three capabilities","Switch to a larger, smarter model","Set the sampling temperature to zero"],
    answer: 1,
    why: "Untrusted content + private data + a way to send data out is the “lethal trifecta.” A malicious email can instruct the agent to forward your files. Prompts don't reliably stop it, so break the combination.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q10",
    stem: "A long chat drops its oldest messages when the context fills up (FIFO). What does Huyen warn can go wrong?",
    options: ["Recent messages become far too costly","The model forgets its pre-training data","Early messages stating the goal vanish","Tool calls stop returning valid JSON"],
    answer: 2,
    why: "FIFO assumes old means unimportant, but the first messages often state the purpose of the conversation. Summarizing, or reflecting on what to keep, avoids throwing them out.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q11",
    stem: "Your agent has 25 tools and keeps picking the wrong ones. How does Huyen suggest deciding which to remove?",
    options: ["Remove each; drop those nobody misses","Keep tools with the longest descriptions","Drop whichever tools were added last","Ask the model which tools it prefers"],
    answer: 0,
    why: "An ablation study: remove one tool, rerun your eval, and if performance doesn't drop, the tool goes. Also plot how often each tool is called and where calls fail.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/7/q12",
    stem: "Your feature always runs classify the ticket → retrieve docs → draft a reply, in that fixed order. In Anthropic's terms, what is it?",
    options: ["An agent, so it needs a planner","A failure, since it never reflects","A multimodal RAG pipeline, really","A workflow, and that's often enough"],
    answer: 3,
    why: "Workflows run LLM calls along code paths you wrote. Agents let the model choose the path. Anthropic's advice: start with the simplest thing that works, and reach for an agent only when the steps can't be predicted.",
    section: "check-2"
  }
];
