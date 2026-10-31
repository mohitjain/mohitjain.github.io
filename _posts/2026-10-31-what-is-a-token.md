---
title: "What is a token?"
description: "What a token is, why text is split into pieces, how byte-pair encoding builds a vocabulary, and which language-model quirks it explains."
categories: [ai-intelligent-systems]
tags: [llms]
---

*Language models don't read words. They read tokens, and that one fact helps explain why they misspell, miscount and charge more for some languages than others.*

I expected tokenization to be the boring, complicated part of LLMs. After watching Andrej Karpathy build a tokenizer from scratch, it turned out the core is a short loop you can understand in five minutes. This post covers what a token is, why words get split into pieces, how a tokenizer builds its vocabulary, and the quirks that follow. No ML background needed.

## A token is a number, not a word

A token is a chunk of text that the model sees as a single number.

Language models can't read text directly. They only work with numbers. So before any text reaches the model, a tokenizer cuts it into chunks and replaces each chunk with its ID from a fixed list, called the vocabulary.

For example, "hello world" becomes two tokens: <code>hello</code> and <code> world</code>. The space belongs to the second token. The model receives two numbers, not eleven characters.

Small changes give different tokens. <code>egg</code>, <code> egg</code> (with a leading space) and <code>Egg</code> all have different IDs, and some take two tokens instead of one. To the model they are unrelated numbers; it has to learn from data that they mean the same thing.

## Why split words into pieces?

There are two obvious options, and both fail.

- **One token per letter.** The vocabulary is tiny, but every sentence becomes a very long sequence. A model can only look at a fixed number of tokens at once (its context window), so it would see far less text.
- **One token per word.** Sequences are short, but the vocabulary never ends: every new name, typo and language needs its own entry.

Tokens sit in between. Common words like <code> the</code> get a single token. Rare words are built from a few smaller pieces. GPT-2's vocabulary has about 50,000 tokens; GPT-4's has about 100,000.

## How a tokenizer creates its tokens

The vocabulary is learned from a pile of sample text using an algorithm called byte-pair encoding (BPE). The idea fits in one line: find the most common pair of neighbours, merge them into a new token, and repeat.

Step by step:

1. **Start with bytes.** Convert the text to UTF-8 bytes. Every byte is a number from 0 to 255, so you start with 256 tokens.
2. **Count pairs.** Count every pair of tokens that sit next to each other.
3. **Merge the winner.** Give the most common pair a new ID (256, then 257, and so on) and replace it everywhere in the text.
4. **Repeat** until the vocabulary reaches the size you want.

A toy run with letters instead of bytes:

| Step | Text | Length | Vocabulary |
| --- | --- | --- | --- |
| Start | `aaabdaaabac` | 11 | a, b, c, d |
| Merge `aa` → `Z` | `ZabdZabac` | 9 | + Z |
| Merge `ab` → `Y` | `ZYdZYac` | 7 | + Y |
| Merge `ZY` → `X` | `XdXac` | 5 | + X |

Each merge makes the text shorter and the vocabulary one bigger. Notice that the last merge combines two tokens that were themselves merges. That's how tokens grow from bytes into whole words.

GPT-2 did this 50,000 times: 256 bytes + 50,000 merges + 1 special end-of-text token = 50,257 tokens.

The result of training is just the list of merges, in the order they were learned. That list is the tokenizer.

## Using the tokenizer: text to IDs and back

Once trained, the tokenizer does two jobs.

- **Encode (text → IDs):** turn the text into bytes, then apply the learned merges in the same order they were learned, until no more apply.
- **Decode (IDs → text):** look up the bytes for each ID, join them, and turn the bytes back into text.

The tokenizer is trained separately from the model, on its own text, and then frozen. The model never sees letters. It only ever sees the IDs the tokenizer hands it.

## Special tokens

A few tokens in the vocabulary don't come from merges at all. They are added by hand to mark structure.

GPT-2 has exactly one: `<|endoftext|>`. It sits between documents in the training data, telling the model that one document has ended and an unrelated one begins. Chat models add more, to mark where each user and assistant message starts and ends.

The tokenizer inserts these directly instead of building them from bytes.

## What this explains

Many LLM quirks come straight from tokenization:

- **Spelling.** To a model, "strawberry" is a few multi-letter chunks, not ten letters. That's why models have often miscounted its R's. The answer is three.
- **Arithmetic.** Numbers split arbitrarily: in GPT-2, `127` is one token, but <code> 677</code> (with the space before it, as in a sum) is two.
- **Other languages.** The tokenizer saw mostly English, so the same sentence in another language can take several times as many tokens as in English. It costs more and fills the context faster.

To see it yourself, paste text into [Tiktokenizer](https://tiktokenizer.vercel.app).

The algorithm is simple. Its side effects are what's worth knowing, because you pay, wait and run out of context in tokens.

## Sources

- Andrej Karpathy, [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE), YouTube, Feb 2024
- OpenAI, [tiktoken](https://github.com/openai/tiktoken): the tokenizer library for GPT models
- Google, [SentencePiece](https://github.com/google/sentencepiece): another widely used tokenizer library, used by models such as T5 and Gemma
