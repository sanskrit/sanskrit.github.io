+++
title = "Interleave translation"
+++

## mUla and En translation
### Non-detail mUla - No sandhi splitting
```markdown

I will give you some text and translation.  
Separate sentences and interleave translation in the following format for each sentence:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL SENTENCE, fed into hyphenator algorithm defined below.
</details>

<details><summary>English</summary>

TRANSLATION
</details>

<details><summary>English - Notes</summary>

ANY NOTES ASSOCIATED WITH THE TRANSLATION. SKIP THIS DETAILS BLOCK IF THERE ARE NO NOTES.
</details>

<details><summary>मूलम्</summary>

ORIGINAL SENTENCE (WITH NO CHANGES)
</details>

Suggest any corrections in this format : [[OLD|NEW]].

**IMPORTANT FORMATTING RULES:**  

The empty lines shown above are significant and must be retained. Note that there should be no empty line before `</details>` tag.  
Retain all other markdown (eg. headings) as they are.

## Hyphenator algorithm
This algorithm is to be applied to text only where explicitly required above, and nowhere else.

### **Part 1: Definitions and Core Principles**

#### **1. Word or Stem Boundary**

A word or stem boundary is the point where two words or stems are joined (possibly but not always involving sandhi) without a space or hyphen. It is the character sequence spanning the end of the first word and the beginning of the second.

#### **2. The Separation Principle**

The core of your task is to identify "separable" boundaries and insert the correct separator (a space or a hyphen).

The **cardinal rule** is: **Do not revert the sandhi.** You are splitting the *result* of the sandhi, not undoing it.

#### **3. The Rule of Precedence: Non-Separability is Absolute**

This is the most critical section. The rules for non-separation **always take precedence** over rules for separation.

*   **If a boundary is identified as non-separable, you MUST NOT split it for any reason, even if the words form a compound (`samāsa`).** This is a veto rule.

#### **4. Boundary Types and Examples**

**A. Non-Separable Boundaries: These MUST NOT be split.**

*   **Vowel Lengthening (dīrgha sandhi):** When two vowels merge into a single long vowel (`आ`, `ई`, `ऊ`, `ॠ`).
  *   `दया + आर्द्र → दयार्द्र`. The boundary `या` is non-separable.
  *   `अपि + इच्छा → अपीच्छा`. The boundary `पी` is non-separable.
  *   **Crucial Compound Example:** `धर्म + अर्थ → धर्मार्थ`. This is a `dīrgha sandhi` within a compound. Because the non-separation rule is absolute, this **must remain `धर्मार्थ`**, not be split into `धर्म-अर्थ`.
  *   **Error Case Study:** The input `स्वप्रकाशाद्वितीय` (from `स्वप्रकाश + अद्वितीय`) must remain `स्वप्रकाशाद्वितीय` because it is a `dīrgha sandhi`. It is incorrect to split it as `स्वप्रकाश-अद्वितीय`.

*   **Vowel Combination (guṇa/vṛddhi sandhi):** When two vowels merge into a new, single vowel (`ए`, `ओ`, `ऐ`, `औ`).
  *   `महा + उत्सव → महोत्सव`. The boundary `हो` is non-separable.
  *   `राम + इति → रामेति`. The boundary `मे` is non-separable.
  *   `सदा + एव → सदैव`. The boundary `दै` is non-separable.

**B. Separable Boundaries: These MUST be split if not vetoed by a non-separable rule.**

*   **Vowel to Semivowel (yaṇ sandhi):** The transformed semivowel (`य्` or `व्`) stays with the first word.
  *   `इति + एवम् → इत्येवम्` must be split as `इत्य् एवम्`. (The `इ` became `य्`; the `य्` is kept).
  *   `मधु + अरिः → मध्वरिः` must be split as `मध्व्-अरिः`.

*   **Visarga (`ः`) Sandhi:**
  *   `visarga` to `ो`: `रामः + अस्ति → रामोऽस्ति`. Split as `रामो ऽस्ति`. (The avagraha `ऽ` is part of the boundary).
  *   `visarga` to `र्`: `दुः + प्रकृतेः + अस्य → दुष्प्रकृतेरस्य`. Split as `दुष्प्रकृतेर् अस्य`.
  *   `visarga` to `स्/श्/ष्`: `नमः + ते → नमस्ते`. Split as `नमस् ते`.

*   **Final `म्`:** A final `म्` before a vowel is separated by a space.
  *   `फलम् + अश्नुते → फलमश्नुते`. Split as `फलम् अश्नुते`.
  *   `अर्थम् + इति  → अर्थमिति`. Split as `अर्थम् इति`.

*   **Consonant Assimilation:**
  *   `तत् + हि → तद्धि`. Split as `तद् धि`.

### **Part 2: The Rigorous Processing Workflow**

Follow these steps in strict order. **This is not a set of guidelines; it is an algorithm.**

**Step 1: Text Cleanup and Normalization**
*   Remove hard-wrapped line breaks to create continuous paragraphs.
*   Correct obvious typographical errors (e.g., a space in the middle of a word).
*   Preserve intentional styles like **bold** and *italic*.
*   Identify Sanskrit text and its script (eg. kannaDa), wrap it in `<santext script=SCRIPT_NAME>` tags, and transliterate to devanāgarī for internal processing.

**Step 2: The Core Separation Algorithm**
For each text wrapped in `<santext>` tags, iterate through every potential word boundary and apply the following logic:

1.  **First Check (The Veto):** Examine the boundary. Is it a **non-separable** `dīrgha`, `guṇa`, or `vṛddhi` sandhi?
  *   If **YES**, the Rule of Precedence applies. **Do nothing.** Do not split it. Move to the next boundary.
2.  **Second Check (Separation):** If the boundary passed the first check (i.e., it is not a non-separable vowel merger), now determine if it is one of the **separable** types defined in Part 1, Section 4.B.
  *   If **NO**, do nothing and move on.
3.  **Apply Separation:** If the boundary has been confirmed as separable, insert the correct separator:
  *   Use a **hyphen (`-`)** if the words form a compound (`samāsa`). Example: `पुण्य-पापैः`.
  *   Use a **space (` `)** for all other separable cases. Example: `इत्य् एवम्`.

After processing all boundaries, transliterate the `<santext>` contents back to the original script (e.g., kannaDa).

**Step 3: Source Error Handling**
*   **This step is distinct from sandhi separation.** It concerns fixing clear spelling or grammatical errors in the *source words themselves*.
*   If you find such an error, suggest a correction inline using the format `[[OLD|NEW]]`. Example: `[[prarabvaṁ|prārabdhaṁ]]`.

**Step 4: Final Markdown Formatting**
*   Remove the `<santext>` tags.
*   **Quotes & Mantras:** Enclose short quotes (under 5 words) in `"` and format longer quotes or mantras as blockquotes (`>`).
*   **Structure:** End verse lines with two spaces for a soft break. Separate paragraphs with a blank line.
*   **Page Numbers:** Format page numbers (e.g., `६४`) as `[[P64]]` at the precise point of the page break. This can be within a paragraph which continues to the next page.
*   **Footnotes:** Format footnotes (e.g., `*`) using Markdown's footnote syntax (`[^1]`). Place the definition at the end. Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible. For example if footnote named 1 appears in page 12, make the reference 12_1.


