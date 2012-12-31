
var IrcHandleLine = function(){

    // make copy of line
    var line = arguments[0];

    // seems freenode randomly throws these in
    line = line.replace("\r",'');

    // split up line
    var words = line.split(' ');

    //
    //  Check for bare words
    //

    // PING
    if(words[0].toLowerCase() == "ping" )
      return IrcHelper.pong( words[1] );

    // ERROR
    if(words[0].toLowerCase() == "error" )
      return false;

    //
    //  All rest follow diff standard
    //  :source action parameters
    //

    // source of message
    // USER   == :methods!1000@c-68-36-237-152.hsd1.nj.comcast.net
    // SERVER == :someserver.com
    var source = words.shift().slice(1); // remove leading colon
    var source_hostname = source.split('@')[1];
    var source_nick_up = source.split('!')[0];
    var source_nick = source_nick_up.toLowerCase(); // nick

    // action
    var action = words.shift().toLowerCase();

    // NAMES response
    // 353 FsknBot = #forsaken :@operator +voiced normal_user
    if(action == '353'){

      //log('--- processing NAMES response')
      words.shift(); // my name
      words.shift(); // equal sign

      // channel
      var channel = IrcChannels.create( words.shift() );

      // users
      var _users = irc.channels[ channel_down ].users;

      // remove colon
      words[0] = words[0].slice(1);

      // foreach user
      words.forEach(function( nick ){

        var operator = false;
        if ( nick[0] == '@' ){
	  nick = nick.slice(1);
	  operator = true;
	}

        var voiced = false;
        if(nick[0]=='+'){
          nick = nick.slice(1);
        }

        var user = new IrcUser({
          operator: operator,
          voiced: voiced,
          nick: nick
        });

      });
      return;
    }

    // hostname 366 nick #6odf :End of /NAMES list.
    if(action == '366'){
      words.shift(); // my nick
      var channel = words.shift().toLowerCase();  
      update_users_total_for( channel );
      return;
    }

    // 001
    if(action == "001"){
      this.initialized = true;
      this.send_join( Preferences.get("irc.channels").replace(' ',',') );
      return;
    }

    // TOPIC | 332
    // 332 FsknBot #forsaken :message goes here
    // :setter TOPIC #forsaken :test4
    if(action == "topic" || action == "332"){
      if( action == "332" ) words.shift(); // my nick -- uneeded
      var channel = IrcChannels.create( words.shift() );
      var topic = words.join(' ').slice(1); // topic without leading colon
      channel.topic = topic;
      var sender = (action=="topic") ? source_nick_up : undefined ;
      set_topic(channel,topic,sender);
      return;
    }

    // PART #channel :message
    if(action == 'part'){
      var channel = IrcChannel.find( words.shift() );
      if(!_channel)
        return log("-- Got part on channel that we're not in.");
      var message = source_nick+" left the room: ("+(words.shift()||"").slice(1)+")";
      channel.leave( source_nick );
      return;
    }












    // NICK
    if(action == "nick"){

      // nick without the colon
      var new_nick = words.shift().slice(1);
      var new_nick_down = new_nick.toLowerCase();

      // update user list
      var user = irc.users[source_nick];
      irc.users[source_nick] = undefined;
      if(user){
        irc.users[ new_nick_down ] = user;
        user.nick = new_nick;
      }else{
        irc.users[ new_nick_down ] = {nick: new_nick};
      }

      // update the dom
      update_user( source_nick, new_nick_down );

      // I changed my nick!
      if( source_nick == irc.nick ){

        irc.nick = new_nick_down;

        broadcast_line({
          label: true,
          time: true,
          type: 'system',
          text: 'You are now known as '+new_nick
        });

      // someone else changed their nick
      }else{

        for( channel in irc.channels ){
log("*** Checking channel: "+channel.name);
log("*** Channels: "+irc.channels.length);
log("*** channel users exists: "+!!channel.name);
log("*** channel users user: "+!!(channel.name &&channel.users[ new_nick_down ]));

          if( !channel.users || !channel.users[ new_nick_down ] ) continue;
  
          add_line({
            target: channel.name,
            label: true,
            time: true,
            type: 'system',
            text: source_nick +' is known as '+new_nick
          },channels);

        }

      }

      return;
    }


    // 432
    // 433

    // erroneous nickname
    // 432 current_nick target_nick :message
    // nick already in use
    // 433 current_nick target_nick :message
    if(["432","433"].indexOf(action) != -1){
      words.shift(); // my current nick
      var message = words.join(' ');
      broadcast_line({
                 label: true,
                 time: true,
                 type: 'system',
                 text: message });
      // we will get timed out very quickly
      // if nick is already in use at initial login
      // might as well quit now and then restart
      if( !this.initialized && action=="433"){ 
        irc.send_quit();
        var message = "Nick ("+irc.nick+") is taken please pick another!";
        var nick = prompt( message, irc.nick );
        user_pref( nick );
        start_connection();
      }
      return;
    }





    // KICK #forsaken DIII-The_Lion :methods
    if(action == "kick"){

      // parse vars
      var [channel,kicked,reason] = words;
      var channel_down = channel.toLowerCase();
      reason = reason ? reason.slice(1) : '';
      var message = "Kicked by FsknBot ("+reason||source_nick+").";
  
      // we got kicked
      if( source_nick == irc.nick ){
        this.channels[ channel_down ] = undefined;
        remove_panel( channel_down );

      // someone else got kicked
      }else{
        _channel.users[ source_nick ] = undefined;
        remove_user( source_nick, channel, message );
      }
      
      return;
    }


    // QUIT :message
    if(action == "quit"){

      //log("--- User quit");      

      // message
      var message = "quit: "+ words.join(' ').slice(1);

      // remove their color from used list
      if(this.users[source_nick].color)
        free_color( this.users[source_nick].color );

      // kill user
      this.users[ source_nick ] = undefined;

      // remove for every channel
      // no need to check if we quit cause we get an ERROR not a QUIT
      for ( channel in this.channels ){
          //log("--- Removing user ("+source_nick+") from ("+channel+") :"+message);
          if(!this.channels[channel].users)continue;
          this.channels[channel].users[ source_nick ] = undefined;
          remove_user( source_nick, channel, message );
      }

      return;
    }


    // JOIN :#channel
    if(action == 'join'){

      var channel = words.shift().slice(1);
      var channel_down = channel.toLowerCase();

      // called when we are done here
      var finished = function(){
        // note:
        //   don't try to who the user directly
        //   you will get the first channel they are in
        //   not the channel they just joined
        //   we might not even be in that channel
//        irc.send_who( channel );
      }
       
      // i joined a channel
      if(source_nick == irc.nick){

        //log("--- we joined a channel");
   
        // bootstrap channel
        if ( irc.channels[ channel_down ] ){
          log('--- got JOIN but we are already in there...');
        }else{
//log("*** Setting channel name to: "+channel);
          irc.channels[ channel_down ] = {
            length: 0,
            users: {}
          };
          irc.channels[ channel_down ].name = channel;
          irc.channels.length += 1;
        }

        //log("--- adding panel for channel: "+channel);

        // create a panel for the channel
        add_panel(channel,function(){
          finished();
        });
    
      // someone else joined the room
      }else{

        //log("--- someone else joined a channel");

        if(!irc.channels[ channel_down ]){
          log('--- got JOIN on ('+channel+') but we are not in that channel...');
          return;
        }

        var user = irc.channels[ channel_down ].users[ source_nick ] = {
          nick_down: source_nick,
          nick: source_nick_up
        }

        add_user( channel_down, user );

        //log("--- notifying user that someone joined a channel");

        // notify user
        add_line({ target: channel_down,
                   label:  true,
                   type:   'system',
                   text:   source_nick+' ['+source_hostname+'] entered the room.',
                   time:   true });

        finished();

      }

      return;
    }


    // WHO response
    // 352 my_nick #channel uid hostname their_server nick mode :realname
    // note:
    //   channel is first channel user is in.
    //   doesn't mean that "we" are in that channel.
    if(action == '352'){
      var [,channel,uid,hostname,,nick,mode,realname] = words;
      var nick_down = nick.toLowerCase();
      var channel_down = channel.toLowerCase();
      if ( ! irc.channels[ channel_down ] ){
        log('--- Got who response for ('+nick+') '+
            'but we are not in the channel ('+channel+').');
        return;
      }
      var user = { uid: uid, hostname: hostname, nick: nick, nick_down: nick_down,
                   mode: mode, realname: realname.slice(1) };
      var nick_down = user.nick.toLowerCase();
      irc.channels[ channel_down ].users[ nick_down ] = user;
      irc.users[ nick_down ] = user;
      return;
    }
    if(action == '315') return; // end of who list


    // PRIVMSG MethBot :hi 1 2 3
    if(["privmsg","notice"].indexOf(action)!=-1){

      // vars
      var target = words.shift().toLowerCase(); // remove target
      var is_channel = false;
      if(target[0] == "#")
        is_channel = true;
      var text = words.join(' ').slice(1); // rebuild line without leading colon
      var ctcp = false;
      var ctcp_action = null;
      var ctcp_message = "";

      // append a notice sign
      if(action=="notice"){
        text = "(notice) " + text;

      // look for ctcp
      }else if(text[0] == "\001" && text[text.length-1] == "\001"){
          ctcp = true;
          var copy = text;
          var parts = copy.replace("\001",'','g').split(' ');
          ctcp_action = parts.shift().toLowerCase();
          ctcp_message = parts.join(' ');
      }

      // add the line
      add_line({ target: (is_channel ? target : source_nick), // channel or pm
                 source: source_nick_up,
                 label:  true,
                 text:   text,
                 time:   true,
                 action: (ctcp_action == "action") });

      // look for ctcp commands to respond to
      // reply to a version message
      if( ctcp )
        if( ctcp_action == "version" ){
          //log('--- detected ctcp version command');
          irc.send_privmsg( source_nick, "ProjectX Chat Client 0.1" );
        }else{
          log('--- unknown ctcp command');
        }

      return;
    }


    // MODE #projectx +o [nick]
    // what is this?
    // 324 FsknBot #forsaken +tncz
    // 329 FsknBot #forsaken 1192567839
    if(action == "mode"){
      var channel = words.shift();
      var mode = words.shift();
      var target = words.shift();
      add_line({ target: channel,
                 type:   'system',
                 label:  true,
                 time:   true,
                 text:   "mode ("+mode
                                 +(target?" "+target:'')
                                 +") by "+source_nick });
      log("--- Changing modes is not implemented yet.");
      return;
    }

    // end of receive_line
    return;

};

IrcConnection.observers.receive_line.register( IrcHandleLine );


