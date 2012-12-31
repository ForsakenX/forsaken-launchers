
/* 
 * Settings
 */

Components.utils.import("resource://main/app.js");

$.ajaxSetup({
  cache: false
});


/*
 * JSLIB
 */

include(jslib_prefs);
include(jslib_system);
include(jslib_dirutils);
include(jslib_file);
include(jslib_dir);
include(jslib_date);
include(jslib_sound);

/*
 * Short Cuts
 */


var prefs       = new Prefs();
var sys         = new System;
var du          = new DirUtils;
var serializer  = new XMLSerializer();
var parser      = new DOMParser();
var sound       = new Sound();

/*
 * Utilities
 */


function createURI(aObj) {
  var ios = Components.classes["@mozilla.org/network/io-service;1"].
            getService(Components.interfaces.nsIIOService);
  return (aObj instanceof Components.interfaces.nsIFile) ?
           ios.newFileURI(aObj) :
           ios.newURI(aObj, null, null);
};

var nsIWPL = Components.
             classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"];

var Persist = function(){
  return nsIWPL.createInstance(Components.interfaces.nsIWebBrowserPersist);
};

var XMLDoc = function(){ return document.implementation.createDocument("", "", null); };

var _status = function ( msg ) {
  $('#status-bar-left')[0].label = msg;
  log.info('status',msg);
};

var xml_to_string = function( xml ){
  if ( ! $.isXMLDoc( xml ) ){
    alert("There has been an internal error!");
    throw("xml_to_string - Not an xml doc - data="+xml);
  }
  var data = serializer.serializeToString( xml );
  return data;
};

var Process = function( path, args, block ){
  this.args   = args||[];
  this.block  = block||false;
  this.file   = (new File( path ));
  this.proc = Components.classes["@mozilla.org/process/util;1"].
              createInstance(Components.interfaces.nsIProcess);
  this.proc.init( this.file.nsIFile );
  log.info('process','new: { block: "'+this.block+'", '+
                     'path: "'+path+'", '+
                     'args: "'+this.args.join('", "') );
  this.pid = this.proc.run( this.block, this.args, this.args.length );
};

var convert_datetime = function( format, datetime ){
  // format: http://www.php.net/manual/en/function.date.php
  var _date = (new Date( datetime ))
  var _local_date = jslibDate( format , _date );
  return _local_date;
};

var md5_of_file = function( file ){
try{
  var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]           
                          .createInstance(Components.interfaces.nsIFileInputStream);
  // open for reading
  istream.init(file, 0x01, 0444, 0);
  var ch = Components.classes["@mozilla.org/security/hash;1"]
                     .createInstance(Components.interfaces.nsICryptoHash);
  // we want to use the MD5 algorithm
  ch.init(ch.MD5);
  // this tells updateFromStream to read the entire file
  const PR_UINT32_MAX = 0xffffffff;
  ch.updateFromStream(istream, PR_UINT32_MAX);
  // pass false here to get binary data back
  var hash = ch.finish(false);
  
  // return the two-digit hexadecimal code for a byte
  function toHexString(charCode)
  {
    return ("0" + charCode.toString(16)).slice(-2);
  }
  
  // convert the binary hash data to a hex string.
  var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");

  // s now contains your hash in hex
  return s;
}catch(e){
  return false;
}
};


////
// Alert Service
////

var alertService = function( options ){

  // service
  var nsIAlertsService = 
    Components.classes["@mozilla.org/alerts-service;1"]
              .getService(Components.interfaces.nsIAlertsService);

  var listener = null;
  var link = null;
  if( options.finished || options.clicked ){
    link = true;
    listener = {
      observe: function( s, t, d ){
        if ( t == 'alertfinished' && options.finished )
          options.finished( d );  // alert is finished callback
        else if ( t == 'alertcallback' && options.clicked )
          options.clicked( d );   // alert was clicked on callback
      }
    };
  }

  // call alert
  nsIAlertsService.showAlertNotification(
      // basic settings
      options.image,   // image to show up in window
      options.title,   // title of alert window
      options.text,    // text to display
      // special setting
      options.name,    // id for os specific alerts systems
      // listener settings
      link,            // makes text clickable
      options.data,    // cookie to be sent to listener
      listener         // listener to catch notifications
  );
};


/*
 * Launch Functions
 */