## Final instructions
Start from the beginning, process fully. Don't produce any additional commentary. Are you ready?
```


### Terminal sandhi splitting (to fix)
```markdown

I will give you some text and translation.  
Separate sentences and interleave translation in the following format for each sentence:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL SENTENCE, with only sandhis in sentence ends (but nowhere else in the middle) resolved.
</details>

<details><summary>English</summary>

TRANSLATION
</details>

<details><summary>English - Notes</summary>

ANY NOTES ASSOCIATED WITH THE TRANSLATION. SKIP THIS DETAILS BLOCK IF THERE ARE NO NOTES.
</details>

<details><summary>मूलम्</summary>

ORIGINAL SENTENCE (WITH NO CHANGES)
</details>

Suggest any corrections in this format : [[OLD|NEW]].

**IMPORTANT FORMATTING RULES:**  

The empty lines shown above are significant and must be retained. Note that there should be no empty line before `</details>` tag.  
Retain all other markdown (eg. headings) as they are.

Are you ready?
```

### mUla not in details tag
```markdown

Consider the attached text and translation.  
Separate sentences and interleave translation in the following format for each sentence:

ORIGINAL SENTENCE, with only sandhis in sentence ends resolved.

<details><summary>English</summary>

TRANSLATION
</details>

Suggest any corrections in this format : [[OLD|NEW]].

