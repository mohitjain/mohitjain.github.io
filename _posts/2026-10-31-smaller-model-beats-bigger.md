---
title: "A smaller AI model can beat a bigger one, and can be cheaper to own"
description: "Build cost versus run cost for a 70B and an 8B model, how the sizing rules changed in 2020, 2022 and 2024, and a derived break-even of about 2 billion answers."
categories: [ai-intelligent-systems]
tags: [llms, performance]
---

*What the sizing rules say, what a model costs to build and to run, and where a smaller model breaks even.*

A smaller AI model can beat a bigger one. In 2022, a model with 70 billion parameters beat one four times its size, trained on the same budget. Two years later, Meta trained an 8-billion-parameter model on text equal to roughly 140 million books, about 75 times the amount Meta itself gives as balanced for a model that size (explained below). It kept improving the whole way. The first half of this post is about the same training budget; the second half is about total cost over many answers. Between a 70-billion and an 8-billion-parameter model, the computing behind every answer differs by about 9×.

Pause on that. How can less beat more? And why would anyone feed a model 75 times what it "needs"?

The answer is one every infrastructure engineer already knows: capex versus opex. I build platforms and distributed systems, not models. When I read the papers behind this, I recognized the argument: the cheapest thing to build is not the cheapest thing to own. Below: how the rule for sizing a model was rewritten twice, why Meta broke it, and how to choose a size. No machine-learning background needed.

## Two bills

A model is a small program plus a very long list of numbers called parameters. A "70B" model has 70 billion of them, about 140 GB. An 8B model is about 16 GB, small enough for a single GPU. What it reads while training is counted in tokens: chunks of text, roughly three-quarters of a word each. And it has two costs, which behave differently.

**The build bill (capex).** Training adjusts every parameter for every token the model reads. The work is about 6 × parameters × tokens read. A bigger model or more text means a bigger bill. You pay it once.

**The run bill (opex).** Every time the model writes a token, it does a multiply and an add with every parameter. That is about 2 × parameters per token, on every request, for as long as the model is in service.

Hold on to those two bills. The rule for how big to make a model has been rewritten twice, and each version is really a different answer to which bill you are trying to shrink.

## 2020: make the model bigger

