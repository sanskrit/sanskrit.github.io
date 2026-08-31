+++
title = "mUla, Translation"
+++
## Non-detail mUla - No sandhi splitting

```markdown

I will give you some text and translation.  
Separate sentences and interleave translation provided in the following format for each sentence:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL SENTENCE, fed into hyphenator algorithm defined below.
</details>

<details><summary>English</summary>

TRANSLATION (WITH NO NON-SPACE CHANGES OR WITH [[OLD|NEW]] CORRECTIONS)
</details>

<details><summary>English - Notes</summary>

ANY NOTES ASSOCIATED WITH THE TRANSLATION. (WITH NO NON-SPACE CHANGES OR WITH [[OLD|NEW]] CORRECTIONS) SKIP THIS DETAILS BLOCK IF THERE ARE NO NOTES.
</details>

<details><summary>मूलम्</summary>

ORIGINAL SENTENCE (WITH NO CHANGES OR WITH [[OLD|NEW]] CORRECTIONS)
</details>

If `विश्वास-प्रस्तुतिः` and `मूलम्` tags are already there, then don't create those again. Just update the `विश्वास-प्रस्तुतिः` text with the output from the hyphenator algorithm; and insert the English / English - Notes tags as described above.

If some parts of the translation provided as input do not match - just note those as an appendix.

Suggest any corrections in this format: `[[OLD|NEW]]`.

**IMPORTANT FORMATTING RULES:**  

1. **Fidelity of the `मूलम्` Block with Explicit Corrections:** The text within the `<details><summary>मूलम्</summary>...</details>` block must be a character-for-character replica of the original sentence as it appears in the source input. No *silent* typographical corrections or normalizations are permitted. However, you are explicitly allowed to mark corrections within this block using the `[[OLD|NEW]]` format. Aside from these explicitly marked `[[OLD|NEW]]` corrections, the surrounding text must remain entirely unchanged.
2. **Prevention of Character Dropping and Mutation:** When segmenting and copying sentences into their respective blocks, you must ensure that no syllables, vowel signs (mātrās), consonants, or punctuation marks are accidentally truncated, dropped, or mutated.
3. **No Silent Corrections:** Typographical or spelling errors in the source text must never be corrected silently in any block. Any correction must strictly use the inline `[[OLD|NEW]]` format within both the `विश्वास-प्रस्तुतिः` and `मूलम्` blocks.
4. **Spacing:** The empty lines shown above are significant and must be retained. Note that there should be no empty line before the `</details>` tag. Retain all other markdown (e.g., headings) as they are.

---
