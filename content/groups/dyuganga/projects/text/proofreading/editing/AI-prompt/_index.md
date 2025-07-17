+++
title = "+AI prompt"

+++

- Go to [aistudio](https://aistudio.google.com/prompts/new_chat). यन्त्रजालक्षेत्रं यातु।  
- A **prompt** is a set of instructions given to the machine. It's usually many sentences.
- **Pick a prompt** from the list provided below appropriate for your task. यन्त्रायोचितम् आदेशं चिनोतु।  (Example: [sanskrit prompt](Sanskrit_devanAgarI_markdown), [english prompt](English_text_with_sanskrit_foo))
- **Paste** that entire prompt in the box you'll see. अखिलम् आदेशं बहुवाक्यात्मकम् अपि युगपद् यन्त्राय प्रेषयतु। 
- Once you get a response, give the material to proofread. उत्तरे प्राप्ते, परिष्कार्यम् पाठं स्थापयतु।
  - If you are providing plain text, paste a few pages or lines. (एकम् एव वाक्यं न - १०-२० पङ्क्तीर्, द्वित्राणां वा पृष्ठानाम् पाठं प्रतिवारं स्थापयतु।) 
  - If you are providing a scanned pdf - ensure that the size is < 50 MB. Or you can provide images.
- Get the altered text using the "copy markdown" option shown in the figure below. (यन्त्र-परिष्कारं जातं लब्ध्वा रक्षतु।)
- ततो **मानुष-शोधनम्**। अनेन परिष्कार-गतिर् वर्धेत।  
  - Manual comparison with the **source image** is critical - sometimes the LLM **hallucinates** seemingly valid sanskrit text.


## Periodic maintenance
- Rather than reuse the same chat for multiple independent inputs, it is better to delete the older input and response (see figure below) once in a while - Or you can start a fresh chat/ right click and branch from the initial prompt. Especially do it if the machine starts getting confused. This keeps the machine fast and efficient. (काले काले जालक्षेत्रम् पिधाय नूतनतयोद्घाट्यादिशतु। )
  - If the inputs are heavily dependent on each other, then there is no alternative but to process them in a single session.
- All images and pdf files you upload are stored in [Google drive](https://drive.google.com/drive/folders/). Go there, look for and enter a directory called "Google AI Studio", and delete old files/ chats once in a while.
- In case you need help, share the chat using the "<"-symbol in the top line (figure below). साहाय्यं चेद् अपेक्ष्यते - उपरि शीर्षिका-पङ्काव् "<"-चिह्नम् नुदित्वा प्रेषयतु। 

{{< figure src="images/gemini-aistudio-message-options.png" title="" class="thumbnail">}}

<details><summary>Stats</summary>

One can see the output time taken under the output. By clicking on it, one can get tokens per second and time to first token.
</details>


<details><summary>Freezes (द्रष्टुं नोद्यम्)</summary>

Sometimes it errors out and you will see a red exclamation mark. There is a 600 second timeout. So, keep the input appropriately small - measuring the max input length for the task by trial and error. Also select Gemini 2.5 flash where feasible (almost always).

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

<details><summary>Input</summary>

Gemini produces MUCH worse output when asked to extract text from a pdf with embedded ocr (though I recall seeing some message where it "assesses" ocr layer)
</details>



<details><summary>Settings</summary>

Advanced settings - **Output length** - set to 65536 tokens by default. Must use paid plan to increase that.

Enable

- Also, if you provide a URL, the **URL context** toggle needs to be enabled. Else you see a yellow exclamation message (and the LLM will hallucinate the contents at the url)
- grounding with Google search.

</details>

<details><summary>Prompt making (द्रष्टुं नोद्यम्)</summary>

- Iterate within a chat.  
- Then say - Improve my initial instructions so that you will get it right the first time in a fresh chat.
</details>



**Prompts below.**
