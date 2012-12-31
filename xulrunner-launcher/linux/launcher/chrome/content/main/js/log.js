
include(jslib_date);
include(jslib_file);

/**
  *  Observers
  */

var service = Components.classes["@mozilla.org/observer-service;1"].
              getService(Components.interfaces.nsIObserverService);

var observer = {observe: function(subject,topic,data){ append(subject.wrappedJSObject); }};
var register_observer = function(){ service.addObserver( observer, 'projectx.log', false ); };
var unregister_observer = function(){ service.removeObserver( observer, 'projectx.log' ); };


/*
 *  Log Storage
 */

var logs = null;

var create_logs = function(){
  logs = document.implementation.createDocument("", "", null);
  logs.appendChild(logs.createElement('logs')); // documentElement
};

create_logs(); // startup

var restart_logs = create_logs;
var clear = function(){ restart_logs(); rebuild( true ) };

var attrs = function( reciever, data ){
  for ( p in data )
    reciever.setAttribute(p,data[p]);
};

var append = function( data ){
  var entry = logs.createElement('entry');
  $.extend(data,{ time: jslibDate("H:i") });
  attrs(entry,data);
  logs.documentElement.appendChild( entry );
  rebuild();
};

/**
  *  Template
  */

var template   = function(){ return $('#log')[0]; };
var builder    = function(){ return template().builder; };
var datasource = function(source){ builder().datasource = source; }

var rebuild    = function( force ){
  if( !force && paused() ) return;
  datasource( logs.documentElement );
//  builder().rebuild();
};

var level = function(name){
  $('treeitem').expire().hide();
  if( name != 'all' )
    $('treeitem.'+name).livequery(function(){ $(this).show(); });
};

var filter = function(){
};

var save = function(){
  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"]
               .createInstance(nsIFilePicker);
  fp.init(window, "Save File", nsIFilePicker.modeSave );
  fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
  var rv = fp.show();
  if(rv == nsIFilePicker.returnCancel())
    return false;
  var data = (new XMLSerializer()).serializeToString( xml );
  var file = new File( fp.file.path );
  if(file.exists())
    file.remove();
  file.create;
  file.open('w');
  file.write( data );
  file.close();
};

/**
  *  Buttons
  */

var pause = function(){ this.checked = !this.checked; }
var paused = function(){ return $('#pause')[0].checked; }
var level_change = function(e){ level( e.target.id ); };
var filter_change = function(e){ filter( this.value ); };

var assign_listeners = function(){
  $('#save').click( save );
  $('#clear').click( clear );
  $('#pause').click( pause );
  $('#filter').keypress( filter );
  $('#level').select( level_change );
};

/*
 *  Startup
 */

$(document).ready(function(){
  register_observer();
  assign_listeners();
});

window.onunload = function(){
  setup_tree_listeners();
  unregister_observer();
};

