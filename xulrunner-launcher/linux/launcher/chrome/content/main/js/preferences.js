
Components.utils.import("resource://main/Preferences.js");

var download_projectx_folder = function(){
  var textbox = document.getElementById('projectx-folder');
  if(!textbox.value) return alert("You must first select the location!");
  Download({
    url: 'http://rapidshare.com/files/103070700/ProjectX_Data.zip',
    filename: 'ProjectX_Data.zip',
    show: true,
    success: function( download ){
      var zReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                    .createInstance(Components.interfaces.nsIZipReader);
      try{
        zReader.open( download.targetFile );
      }catch(e){
        notice("Error: Unable to extract files!");
        return false;
      }
      if ( ! zReader.hasEntry( 'ProjectX' ) ){
        notice("Error: Zip is not properly formated!");
        zReader.close();
        return false;
      }
      try{
        zReader.extract( 'ProjectX', new File(textbox.value).nsIFile )
      }catch(e){
        notice('Error: Failed to extract contents!');
        zReader.close();
        return false;
      }
      zReader.close();
      notice("ProjectX Installed!");
    }
  });
};

var browse_for_folder = function(){

  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  
  var fp = Components.classes["@mozilla.org/filepicker;1"]
               .createInstance(nsIFilePicker);
  fp.init(window, "ProjectX Folder", nsIFilePicker.modeGetFolder );
  fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
  
  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
    var file = fp.file;
    // Get the path as string. Note that you usually won't 
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...
    var textbox = document.getElementById('projectx-folder');
    textbox.value = path;
    Preferences.set('browser.download.dir',path);
  }

};


var browse_for_wine = function(){

  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  
  var fp = Components.classes["@mozilla.org/filepicker;1"]
               .createInstance(nsIFilePicker);
  fp.init(window, "Wine Executable", nsIFilePicker.modeGetFile );
  fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
  
  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
    var file = fp.file;
    // Get the path as string. Note that you usually won't 
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...
    var textbox = document.getElementById('wine-path');
    textbox.value = path;
  }

};

window.onload=function(){

  var button = document.getElementById('projectx-folder-button');
  button.addEventListener('click',browse_for_folder,false);

  var button = document.getElementById('projectx-folder-download-button');
  button.addEventListener('click',download_projectx_folder,false);

  var button = document.getElementById('wine-path-button');
  button.addEventListener('click',browse_for_wine,false);

};



