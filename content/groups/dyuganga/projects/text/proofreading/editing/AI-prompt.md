+++
title = "AI prompt"
+++

- Go to [aistudio](https://aistudio.google.com/prompts/new_chat).  
- Pick a prompt from the list provided below appropriate for your task. 
- Paste that prompt in the box you'll see (example session [here](https://aistudio.google.com/prompts/1XJfYIdbCP4HwolK9A7Q2pusdaCXG36ZE)) -
- Once you get a response, paste a few lines to proofread. (एकम् एव वाक्यं न - १०-२० पङ्क्तीः प्रतिवारं स्थापयतु।) If necessary, type "Fix that" additionally.
  - Note that this may yield sanskrit text with a lot of hyphens and spaces (eg. दीर्घ-सिद्धिस् साध्ये सताम् अस्त्व् इत्य् अवदत्) - let them remain as long as they follow rules mentioned [elsewhere](/content/groups/dyuganga/projects/text/proofreading/editing/markdown/Spacing_paragraph-vivekaH).
- Get the altered text using the "copy markdown" option shown in the figure below. (यन्त्र-परिष्कारं जातं लब्ध्वा)
- ततो मानुष-शोधनम्। अनेन परिष्कार-गतिर् वर्धेत।  
- Rather than reuse the same chat for multiple inputs, it is better to delete the older input and response (see figure below). This keeps the machine fast and efficient. Or you can start a fresh chat.

{{< figure src="../../AI/images/gemini-aistudio-message-options.png" title="" class="thumbnail">}}

<details><summary>Freezes (द्रष्टुं नोद्यम्)</summary>

Sometimes it errors out and you will see a red exclamation mark. You can then continue from where it left off using a "continue" prompt.  
This sometimes won't work - regenerates from the beginning - so you need to provide the remaining text again.
</details>

<details><summary>Chat context</summary>

A chat holds the collective memory of your interaction with the LLM. Token count indicates the context size. Smaller the better.

Try collecting all your instructions into a single comprehensive prompt

So, it's better to start a fresh chat every few inputs rather than reuse the same chat?

The tokenizer converts the text/image/audio into number vectors called embeddings. The process is reversed when generating user-facing output. 

Context size grows quadratically - like a square minus the diagonal. Gemini explaining attention -

* 1 token paying attention to itself = 1 connection (1x1)
* 2 tokens: each token pays attention to both tokens = 4 connections (2x2)
* 3 tokens: each token pays attention to all three tokens = 9 connections (3x3)
</details>


<details><summary>Settings</summary>

Also, if you provide a URL, the URL context toggle needs to be enabled. Which i think you must have done. Else you see a yellow exclamation message (and the LLM will hallucinate the contents at the url)
</details>


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

**Format quotes** (mantras to be chanted are also counted as quotes) as follows -

- Short quotes, involving 2-3 words should be placed within ""symobls.
- Longer quotes should use the markdown >-symbol.
- Nested quotes should be similarly formatted.

**Markdown formatting** will be used - so be careful not to mess with spaces.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

## Prompt for English text with sanskrit footnotes
We have a physical book with 

- English content with some sanskrit IAST words.
- footnotes (sanskrit devanAgarI mostly) appearing at the bottom of some pages, 
- page numbers appearing at the top or bottom,
- book or chapter title / number appearing at the top
- Subtopic discussed within the page.

You'll be given some plain text (OCR of some pages). Use it to produce clean markdown. 

**Identify errors and suggest corrections** inline, within content, footnotes and section headings, using this format {{OLD|NEW}}. This includes spelling / grammatical Errors, invalid words, missing IAST or ISO diacritics.

**Identify footnotes and footnote-references**, and format them appropriately. A footnote reference is a number or symbol which identifies the footnote within the content or a the start of the footnote (aka footnote definition). Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

Some pages **specify the subtopic** discussed in the page - insert that as a markdown section heading at the appropriate place. If the section heading has already been inserted in a preceding page, don't reinsert it again.

Some pages specify the title of the book or chapter - remove those. 

## Prompt for other Indic language
We have a physical book with

- Indic language content.
- footnotes appearing at the bottom of some pages,
- page numbers appearing at the top or bottom,
- possibly book or chapter title / number appearing at the top
- possibly - subtopic discussed within the page.

You'll be given some plain text (OCR of some pages). Use it to produce clean markdown.

**Identify errors and suggest corrections** inline, within content, footnotes and section headings, using this format {{OLD|NEW}}. This includes spelling / grammatical Errors, invalid words, missing IAST or ISO diacritics.

**Identify footnotes and footnote-references**, and format them appropriately. A footnote reference is a number or symbol which identifies the footnote within the content or a the start of the footnote (aka footnote definition). Make the footnote definitions appear next to the paragraph containing the corresponding footnote reference. Ensure that footnote references are unique, reflecting the number used in the source whenever possible. For example if footnote named 1 appears in page 12, make the reference 12_1

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

Some pages **specify the subtopic** discussed in the page - insert that as a markdown section heading at the appropriate place. If the section heading has already been inserted in a preceding page, don't reinsert it again.

Some pages specify the title of the book or chapter - remove those. 
