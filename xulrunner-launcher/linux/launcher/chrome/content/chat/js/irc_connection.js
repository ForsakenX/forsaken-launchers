
var IrcConnection = {};
Socket.extend( IrcConnection, Socket.protocols.lineText1 );
Socket.extend( IrcConnection, {

  socket: null,
  initialized: false,

  observers: {
    'receive_line': new Observe()
  },

  start: function(){
    IrcConnection.socket = new Socket( 
      Preferences.get("irc.server"),
      Preferences.get("irc.port"),
      IrcConnection
    );
  },

  post_init: function(){
    log( "--- Connected" );
    this.send_nick( Preferences.get("irc.nick") );
    this.send_line("USER x x x :x");
  },

  unbind: function(){
    log( "--- Disconnected" );
  },

  receive_line: function( line ){
    log( "irc >>> "+line );
    this.observers.receive_line.run( line );
  },

  send_line: function( data ){
    var line = data + "\n";
    log( "irc <<< "+line );
    this.send_data( line );
  }

});


