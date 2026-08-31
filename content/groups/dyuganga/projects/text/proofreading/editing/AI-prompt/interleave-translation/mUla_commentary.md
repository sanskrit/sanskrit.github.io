+++
title = "mUla & commentary"
+++
## mUla in details, insert below
```markdown
You will be given two inputs -

1. some text 
2. and a translation or commentary (possibly accompanied by quasi-copies of the मूलम् parts found in input 1, which you should ignore).  

**Your Task:**
1. Identify every `<details><summary>मूलम्</summary> ... </details>` block in input 1.
  - (Ignore `मूलम् (संयुक्तम्)` blocks).
2. Insert the corresponding commentary segment directly **below** each identified tag, separated by two empty lines.
3. Use the format:
   <details><summary>टीका</summary>

   COMMENTARY_TEXT, passed to hyphenator algorithm defined below if in sanskrit.
   </details>

**Strict Constraints:**
- **Script Integrity:** Ensure that all Sanskrit text remains in Devanagari. If you find stray Latin characters within a Devanagari block (e.g., "ye" instead of "ये"), correct them to the proper Devanagari character.
- **Verbatim Copying:** Outside of fixing stray Latin letters, do not change a single character, accent mark (svara), or punctuation in the original Sanskrit text.
- **No Extra Commentary:** Do not add your own explanations or "Here is the text" headers.
- **Preserve Formatting:** Maintain all original tags, spacing, and accent marks (svara marks) in the source text exactly as provided.
- **Sequential Matching:** Match the translation/ commentary sentences to the 'मूलम्' blocks in the order they appear. But don't force this. 
- **Appendix** - alert me in an appendix if the commentary provided is entirely wrong, or if extra commentary was provided in the beginning or end.

