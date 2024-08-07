+++
title = "Footnotes"

+++
Often, footnotes which appear in the bottom of the page in a physical book, appear without separation in raw OCR text on screen. This confuses the reader. Hence, it should be properly formatted.

Every footnote has a **reference** position/ mark, and a **definition**. Example in the below image (right click and open it in a new window for clearer view):

{{< figure src="../../../images/footnote_ref_def.png" title="" class="thumbnail">}}

In our markup, every footnote should have it's references and definition clearly marked. 

## Example 1
Consider the footnote in the image below (right click and open it in a new window for clearer view):

{{< figure src="../../../images/kANe-footnote-example.png" title="" class="thumbnail">}}

Here is how it should be presented in the markdown file:

__________________________
```markdown
He was only represented at first by symbols. If modern chronology about Buddha's ministry is to be followed [^1697] (he was born about 563 B. C. and died about 483 B, C.), it is almost impossible to hold that images of gods originally came to be made in imitation of images or statues of Buddha, since, as we saw above, temples and images of gods had already become widespread throughout India in the 4th or 5th century B. C. [^1698]. 

[^1697]: See 'History of Buddhist thought' by Dr. E. J. Thomas (1933) for these dates.

[^1698]:

    Vide Mr. O. C. Ganguly's paper 'the antiquity of the Buddha Image' in Ostasiatische Zeitschrift Noue Folge XIV, Heft 2/3, whore he adduces very weighty grounds for holding that the beginning of the cult of the worship of the imago of Buddha lies somewhere between 150 B. C. to 50 B. C.


The first view is supported with arguments of some weight by Dr. Farquhar in J. R. A. S. for 1928 pp. 15-23. ...

```
__________________________

Observe:

- Footnote numbers have been formatted specially - `[^1698]` etc.
- Footnote definitions can be of two styles. Indenting is important in the second style, which can accommodate multiple paragraphs. ([MD Guide](https://www.markdownguide.org/extended-syntax/#footnotes).)
- We _may_ choose to break paragraphs, but not sentences, so as to define footnotes near their place of use. It is ok to place footnotes at the nearest logical place - example at the end of the paragraph or list.
- Footnote defintion should be preceded by an empty line.


Testing formatting: Use https://stackedit.io/app#

## Multiline footnotes

```
There is a famous poem[^13].

[^13]:

    The poem goes:

    > Twinkle twinkle little star  
    How I wonder what you are.
    >
    > Up above the world so high!  
    Like a diamond in the sky.
```

Observe that each line in the footnote definition has 4 initial spaces,  
and that there is an empty line in the beginning.  
Regarding paragraph formatting, line separation etc.. - usual markdown conventions (described [elsewhere](../) apply.)

यत्र दीर्घोद्धरणम् (श्लोकसदृशम्) भवति, तत्रैवम् अवश्यं क्रियताम्।  
अन्यथापि पादटिप्पन्यवगतौ paragraph-विन्यासः शोभते चेद् एवम्।


## Deduplication
प्रत्येकस्यां सञ्चिकायां
परस्परभेदवतां पादटिप्पनीनां सङ्क्यानाम् परस्परभेदो भवेत्।  

यत्र यत्र [^3] इत्य् अस्ति, तत्र तत्र समाना टिप्पनी दर्शनीया चेद् भिन्ना वार्ता। किन्तु +अत्र (उदाहरणार्थम्) -

```
[^3]: Caland's text reads tathai'vāñjanam. It needs to be emended as tathai'vāntarāñjanam following the earlier occurrence.  

[^3]: TĀ IV.9.1 

[^3]: TĀ IV.8.3 
```

इत्यादि बहुविधटिप्पन्यो निर्दिष्टाः समाननाम्ना `[^3]` इत्यनेन ।  
एवंं तर्हि कां कुत्र दर्शनीयम् इति सङ्गणकं कथं जानीयात्?

अत एव पार्थक्यं कल्पनीयम्। 
भेद-कल्पनार्थं पृष्ठसङ्ख्या-स्थापनं युज्येत।  
यथा १२तमे पृष्ठे वर्तमानाय `[^१]` इति सङ्केताय `[^१_१२]` इति लेखनम्। परिष्कारोदाहरणं यथा [ऽत्र](https://github.com/vishvAsa/vedAH/commit/3b23fa2757d06436821be91632d809d489d3b6b3) । 

अवरपक्षय् एवम् अपि यदृच्छया पृथक्करणं शक्यम् -

```
[^3_1]: Caland's text reads tathai'vāñjanam. It needs to be emended as tathai'vāntarāñjanam following the earlier occurrence.  

[^3_2]: TĀ IV.9.1 

[^3_3]: TĀ IV.8.3 
```

## Quote used entirely replacing author's words
{{< figure src="../../images/quote_entirely_replacing_author.jpg" title="" class="thumbnail">}}

Reg. example above -  
वस्तुतः "राजन्यवैश्ययोर् उपनयनम्" इत्यस्मिन् विभागे वर्तमानम् अखिलं ग्रन्थान्तराद् उद्धृतम् - आद्य्-अन्तयोर् वर्तमान-`"`-चिह्नेनैतज् ज्ञायते। तथापि स्ववचनस्थाने हि प्रयुक्तम्। अतस् तत्रोद्धरणचिह्नदानं नापेक्षितम्।

किञ्च, तद्-अन्तः यद् उद्धरण-जातम् अस्ति तत् तु दर्शनीयम्।
