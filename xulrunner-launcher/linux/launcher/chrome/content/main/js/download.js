/***** BEGIN LICENSE BLOCK *****\
Version: MPL 1.1/LGPL 2.1/GPL 2.0

The contents of this file are subject to the Mozilla Public License Version 
1.1 (the "License"); you may not use this file except in compliance with
...
for the specific language governing rights and limitations under the
License.

Copyright (C) 2007 All Rights Reserved.

Contributor(s):
  Daniel Aquino <mr (dot) danielaquion (at) gmail (dot) com>

Alternatively, the contents of this file may be used under the terms of
either of the GNU General Public License Version 2 or later (the "GPL"),
...
the terms of any one of the MPL, the GPL or the LGPL.

\***** END LICENSE BLOCK *****/


/**********************************************************************************************************************\
 * Download *
 ************
 *
 *  Description: Downloads a file.
 *
 *  Synopsis: Download( options );
 *
 *  Argument: options <object>
 *
 *  Params:
 *
 *    CallBacks:
 *
 *      success	 <func(<nsIDownload>)|null> 	description: called on finish w/ downloaded file handle
 *      complete <func(<nsIDownload>)|null>	description: called on complete
 *      failure	 <func(<nsIDownload>)|null>	description: called on failure
 *
 *    Values:
 *
 *      flags 	<byte|null>		description: persistance flags for download, defaut: replace, nocache
 *      dir   	<nsIFile|null>	 	description: where to put the file, 	default: default downloads directory
 *      filename  <string|null> 	description: name of the file, 		default: "temp_" + unix-epoch-time
 *      displayname <string|null>	description: name to be displayed in download manager,	default: <filename>
 *      tempname  <string|null>		description: temp namedefault: "temp"
 *      show	<boolean|null>		description: show download manager window on start,	default: false
 *      url     <string>		description: url of the file... embed http auth if desired.
 *      referrer <string|null>		description: referrer sent to server
 *      data <string|null>		description: post data !
 *      data_stream <nsIInputStream|null>	description: post data stream object, default: convert data param | null
 *      headers <string|null>		description: headers to be sent to the server.
 *
 *      cache_key ????			description: for pointing at an already loaded resource ???
 *
 *    These properties will exist during callbacks.
 *
 *      file <nsIFile>   	The destination file
 *      fileURI <nsIFileURI>  	The destination file uri
 *      source <nsIURI>   	The source uri
 *	start_time <int>	The start time in microseconds from unix epoch
 *	download <nsIDownload>	The download object
 *      persist <nsIWebBrowserPersist>	The persistance object used to download
 *
 *  Example:
 *
 *    Simple:
 *

     d = Download({
       url:"http://localhost/~daquino/test.wav",
       success:function( download ){
         alert( download.targetFile.path );
       }
     });
 
 *
 *    Better Example:
 *

     d = Download({
       url:"http://user:pass@localhost:80/~daquino/test.wav?blah",
       data: "key1=val1&key2=val2",
       headers: "Content-Type: application/x-www-form-urlencoded",
       show: true,
       displayname: "Song!",
       filename: "test.wav",
       dirpath: "/home/daquino/",
       show: true,
       success: function( download ){
         alert("Download saved to: "+download.targetFile.path);
       },
       failure: function( download ){
 	 alert("Download of "+download.targetFile.leaf+" failed with state: "+download.state);
       },
       complete: function( download ) {
         alert("Download finished w/ state: "+download.state);
       }
     });
 *
 *
 *  TODO:
 * 
 *    Auto convert objects into formated/encoded strings for post data, query string and headers.
 *  
 *    Add more full fledged progress listening abilities.
 *
 *    Add some options to not use DownloadManager at all ?
 *
 *    Use nsIFile#createUnique for temp files?
 *
 *    Custom flag names so you can use a string to specify the flags?
 *    or short names to represent multiple flags?
 *    Perhaps use/share/port the File#create name conventsion?
 *
 *    Instance methods to support pausing, canceling, queuing, etc... ?
 *
 *    Support passing in nsIURI's and other native formats
 *  
 *    Ability to attach nsIMIMEInfo and declare that download should launch after finished
 *
 *    Support downloading file as it's namein the header...
 *  ********************************************************************************************************************/

// class
var Download = function( options ){
	if(!this.init) return new Download( options );
	else this.init( options );
};

// debugging
// override url to test.
Download.debug_url = "http://dev.ispbx.com/dan/test.wav";

// interfaces
Download.nsIDM   = Components.interfaces.nsIDownloadManager;
Download.nsIDMUI = Components.interfaces.nsIDownloadManagerUI;
Download.nsWPL   = Components.interfaces.nsIWebProgressListener;
Download.manager = Components.classes["@mozilla.org/download-manager;1"]
                             .createInstance(Download.nsIDM);

// default flags for saving the download
Download.default_flags = 	Download.nsWPL.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
				Download.nsWPL.PERSIST_FLAGS_BYPASS_CACHE |
				Download.nsWPL.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

// log helper
Download.log = function(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}

// callbacks for each download
Download.listeners = {};

