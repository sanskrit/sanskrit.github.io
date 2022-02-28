+++ title = "Computer setup (en)"
+++

संस्कृतेन सूचना द्रष्टुम् [अत्र गम्यताम्](../computer-setup_sa/) ।

## Common setup

- Below, replace _'XYZ'_ with your github username.
  - Or use this machine: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">Replace</button>
- If https://github.com/XYZ/REPO exists beforehand, please delete it by going to settings using your browser.
- Go to https://github.com/vishvAsa/REPO and fork (there should be a Fork button in the top-right). Thence, you will
  get https://github.com/XYZ/REPO .

## Going to the right place in your computer

- We'll assume that you're saving all github files in some location such as the ones used below.
- Please open terminal/ command-prompt in your computer.
  - In Windows, do something like: `cd F:\Git\`
  - In linux, do something like: `cd ~` .

## Getting the files

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

## Running hugo

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

## Submitting file changes

- If you're chaning files in `REPO-content` :
  - Make sure that you're working on the latest files by running: `git pull upstream content` .
  - Then, commit and push your changes (using atom editor, or github desktop or commands
    like `git commit -am "Some message"` and `git push`).
  - Then go to https://github.com/XYZ/REPO/tree/content and send a pull request .

<div class="staticFilesInstruction">

- If you're changing files in `REPO-static` :
  - Make sure that you're working on the latest files by running: `git pull upstream static_files` .
  - Then, commit and push your changes (using atom editor, or github desktop or commands
    like `git commit -am "Some message"` and `git push`).
  - Then go to https://github.com/XYZ/REPO/tree/static_files and send a pull request .
</div>

- Common steps
  - Text like `1 commit ahead` indicates that you have something to contribute. 
  - Find and use the "Contribute" link.

<script>
module_uiLib.replaceWithQueryParam("githubUserId", /XYZ(?=[^'’])/g);
module_uiLib.replaceWithQueryParam("repo", /REPO(?=[^'’])/g);
let noStaticFilesInstruction = module_main.default.query.getParam("noStatic");
if (noStaticFilesInstruction) {
  document.getElementsByClassName("staticFilesInstruction").forEach(function (x) {x.hidden = true;});
}

function handleTransformIdBtnClick(e) {
  let userId = document.getElementById("input_githubUserId").value;
  console.log("transformId clicked", userId);
  module_main.default.query.setParamAndGo("githubUserId", userId);
}
</script>