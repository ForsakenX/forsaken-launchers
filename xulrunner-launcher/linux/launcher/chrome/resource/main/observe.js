
var EXPORTED_SYMBOLS = [ "Observe" ];

var Observe = function(){};

Observe.prototype = {
  list: [],
  register: function( func ){
    this.list.push( func );
  },
  run: function(){
    var args = arguments;
    this.list.forEach(function( observer ){
      observer.apply( undefined, args );
    });
  }
};