var projectx_folder = function(){
  var folder = prefs.getChar('projectx.folder');
  if ( folder == 0 ){
    _status('Please configure projectx.folder.');
    throw('projectx.folder not defined...');
  }
  var file = new File( folder );
  if ( !file.exists() ){
    _status('Please configure projectx.folder.');
    throw('projectx.folder not defined...');
  }
  return folder;
};

var projectx_bin = function(){
  return VersionManager.get_selected_version();
};

var projectx_path = function(){
  return [projectx_folder(),projectx_bin()].join( sys.separator );
};

var projectx_version = function(){
  return projectx_bin().replace('ProjectX_','').replace('.exe','');
};

var join_forsaken = function(){
  var ip = GameManager.current_ip();
  if( !ip )
    ip = prompt("Type the ip address or hostname to join.",
                prefs.getChar('launcher.manual.ip'));
  if(ip)
    launch_forsaken( ["-QuickJoin","-TCP",ip,"-placeholder"] );
};

var host_forsaken = function(){
  launch_forsaken( ["-QuickHost"] );
};

var launch_forsaken = function( args ){
  args=args||[];
  var path = projectx_path();
  var proc = null;
  switch (sys.os){
  case 'win32':
    proc = path;
  break;
  case 'linux':
    // wine forsaken-path args
    proc = prefs.getChar("wine.path");
    args = [path].concat( args );
  break;
  default:
    alert("Your OS is not implimented yet!");
    throw("Unsupported OS type: "+sys.os);
  }
  // -chdir must be last
  // nsIProcess does not support a work directory argument
  args = args.concat( "-chdir", projectx_folder() );
  // run the process
  var process = new Process(proc,args,true);
  return process;
};

//
// Browser window
//

var browser_win = null;
var browser_ref = null;
var browser_close = function(){
  if(browser_win && !browser_win.closed ){
    browser_win.close();
  }
};
var browser = function( url ){
  if(!url)url="http://fly.thruhere.net";
  log.info('browser','opening: '+url);
  var ready = function(){
    browser_ref = $('browser',browser_win.document)[0];
    if(url) browser_ref.loadURI( url, null, null );
  };
  browser_close();
  browser_win = window.open(
    'chrome://main/content/browser.xul',
    'browser',
    'chrome,resizable,width=800,height=400,centerscreen'
  );
  browser_win.onload = ready;
  return browser_ref;
};


/*******
 * Download
 * * * * 
 * Add and start download using download manager
 */

// constructor
var Download = function( options ){ this.init( options ); };

// interfaces
Download.nsIDM   = Components.interfaces.nsIDownloadManager;
Download.nsIDMUI = Components.interfaces.nsIDownloadManagerUI;
Download.nsIWPL  = Components.interfaces.nsIWebProgressListener;
Download.manager = Components.classes["@mozilla.org/download-manager;1"]
                             .createInstance(Download.nsIDM),

// default download path
Download.directory = Download.nsIDM.defaultDownloadsDirectory

// public list of listeners
Download.listeners = {};

// listener
Download.listener = {
  onDownloadStateChange: function( state, download ){
    var state = [
       'Not Started', 'Started',  'Finished',
       'Failed',      'Canceled', 'Paused',
       'Queued',      'Blocked',  'Scanning', 
    ][ download.state + 1 ];
    if(state){
      log.info('download', ['id='+download.id,'state='+state].join(', '));
    }else{
      log.info('download','Unknown State: '+download.state);
      return;
    }
    var listener = Download.listeners[download.id];
    if(listener){
      switch(download.state) {
        case Download.nsIDM.DOWNLOAD_FINISHED:
          listener.success( (new File(download.targetFile)) );
          listener.complete();
        break;
        case Download.nsIDM.DOWNLOAD_FAILED:
        case Download.nsIDM.DOWNLOAD_CANCELED:
        // 6 The download has been blocked,
        //   either by parental controls or virus scanner 
        // can i add to Download list?
        case Download.nsIDM.DOWNLOAD_BLOCKED:
          listener.failure();
          listener.complete();
        break;
      }
    }else{
      log.info('download','No listener for id: '+download.id);
      switch(download.state){
		case Download.nsIDM.DOWNLOAD_FINISHED:
      			if(download.targetFile.leafName.match(/^ProjectX_.*\.exe/i) )
			{
				VersionManager.update();
				VersionManager.set_selected_version(download.targetFile.leafName);
				browser_close();
			}
		break;
      }
    }
  },
  onProgressChange: function(){},
  onStateChange: function(){},
  onSecurityChange: function(){},
};

