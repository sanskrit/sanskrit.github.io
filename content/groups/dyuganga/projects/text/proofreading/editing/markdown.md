+++
title = "Editing"
+++

## General
- General reference: [MD Guide](https://www.markdownguide.org/extended-syntax/#footnotes).
- _italics_ - `_italics_`. **Bold** - `**Bold**`.
- Headings -
```
## Top heading
### Subheading
#### Subsubheading 
conent
```

## Lists
```
- item 1
  - item 1.1
- item 2
  - item 2.1
  - item 2.2
    - item 2.2.1
```

## Spacing
- Paragraphs are separated by empty lines. Please remove empty spaces at the beginning of lines.
- As far as possible, prefer paragraphs without any line breaks ("Enter" keystrokes). Just use word-wrap in your editor program.


## Quotes
- Please don’t use backticks (`). Use only ‘ or “.
- Ensure that quotes match (for example: 'the wife of the king, the man of _Devadatta_'. Or ”the wife of the king, the man of _Devadatta_”.). 
- Please make sure that the quotes are appropriately positioned - for example, 
  - this is bad: `'similar, '_ûnartha_, 'words, '_kalaha_ 'quarrel,'`
  - this is better: `'similar,' _ûnartha_, 'words,' _kalaha_ 'quarrel,'`
  - and this is best: `'similar', _ûnartha_, 'words', _kalaha_ 'quarrel',`. 
  - We're NOT OK with the "bad" punctuation, but ok with "better" and prefer "best" above.

## Footnotes
Often, footnotes which appear in the bottom of the page in a physical book, appear without separation in raw OCR text on screen. This confuses the reader. Hence, it should be properly formatted.

Consider the footnote in the image below (right click and open it in a new window for clearer view):

{{< figure src="../../images/kANe-footnote-example.png" title="" class="thumbnail">}}

Here is how it should be presented in the markdown file:

```markdown
He was only represented at first by symbols. If modern chronology about Buddha's ministry is to be followed [^1697] (he was born about 563 B. C. and died about 483 B, C.), it is almost impossible to hold that images of gods originally came to be made in imitation of images or statues of Buddha, since, as we saw above, temples and images of gods had already become widespread throughout India in the 4th or 5th century B. C. [^1698]. 

[^1697]: See 'History of Buddhist thought' by Dr. E. J. Thomas (1933) for these dates.

[^1698]:

    Vide Mr. O. C. Ganguly's paper 'the antiquity of the Buddha Image' in Ostasiatische Zeitschrift Noue Folge XIV, Heft 2/3, whore he adduces very weighty grounds for holding that the beginning of the cult of the worship of the imago of Buddha lies somewhere between 150 B. C. to 50 B. C.


The first view is supported with arguments of some weight by Dr. Farquhar in J. R. A. S. for 1928 pp. 15-23. ...

```

Observe:

- Footnote numbers have been formatted specially - `[^1698]` etc.
- Footnote definitions can be of two styles. Indenting is important in the second style, which can accommodate multiple paragraphs. ([MD Guide](https://www.markdownguide.org/extended-syntax/#footnotes).)
- We _may_ choose to break paragraphs, but not sentences, so as to define footnotes near their place of use. It is ok to place footnotes at the nearest logical place - example at the end of the paragraph or list.

## Tables and charts
- Please generate tables using [this online tool](https://www.tablesgenerator.com/markdown_tables). तत्र फलकं रचयतु। ततः "Generate"  इति नुदतु। ततः "Copy to clipboard" इति कृत्वा सम्पाद्यमानसञ्चिकायां लिम्पतु (paste करोतु)।
- Consider ditto marks or identical text associated with other text in a list (example [here](https://archive.org/details/ashtadhyayi/ashtadhyayi2?view=theater#page/n31/mode/1up)): Just repeat the text.
- In case of other cases/ confusion, please contact us with a link to the page with the table/ chart/ figure. Don’t hesitate to ask.


## Long quotes
Example:
```
… यथाऽऽहुः —

> (२) सुगतो यदि धर्मज्ञः कपिलो नेति का प्रमा।
> तावुभौ यदि धर्मज्ञौ मतभेदः कथं तयोः ॥ 

इति ।

```

