
var Supports = function(obj){
  return {
    wrappedJSObject: obj,
    QueryInterface: function(){ return this; },
    getHelperForLanguage: function(){},
    getInterfaces: function(){},
  };
};

var log = {
  notify: function ( severity, type, message ) {
    var o = Components.classes["@mozilla.org/observer-service;1"].
            getService(Components.interfaces.nsIObserverService);
    var data = Supports({ severity: severity, type: type, message: message, });
    o.notifyObservers ( data, 'projectx.log', null );
  },
  error:    function( type, message ) { this.notify( 'error',   type, message ); },
  info:     function( type, message ) { this.notify( 'info',    type, message ); },
  warning:  function( type, message ) { this.notify( 'warning', type, message ); },
  fatal:    function( type, message ) { this.notify( 'fatal',   type, message ); },
  misc:     function( type, message ) { this.notify( 'misc',    type, message ); },
};

