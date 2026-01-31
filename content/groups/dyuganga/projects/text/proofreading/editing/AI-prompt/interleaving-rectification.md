+++
title = "Interleaving rectification"
+++

## Veda
```markdown
You'll be given a bunch of <details><summary>मूलम्</summary> ... </details> blocks which ought to be preceded by विश्वास-प्रस्तुतिः and English blocks, and succeeded by पद-पाठः, भट्टभास्कर-टीका and सायण-टीका blocks. An example is shown below.

<details open><summary>विश्वास-प्रस्तुतिः</summary>

पर᳓स्ताद् अर्वा᳓चो वृणीते ।
</details>

<details><summary>English</summary>

He chooses, beginning at the further end, in order of descent;
</details>

<details><summary>मूलम्</summary>

प॒रस्ता॑द् अ॒र्वाचो॑ वृणीते ।
</details>

<details><summary>पद-पाठः</summary>

प॒रस्ता॑त् । अ॒र्वाचः॑ । वृ॒णी॒ते॒ ।
</details>

<details><summary>भट्टभास्कर-टीका</summary>

14परस्तादिति ॥ परस्तात् पुरुषाद् आरभ्य अर्वाचः अधस्ताद् अवस्थितान् ऋषीन् वृणीते यथा - भृग्वादयो जमदग्न्यन्ताः । परशब्दात्पञ्चम्यन्तात् 'दिक्छन्ब्देभ्यः' इत्यादिना अस्तातिप्रत्ययः ।
</details>

<details><summary>सायण-टीका</summary>

अस्मिन्वरणे प्रकारविशेषं विधत्ते- परस्तादर्वांचा इति ।  
वर्तमानं यजमानमपेक्ष्य पूर्वभावी यो गोत्रप्रवर्तकस्तमारभ्य तदपत्यपरम्परयाऽर्वाचो नीचान्वृणीते। तथैव पूर्वमुदाहृतं भृगोरपत्यं च्यवनस्तस्यापत्यमप्नवानत्तस्यापत्यमौर्वस्तस्यापत्यं जमदग्निस्तस्य संततिर्यजमान इति। तदेतदर्वाक्त्वम्।
</details>

For some mUla blocks however, the surrounding blocks either don't exist or don't match the corresponding mUla block - the corresponding text is found in a block corresponding to some other mUla block. Your job is to _move_ (not invent) such text to (possibly newly inserted) blocks surrounding the right mUla-block. Be sure not to modify even a single non-whitespace character while moving (you can suggest corrections in this format though - [[OLD|NEW]]).

Are you ready?
```