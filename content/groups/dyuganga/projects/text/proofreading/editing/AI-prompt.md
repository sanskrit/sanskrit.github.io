+++
title = "AI prompt"
+++

- Go to [aistudio](https://aistudio.google.com/prompts/new_chat).  
- Pick a prompt from the list provided below appropriate for your task. 
- Paste that prompt in the box you'll see (example session [here](https://aistudio.google.com/prompts/1XJfYIdbCP4HwolK9A7Q2pusdaCXG36ZE)) -
- Once you get a response, paste a few lines to proofread. (एकम् एव वाक्यं न - १०-२० पङ्क्तीः प्रतिवारं स्थापयतु।) If necessary, type "Fix that" additionally.
  - Note that this may yield sanskrit text with a lot of hyphens and spaces (eg. दीर्घ-सिद्धिस् साध्ये सताम् अस्त्व् इत्य् अवदत्) - let them remain as long as they follow rules mentioned [elsewhere](/content/groups/dyuganga/projects/text/proofreading/editing/markdown/Spacing_paragraph-vivekaH).
- यन्त्र-परिष्कारं जातं लब्ध्वा, ततो मानुष-शोधनम्। अनेन परिष्कार-गतिर् वर्धेत।  


## Prompt for sanskrit devanAgarI markdown
We have a physical book with

- sanskrit devanAgarI content
- possibly footnotes appearing at the bottom of each page
- page numbers appearing at the top or bottom,

You will be provided sanskrit devanAgarI markdown (from OCR of some pages). You'll proofread with the following edits.

**Separate words** at pada (inflected word) boundaries with spaces.  
In doing this, NEVER break a sandhi. For example, ह्यस्तु should be spit to ह्य् अस्तु and not हि अस्तु.

**Separate subwords** inside compounds with hyphens. In doing this, observe the following rules

- NEVER break a sandhi. For example, श्रीधरस्येच्छा should yield श्री-धरस्येच्छा, and not श्री-धरस्य-इच्छा. 
- Never separate such subwords by space - remove such spurious spaces. 
- Don't separate upasarga prefixes - आश्रमम् should not be replaced by आ-श्रमम्.

Also, **recreate sandhi** in case a sandhi is broken within a sentence. For example - अथ स्थापकः अनिरुद्धः विष्वक्सेनः should be made to अथ स्थापको ऽनिरुद्धो विष्वक्सेनः. However, follow these rules - 

- If the sandhi break denotes separate sentances or pauses, insert apprpriate punctuation like , or ।.
- Don't remove avagraha-s. Eg. don't replace यदा ऽऽत्मानं with यदात्मानं.

While at it, **identify errors and suggest corrections** inline using this format {{OLD|NEW}}. This includes spelling / grammatical Errors, invalid words. 

**Markdown formatting** will be used - so be careful not to mess with spaces.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

## Prompt for English text with sanskrit footnotes
We have a physical book with 

- English content with some sanskrit IAST words.
- footnotes (sanskrit devanAgarI mostly) appearing at the bottom of each page, 
- page numbers appearing at the top or bottom,
- book or chapter title / number appearing at the top
- Subtopic discussed within the page.

You'll be given some plain text (OCR of some pages). Use it to produce clean markdown. 

**Identify errors and suggest corrections** inline, within content, footnotes and headings, using this format {{OLD|NEW}}. This includes spelling / grammatical Errors, invalid words, missing IAST or ISO diacritics.

**Identify footnotes and footnote-references**, and format them appropriately. A footnote reference is a number or symbol which identifies the footnote within the content or a the start of the footnote (aka footnote definition). Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

Some pages **specify the subtopic** discussed in the page - insert that as a markdown section heading at the appropriate place. Make sure to Identify errors and suggest corrections there too using this format {{OLD|NEW}}.

Some pages specify the title of the book or chapter - remove those. 

