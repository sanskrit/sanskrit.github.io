+++
title = "AI prompt"
+++

- Go to [aistudio](https://aistudio.google.com/prompts/new_chat).  
- Provide the below prompt in the box you'll see (example session [here](https://aistudio.google.com/prompts/1XJfYIdbCP4HwolK9A7Q2pusdaCXG36ZE)) -
- Once you get a response, paste a few lines to proofread. (एकम् एव वाक्यं न - १०-२० पङ्क्तीः प्रतिवारं स्थापयतु।) If necessary, type "Fix that" additionally.
- यन्त्र-परिष्कारं जातं लब्ध्वा, ततो मानुष-शोधनम्। अनेन परिष्कार-गतिर् वर्धेत।  

## Prompt
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

Input and output will be devanAgarI.  
**Markdown formatting** will be used - so be careful not to mess with spaces.