**IMPORTANT FORMATTING RULES:**  

The empty lines shown above are significant and must be retained. Note that there should be no empty line before `</details>` tag.
```

### Insert above mUla
```markdown
You will be given some text and a translation or commentary.  

**Your Task:**
1. Identify every `<details><summary>मूलम्</summary> ... </details>` block.
  - (Ignore `मूलम् (संयुक्तम्)` blocks).
2. Insert the corresponding English translation segment directly **above** each identified tag, separated by two empty lines.
3. Use the format:
   <details><summary>English</summary>

   TRANSLATION_TEXT
   </details>

**Strict Constraints:**
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character.
- **Verbatim Copying:** Outside of fixing stray Latin letters, do not change a single character, accent mark (svara), or punctuation in the original Sanskrit text.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, spacing, and accent marks (svara marks) in the source text exactly as provided.
- **Sequential Matching:** Match the translation sentences to the 'मूलम्' blocks in the order they appear.

Are you ready?
```



## mUla and OCR with commentary
### mUla not in details
```markdown
I will give you two texts - 1 is clean source of the sanskrit original. 2 is OCR of the same text with commentary. Using this, produce a md file which interleaves the commentary in this form

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL VAKYA OR VERSE
</details>

<details><summary>टीका</summary>

COMMENTARY
</details>

<details><summary>मूलम्</summary>

ORIGINAL VAKYA OR VERSE (SAME AS IN विश्वास-प्रस्तुतिः ABOVE)
</details>


Suggest corrections only in the commentary portion, only in this form - [OLD|NEW]. No wanton change of text.  
Use markdown format for footnotes. (if footnote named 1 appears in page 12, make the reference 12_1).
```

## mUla & commentary
### mUla in details, insert below
```markdown
You will be given some text and a translation or commentary.  

**Your Task:**
1. Identify every `<details><summary>मूलम्</summary> ... </details>` block.
  - (Ignore `मूलम् (संयुक्तम्)` blocks).
2. Insert the corresponding commentary segment directly **below** each identified tag, separated by two empty lines.
3. Use the format:
   <details><summary>टीका</summary>

   COMMENTARY_TEXT, passed to hyphenator algorithm defined below if in sanskrit.
   </details>

**Strict Constraints:**
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character.
- **Verbatim Copying:** Outside of fixing stray Latin letters, do not change a single character, accent mark (svara), or punctuation in the original Sanskrit text.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, spacing, and accent marks (svara marks) in the source text exactly as provided.
- **Sequential Matching:** Match the translation sentences to the 'मूलम्' blocks in the order they appear.


## Hyphenator algorithm
This algorithm is to be applied to text only where explicitly required above, and nowhere else.

### **Part 1: Definitions and Core Principles**

#### **1. Word or Stem Boundary**

A word or stem boundary is the point where two words or stems are joined (possibly but not always involving sandhi) without a space or hyphen. It is the character sequence spanning the end of the first word and the beginning of the second.

#### **2. The Separation Principle**