// global listener
Download.listener = {
  onDownloadStateChange: function( state, download ){

    var state = [
       "Not Started", "Started",  "Finished",
       "Failed",      "Canceled", "Paused",
       "Queued",      "Blocked",  "Scanning",
    ][ download.state + 1 ];

    Download.log( [ "download", "id="+download.id, "state="+ (state||"unknown") ].join(", ") );
    if(!state)return;

    var listener = Download.listeners[download.id];
    if(!listener){
      Download.log( [ "download", "No listener for id: "+download.id ].join(", ") );
      return;
    }

    switch(download.state) {

      case Download.nsIDM.DOWNLOAD_FINISHED:
        if(listener.success)  listener.success( download );
        if(listener.complete) listener.complete( download );
      break;

      case Download.nsIDM.DOWNLOAD_FAILED:
      case Download.nsIDM.DOWNLOAD_CANCELED:
      // 6 The download has been blocked,
      //   either by parental controls or virus scanner 
      // can i add to Download list?
      case Download.nsIDM.DOWNLOAD_BLOCKED:
	if(listener.failure)  listener.failure( download );
        if(listener.complete) listener.complete( download );
      break;

    }

  },
  onProgressChange: function(){},
  onStateChange: function(){},
  onSecurityChange: function(){},
};

// start the listener
Download.manager.addListener( Download.listener );

// remove listener when window destroys it self
if(window)
	window.addEventListener( "unload", function(){
		Download.manager.removeListener( Download.listener );
	},false);


// show the download manager window
Download.show = function( context, select, reason ){ // bug: window shows up small
  context = context || window;
  reason  = reason || Download.nsIDMUI.REASON_USER_INTERACTED;
  Components.classes["@mozilla.org/download-manager-ui;1"].
  getService(Download.nsIDMUI).show( context, select, reason );
};

// download instance constructor
Download.prototype.init = function( options ){

	// input output service
	var nsIOS   = Components.classes["@mozilla.org/network/io-service;1"];
	var nsIIOS  = Components.interfaces.nsIIOService; 
	var ios     = nsIOS.getService( nsIIOS );

	// persistance object
	var nsWBP   = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"];
	var nsIWBP  = Components.interfaces.nsIWebBrowserPersist;
	options.persist = nsWBP.createInstance( nsIWBP );

	// persistance flags
	options.flags = options.flags || Download.default_flags;
	options.persist.persistFlags = options.flags;

	// download folder to save to
	if( options.dir ){

		if( ! (options.dir instanceof Components.interfaces.nsIFile) )
			throw("Download dir can only be an nsIFile.");

	}else{

		// use the user given path
		if( options.dirpath ){

			// create an nsIFile
			options.dir = Components.classes["@mozilla.org/file/local;1"]
		                     .createInstance(Components.interfaces.nsILocalFile);

			// set the path of the file
			options.dir.initWithPath( options.dirpath );

		// use the default downloads directory
		}else{
	
			// default download directory
			options.dir = Download.manager.defaultDownloadsDirectory;

			// make sure moz actually has one
			if( ! options.dir ) throw("Could not determine default downloads directory!");

			// just to be proper
			options.dirpath = options.dir.path;

		}
	}

	// filename of the download
	options.filename = options.filename || (options.tempname||"temp") + "_" + (new Date()).getTime();

	// our download file
	options.file = options.dir.clone();
	options.file.append( options.filename );
           
	// our download file uri
	options.fileURI = ios.newFileURI( options.file );

	// source download
	// url"s can contain prototol://user:pass@domain/uri?query
	options.source = ios.newURI( Download.debug_url || options.url, null, null );

	// creation time
	options.start_time = ((new Date()).getTime()*100); // unix epoch in microseconds

	// add to the list (download is not yet started - queued)
	options.download = Download.manager.addDownload(
				Download.nsIDM.DOWNLOAD_TYPE_DOWNLOAD,
		      	 	options.source,
				options.fileURI,
				options.displayname  || options.filename,
				options.mime_type || null,
		      	 	options.start_time,
				options.temp_file || null,
				options.persist
	);

	// set download listener
	// you will never get the initial queued message since that happened on the statement above
	Download.listeners[ options.download.id ] = options;

	// bind listeners
	// allows the download manager to listen to the persistance object (and us too)
	options.persist.progressListener = options.download.QueryInterface( Download.nsWPL );

	// format post parameters
	if( !options.data_stream && options.data instanceof String ){
		options.data_stream = Components.classes["@mozilla.org/io/string-input-stream;1"].
        				createInstance(Components.interfaces.nsIStringInputStream);
		// we could just use data_stream.setData but that stops at \0 chars
		// this way we have a proper string + strlen defining the boundaries
		var cstr = options.data_stream.
			QueryInterface( Components.interfaces.nsISupportsCString );
		cstr.data = options.data;
	}

	// save file (start download)
	options.persist.saveURI(
		options.source,
		options.cache_key	|| null, // ????
		options.referrer	|| null,
		options.data_stream	|| null, // post data <string>
		options.headers		|| null, // headers <string>
		options.file
	);

	// show download manager window
	if( options.show )
		Download.show( window, options.download.id, Download.nsIDMUI.REASON_NEW_DOWNLOAD );

};


