+++
title = "mUla, OCR with commentary"
+++
## mUla not in details
```markdown
I will give you two texts -  
1 is clean source of the sanskrit original.  
2 is some commentary or translation (possibly with the source text). Using this, produce a md file which interleaves the commentary in this form

<details open><summary>विश्वास-प्रस्तुतिः</summary>

ORIGINAL VAKYA OR VERSE PASSED THROUGH the Hyphenator algorithm defined below
</details>

<details><summary>मूलम्</summary>

ORIGINAL VAKYA OR VERSE WITHOUT ANY CHANGES
</details>

<details><summary>टीका</summary>

COMMENTARY PASSED THROUGH the Hyphenator algorithm defined below
</details>

**Strict Constraints:**
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, spacing, and accent marks (svara marks) in the source text exactly as provided.
- **Sequential Matching:** Match the translation/ commentary sentences to the 'मूलम्' blocks in the order they appear. But don't force this. 
- **Appendix** - alert me in an appendix if the commentary provided is entirely wrong, or if extra commentary was provided in the beginning or end.
- **Granularity:** Don't club multiple mUla vAkya-s together (unless they form a verse) - It's ok if each sentence does not have a corresponding commentary. 