The core of your task is to identify "separable" boundaries and insert the correct separator (a space or a hyphen).

The **cardinal rule** is: **Do not revert the sandhi.** You are splitting the *result* of the sandhi, not undoing it.

#### **3. The Rule of Precedence: Non-Separability is Absolute**

This is the most critical section. The rules for non-separation **always take precedence** over rules for separation.

*   **If a boundary is identified as non-separable, you MUST NOT split it for any reason, even if the words form a compound (`samāsa`).** This is a veto rule.

#### **4. Boundary Types and Examples**

**A. Non-Separable Boundaries: These MUST NOT be split.**

*   **Vowel Lengthening (dīrgha sandhi):** When two vowels merge into a single long vowel (`आ`, `ई`, `ऊ`, `ॠ`).
*   `दया + आर्द्र → दयार्द्र`. The boundary `या` is non-separable.
*   `अपि + इच्छा → अपीच्छा`. The boundary `पी` is non-separable.
*   **Crucial Compound Example:** `धर्म + अर्थ → धर्मार्थ`. This is a `dīrgha sandhi` within a compound. Because the non-separation rule is absolute, this **must remain `धर्मार्थ`**, not be split into `धर्म-अर्थ`.
*   **Error Case Study:** The input `स्वप्रकाशाद्वितीय` (from `स्वप्रकाश + अद्वितीय`) must remain `स्वप्रकाशाद्वितीय` because it is a `dīrgha sandhi`. It is incorrect to split it as `स्वप्रकाश-अद्वितीय`.

*   **Vowel Combination (guṇa/vṛddhi sandhi):** When two vowels merge into a new, single vowel (`ए`, `ओ`, `ऐ`, `औ`).
*   `महा + उत्सव → महोत्सव`. The boundary `हो` is non-separable.
*   `राम + इति → रामेति`. The boundary `मे` is non-separable.
*   `सदा + एव → सदैव`. The boundary `दै` is non-separable.

**B. Separable Boundaries: These MUST be split if not vetoed by a non-separable rule.**

*   **Vowel to Semivowel (yaṇ sandhi):** The transformed semivowel (`य्` or `व्`) stays with the first word.
*   `इति + एवम् → इत्येवम्` must be split as `इत्य् एवम्`. (The `इ` became `य्`; the `य्` is kept).
*   `मधु + अरिः → मध्वरिः` must be split as `मध्व्-अरिः`.

*   **Visarga (`ः`) Sandhi:**
*   `visarga` to `ो`: `रामः + अस्ति → रामोऽस्ति`. Split as `रामो ऽस्ति`. (The avagraha `ऽ` is part of the boundary).
*   `visarga` to `र्`: `दुः + प्रकृतेः + अस्य → दुष्प्रकृतेरस्य`. Split as `दुष्प्रकृतेर् अस्य`.
*   `visarga` to `स्/श्/ष्`: `नमः + ते → नमस्ते`. Split as `नमस् ते`.

*   **Final `म्`:** A final `म्` before a vowel is separated by a space.
*   `फलम् + अश्नुते → फलमश्नुते`. Split as `फलम् अश्नुते`.
*   `अर्थम् + इति  → अर्थमिति`. Split as `अर्थम् इति`.

*   **Consonant Assimilation:**
*   `तत् + हि → तद्धि`. Split as `तद् धि`.

### **Part 2: The Rigorous Processing Workflow**

Follow these steps in strict order. **This is not a set of guidelines; it is an algorithm.**

**Step 1: Text Cleanup and Normalization**
*   Remove hard-wrapped line breaks to create continuous paragraphs.
*   Correct obvious typographical errors (e.g., a space in the middle of a word).
*   Preserve intentional styles like **bold** and *italic*.
*   Identify Sanskrit text and its script (eg. kannaDa), wrap it in `<santext script=SCRIPT_NAME>` tags, and transliterate to devanāgarī for internal processing.

