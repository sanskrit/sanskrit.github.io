+++
title = "Saving changes"
+++

<details><summary>निर्देश-समीक्रिया (द्रष्टुं नोद्यम्)</summary>

- अधः _XYZ_ इति यद् अस्ति, तस्य स्थाने स्वीयं github-नाम प्रयुङ्क्ताम्। (Below, replace _'XYZ'_ with your github username.)
  - अथवैतत् प्रयुज्यतां यन्त्रम्: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">पाठम् परिवर्तय!!</button>
- Back to [Git workflow](/groups/dyuganga/projects/text/git-workflow/?githubUserId=XYZ&repo=REPO)
</details>


## Overview
- Get the latest files. (See "syncing" section below)
- Make changes in your editor (eg. vscode).
- Save, commit and push periodically.

## Syncing with remote repository
- Every day, make sure that you're working on the latest files by doing the below.
- If you're changing files in `REPO-content` :
  - `git pull upstream content` इति परिवर्तनानि लभ्यानि।
- If you're changing files in `REPO-static` :
  -  by running: `git pull upstream static_files` .

### Alternate procedure with VSCode
- Do the following, and select "upstream" and the appropriate branch (content or static_files).

(Click on the images below and open and view full screen.)

{{< figure src="../../images/vscode-pull-upstream.png" title="" class="thumbnail">}}

{{< figure src="../../images/vscode-pull-upstream_select_upstream.png" title="" class="thumbnail">}}

{{< figure src="../../images/vscode-pull-upstream_select_branch.png" title="" class="thumbnail">}}

## Pushing file changes

- Follow instructions in "Syncing with remote repository" first.
- Then, commit and push your changes (using vscode, or github desktop).
  - For tips on using vscode, please learn to use the [online interface first](../../online-editing/saving-changes?githubUserId=XYZ&repo=REPO).
- If using command prompt/ terminal: `git commit -am "Some message"` and `git push`
  - Then go to https://github.com/XYZ/REPO/tree/content and send a pull request .
  - Video demonstration - [here](https://youtu.be/xXpaUCvqpE4?list=PL63uIhJxWbgg3yJqzeh8kCxMo55YUX50F&t=1669) (२९:०० - ३२:००)।

<div class="staticFilesInstruction">

  - Then, commit and push your changes (using atom editor, or github desktop or commands
    like `git commit -am "Some message"` and `git push`).
  - Then go to https://github.com/XYZ/REPO/tree/static_files and send a pull request .
</div>

<details><summary>Atom (द्रष्टुं नोद्यम्)</summary>

- Make necessary changes,
- save (press Ctrl+S or use File menu),
- click on Git (bottom right)
- click on stage-all
- Type a commit message, click on "commit"
- Finally push.
- Video demonstration - [here](https://youtu.be/xXpaUCvqpE4?list=PL63uIhJxWbgg3yJqzeh8kCxMo55YUX50F&t=1669) (२९:०० - ३२:००)।
</details>


## Running hugo/ hugo-चालनम्
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


<div class="staticFilesInstruction">

- यदि कार्यम् REPO-static इत्यस्मिन् क्रियते
  - `git pull upstream static_files` इति परिवर्तनानि लभ्यानि।
  - ततो नुदित्वाकर्षणाभ्यर्थनं https://github.com/XYZ/REPO/tree/static_files इत्यत्र गत्वा प्रेषणीयम्।
</div>

<script src="../../contribution-page-customizer.js"></script>