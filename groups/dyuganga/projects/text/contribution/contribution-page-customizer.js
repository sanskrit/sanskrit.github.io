module_uiLib.replaceWithQueryParam("githubUserId", /XYZ(?=[^'’])/g);
module_uiLib.replaceWithQueryParam("repo", /REPO(?=[^'’])/g);
let noStaticFilesInstruction = module_uiLib.default.query.getParam("noStatic");
if (noStaticFilesInstruction) {
document.getElementsByClassName("staticFilesInstruction").forEach(function (x) {x.hidden = true;});
}

function handleTransformIdBtnClick(e) {
  let userId = document.getElementById("input_githubUserId").value;
  console.log("transformId clicked", userId);
  module_uiLib.default.query.setParamAndGo("githubUserId", userId);
}
