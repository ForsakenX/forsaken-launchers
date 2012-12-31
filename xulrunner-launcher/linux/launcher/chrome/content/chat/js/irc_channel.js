
//
//  Channels
//

var IrcChannels = {
  list: {},
  observers: {
    'part': (new Observe())
  },
  find: function( channel ){
    return this.list[ channel.toLowerCase() ];
  },
  join: function( channel ){
    this.list[ channel.name.toLowerCase ] = channel;
  },
  part: function( channel, nick ){
    if( nick && nick == Preferences.get('irc.nick') )
      this.list[ channel.name.toLowerCase ] = undefined;
    this.observers.part.run( channel, nick );
  },
  create: function( channel ){
    var _channel = this.find( channel );
    if( _channel ) return _channel;
    return new IrcChannel( channel );
  }
};

//
//  Channel
//

var IrcChannel = function( channel ){
  this.name = channel.toLowerCase();
  this.topic = '';
  IrcChannels.join( this );
};

IrcChannel.prototype = {
  part: function( nick ){
    IrcChannels.part( self.name, nick );
  }
};



