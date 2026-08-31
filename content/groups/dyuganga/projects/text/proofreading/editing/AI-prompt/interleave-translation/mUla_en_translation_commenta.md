+++
title = "mUla, en translation, commentary"
+++

```markdown
I will give you 3 inputs - 

- Original text
- translation
- Commentary

### Interleaving Instructions
Separate the text into individual sentences. For every single sentence, output the interleaved translation and commentary in the following format:

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

COMMENTARY_TEXT, passed to hyphenator algorithm defined below if in sanskrit. SKIP THIS DETAILS BLOCK IF THERE IS NO MATCHING COMMENTARY FOR THIS SENTENCE.
</details>


### Processing Rules
- **No Silent Corrections:** Typographical or spelling errors in the source text must never be corrected silently in any block. Any correction must strictly use the inline `[[OLD|NEW]]` format.  
- **Strict Max Granularity (Sentence-by-Sentence Splitting):** Each `मूलम्` block MUST contain exactly one single, coherent sentence or independent clause. Under no circumstances should multiple sentences be grouped into a single `<details>` block, even if they share a paragraph, translation block, or commentary block in the input. You must manually divide and map the translation and commentary sentence-by-sentence to match this granular level.
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character. When segmenting and copying sentences into their respective blocks, you must ensure that no syllables, vowel signs (mātrās), consonants, or punctuation marks are accidentally truncated, dropped, or mutated.  
- **Verbatim Copying:** Within the mUla blocks, besides fixing stray Latin letters, do not change a single character, accent mark (svara), or punctuation in the original Sanskrit text.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, headings, spacing, and accent marks (svara marks) in the source text exactly as provided. **Spacing:** The empty lines shown above are significant and must be retained. Note that there should be no empty line before the `</details>` tag. Retain all other markdown (e.g., headings) as they are.
- **Sequential Matching:** Match the translation/commentary sentences to the 'मूलम्' blocks in the order they appear.
- **Mandatory Appendix:** You MUST output a section titled `## Appendix` at the very end of your response. Use this section to explicitly report if the provided commentary or translation is mismatched, wrong, contains extra content (e.g., commentary text at the end with no matching Sanskrit), or is missing content. If no anomalies or mismatches are found, you must still output this section and write: "No mismatches or anomalies detected."
- **Hyphenator:** Apply the hyphenator algorithm where required (`विश्वास-प्रस्तुतिः` and `टीका` blocks).

If `विश्वास-प्रस्तुतिः` and `मूलम्` tags are already there, then don't create those again. Just update the `विश्वास-प्रस्तुतिः` text with the output from the hyphenator algorithm; and insert the Translation / Translation - Notes tags as described above.


---

<details><summary>Hyphenator algorithm</summary>

This algorithm is to be applied to text only where explicitly required above (example - `विश्वास-प्रस्तुतिः` block), and nowhere else.

**Part 1: Definitions and Core Principles**

**1. Word or Stem Boundary**
A word or stem boundary is the point where two words or stems are joined (possibly but not always involving sandhi) without a space or hyphen. It is the character sequence spanning the end of the first word and the beginning of the second.

**2. The Separation Principle**
The core of your task is to identify "separable" boundaries and insert the correct separator (a space or a hyphen).
The **cardinal rule** is: **Do not revert the sandhi.** You are splitting the *result* of the sandhi, not undoing it.

**3. The Rule of Precedence: Non-Separability is Absolute**
This is the most critical section. The rules for non-separation **always take precedence** over rules for separation.
* **If a boundary is identified as non-separable, you MUST NOT split it for any reason, even if the words form a compound (`samāsa`).** This is a veto rule.

**4. Boundary Types and Examples**

**A. Non-Separable Boundaries: These MUST NOT be split.**
* **Vowel Lengthening (dīrgha sandhi):** When two vowels merge into a single long vowel (`आ`, `ई`, `ऊ`, `ॠ`).
  * `दया + आर्द्र → दयार्द्र`. The boundary `या` is non-separable.
  * `अपि + इच्छा → अपीच्छा`. The boundary `पी` is non-separable.
  * **Crucial Compound Example:** `धर्म + अर्थ → धर्मार्थ`. This is a `dīrgha sandhi` within a compound. Because the non-separation rule is absolute, this **must remain `धर्मार्थ`**, not be split into `धर्म-अर्थ`.
  * **Error Case Study:** The input `स्वप्रकाशाद्वितीय` (from `स्वप्रकाश + अद्वितीय`) must remain `स्वप्रकाशाद्वितीय` because it is a `dīrgha sandhi`. It is incorrect to split it as `स्वप्रकाश-अद्वितीय`.
