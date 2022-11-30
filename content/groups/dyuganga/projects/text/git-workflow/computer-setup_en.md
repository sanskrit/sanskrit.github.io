+++
title = "Computer setup (en)"
+++

संस्कृतेन सूचना द्रष्टुम् [अत्र गम्यताम्](../computer-setup_sa/) ।

## Common setup

- Below, replace _'XYZ'_ with your github username.
  - Or use this machine: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">Replace</button>
- If https://github.com/XYZ/REPO exists beforehand, please delete it by going to settings using your browser (https://github.com/XYZ/REPO/settings#danger-zone इत्यत्र गत्वा, पृष्ठस्यान्तं गत्वा "Delete this repository" इति करोतु।) .
- Go to https://github.com/vishvAsa/REPO/fork and fork (there should be a "Create Fork" button). When forking, make sure to uncheck "Copy the master branch only" option. Thence, you will get https://github.com/XYZ/REPO .

{{< figure src="../images/fork-creation.png" title="" >}}

## Online work

- Go to [https://vscode.dev/github/XYZ/REPO/tree/content](https://vscode.dev/github/XYZ/REPO/tree/content), navigate to the files you want to change and make your edits. You save changes by typing a "Commit message" and commiting + pushing.

{{< figure src="../images/vscode-commit.png" title="" >}}
- Video demonstrations: 
  - [here, till 7:55](https://youtu.be/yKLyfqL0A4M?t=462)
  - [Inserting Headings and saving](https://www.youtube.com/watch?v=BlOavkB2ooU)

PS: You can also change Font size, colors etc. by going to settings. 

{{< figure src="../images/vscode-settings-font.png" title="">}}

## Offline Work
### Going to the right place in your computer

- We'll assume that you're saving all github files in some location (eg. `F:\Git\`). Please change the below accordingly.
- Windows -
  - navigate to the appropriate folder using "File explorer" or "My Computer"; Then right-click, select "Other options" if available, and finally click "Open Git Bash here".
  - Or, open terminal/ command-prompt (go to start menu and search for "Command" or "terminal") and do something like: `cd F:\Git\`.
- Linux
  - do something like: `cd ~` .


### Getting the files

- Having followed "Going to the right place in your computer", doe the below

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

### Running hugo

- Having followed "Going to the right place in your computer", and having retrieved the files as described above,
- do the below to run `hugo` to build the website on your computer (so that you can verify that everything appears as it
  should).

```
cd REPO-master
git pull upstream master
cd themes/sanskrit-documentation-theme-hugo/
git pull origin master
cd ../.. 
hugo server --renderToDisk --config ./config_dev.toml
```

### Pushing file changes

- If you're changing files in `REPO-content` :
  - Make sure that you're working on the latest files by running: `git pull upstream content` .
  - Then, commit and push your changes (using atom editor, or github desktop).
    - `git pull upstream content` इति परिवर्तनानि लभ्यानि।
    - If using Atom: 
      - Make necessary changes, 
      - save (press Ctrl+S or use File menu), 
      - click on Git (bottom right)
      - click on stage-all
      - Tyle a commit message, click on "commit"
      - Finally push.
      - Video demonstration - [here](https://youtu.be/xXpaUCvqpE4?list=PL63uIhJxWbgg3yJqzeh8kCxMo55YUX50F&t=1669) (२९:०० - ३२:००)।
    - If using command prompt/ terminal: `git commit -am "Some message"` and `git push`
  - Then go to https://github.com/XYZ/REPO/tree/content and send a pull request .
  - Video demonstration - [here](https://youtu.be/xXpaUCvqpE4?list=PL63uIhJxWbgg3yJqzeh8kCxMo55YUX50F&t=1669) (२९:०० - ३२:००)। 

<div class="staticFilesInstruction">

- If you're changing files in `REPO-static` :
  - Make sure that you're working on the latest files by running: `git pull upstream static_files` .
  - Then, commit and push your changes (using atom editor, or github desktop or commands
    like `git commit -am "Some message"` and `git push`).
  - Then go to https://github.com/XYZ/REPO/tree/static_files and send a pull request .
</div>

## Sending pull request
- Open the appropriate github link as below
  - If you're working on content branch, it will be https://github.com/XYZ/REPO/tree/content
  - If you're working on static_files branch, it will be https://github.com/XYZ/REPO/tree/static_files
- Text like `1 commit ahead` indicates that you have something to contribute. 
- Find and use the "Contribute" link.
- Video demonstration: [here, starting at 7:55](https://youtu.be/yKLyfqL0A4M?t=462)

<script src="../contribution-page-customizer.js"></script>