// define listener
Download.manager.addListener( Download.listener );

// show window
Download.show = function( context, select, reason ){ // small window bug
  context = context || window;
  reason = reason || Download.nsIDMUI.REASON_USER_INTERACTED;
  Components.classes['@mozilla.org/download-manager-ui;1'].
  getService(Download.nsIDMUI).show( context, select, reason );
};

// constructor
Download.prototype.init = function( options ){

    // downloader
    var persist = Persist();
  
    // file download rules
    persist.persistFlags = nsIWPL.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
                           nsIWPL.PERSIST_FLAGS_BYPASS_CACHE |
                           nsIWPL.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
  
    // destination
    options.dir = options.dir || new File( Download.directory ).path;
    options.filename = options.filename || "temp_" + (new Date()).getTime();
    var filepath = [ options.dir , options.filename ].join(sys.separator);
    var file = new File( filepath );
    var target = createURI( file.nsIFile );
  
    // source download
    // 
    var source = createURI( options.url );
  
    // creation time
    var start_time = ((new Date()).getTime()*100); // epoch in microseconds
  
    // add to manager
    var download = Download.manager.addDownload(
                       Download.nsIDM.DOWNLOAD_TYPE_DOWNLOAD,
                       source, target, options.filename, null,
                       start_time, null, persist );
  
    // set listener
    Download.listeners[ download.id ] = options;
  
    // bind listeners
    persist.progressListener = download.QueryInterface( Download.nsIWPL );
  
    // save file
    persist.saveURI( source, null,null,null,null, file.nsIFile );
  
    // show manager
    Download.show( window, download.id, Download.nsIDMUI.REASON_NEW_DOWNLOAD );

};


/*******
 * Version Manager
 * * * * 
 * Manages everything to do with
 * mainting the local representation
 * of projectx versions from local fs
 * remote fs and existing in projectx
 * folder
 */