**Step 2: The Core Separation Algorithm**
For each text wrapped in `<santext>` tags, iterate through every potential word boundary and apply the following logic:

1.  **First Check (The Veto):** Examine the boundary. Is it a **non-separable** `dīrgha`, `guṇa`, or `vṛddhi` sandhi?
*   If **YES**, the Rule of Precedence applies. **Do nothing.** Do not split it. Move to the next boundary.
2.  **Second Check (Separation):** If the boundary passed the first check (i.e., it is not a non-separable vowel merger), now determine if it is one of the **separable** types defined in Part 1, Section 4.B.
*   If **NO**, do nothing and move on.
3.  **Apply Separation:** If the boundary has been confirmed as separable, insert the correct separator:
*   Use a **hyphen (`-`)** if the words form a compound (`samāsa`). Example: `पुण्य-पापैः`.
*   Use a **space (` `)** for all other separable cases. Example: `इत्य् एवम्`.

After processing all boundaries, transliterate the `<santext>` contents back to the original script (e.g., kannaDa).

**Step 3: Source Error Handling**
*   **This step is distinct from sandhi separation.** It concerns fixing clear spelling or grammatical errors in the *source words themselves*.
*   If you find such an error, suggest a correction inline using the format `[[OLD|NEW]]`. Example: `[[prarabvaṁ|prārabdhaṁ]]`.

**Step 4: Final Markdown Formatting**
*   Remove the `<santext>` tags.
*   **Quotes & Mantras:** Enclose short quotes (under 5 words) in `"` and format longer quotes or mantras as blockquotes (`>`).
*   **Structure:** End verse lines with two spaces for a soft break. Separate paragraphs with a blank line.
*   **Page Numbers:** Format page numbers (e.g., `६४`) as `[[P64]]` at the precise point of the page break. This can be within a paragraph which continues to the next page.
*   **Footnotes:** Format footnotes (e.g., `*`) using Markdown's footnote syntax (`[^1]`). Place the definition at the end. Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible. For example if footnote named 1 appears in page 12, make the reference 12_1.


Are you ready?
```

### Pre-interleaved - make details
```markdown
You will be given some core text with a commentary or translation interleaved into it.  

Separate the core text and commentary blocks and interleave them in the following format for each block:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

CORE TEXT BLOCK, fed into hyphenator algorithm defined below.
</details>

<details><summary>टीका</summary>

COMMENTARY, fed into hyphenator algorithm defined below.
</details>

<details><summary>मूलम्</summary>

CORE TEXT
</details>

Suggest any corrections in this format : [[OLD|NEW]].

**IMPORTANT FORMATTING RULES:**

The empty lines shown above are significant and must be retained. Note that there should be no empty line before `</details>` tag.  
Retain all other markdown (eg. headings) as they are.

## Hyphenator algorithm
This algorithm is to be applied to text only where explicitly required above, and nowhere else.

### **Part 1: Definitions and Core Principles**

#### **1. Word or Stem Boundary**

A word or stem boundary is the point where two words or stems are joined (possibly but not always involving sandhi) without a space or hyphen. It is the character sequence spanning the end of the first word and the beginning of the second.

#### **2. The Separation Principle**

The core of your task is to identify "separable" boundaries and insert the correct separator (a space or a hyphen).

The **cardinal rule** is: **Do not revert the sandhi.** You are splitting the *result* of the sandhi, not undoing it.

#### **3. The Rule of Precedence: Non-Separability is Absolute**

This is the most critical section. The rules for non-separation **always take precedence** over rules for separation.

*   **If a boundary is identified as non-separable, you MUST NOT split it for any reason, even if the words form a compound (`samāsa`).** This is a veto rule.

#### **4. Boundary Types and Examples**

**A. Non-Separable Boundaries: These MUST NOT be split.**

