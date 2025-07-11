+++
title = "+AI prompt"

+++

- Go to [aistudio](https://aistudio.google.com/prompts/new_chat).  
- Pick a prompt from the list provided below appropriate for your task. 
- Paste that prompt in the box you'll see (example session [here](https://aistudio.google.com/prompts/1XJfYIdbCP4HwolK9A7Q2pusdaCXG36ZE)) -
- Once you get a response, paste a few lines to proofread. (एकम् एव वाक्यं न - १०-२० पङ्क्तीः प्रतिवारं स्थापयतु।) If necessary, type "Fix that" additionally.
  - Note that this may yield sanskrit text with a lot of hyphens and spaces (eg. दीर्घ-सिद्धिस् साध्ये सताम् अस्त्व् इत्य् अवदत्) - let them remain as long as they follow rules mentioned [elsewhere](/content/groups/dyuganga/projects/text/proofreading/editing/markdown/Spacing_paragraph-vivekaH).
- Get the altered text using the "copy markdown" option shown in the figure below. (यन्त्र-परिष्कारं जातं लब्ध्वा)
- ततो मानुष-शोधनम्। अनेन परिष्कार-गतिर् वर्धेत।  
- Rather than reuse the same chat for multiple independent inputs, it is better to delete the older input and response (see figure below) once in a while - Or you can start a fresh chat. This keeps the machine fast and efficient. 
  - If the inputs are heavily dependent on each other, then there is no alternative but to process them in a single session.

{{< figure src="images/gemini-aistudio-message-options.png" title="" class="thumbnail">}}

<details><summary>Freezes (द्रष्टुं नोद्यम्)</summary>

Sometimes it errors out and you will see a red exclamation mark. There seems to be a 600 second timeout.

You can then continue from where it left off using a "continue" prompt.  
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

Advanced settings - **Output length** - set to 65536 tokens by default. Must use paid plan to increase that.

Also, if you provide a URL, the **URL context** toggle needs to be enabled. Else you see a yellow exclamation message (and the LLM will hallucinate the contents at the url)

</details>

**Prompts below.**
