
//
//  Users
//

var IrcUsers = {
  list: {},
  observers: {
    'new': (new Observe())
  },
  find: function( nick ){
    return this.list[ nick.toLowerCase() ];
  },
  add: function( user ){
    this.list[ user.nick.toLowerCase() ] = user;
  },
  del: function( user ){
    this.list[ user.nick.toLowerCase() ] = undefined;
  }
};

//
//  User
//

var IrcUser = function( hash ){
  this.nick = hash.nick;
  this.channels = {};
  IrcUsers.add( this );
};

IrcUser.prototype = {
  delete: function(){
    IrcUsers.del( this );
  }
};



