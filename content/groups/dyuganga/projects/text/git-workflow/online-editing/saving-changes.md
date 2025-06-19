+++
title = "Saving changes"
+++
<details><summary>निर्देश-समीक्रिया (द्रष्टुं नोद्यम्)</summary>

- अधः _XYZ_ इति यद् अस्ति, तस्य स्थाने स्वीयं github-नाम प्रयुङ्क्ताम्। (Below, replace _'XYZ'_ with your github username.)
  - अथवैतत् प्रयुज्यतां यन्त्रम्: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">पाठम् परिवर्तय!!</button>
- Back to [Git workflow](/groups/dyuganga/projects/text/git-workflow/?githubUserId=XYZ&repo=REPO)
</details>

## Saving changes
- Go to [https://vscode.dev/github/XYZ/REPO/tree/content](https://vscode.dev/github/XYZ/REPO/tree/content) or [https://vscode.dev/github/XYZ/REPO/tree/static_files](https://vscode.dev/github/XYZ/REPO/tree/static_files) (if working on files located in [static_files branch](https://github.com/XYZ/REPO/tree/static_files)) on the computer where you'll work (not mobile phone), provide all permissions. Config tips [here](vscode).
  - (Browser may block popups - enable popups. GitHub permission may be sought. etc..)
- If needed, switch to the "Explorer view": [YT](https://youtu.be/6n22TxXi_yQ?t=558).

{{< figure src="../../vscode/images/explorer.png" title="" >}}

- Navigate to the files you want to change and make your edits. You save changes by typing a "Commit message" and commiting + pushing.

{{< figure src="../../vscode/images/commit.png" title="" >}}
- Video demonstrations:
  - [here, till 7:55](https://youtu.be/yKLyfqL0A4M?t=462)
  - [Inserting Headings and saving](https://www.youtube.com/watch?v=BlOavkB2ooU)

PS: To close unnecessary tabs, do as illustrated below:

{{< figure src="../../vscode/images/close-tabs.png" title="" >}}

## Syncing fork
- कार्यानुसारेण https://github.com/XYZ/REPO/tree/content इत्यत्र, ( https://github.com/XYZ/REPO/tree/static_files इत्यत्र वा यथानिर्देशं)  गत्वा,  
  sync-fork इति करोतु - [चित्रे](https://youtu.be/yKLyfqL0A4M?t=462) दर्शितया रीत्या।  
  उचितस्थाने "Sync fork" इति कीलकं न दृश्यते चेद् उपेक्षताम् - पूर्वम् एवास्मत्सञ्चिकाभिः समम् अस्तीति ज्ञायताम्।  
  (अवधेयम् - master-शाखायाम् एतत् कृतं व्यर्थप्रायम्। content-आदि-शाखायां गत्वा करणीयम्। )
- ततः vscode.dev (अधः सूचितम्) जालपुटं नवीकरोतु (refresh/ reload)।
- परिवर्तनानि (यथा नूतनाः सञ्चिका) लभ्येरन्।

If sync is successful, you will see messages like the below in the pull request:

{{< figure src="../../images/sync-fork-merge-success.png" title="">}}

### Overwriting your changes
कदाचिद् sync fork इति नुदितय् एवं दृश्येत -

{{< figure src="../../images/sync-fork_discard-changes.jpg" title="">}}

परिहारो [ऽन्यत्रोक्तः](../../6_conflicts?githubUserId=XYZ&repo=REPO) । 

## Sending changes
- [Sending changes via pull requests (आकर्षणाभ्यर्थन-प्रेषणम्)](../../4_sending-pull-request?githubUserId=XYZ&repo=REPO). <u>SHOULD BE DONE ON EVERY WORK-DAY</u>, after work.
  - **यस्मिन् यस्मिन् दिने कार्यं करोति, तत्तद्दिने कार्यारम्भात् प्राक् sync fork इति कुर्यात्, कार्यान्ते चाकर्षणाभ्यर्थनं प्रेषयेत्।** एकस्मिन् दिने शोधनम् अपरस्मिन् दिने प्रेषणम् इति नैव युक्तम्। (अनेन मत्पक्षे परीक्षणं सरलम् भवति, भ्रमाश् च वार्येरन्।)


<script src="../../contribution-page-customizer.js"></script>


