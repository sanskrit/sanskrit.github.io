+++
title = "+AI prompt"

+++

- Go to [aistudio](https://aistudio.google.com/prompts/new_chat). यन्त्रजालक्षेत्रं यातु।  
- Pick a prompt from the list provided below appropriate for your task. यन्त्रायोचितम् आदेशं चिनोतु।  (Example: [sanskrit prompt](Sanskrit_devanAgarI_markdown), [english prompt](English_text_with_sanskrit_foo))
- Paste that prompt in the box you'll see. आदेशं यन्त्राय प्रेषयतु। 
- Once you get a response, paste a few lines to proofread. उत्तरे प्राप्ते, परिष्कार्यम् पाठं स्थापयतु। (एकम् एव वाक्यं न - १०-२० पङ्क्तीर्, द्वित्राणां वा पृष्ठानाम् पाठं प्रतिवारं स्थापयतु।) 
  - (Note that, depending on the prompt, this may yield sanskrit text with a lot of hyphens and spaces (eg. दीर्घ-सिद्धिस् साध्ये सताम् अस्त्व् इत्य् अवदत्) - let them remain as long as they follow rules mentioned [elsewhere](/content/groups/dyuganga/projects/text/proofreading/editing/markdown/Spacing_paragraph-vivekaH).)
- Get the altered text using the "copy markdown" option shown in the figure below. (यन्त्र-परिष्कारं जातं लब्ध्वा रक्षतु।)
- ततो मानुष-शोधनम्। अनेन परिष्कार-गतिर् वर्धेत।  
- Rather than reuse the same chat for multiple independent inputs, it is better to delete the older input and response (see figure below) once in a while - Or you can start a fresh chat. This keeps the machine fast and efficient. (काले काले जालक्षेत्रम् पिधाय नूतनतयोद्घाट्यादिशतु। )
  - If the inputs are heavily dependent on each other, then there is no alternative but to process them in a single session.

{{< figure src="images/gemini-aistudio-message-options.png" title="" class="thumbnail">}}

<details><summary>Stats</summary>

One can see the output time taken under the output. By clicking on it, one can get tokens per second and time to first token.
</details>


<details><summary>Freezes (द्रष्टुं नोद्यम्)</summary>

Sometimes it errors out and you will see a red exclamation mark. There is a 600 second timeout. So, keep the input appropriately small - measuring the max input length for the task by trial and error. 

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

Enable

- Also, if you provide a URL, the **URL context** toggle needs to be enabled. Else you see a yellow exclamation message (and the LLM will hallucinate the contents at the url)
- grounding with Google search.

</details>


**Prompts below.**
