
try{

Components.utils.import("resource://main/app.js");

$(document).ready(function(){
  $('#name').attr('value',App.info.name);
  $('#version').attr('value',App.info.version);
  $('#build').attr('value',App.info.appBuildID);
  $('#platform-build').attr('value',App.info.platformBuildID);
  $('#platform-version').attr('value',App.info.platformVersion);
});

}catch(e){
  alert(e);
}

