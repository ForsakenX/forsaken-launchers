
Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
          .getService(Components.interfaces.mozIJSSubScriptLoader)
          .loadSubScript("chrome://jslib/content/jslib.js");

JS_LIB_DEBUG = true;
jslibTurnDumpOn();
jslibTurnStrictOn();

