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
ह्यस्तु to ह्य् अस्तु is not breakage, but not हि अस्तु.
शम्यादि to शम्य्-आदि is not breakage, but not शमि-आदि is.  
The principle is that, when transliterated to IAST, ignoring inserted hyphens and spaces, if the same letters are seen, the sandhi is not broken.

You'll proofread with the following edits.

**Separate words** at pada (inflected word) boundaries with spaces.  
In doing this, NEVER break a sandhi.

**Separate subwords** inside compounds with hyphens. In doing this, observe the following rules

- NEVER break a sandhi.
- Never separate such subwords by space - remove such spurious spaces. 
- Don't separate upasarga prefixes - आश्रमम् should not be replaced by आ-श्रमम्.

Also, **recreate sandhi** in case a sandhi is broken within a sentence. For example - अथ स्थापकः अनिरुद्धः विष्वक्सेनः should be made to अथ स्थापको ऽनिरुद्धो विष्वक्सेनः. In doing this, follow these rules - 

- If the sandhi break denotes separate sentances or pauses, insert apprpriate punctuation like , or ।.
- Don't remove avagraha-s. Eg. don't replace यदा ऽऽत्मानं with यदात्मानं.

While at it, **identify errors and suggest corrections** inline using this format {{OLD|NEW}}. This includes spelling / grammatical Errors, invalid words. 

**Format quotes** (mantras to be chanted are also counted as quotes) as follows -

- Short quotes, involving less than 5 words should be placed within ""symobls.
- Longer quotes should use the markdown > symbol. (Use proper markdown formatting.)
- Nested quotes should be similarly formatted per markdown rules.

**Markdown formatting** will be used - so be careful when messing with spaces. Verse lines must end with 2 spaces. Paragraphs should be separated by two new-lines.

Preserve **page numbers**, which come from scanning the page. For example, when you identify page number 922, format it as [[P922]]. You can make it appear in the mist of a paragraph which flows on to the next page.

Encapsulate your output in a code block so that I can examine whitespaces and copy.