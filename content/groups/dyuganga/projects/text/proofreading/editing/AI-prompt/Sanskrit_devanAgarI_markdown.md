+++
title = "Sanskrit devanAgarI markdown"

+++

We have a physical book with

- sanskrit devanAgarI content
- possibly footnotes appearing at the bottom of each page
- page numbers appearing at the top or bottom,

You will be provided sanskrit some of the following - 

- devanAgarI markdown (from OCR of some pages) 
- pdf or images 

From that you'll produce proper and correct markdown, keeping text styles like bold and italic, separating paragraphs, but removing hard-wraps.  

First some clarification on what "**breaking a sandhi**" is.  
ह्यस्तु to ह्य् अस्तु is not breakage, but हि अस्तु.
शम्यादि to शम्य्-आदि is not breakage, but शमि-आदि is.  
The principle is that, when transliterated to IAST, ignoring inserted hyphens and spaces, if the same letters are seen, the sandhi is not broken.

You'll proofread with the following edits.

**Separate words** at pada (inflected word) boundaries with spaces.  
In doing this, NEVER break a sandhi as described above.  
In case a space appears in the middle of a pada, remove it.  
In case a hyphen appears instead of a space between padas, replace it with a space.

**Separate subwords** inside compounds with hyphens. In doing this, observe the following rules

- NEVER break a sandhi as described above.
- Never separate such subwords by space - remove such spurious spaces. 
- Don't separate upasarga prefixes - आश्रमम् should not be replaced by आ-श्रमम्.

Also, **recreate sandhi** in case a sandhi is broken within a sentence. For example - अथ स्थापकः अनिरुद्धः विष्वक्सेनः should be made to अथ स्थापको ऽनिरुद्धो विष्वक्सेनः. In doing this, follow these rules - 

- If the sandhi break denotes separate sentances or pauses, insert apprpriate punctuation like , or ।.
- Don't remove avagraha-s. Eg. don't replace यदा ऽऽत्मानं with यदात्मानं.

While at it, **identify errors and suggest corrections** inline using this format [[OLD|NEW]]. This includes spelling / grammatical Errors, invalid words. 

**Format quotes** (mantras to be chanted are also counted as quotes) as follows -

- Short quotes, involving less than 5 words should be placed within ""symobls.
- Longer quotes should use the markdown > symbol. (Use proper markdown formatting.)
- Nested quotes should be similarly formatted per markdown rules.

**Markdown formatting** will be used - so be careful when messing with spaces. Verse lines must end with 2 spaces. Paragraphs should be separated by two new-lines.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[P922]]. You can make it appear in the mist of a paragraph which flows on to the next page. 

There should be no page breaks between paragraphs.

Final checks - 

- Ensure you've not broken sandhis as described earlier.
- Ensure footnotes are in markdown format.

Encapsulate your output in a code block so that I can examine whitespaces and copy.


<details><summary>उदाहरणानि</summary>

- [VV](https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221iJbRkKjT_icJLJY0PUa-_odk_TlTZFo8%22%5D,%22action%22:%22open%22,%22userId%22:%22109000762913288837175%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing)

</details>
