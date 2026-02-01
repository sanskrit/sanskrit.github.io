+++
title = "Interleave translation"
+++

## mUla and En translation
```markdown

Consider the attached text and translation.  
Separate sentences and interleave translation in the following format for each sentence:

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL SENTENCE, with only sandhis in sentence ends resolved.
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
In the text given, you will see tags like the below- 

<details><summary>मूलम्</summary>

ORIGINAL_TEXT
</details>

Note - We're not referring to `<details><summary>मूलम् (संयुक्तम्)</summary> ... </details>` blocks.

Please add the relevant bit from the translation provided above every such tag, in the following format:

<details><summary>English</summary>

TRANSLATION
</details>

Are you ready?
```



## mUla and OCR with commentary
### mUla in details tag
```markdown
I will give you two texts - 1 is clean source of the sanskrit original. 2 is OCR of the same text with hindI commentary. Using this, produce a md file which interleaves the commentary in this form

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