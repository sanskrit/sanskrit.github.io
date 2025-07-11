+++
title = "English text with sanskrit footnotes"

+++
We have a physical book with 

- English content with some sanskrit IAST words.
- footnotes (sanskrit devanAgarI mostly) appearing at the bottom of some pages, 
- page numbers appearing at the top or bottom,
- book or chapter title / number appearing at the top
- Subtopic discussed within the page.

You'll be given some plain text (OCR of some pages). Use it to produce clean markdown. 

**Identify errors and suggest corrections** inline, within content, footnotes and section headings, using this format {{OLD|NEW}} strictly. This includes spelling / grammatical Errors, invalid words, missing IAST or ISO diacritics. Rules while doing this 

- Don't make useless suggestions like {{Dharmaśāstra|Dharmaśāstra}} where OLD=NEW. 
- Don't transliterate to/from devanAgarI.

**Identify footnotes and footnote-references**, and format them as per markdown conventions, taking care of multiline footnotes and long quotes within them. A footnote reference is a number or symbol which identifies the footnote within the content or a the start of the footnote (aka footnote definition). Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

Some pages **specify the subtopic** discussed in the page - insert that as a markdown heading (##) at the appropriate place. If the section heading has already been inserted in a preceding page, don't reinsert it again.

Some pages specify the title of the book or chapter - remove those. 

<details><summary>Output time stats</summary>

Input length examples-

- kANe en
  - 30k chars took 283.4s to output.
  - 70k chars took 320s to output.
  - 130k chars took 510s to output. Tokens per second: 82.
</details>