* **Vowel Combination (guṇa/vṛddhi sandhi):** When two vowels merge into a new, single vowel (`ए`, `ओ`, `ऐ`, `औ`).
  * `महा + उत्सव → महोत्सव`. The boundary `हो` is non-separable.
  * `राम + इति → रामेति`. The boundary `मे` is non-separable.
  * `सदा + एव → सदैव`. The boundary `दै` is non-separable.

**B. Separable Boundaries: These MUST be split if not vetoed by a non-separable rule.**
* **Vowel to Semivowel (yaṇ sandhi):** The transformed semivowel (`य्` or `व्`) stays with the first word.
  * `इति + एवम् → इत्येवम्` must be split as `इत्य् एवम्`. (The `इ` became `य्`; the `य्` is kept).
  * `मधु + अरिः → मध्वरिः` must be split as `मध्व्-अरिः`.
* **Visarga (`ः`) Sandhi:**
  * `visarga` to `ो`: `रामः + अस्ति → रामोऽस्ति`. Split as `रामो ऽस्ति`. (The avagraha `ऽ` is part of the boundary).
  * `visarga` to `र्`: `दुः + प्रकृतेः + अस्य → दुष्प्रकृतेरस्य`. Split as `दुष्प्रकृतेर् अस्य`.
  * `visarga` to `स्/श्/ष्`: `नमः + ते → नमस्ते`. Split as `नमस् ते`.
* **Final `म्`:** A final `म्` before a vowel is separated by a space.
  * `फलम् + अश्नुते → फलमश्नुते`. Split as `फलम् अश्नुते`.
  * `अर्थम् + इति  → अर्थमिति`. Split as `अर्थम् इति`.
* **Consonant Assimilation:**
  * `तत् + हि → तद्धि`. Split as `तद् धि`.

---

**Part 2: The Rigorous Processing Workflow**

Follow these steps in strict order.

**Step 1: Text Cleanup and Normalization**
* Remove hard-wrapped line breaks to create continuous paragraphs.
* Do **not** perform silent corrections of typographical or spelling errors. Only resolve structural formatting anomalies (e.g., an accidental space splitting a single word across lines). 
* Preserve intentional styles like **bold** and *italic*.
* Identify Sanskrit text and its script, wrap it in `<santext script=SCRIPT_NAME>` tags, and transliterate to devanāgarī for internal processing. Ensure that the transliteration process does not introduce or drop any phonemes.

**Step 2: The Core Separation Algorithm**
For each text wrapped in `<santext>` tags, iterate through every potential word boundary and apply the following logic:
1. **First Check (The Veto):** Examine the boundary. Is it a **non-separable** `dīrgha`, `guṇa`, or `vṛddhi` sandhi?
  * If **YES**, the Rule of Precedence applies. **Do nothing.** Do not split it. Move to the next boundary.
2. **Second Check (Separation):** If the boundary passed the first check (i.e., it is not a non-separable vowel merger), now determine if it is one of the **separable** types defined in Part 1, Section 4.B.
  * If **NO**, do nothing and move on.
3. **Apply Separation:** If the boundary has been confirmed as separable, insert the correct separator:
  * Use a **hyphen (`-`)** if the words form a compound (`samāsa`). Example: `पुण्य-पापैः`.
  * Use a **space (` `)** for all other separable cases. Example: `इत्य् एवम्`.

After processing all boundaries, transliterate the `<santext>` contents back to the original script.

**Step 3: Source Error Handling**
* **This step is distinct from sandhi separation.** It concerns fixing clear spelling or grammatical errors in the *source words themselves*.
* If you find such an error, suggest a correction inline within **both** the `विश्वास-प्रस्तुतिः` and the `मूलम्` blocks using the format `[[OLD|NEW]]`. Example: `[[prarabvaṁ|prārabdhaṁ]]`.
* Never apply these corrections silently.

**Step 4: Final Markdown Formatting**
* Remove the `<santext>` tags.
* **Quotes & Mantras:** Enclose short quotes (under 5 words) in `"` and format longer quotes or mantras as blockquotes (`>`).
* **Structure:** End verse lines with two spaces for a soft break. Separate paragraphs with a blank line.
* **Page Numbers:** Format page numbers (e.g., `६४`) as `[[P64]]` at the precise point of the page break. This can be within a paragraph which continues to the next page.
* **Footnotes:** Format footnotes (e.g., `*`) using Markdown's footnote syntax (`[^1]`). Place the definition at the end. Place footnote definitions next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible (e.g., `[^12_1]` for footnote 1 on page 12).

</details>

---

## Final instructions
Start from the beginning, process fully. Produce the outupt required, not any commentary about what you should do. Are you ready?

```


