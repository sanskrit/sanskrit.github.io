+++
title = "Syncing fork"
+++
<details><summary>निर्देश-समीक्रिया (द्रष्टुं नोद्यम्)</summary>

- अधः _XYZ_ इति यद् अस्ति, तस्य स्थाने स्वीयं github-नाम प्रयुङ्क्ताम्। (Below, replace _'XYZ'_ with your github username.)
  - अथवैतत् प्रयुज्यतां यन्त्रम्: <input id="input_githubUserId" value="XYZ"></input><input id="input_repo" value="REPO"></input><button id="transformId" onclick="handleTransformIdBtnClick();">पाठम् परिवर्तय!!</button>
- Back to [Git workflow](/groups/dyuganga/projects/text/git-workflow/?githubUserId=XYZ&repo=REPO)
</details>


प्रतिवारं (दीर्घविश्रान्तेः परम् अपि) कार्यारम्भात् प्राक् sync fork इति कुर्यात्।

## प्रक्रिया
- कार्यानुसारेण https://github.com/XYZ/REPO/tree/content इत्यत्र, ( https://github.com/XYZ/REPO/tree/static_files इत्यत्र वा यथानिर्देशं)  गत्वा,  
  sync-fork इति करोतु - [चित्रे](https://youtu.be/yKLyfqL0A4M?t=462) दर्शितया रीत्या।  
  उचितस्थाने "Sync fork" इति कीलकं न दृश्यते चेद् उपेक्षताम् - पूर्वम् एवास्मत्सञ्चिकाभिः समम् अस्तीति ज्ञायताम्।  
  (अवधेयम् - master-शाखायाम् एतत् कृतं व्यर्थप्रायम्। content-आदि-शाखायां गत्वा करणीयम्। )
- ततः vscode.dev (अधः सूचितम्) जालपुटं नवीकरोतु (refresh/ reload)।
- परिवर्तनानि (यथा नूतनाः सञ्चिका) लभ्येरन्।

If sync is successful, you will see messages like the below in the pull request:

{{< figure src="../../images/sync-fork-merge-success.png" title="">}}

## Overwriting your changes
कदाचिद् sync fork इति नुदितय् एवं दृश्येत -

{{< figure src="../../images/sync-fork_discard-changes.jpg" title="">}}

परिहारो [ऽन्यत्रोक्तः](../../6_conflicts?githubUserId=XYZ&repo=REPO) । 


<script src="../../contribution-page-customizer.js"></script>
