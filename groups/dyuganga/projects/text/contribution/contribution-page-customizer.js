module_uiLib.replaceWithQueryParam("githubUserId", /XYZ(?=[^'’])/g);
module_uiLib.replaceWithQueryParam("repo", /REPO(?=[^'’])/g);
let noStaticFilesInstruction = module_uiLib.default.query.getParam("noStatic");
if (noStaticFilesInstruction) {
document.getElementsByClassName("staticFilesInstruction").forEach(function (x) {x.hidden = true;});
}

function handleTransformIdBtnClick(e) {
  let userId = document.getElementById("input_githubUserId").value;
  let repoId = document.getElementById("input_repo").value;
  console.log("transformId clicked", userId, repoId);
  module_uiLib.default.query.setParamsAndGo({"githubUserId": userId, "repo": repoId});
}
