

var IrcHelper = {

  pong:   function( arg ){ IrcConnection.send_line( "PONG " + arg ); },
  join:   function( arg ){ IrcConnection.send_line( "JOIN " + arg ); },
  who:    function( arg ){ IrcConnection.send_line( "WHO "  + arg ); },
  nick:   function( arg ){ IrcConnection.send_line( "NICK " + arg ); },
  away:   function( arg ){ IrcConnection.send_line( "AWAY :"+ arg ); },
  quit:   function( arg ){ IrcConnection.send_line( "QUIT :"+ arg ); },
  time:   function( arg ){ IrcConnection.send_line( "TIME"        ); },

  // ctcp version request
  version: function( target ){
    this.privmsg(target,"\001VERSION\001");
  },

  // ctcp ping
  ping: function( target ){
    if(target) this.privmsg(target,"\001PING\001");
    else this.data("PING");
  }

  invite: function( nick, channel ){
    IrcConnection.send_line("INVITE "+nick+" "+channel);
  },

  part: function( channel, message ){
    IrcConnection.send_line("PART "+channel+" :"+message);
  },

  topic: function( channel, message ){
    IrcConnection.send_line("TOPIC "+channel+" :"+topic);
  },

  privmsg: function( target, text ){
    IrcConnection.send_line("PRIVMSG "+target+" :"+text);
    add_line({ target: target,
               source: irc.nick,
               text:   text,
               label:  true,
               time:   true });
  },

};


