+++
title = "mUla translation page layout"
+++

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
Start from the beginning, process fully. Produce the outupt required, not any commentary about what you should do. Are you ready?
```