var VersionManager = {

  /*
   * Initialize
   */

  setup: function(){
    this.setup_dom_listeners();
    this.add_template_listener();
    this.reload_xml();
    this.update();
  },

  /*
   * Reloads
   */

  update: function(){
    log.info('versions','update called');
    var dir = new Dir( projectx_folder() );
    if ( ! dir ) return false;
    this.scan_directory();
    this.check_latest();
  },

  /*
   * Sets DOM Observers
   */

//bug
  setup_dom_listeners: function(){
    this.template().addEventListener( 'select', this.set_selected_version, false );
  },

  /*
   * Seleted Version
   */

  set_selected_version: function( name ){
    var set = function( name ){
      prefs.setChar( 'projectx.selected.version', name );
    }
    if ( name ){
      var list = VersionManager.template();
      for( var x=0; x<list.itemCount; x++ ){
        var item = list.getItemAtIndex( x );
        var _name = item.getAttribute('label');
        if ( _name == name ){
          list.selectedIndex = x;
          set( name );
          return true;
        }
      }
      // select first item if not found
      list.selectedIndex = 0;
    }else{
      var item = VersionManager.template().selectedItem;
      if ( item == null ) return;
      name = item.getAttribute('label');
      if ( ! name ) return;
      set( name );
      return true;
    }
    return false;
  },

  get_selected_version: function(){
    return prefs.getChar( 'projectx.selected.version' );
  },

  /*
   * Xml Data
   */

  xml: null,

  reload_xml: function(){
    this.xml = parser.parseFromString( '<versions/>', 'text/xml' );
  },

  versions: function(){
    return this.xml.getElementsByTagName('version');
  },

  add_version: function( name ){
    var el = null;
    el = this.find( name );
    if(el){return el;};
    el = this.xml.createElement('version');
    el.setAttribute('name',name);
    this.xml.documentElement.appendChild( el );
    log.info('versions','Added version to list: '+name);
    return el;
  },

  find: function( name ){ return this.has_version( name ); },
  has_version: function( name ){
    var versions = this.versions();
    for( var x=0; x<versions.length; x++ )
      if ( versions[x].getAttribute('name') == name )
        return versions[x]; // does contain
    return false; // does not contain
  },

  /*
   * Template Methods
   */

  template: function(){ return $('#version-template')[0]; },

  builder: function(){ return this.template().builder; },

  rebuild: function(){
    this.builder().datasource = this.xml;
//    this.builder().rebuild();
  },

  add_template_listener: function(){
    this.builder().addListener( this.template_listener );
  },
  
  template_listener: {
    open: false,
    willRebuild: function( builder ){
      this.open = VersionManager.template().open;
      VersionManager.set_selected_version();
    },
    didRebuild: function( builder ){
      var list = VersionManager.template();
      list.open = this.open;
      var name = VersionManager.get_selected_version();
      if (name)
        return VersionManager.set_selected_version(name)
      // default
      list.selectedIndex = 0; // selected first item
    }
  },

  /*
   * Checks local filesystem for exe's
   */

  scan_directory: function(){
    log.info('versions','scanning projectx.folder');
    // make sure we have path
    var dir = new Dir( projectx_folder() );
    if ( ! dir ) return false;
    // get files in directory
    var items = dir.readDir();
    // clean up unwanted files
    var files = [];
    for( var x=0; x<items.length; x++ ){
      if ( ! items[x].isFile() ) continue;
      if ( items[x].leaf.search(/\.exe$/) < 0) continue;
      files.push( items[x] );
    }
    // check that version still has exe in dir
    var versions = this.versions();
    for( var x=0; x<versions.length; x++ ){
      var found = false;
      var name = versions[x].getAttribute('name');
      for( var y=0; y<files.length; y++ )
        if ( name == files[y].leaf ){
          found = true;
          continue;
        }
      if(!found){
        this.xml.documentElement.removeChild( versions[x] );
        log.info('versions','removed stale version: '+name);
      }
    }
    // scan for new versions
    var count = this.versions().length;
    for( var x=0; x<files.length; x++ )
      this.add_version( files[x].leaf );
    if( count < this.versions().length )
      this.rebuild();
  },

  /*
   * Check Latest Version
   */

  check_latest: function( complete ){
    log.info('versions','checking latest version');
    var that = this;
    $.ajax({
      url: prefs.getChar('urls.latest'),
      success: function(version){
      	version = version.replace(/[\n\t\r]/g,'');
        if( ! that.has_version( version ) )
		_status("New version available: "+version);
	else
		_status("Version up to date...");
      },
      error: function(x,s,e){
        log.warning('server','Failed to check latest version: '+
                             'status="'+s+'", error="'+e+'"');
      }
    });
  }
			   
};

/*
 * Update Game List
 */

var GameManager = {

  template: function(){ return $('#game-template')[0]; },

  builder: function(){ return GameManager.template().builder; },

  current_ip: function(){
    var item = GameManager.template().selectedItem;
    if(!item)
      return false;
    var ip = item.value;
    return ip;
  },

  select_game: function( ip ){
    var list = GameManager.template();
    for( var x=0; x<list.itemCount; x++ ){
      var item = list.getItemAtIndex( x );
      var _ip = item.getAttribute('value');
      if ( _ip == ip ){
        list.selectedIndex = x;
        return true;
      }
    }
    return false;
  },

  setup: function(){
    GameManager.setup_listener();
  },

  setup_listener: function(){
    GameManager.builder().addListener( this.template_listener );
  },

  template_listener: {
    open: false,
    value: null,
    willRebuild: function( builder ){
      this.open = builder.root.open;
      var item = builder.root.selectedItem;
      if(item)
        this.value = item.value;
    },
    didRebuild: function( builder ){
      var list = builder.root;
      list.open = this.open;
      if (this.value && GameManager.select_game( this.value ))
        return;
      // default
      list.selectedIndex = 0; // selected first item
    }
  },

  // update code
  updating: false,
  update: function(){
    if(GameManager.updating){
      //log.info('games','Already updating.');
      return;
    }
    GameManager.updating = true;
    log.info('games','updating');
    $.ajax({
      url: prefs.getChar("urls.games"),
      dataType: 'xml',
      success: GameManager.process_update,
      error: GameManager.process_error,
      complete: function(){
        GameManager.updating = false;
      }
    });
  },
  process_error: function(x,s,e){
    log.info('Failed game update: status='+s+' error='+e);
  },
  process_update: function(xml){
    var doc = xml.documentElement;
    var games = doc.getElementsByTagName('game');
    log.info('games','Found ('+games.length+') games.');
    for( var x=0; x<games.length; x++ ){
      GameManager.process_new_game( games[x] );
      GameManager.set_local_time( games[x] );
    }
    // add manual join game
    var manual = xml.createElement('game');
    manual.setAttribute('nick','type in address manually');
    xml.getElementsByTagName('games')[0].appendChild(manual);
    //
    GameManager.builder().datasource = doc;
    //template.builder.rebuild();
  },
  process_new_game: function( el ){
    var ip = el.getAttribute('ip');
    var nick = el.getAttribute('nick');
    if ( $('*[value="'+ip+'"]',GameManager.template())[0] )
      return false;
    log.info('games','New game detected.');
    sound.beep();
    alertService({
      name:   'games',
      title:  'New Game!',
      text:   nick + ' has started a game!'
    });
  },
  set_local_time: function( el ){
    var started_at = el.getAttribute('started_at');
    var local_time = convert_datetime( "h:i A", started_at );
    el.setAttribute( 'started_at', local_time );
  },
};


