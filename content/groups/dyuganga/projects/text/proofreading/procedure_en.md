+++
title = "Procedure (EN)"
+++

## Contribution levels
Our expectation: when we read the corrected text, we expect to have atleast the same experience as reading the original pdf (if not better). <u>Even otherwise, if you leave the text in a significantly better state than earlier, it is valuable.</u> 

- Top level: Perfect text and formatting.
- Next level: Perfect text, with basic formatting (described below). Reader won't feel particular urge to consult the source most of the time.
- Next level: Almost perfect text (possibly missing diacritics and accents), with basic formatting (contiguous paragraphs, footnotes etc.).
- And so on.

## Typing correct symbols
- Please use the correct symbols. Common mistakes: |(pipe) instead of ।(daNDa), :(colon) instead of visarga(ः).

### Special characters
If you cannot type unusual unicode characters, copy them from here and paste.

- IAST diacritics
  - ā Ā ī Ī ū Ū ṛ Ṛ ṝ Ṝ ḷ	Ḷ ḹ	Ḹ 
  - ṃ Ṃ ḥ Ḥ  
  - ṅ  Ṅ ñ Ñ 
  - ṭ Ṭ ḍ Ḍ
  - ś Ś ṣ Ṣ
- ISO 
  - ē ō r̥ r̥̄ l̥ l̥̄ ṁ
- Vedic Svaras
  - `  ॒   ॑ `

- No harm using ISO instead of IAST - we can fix it later.
- No harm ignoring initial letter capitalization (ie ṣ instead of Ṣ and so on).

## Formatting
- General reference: [MD Guide](https://www.markdownguide.org/extended-syntax/#footnotes).
- _italics_ - `_italics_`. **Bold** - `**Bold**`.
- Headings -
```
## Top heading
### Subheading
#### Subsubheading 
conent
```

### Lists
```
- item 1
  - item 1.1
- item 2
  - item 2.1
  - item 2.2
    - item 2.2.1
```

### Spacing
- Paragraphs are separated by empty lines. Please remove empty spaces at the beginning of lines.
- As far as possible, prefer paragraphs without any line breaks ("Enter" keystrokes). Just use word-wrap in your editor program.


### Quotes
- Please don’t use backticks (`). Use only ‘ or “.
- Ensure that quotes match (for example: 'the wife of the king, the man of _Devadatta_'. Or ”the wife of the king, the man of _Devadatta_”.). 
- Please make sure that the quotes are appropriately positioned - for example, 
  - this is bad: `'similar, '_ûnartha_, 'words, '_kalaha_ 'quarrel,'`
  - this is better: `'similar,' _ûnartha_, 'words,' _kalaha_ 'quarrel,'`
  - and this is best: `'similar', _ûnartha_, 'words', _kalaha_ 'quarrel',`. 
  - We're NOT OK with the "bad" punctuation, but ok with "better" and prefer "best" above.

### Footnotes
Often, footnotes which appear in the bottom of the page in a physical book, appear without separation in raw OCR text on screen. This confuses the reader. Hence, it should be properly formatted.

Consider the footnote in the image below (right click and open it in a new window for clearer view):

{{< figure src="../images/kANe-footnote-example.png" title="" class="thumbnail">}}

Here is how it should be presented in the markdown file:

```markdown
He was only represented at first by symbols. If modern chronology about Buddha's ministry is to be followed [^1697] (he was born about 563 B. C. and died about 483 B, C.), it is almost impossible to hold that images of gods originally came to be made in imitation of images or statues of Buddha, since, as we saw above, temples and images of gods had already become widespread throughout India in the 4th or 5th century B. C. [^1688]. 

[^1697]. See 'History of Buddhist thought' by Dr. E. J. Thomas (1933) for these dates.

[^1698].

    Vide Mr. O. C. Ganguly's paper 'the antiquity of the Buddha Image' in Ostasiatische Zeitschrift Noue Folge XIV, Heft 2/3, whore he adduces very weighty grounds for holding that the beginning of the cult of the worship of the imago of Buddha lies somewhere between 150 B. C. to 50 B. C.


The first view is supported with arguments of some weight by Dr. Farquhar in J. R. A. S. for 1928 pp. 15-23. ...

```

Observe:

- Footnote numbers have been formatted specially - `[^1698]` etc.
- Footnote definitions can be of two styles. Indenting is important in the second style, which can accommodate multiple paragraphs. ([MD Guide](https://www.markdownguide.org/extended-syntax/#footnotes).)
- We _may_ choose to break paragraphs, but not sentences, so as to define footnotes near their place of use. It is ok to place footnotes at the nearest logical place - example at the end of the paragraph or list.

### Tables and charts
- Please generate tables using [this online tool](https://www.tablesgenerator.com/markdown_tables).
- Consider ditto marks or identical text associated with other text in a list (example [here](https://archive.org/details/ashtadhyayi/ashtadhyayi2?view=theater#page/n31/mode/1up)): Just repeat the text.
- In case of other cases/ confusion, please contact us with a link to the page with the table/ chart/ figure. Don’t hesitate to ask.


### Long quotes
Example:
```
… यथाऽऽहुः —

> (२) सुगतो यदि धर्मज्ञः कपिलो नेति का प्रमा।
> तावुभौ यदि धर्मज्ञौ मतभेदः कथं तयोः ॥ 

इति ।

```

## Things to ignore
- Quotation mark placement which is not ‘bad’ as described in examples above - ie. don’t spend time trying to make it ‘best’.
- Empty spaces in lines. Don’t spend time correcting [spaces like this](https://i.imgur.com/On0RioK.png). 


## Submitting changes
- Please fork the repo, edit your files and send pull requests; a browser suffices - (I can guide on google meet).

### Account setup
- I must have sent out email invites to join https://trello.com/ocrcorrection . (We use trello for tracking tasks.) Please accept (contact me if you haven't received an invite).
- Everyone needs to have a github account (We use github for checking and accepting corrections - example here) and join https://github.com/orgs/vishvAsa/teams/ocr-correction/ . Please create a github account and let me know offline so that I can send you an email invite to join https://github.com/orgs/vishvAsa/teams/ocr-correction/ .

### Computer setup
Besides the above, (unless you are already computer-savvy and have other preferences) please set up your Windows computer (if you use another OS, let me know) in the following way, so that your work can be most enjoyable and seamless.

- [Git for windows](https://gitforwindows.org/)
- [Atom editor](https://atom.io/)
- Install Hugo (to verify your work on your computer) 
  - Option 1
    - Get a file like hugo_0.xx.x_Windows-64bit.zip from [Hugo releases](https://github.com/gohugoio/hugo/releases)
    - extract zip file contents to some place like C:\Hugo\bin.
    - add it to your path - Start button >> System >> Advanced System Settings on the left >> Environment Variables… button on the bottom >> User variables section >> Path >> Double click >> Click the New… button >> Type in the folder where hugo.exe was extracted
  - Alternatively [see here](https://gohugo.io/getting-started/installing/). 