*   **Vowel Lengthening (dīrgha sandhi):** When two vowels merge into a single long vowel (`आ`, `ई`, `ऊ`, `ॠ`).
*   `दया + आर्द्र → दयार्द्र`. The boundary `या` is non-separable.
*   `अपि + इच्छा → अपीच्छा`. The boundary `पी` is non-separable.
*   **Crucial Compound Example:** `धर्म + अर्थ → धर्मार्थ`. This is a `dīrgha sandhi` within a compound. Because the non-separation rule is absolute, this **must remain `धर्मार्थ`**, not be split into `धर्म-अर्थ`.
*   **Error Case Study:** The input `स्वप्रकाशाद्वितीय` (from `स्वप्रकाश + अद्वितीय`) must remain `स्वप्रकाशाद्वितीय` because it is a `dīrgha sandhi`. It is incorrect to split it as `स्वप्रकाश-अद्वितीय`.

*   **Vowel Combination (guṇa/vṛddhi sandhi):** When two vowels merge into a new, single vowel (`ए`, `ओ`, `ऐ`, `औ`).
*   `महा + उत्सव → महोत्सव`. The boundary `हो` is non-separable.
*   `राम + इति → रामेति`. The boundary `मे` is non-separable.
*   `सदा + एव → सदैव`. The boundary `दै` is non-separable.

**B. Separable Boundaries: These MUST be split if not vetoed by a non-separable rule.**

*   **Vowel to Semivowel (yaṇ sandhi):** The transformed semivowel (`य्` or `व्`) stays with the first word.
*   `इति + एवम् → इत्येवम्` must be split as `इत्य् एवम्`. (The `इ` became `य्`; the `य्` is kept).
*   `मधु + अरिः → मध्वरिः` must be split as `मध्व्-अरिः`.

*   **Visarga (`ः`) Sandhi:**
*   `visarga` to `ो`: `रामः + अस्ति → रामोऽस्ति`. Split as `रामो ऽस्ति`. (The avagraha `ऽ` is part of the boundary).
*   `visarga` to `र्`: `दुः + प्रकृतेः + अस्य → दुष्प्रकृतेरस्य`. Split as `दुष्प्रकृतेर् अस्य`.
*   `visarga` to `स्/श्/ष्`: `नमः + ते → नमस्ते`. Split as `नमस् ते`.

*   **Final `म्`:** A final `म्` before a vowel is separated by a space.
*   `फलम् + अश्नुते → फलमश्नुते`. Split as `फलम् अश्नुते`.
*   `अर्थम् + इति  → अर्थमिति`. Split as `अर्थम् इति`.

*   **Consonant Assimilation:**
*   `तत् + हि → तद्धि`. Split as `तद् धि`.

### **Part 2: The Rigorous Processing Workflow**

Follow these steps in strict order. **This is not a set of guidelines; it is an algorithm.**

**Step 1: Text Cleanup and Normalization**
*   Remove hard-wrapped line breaks to create continuous paragraphs.
*   Correct obvious typographical errors (e.g., a space in the middle of a word).
*   Preserve intentional styles like **bold** and *italic*.
*   Identify Sanskrit text and its script (eg. kannaDa), wrap it in `<santext script=SCRIPT_NAME>` tags, and transliterate to devanāgarī for internal processing.

**Step 2: The Core Separation Algorithm**
For each text wrapped in `<santext>` tags, iterate through every potential word boundary and apply the following logic:

1.  **First Check (The Veto):** Examine the boundary. Is it a **non-separable** `dīrgha`, `guṇa`, or `vṛddhi` sandhi?
*   If **YES**, the Rule of Precedence applies. **Do nothing.** Do not split it. Move to the next boundary.
2.  **Second Check (Separation):** If the boundary passed the first check (i.e., it is not a non-separable vowel merger), now determine if it is one of the **separable** types defined in Part 1, Section 4.B.
*   If **NO**, do nothing and move on.
3.  **Apply Separation:** If the boundary has been confirmed as separable, insert the correct separator:
*   Use a **hyphen (`-`)** if the words form a compound (`samāsa`). Example: `पुण्य-पापैः`.
*   Use a **space (` `)** for all other separable cases. Example: `इत्य् एवम्`.