/*
 * Actions
 */

var about_config = function(){
  window.open(
    "about:config",
    "about_config",
    "chrome,centerscreen,resizable,width=100,height=450"
  );
};

var about_window = function(){
  window.open(
    "chrome://main/content/about.xul",
    "about",
    "chrome,modal,centerscreen,resizable,width=300,height=350"
  );
};

var log_window = function(){
  window.open(
    "chrome://main/content/log.xul",
    "log",
    "chrome,resizable,width=300,height=300"
  );
};

var settings_window = function(){
  window.openDialog(
    "chrome://main/content/preferences.xul",
    "Preferences",
    "chrome,resizeable,centerscreen,toolbar,width=800,height=600"
  );
};

var domi_window = function(){
  window.open(
    "chrome://inspector/content/inspector.xul",
    "inspector",
    "chrome,resizable,width=600,height=300"
  );
};

var extension_manager = function(){
  window.open(
    'chrome://mozapps/content/extensions/extensions.xul?type=extensions',
    'extensions',
    "chrome,all,toolbar,centerscreen,resizable"
  );
};

var theme_manager = function(){
  window.open(
    'chrome://mozapps/content/extensions/extensions.xul?type=themes',
    'extensions',
    "chrome,all,toolbar,centerscreen,resizable"
  );
};

var chat_window = function(){
  window.open(
    'chrome://chat/content/chat.xul',
    'chat',
    'chrome,all,centerscreen,resizable,modal=no,width=400,height=300'
  );
};

/*
 * Window Buttons
 */

var setup_window_buttons = function(){
  $('#about-button').click( about_window );
  $('#log-button').click( log_window );
  $('#about-config-button').click( about_config );
  $('#quit-button').click( function(){ App.quit(false); } );
  $('#launch-button').click( function(){ launch_forsaken() } );
  $('#join-button').click( join_forsaken );
  $('#host-button').click( host_forsaken );
  $('#settings-button').click( settings_window );
  $('#version-template').select( function(){ VersionManager.set_selected_version() } );
  $('#domi-button').click( domi_window );
  $('#reload-button').click( doReloadAllChrome );
  $('#downloads-button').click( Download.show );
  $('#browser-button').click(function(){ browser(); });
  $('#extension-manager-button').click( extension_manager );
  $('#theme-manager-button').click( theme_manager );
  $('#chat-button').click( chat_window );
  $('#version-update-button').click( function(){ VersionManager.update(); } );
  $('#version-download-button').click( function(){ browser("http://fly.thruhere.net/versions/"); } );
};

/*
 *
 */

var check_required_preferences = function(){
  if(!prefs.getChar('projectx.folder')){
    alert('You must configure the projectx.folder!');
    settings_window();
  }
};

/*
 * Startup
 */

$(document).ready(function(){
  try{

    _status( 'Starting...' );




    // listeners
    setup_tree_listeners();  

    // binds button actions
    setup_window_buttons();
  
    // check for needed preferences
    check_required_preferences();
  
    // setup and update the versions
    VersionManager.setup();
    VersionManager.update();

    // setup and update the game list
    GameManager.setup();
    GameManager.update();
  
    // automate game list updator
    $().everyTime( '5s', 'updator', function(){ GameManager.update() }, 0, true );
  



    _status( 'Ready.' );
  
  }catch(e){
    log.error('race',e);
  }
});


/*
 * Shutdown
 */

window.onunload = function(){
  Download.manager.removeListener( Download.listener );
};