In 2020, OpenAI researchers ([Kaplan et al.](https://arxiv.org/abs/2001.08361)) measured how a language model improves as you make it bigger, give it more text, or spend more computing on it. Each improved it in a smooth, predictable way. Then they asked where a fixed training budget is best spent. Their answer: mostly on a bigger model, because a larger model learns more from each piece of text, so it needs relatively little.

GPT-3 followed that pattern. Here is a useful number: **tokens per parameter**, how much text the model reads for each of its parameters. Compare GPT-3 with GPT-2, from a year earlier:

| Model | Parameters | Tokens read | Tokens per parameter |
| --- | --- | --- | --- |
| GPT-2 (2019) | about 1.5 billion | about 100 billion | about 67 |
| GPT-3 (2020) | 175 billion | 300 billion | about 1.7 |

In one year the model grew more than 100 times, while the text it read grew only about 3 times. Each parameter now saw about 40 times less text. For the next two years, that was the rule: grow the model first.

<small>GPT-2's token count is Karpathy's figure. OpenAI published only the dataset: about 8 million web pages, 40 GB of text.</small>

## 2022: balance model and text

DeepMind tested that rule with over 400 models and found a sweet spot for any fixed budget. A model too small lacks capacity; one too large has not read enough to use it. Think of sizing a thread pool: too few threads and work piles up, too many and they get in each other's way. The updated rule: grow the model and the text together, so doubling the model means doubling the text. Worked out from the paper's tables, that is about 20 tokens of text per parameter, a ratio now widely quoted as the Chinchilla rule of thumb. A 10B model should read about 200B tokens. I first read that 20 as a minimum. It isn't. It is the balance point for a fixed training budget, and going past it can still pay off, as the next section shows.

Then they proved it. Gopher had 280B parameters and read 300B tokens. With the same training budget, [**Chinchilla**](https://arxiv.org/abs/2203.15556) had 70B parameters and read 1.4 trillion tokens. It scored 67.6% on MMLU, a 57-subject exam benchmark, against Gopher's 60.0%. Four times smaller, and better.

**Key finding.** That answers the first half of the puzzle: for a fixed training budget, a smaller model that read more beats a bigger one that read less.

## 2024: count the cost of running it

Chinchilla minimizes the build bill. It says nothing about the run bill.

Now price the run bill. Take one 500-token answer, using the 2 × parameters estimate from earlier: each token costs about 2 operations per parameter, where an operation is one multiply or one add.

| | 70B model | 8B model |
| --- | --- | --- |
| Work per token (2 × parameters) | 140 billion operations | 16 billion operations |
| Work for a 500-token answer (× 500) | 70 trillion operations | 8 trillion operations |
| Memory to hold the numbers (2 bytes each) | 140 GB | 16 GB |

The 70B model does about 9 times the work, because every token touches every parameter, and it needs about 9 times the memory to hold them. At ten requests a day, nobody cares. The next step shows where it starts to matter.

Put both bills on one line. Train the 70B model Chinchilla-style on 1.4 trillion tokens: the build is about 6 × 70B × 1.4T ≈ 5.9 × 10²³ operations. Train the 8B model on 15 trillion tokens, as Meta did (next paragraphs): about 7.2 × 10²³. The smaller model costs more to build. Then each 500-token answer costs 7 × 10¹³ operations on the 70B and 8 × 10¹² on the 8B.

{% include chart.html name="model-size-cost" title="The smaller model costs more to build and pays that back after about 2 billion answers." alt="Chart of total operations against answers served for a 70B model trained on 1.4 trillion tokens and an 8B model trained on 15 trillion tokens. The 8B line starts higher and the lines cross at about 2 billion answers; after that the 8B model is cheaper in total." caption="Derived, not measured: operations only, dense models, 500-token answers. It assumes the two models are equally good, which this post does not show, so read the shape, not the exact crossing." %}

The extra 1.3 × 10²³ operations the small model cost to build is paid back after about 2 billion answers. Past that crossing, the smaller one is cheaper in total, and the gap keeps widening with every request. The exact crossing depends on real prices and on how good each model actually is, but the shape does not.

That is the engineer's trade: pay more to build, once, to pay less on every call. Train the smaller model on far more text than the rule says. Meta did exactly that with [Llama 3 8B](https://ai.meta.com/blog/meta-llama-3/): 15 trillion tokens (roughly 140 million books at about 80,000 words each), about 75× the roughly 200 billion tokens Meta itself gives as the balanced amount for an 8B model. (The Chinchilla ratio of about 20 tokens per parameter gives 160 billion for an 8B model, which would make it about 94×.) Meta reported that its 8B and 70B models both continued to improve log-linearly, that is, each 10× of data bought a similar step, up to 15 trillion tokens. Research that models this directly ([Sardana et al.](https://arxiv.org/abs/2401.00448)) finds that if you expect reasonably large demand, around a billion requests, you should train smaller and longer than the Chinchilla ratio of about 20 tokens per parameter. Their model is more detailed than the one above, but it points the same way. That answers the second half of the puzzle. Meta did not overfeed the model. It paid more once, so every answer afterwards costs less.

## Smaller or bigger?

Which one to pick depends on how many requests you will serve and what each answer is worth.

| Your situation | Lean toward |
| --- | --- |
| Millions of requests, each worth little | Smaller |
| Few requests, or each answer is high-stakes | Bigger |
| Must run on one GPU or a laptop | Smaller |
| Mixed traffic | Both: easy requests to a small model, hard ones to a big one |

The first and third rows follow from the numbers above. The rest are rules of thumb.

## Key takeaways

Most of us will never train a model. We will pick one. Three habits follow.

1. **Treat "bigger" as a cost signal.** Parameter count tells you more about the price of running a model than about its quality.
2. **Expect a small model to close much of the gap.** A 70B model beat one four times its size at the same training budget, and Meta's 8B kept improving on far more text than the rule asks. That is not proof that a small model always matches a bigger one, only that size alone does not settle quality.
3. **Ask about volume before you ask about the model.** The table above is the short version.

## Sources

- Kaplan et al., [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) (2020)
- Radford et al., [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) (2019), for GPT-2's size and dataset
- Hoffmann et al., [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) (2022)
- Sardana, Portes, Doubov and Frankle, [Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) (ICML 2024)
- Meta, [Introducing Meta Llama 3](https://ai.meta.com/blog/meta-llama-3/) (April 2024)
- Karpathy, [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI) (2025), for GPT-2's training-token figure