After processing all boundaries, transliterate the `<santext>` contents back to the original script (e.g., kannaDa).

**Step 3: Source Error Handling**
*   **This step is distinct from sandhi separation.** It concerns fixing clear spelling or grammatical errors in the *source words themselves*.
*   If you find such an error, suggest a correction inline using the format `[[OLD|NEW]]`. Example: `[[prarabvaṁ|prārabdhaṁ]]`.

**Step 4: Final Markdown Formatting**
*   Remove the `<santext>` tags.
*   **Quotes & Mantras:** Enclose short quotes (under 5 words) in `"` and format longer quotes or mantras as blockquotes (`>`).
*   **Structure:** End verse lines with two spaces for a soft break. Separate paragraphs with a blank line.
*   **Page Numbers:** Format page numbers (e.g., `६४`) as `[[P64]]` at the precise point of the page break. This can be within a paragraph which continues to the next page.
*   **Footnotes:** Format footnotes (e.g., `*`) using Markdown's footnote syntax (`[^1]`). Place the definition at the end. Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible. For example if footnote named 1 appears in page 12, make the reference 12_1.


## Final instructions
Start from the beginning, process fully. Don't produce any additional commentary. Are you ready?
```

## mUla translation page layout

```markdown
I will give you OCR of a certain book, where each page has the original sanskrit text (aka mUla) at the top, and a translation below. You are to produce some clean markdown from it, subject to the below rules.

**Output Structure**  
For each original sanskrit verse (exactly 1, not more or less) in the mUla and the corresponding translation, produce the following tags - 

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL_VERSE
</details>

<details><summary>हिन्दी</summary>

TRANSLATION
</details>

<details><summary>मूलम्</summary>

ORIGINAL_VERSE
</details>

**Corrections**
You should not alter a single word anywhere, but you may suggest corrections in [[OLD|NEW]] format.

**Page Numbers:** Format page numbers (e.g., `६४`) as `[[P64]]` at the precise point of the page break. This can be within a paragraph which continues to the next page.

Be sure to use markdown format for **headings and footnotes**.

**Footnotes:** Format footnotes (e.g., `*`) using Markdown's footnote syntax (`[^1]`). Place the definition at the end. Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible. For example if footnote named 1 appears in page 12, make the reference 12_1.


## Final instructions
Start from the beginning, process fully. Don't produce any additional commentary. Are you ready?
```

## En and Es translation addition
```markdown

You will be given some markdown text. 

Under each <details><summary>नीलमेघः (सं)</summary> ... </details> block, place the following blocks - 

<details><summary>English</summary>

ENGLISH TRANSLATION corresponding to the text in the नीलमेघः (सं) block above, selected FROM THE translation provided in the end (not anything freshly created)
</details>

<details><summary>Español</summary>

Spanish translation of the above English block
</details>
```

## maNipravALa, skt, kn
```markdown
I will give you some text in kannaDa script where each numbered maNipravALa (sanskritized tamil) sUtra is followed by a sanskrit verse and kannada translation.

Give me markdown, in this format -

<details><summary>मूलम् - SENTENCE_NUMBER</summary>

ORIGINAL SENTENCE
</details>

<details><summary>वकुल-भूषणः (सं) - SENTENCE_NUMBER</summary>

SANSKRIT VERSE
</details>

<details><summary>वकुल-भूषणः (क) - SENTENCE_NUMBER</summary>

KANNADA COMMENTARY
</details>

Suggest any textual corrections in this format : [[OLD|NEW]]. Remember that you can only suggest corrections, not autocorrect.

**IMPORTANT FORMATTING RULES:**

The empty lines shown above are significant and must be retained. Note that there should be no empty line before `</details>` tag.

```