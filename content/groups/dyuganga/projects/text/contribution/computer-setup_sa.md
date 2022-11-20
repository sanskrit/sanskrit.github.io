+++
title = "Computer setup"
unicode_script = "devanagari"
+++

## समानं कर्म
- अधः XYZ इति यद् अस्ति, तस्य स्थाने स्वीयं github-नाम प्रयुङ्क्ताम्।
  - अथवैतत् प्रयुज्यतां यन्त्रम्: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">पाठम् परिवर्तय!!</button>
- https://github.com/XYZ/REPO इति पूर्वम् एव वर्तते चेन् निष्कासयतु browser-उपयोगेन।
- https://github.com/vishvAsa/REPO/fork इत्यत्र गत्वा पुनः "Create Fork" इति नुदतु। तत्करणे "Copy the master branch only " इति विकल्पं निराकरोतु। तेन https://github.com/XYZ/REPO इति किञ्चिल् लभ्यते।

![fork-creation](../images/fork-creation.png)

## सङ्गणके समीचीनस्थानप्राप्तिः
- ततः समीचीनस्थाने terminal/ command-prompt इत्य् उद्घाट्य गच्छतु। यथा
  - `cd F:\Git\` इति windows पक्षे
  - `cd ~` इति linux पक्षे

## सञ्चिकाप्राप्तिः
- सङ्गणके समीचीनस्थानप्राप्तिः इति भागे यद् उक्तं तत् कृत्वा

```
git clone --single-branch --depth 1 --branch master https://github.com/XYZ/REPO.git REPO-master
cd REPO-master
git remote add upstream https://github.com/vishvAsa/REPO.git
git submodule update --init  themes/sanskrit-documentation-theme-hugo
cd ..

git clone --single-branch --depth 1 --branch content https://github.com/XYZ/REPO.git REPO-content
cd REPO-content
git remote add upstream https://github.com/vishvAsa/REPO.git
git pull upstream content
cd ..
```

<div class="staticFilesInstruction">

```
git clone --single-branch --depth 1 --branch static_files https://github.com/XYZ/REPO.git REPO-static
cd REPO-static
git remote add upstream https://github.com/vishvAsa/REPO.git
git pull upstream static_files
cd ..
```
</div>

## hugo-चालनम्
- सङ्गणके समीचीनस्थानप्राप्तिः इति भागे यद् उक्तं तत् कृत्वा

```
cd REPO-master
git pull upstream master
cd themes/sanskrit-documentation-theme-hugo/
git pull origin master
cd ../.. 
hugo server --renderToDisk --config ./config_dev.toml
```

## सञ्चिकासु प्राप्तासु सत्सु कार्यम्
- यदि कार्यम् REPO-content इत्यस्मिन् क्रियते
    - `git pull upstream content` इति परिवर्तनानि लभ्यानि।
    - If using Atom: 
      - Make necessary changes, 
      - save (press Ctrl+S or use File menu), 
      - click on Git (bottom right)
      - click on stage-all
      - Tyle a commit message, click on "commit"
      - Finally push.
      - Video demonstration - [here](https://youtu.be/xXpaUCvqpE4?list=PL63uIhJxWbgg3yJqzeh8kCxMo55YUX50F&t=1669) (२९:०० - ३२:००)।
    - ततो नुदित्वाकर्षणाभ्यर्थनं https://github.com/XYZ/REPO/tree/content इत्यत्र गत्वा प्रेषणीयम्।
 
<div class="staticFilesInstruction">

- यदि कार्यम् REPO-static इत्यस्मिन् क्रियते
    - `git pull upstream static_files` इति परिवर्तनानि लभ्यानि।
    - ततो नुदित्वाकर्षणाभ्यर्थनं https://github.com/XYZ/REPO/tree/static_files इत्यत्र गत्वा प्रेषणीयम्।
</div>

- अकर्षणाभ्यर्थन-प्रेषण-विधानं समानम्
  - `1 commit ahead` इतीव किञ्चिद् दर्शितं चेत् प्रेषयितुं किञ्चिद् अस्तीत्य् अर्थः। 
  - "Contribute" इति कश्चन सङ्केतो दृश्येत। तत्र नुदनीयम्। 

<script src="../contribution-page-customizer.js"></script>