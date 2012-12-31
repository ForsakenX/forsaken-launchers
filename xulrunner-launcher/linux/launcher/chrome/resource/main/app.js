
var EXPORTED_SYMBOLS = [ "App" ];

/*
 *  Main Container
 */

var App = {};

/*
 *  Application Information
 */

//	name ID version appBuildID platformVersion platformBuildID
App.info = Components.classes["@mozilla.org/xre/app-info;1"]
				   .getService(Components.interfaces.nsIXULAppInfo);

/*
 *  Session Data
 */

App.session = {}

/*
 *  Actions
 */


App.quit = function(aForceQuit){
  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].
    getService(Components.interfaces.nsIAppStartup);
  // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
  // process if there is unsaved data. eForceQuit will quit no matter what.
  var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit :
                                  Components.interfaces.nsIAppStartup.eAttemptQuit;
  appStartup.quit(quitSeverity);
};

