window.QUIZ = [
  {
    id: "ai-engineering-101/8/q1",
    stem: "Your app logs pairs of replies where users clicked the better one. Which training stage can that data feed?",
    options: ["Pre-training","Supervised finetuning","Preference finetuning","Continued pre-training"],
    answer: 2,
    why: "Nobody wrote an answer; a person only picked the better of two. That's comparison data, the input to a reward model and preference finetuning.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/8/q2",
    stem: "An agent reports “All 200 invoices processed,” but 37 are still marked pending. Which failure mode is this?",
    options: ["A reflection error","An invalid tool","A tool failure","Wrong parameter values"],
    answer: 0,
    why: "The agent's own check falsely declared the goal met, like the 40-of-50 hotel rooms trace in Lesson 7.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/8/q3",
    stem: "Your assistant must remember each user's preferred language for months, across sessions. Where should that live?",
    options: ["In the model's weights","In the context window","In a sampling setting","In a long-term memory store"],
    answer: 3,
    why: "It's per-user and must outlive the session: long-term memory, retrieved when needed. Weights are for what <em>every</em> task needs.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/8/q4",
    stem: "Why do many teams track context precision in production but not context recall?",
    options: ["Precision matters more to users","Recall needs every document labeled","Recall can't be computed for embeddings","Precision is cheaper to retrieve with"],
    answer: 1,
    why: "Precision only needs a judgment on what was retrieved. Recall needs to know every relevant document for each query, which means labeling the whole corpus.",
    section: "check-1"
  },
  {
    id: "ai-engineering-101/8/q5",
    stem: "The model's facts are right, but its output keeps breaking your in-house config language, even with 30 examples in the prompt. What's the next step?",
    options: ["Add a vector database","Finetune on the config format","Switch to BM25 retrieval","Raise the sampling temperature"],
    answer: 1,
    why: "Correct facts, wrong form: a behavior failure. Rare syntaxes are exactly where Huyen says finetuning helps. Retrieval adds facts, which aren't missing.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q6",
    stem: "Your bot gets questions about this week's product launches wrong. What's the next step?",
    options: ["Finetune on last year's docs","Add more few-shot examples","Lower the learning rate","Retrieve the current launch docs"],
    answer: 3,
    why: "Missing or outdated information is an information failure, so use RAG. Ovadia et al. found RAG beat finetuning on current-events questions.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q7",
    stem: "Roughly how much GPU memory does a 13B-parameter model in FP16 need for inference?",
    options: ["About 13 GB","About 26 GB","About 31 GB","About 78 GB"],
    answer: 2,
    why: "13B × 2 bytes = 26 GB of weights, × 1.2 for activations and the KV cache ≈ 31 GB. So it won't fit on a 24 GB card unless you quantize.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q8",
    stem: "Fully finetuning a 7B FP16 model with Adam needs about 56 GB before activations. What takes most of it?",
    options: ["Gradients and optimizer states","The model's own weights","The training dataset","The KV cache"],
    answer: 0,
    why: "Weights are 14 GB. Each trainable parameter adds a gradient and two Adam states: 7B × 3 × 2 bytes = 42 GB. Fewer trainable parameters (PEFT) is how you cut it.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q9",
    stem: "Many teams loaded Llama 2 in FP16 and found its quality worse than advertised. Why?",
    options: ["FP16 has fewer total bits","FP16 is too slow on GPUs","Its tokenizer requires FP32","Its weights were set in BF16"],
    answer: 3,
    why: "BF16 and FP16 both use 16 bits but split them differently: BF16 has more range, FP16 more precision. Load a model in the format it was made for.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q10",
    stem: "You finetune a model per customer for 100 customers with LoRA. Why keep the adapters separate from the base model?",
    options: ["Separate adapters remove all latency","One base plus 100 small adapters","Adapters train better when separate","Merged adapters can't be stored"],
    answer: 1,
    why: "One shared W plus 100 small (A, B) pairs is about 23M parameters per matrix instead of 1.68B, and switching customers means loading only an adapter. Merging removes the extra latency, but only pays off for a single model.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q11",
    stem: "After finetuning on order-change queries, your model got worse at product recommendations. What happened?",
    options: ["The learning rate was too low","The LoRA rank was too small","It improved one task, hurt others","The model was quantized wrongly"],
    answer: 2,
    why: "Finetuning for one task can degrade others. Finetune on all the tasks you care about, use separate models, or merge separately finetuned models.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q12",
    stem: "During finetuning, training loss keeps falling but validation loss starts rising. What do you do?",
    options: ["Overfitting: train fewer epochs","Underfitting: train more epochs","Raise the batch size a lot","Increase the LoRA rank r"],
    answer: 0,
    why: "The model is memorizing the training set. Cut epochs (or add data). If both losses were still falling, more epochs would help.",
    section: "check-2"
  },
  {
    id: "ai-engineering-101/8/q13",
    stem: "A colleague says general models can't handle finance, so you must train your own. What does the BloombergGPT story suggest?",
    options: ["Domain models always win their domain","Training your own is always cheaper","Finance data is too private for APIs","General models may already do better"],
    answer: 3,
    why: "BloombergGPT cost an estimated $1.3–2.6M in compute. GPT-4, released the same month, beat it on financial benchmarks zero-shot. Test strong general models first.",
    section: "check-2"
  }
];
