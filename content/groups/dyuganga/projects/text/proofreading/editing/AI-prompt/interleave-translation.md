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

