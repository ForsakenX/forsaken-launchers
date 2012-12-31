
// wine settings
pref("wine.path","/usr/local/bin/wine");

// update urls
pref("urls.latest","http://fly.thruhere.net/status/latest.txt");
pref("urls.games","http://fly.thruhere.net/status/games.xml");

// chat settings
pref("irc.server","irc.freenode.net");
pref("irc.port",6667);
pref("irc.channels","#forsaken");
pref("irc.user","guest");

// Default Window
// this for some reason stops window from being able to go behind others
//pref("toolkit.defaultChromeFeatures", "chrome,all,width=350,height=170");
pref("toolkit.defaultChromeURI",      "chrome://main/content/main.xul");

// singleton windows
pref("toolkit.singletonWindowType", "main-window");
pref("toolkit.singletonWindowType", "log-window");

// Deafult Skin
//pref("general.skins.selectedSkin", "classic");

// Dump the current ram footprint when minimized.
pref("config.trim_on_minimize", true);

//
// debugging prefs
//

pref("browser.dom.window.dump.enabled", true);
pref("javascript.enabled", true);
pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);

// Turn off xul caching
// This allow you to reload a windows contents !!!
// Instead of restarting the application !!!
pref("nglayout.debug.disable_xul_cache",    true);
pref("nglayout.debug.disable_xul_fastload", true);


// extension manager settings
pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul?type=themes");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul?type=extensions");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager-themes");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager-extensions");
pref("extensions.update.enabled", true);
pref("extensions.update.interval", 86400);
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
pref("extensions.ignoreMTimeChanges", false);
pref("extensions.logging.enabled", false);
pref("general.skins.selectedSkin", "classic/1.0");
// NB these point at AMO
pref("extensions.update.url", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreExtensionsURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreThemesURL", "chrome://mozapps/locale/extensions/extensions.properties");


// download manager settings
pref("browser.download.useDownloadDir", true);
pref("browser.download.folderList", 2); // use my download dir
//pref("browser.download.dir",""); // this is where it will be downloaded
pref("browser.download.manager.showAlertOnComplete", true);
pref("browser.download.manager.showAlertInterval", 2000);
pref("browser.download.manager.retention", 2);
pref("browser.download.manager.showWhenStarting", true);
pref("browser.download.manager.useWindow", true);
pref("browser.download.manager.closeWhenDone", true);
pref("browser.download.manager.openDelay", 0);
pref("browser.download.manager.focusWhenStarting", false);
pref("browser.download.manager.flashCount", 2);
//
pref("alerts.slideIncrement", 1);
pref("alerts.slideIncrementTime", 10);
pref("alerts.totalOpenTime", 4000);
pref("alerts.height", 50);

// suppress external-load warning for standard browser schemes
pref("network.protocol-handler.warn-external.http", false);
pref("network.protocol-handler.warn-external.https", false);
pref("network.protocol-handler.warn-external.ftp", false);

//Alertboxen
pref("security.warn_entering_secure", false);
pref("security.warn_leaving_secure", false);

//Remember Passwords
pref("signon.debug", true);
pref("signon.rememberSignons", true);
pref("signon.expireMasterPassword", false);
pref("signon.SignonFileName", "signons.txt");

