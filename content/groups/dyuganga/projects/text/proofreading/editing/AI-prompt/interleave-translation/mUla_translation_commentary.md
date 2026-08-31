+++
title = "mUla, translation, commentary"
+++

```markdown

I will give you 3 inputs - 

- Original text
- translation
- Commentary

Separate sentences and interleave translation provided in the following format for each sentence:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL SENTENCE, fed into hyphenator algorithm defined below.
</details>

<details><summary>Translation</summary>

TRANSLATION (WITH NO NON-SPACE CHANGES OR WITH [[OLD|NEW]] CORRECTIONS)
</details>

<details><summary>Translation - Notes</summary>

ANY NOTES ASSOCIATED WITH THE TRANSLATION. (WITH NO NON-SPACE CHANGES OR WITH [[OLD|NEW]] CORRECTIONS) SKIP THIS DETAILS BLOCK IF THERE ARE NO NOTES.
</details>

<details><summary>मूलम्</summary>

ORIGINAL SENTENCE (WITH NO CHANGES OR WITH [[OLD|NEW]] CORRECTIONS)
</details>

<details><summary>टीका</summary>

COMMENTARY_TEXT, passed to hyphenator algorithm defined below if in sanskrit.
</details>



- **No Silent Corrections:** Typographical or spelling errors in the source text must never be corrected silently in any block. Any correction must strictly use the inline `[[OLD|NEW]]` format.  
- **Max granularity** - Each मूलम् block should have the smallest possible coherent sentence or verse. Don't put multiple sentences together just to align with the translation or commentary. 
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character. When segmenting and copying sentences into their respective blocks, you must ensure that no syllables, vowel signs (mātrās), consonants, or punctuation marks are accidentally truncated, dropped, or mutated.  
- **Verbatim Copying:** Within the mUla blocks, besides fixing stray Latin letters, do not change a single character, accent mark (svara), or punctuation in the original Sanskrit text.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, spacing, and accent marks (svara marks) in the source text exactly as provided. **Spacing:** The empty lines shown above are significant and must be retained. Note that there should be no empty line before the `</details>` tag. Retain all other markdown (e.g., headings) as they are.
- **Sequential Matching:** Match the translation/ commentary sentences to the 'मूलम्' blocks in the order they appear. But don't force this. 
- **Appendix** - alert me in an appendix if the commentary/ translation provided is entirely wrong, or if extra commentary/ translation was provided in the beginning or end.
- Don't forget to apply the hyphenator aglorithm where required.

If `विश्वास-प्रस्तुतिः` and `मूलम्` tags are already there, then don't create those again. Just update the `विश्वास-प्रस्तुतिः` text with the output from the hyphenator algorithm; and insert the Translation / Translation - Notes tags as described above.


---
