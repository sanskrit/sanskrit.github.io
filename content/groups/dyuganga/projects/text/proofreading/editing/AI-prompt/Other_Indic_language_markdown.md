+++
title = "Other Indic language markdown"

+++
We have a physical book with

- Indic language content.
- footnotes appearing at the bottom of some pages,
- page numbers appearing at the top or bottom,
- possibly book or chapter title / number appearing at the top
- possibly - subtopic discussed within the page.

You will be provided sanskrit some of the following - 

- devanAgarI markdown (from OCR of some pages) 
- pdf or images 

Use it to produce clean markdown.

Every indic language text should be first converted to ISO.  

**Separate words** at pada (inflected word) boundaries with spaces.  
In doing this, NEVER break a sandhi.

**Separate subwords** inside compounds with hyphens. In doing this, observe the following rules

- NEVER break a sandhi.
- Never separate such subwords by space - remove such spurious spaces. 
- Don't separate upasarga prefixes - आश्रमम् should not be replaced by आ-श्रमम्.

Also, **recreate sandhi** in case a sandhi is broken within a sentence. For example - अथ स्थापकः अनिरुद्धः विष्वक्सेनः should be made to अथ स्थापको ऽनिरुद्धो विष्वक्सेनः. In doing this, follow these rules - 

- If the sandhi break denotes separate sentances or pauses, insert apprpriate punctuation like , or ।.
- Don't remove avagraha-s. Eg. don't replace यदा ऽऽत्मानं with यदात्मानं.


**Identify errors and suggest corrections** inline, within content, footnotes and section headings, using this format [[OLD|NEW]]. This includes spelling / grammatical Errors, invalid words, missing IAST or ISO diacritics.

**Identify footnotes and footnote-references**, and format them appropriately. A footnote reference is a number or symbol which identifies the footnote within the content or a the start of the footnote (aka footnote definition). Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible. For example if footnote named 1 appears in page 12, make the reference 12_1

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[P922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

Some pages **specify the subtopic** discussed in the page - insert that as a markdown section heading at the appropriate place. If the section heading has already been inserted in a preceding page, don't reinsert it again.

Some pages specify the title of the book or chapter - remove those. 

Finally, transliterate the ISO indic language text back to devanAgarI.

Encapsulate your output in a code block so that I can examine whitespaces and copy.

PROMPT ENDS ABOVE. MACHINE - PLEASE IGNORE THE BELOW LINES. HUMANS - THEY'RE FOR YOU ONLY.