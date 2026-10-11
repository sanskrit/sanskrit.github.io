+++
title = "non-detail mUla, no hyphenator"
+++

```
I will give you 2 inputs - 

- Original text
- translation

## Interleaving Instructions
Separate the text into individual sentences. For every single sentence, output the interleaved translation in the following format:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL SENTENCE
</details>

<details><summary>Translation</summary>

TRANSLATION (WITH NO NON-SPACE CHANGES, POSSIBLY WITH [[OLD|NEW]] CORRECTIONS)
</details>

<details><summary>Translation - Notes</summary>

ANY NOTES ASSOCIATED WITH THE TRANSLATION. (WITH NO NON-SPACE CHANGES, POSSIBLY WITH [[OLD|NEW]] CORRECTIONS) SKIP THIS DETAILS BLOCK IF THERE ARE NO NOTES.
</details>

<details><summary>मूलम्</summary>

ORIGINAL SENTENCE (WITH NO CHANGES, POSSIBLY WITH [[OLD|NEW]] CORRECTIONS)
</details>


## Processing Rules
- **No Silent Corrections:** Typographical or spelling errors in the source text must never be corrected silently in any block. Any correction must strictly use the inline `[[OLD|NEW]]` format.  
- **Strict Max Granularity (Sentence-by-Sentence Splitting):** Each `मूलम्` block MUST contain exactly one single, coherent sentence or independent clause. Under no circumstances should multiple sentences be grouped into a single `<details>` block, even if they share a paragraph, translation block, or commentary block in the input. You must manually divide and map the translation and commentary sentence-by-sentence to match this granular level.
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character. When segmenting and copying sentences into their respective blocks, you must ensure that no syllables, vowel signs (mātrās), consonants, or punctuation marks are accidentally truncated, dropped, or mutated.  
- **Verbatim Copying:** Within the mUla blocks, besides fixing stray Latin letters, do not change a single character, accent mark (svara), or punctuation in the original Sanskrit text.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, headings, spacing, and accent marks (svara marks) in the source text exactly as provided. **Spacing:** The empty lines shown above are significant and must be retained. Note that there should be no empty line before the `</details>` tag. Retain all other markdown (e.g., headings) as they are.
- **Sequential Matching:** Match the translation/commentary sentences to the 'मूलम्' blocks in the order they appear.
- **Mandatory Appendix:** You MUST output a section titled `## Appendix` at the very end of your response. Use this section to explicitly report if the provided commentary or translation is mismatched, wrong, contains extra content (e.g., commentary text at the end with no matching Sanskrit), or is missing content. If no anomalies or mismatches are found, you must still output this section and write: "No mismatches or anomalies detected."

If `विश्वास-प्रस्तुतिः` and `मूलम्` tags are already there, then don't create those again. Just insert the Translation / Translation - Notes tags as described above.
```
