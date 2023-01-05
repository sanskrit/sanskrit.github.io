+++
title = "2 Getting files"
+++
<details><summary>निर्देश-समीक्रिया (द्रष्टुं नोद्यम्)</summary>

- अधः _XYZ_ इति यद् अस्ति, तस्य स्थाने स्वीयं github-नाम प्रयुङ्क्ताम्। (Below, replace _'XYZ'_ with your github username.)
  - अथवैतत् प्रयुज्यतां यन्त्रम्: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">पाठम् परिवर्तय!!</button>
</details>

## Going to the right place in your computer (सङ्गणके समीचीनस्थानप्राप्तिः)

- We'll assume that you're saving all github files in some location (eg. `F:\Git\`). Please change the below accordingly.
- Windows -
  - navigate to the appropriate folder using "File explorer" or "My Computer"; Then right-click, select "Other options" if available, and finally click "Open Git Bash here".
  - Or, open terminal/ command-prompt (go to start menu and search for "Command" or "terminal") and do something like: `cd F:\Git\`.
- Linux
  - do something like: `cd ~` .


<details><summary>संस्कृतानुवादः (द्रष्टुं नोद्यम्)</summary>

- समीचीनस्थाने terminal/ command-prompt इत्य् उद्घाट्य गच्छतु। यथा
  - `cd F:\Git\` इति windows पक्षे
  - `cd ~` इति linux पक्षे
</details>


## Getting the files

- Having followed "Going to the right place in your computer", do the below (सङ्गणके समीचीनस्थानप्राप्तिः इति भागे यद् उक्तं तत् कृत्वा)

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


<script src="../../contribution-page-customizer.js"></script>