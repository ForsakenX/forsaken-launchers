
// aliases

const Cc = Components.classes;
const Cu = Components.utils;
const Ci = Components.interfaces;

// resources

[
 "resource://main/socket.jsm",
 "resource://main/Preferences.js",
 "resource://main/Observers.js",
 "resource://main/util.js",
 "resource://main/chat_scroll.js",
 "resource://main/observe.js",
].forEach(function( resource ){
  Cu.import( resource );
});

// subscripts

[
 "chrome://chat/content/js/irc_connection.js",
 "chrome://chat/content/js/irc_handle_line.js",
 "chrome://chat/content/js/irc_helper.js",
 "chrome://chat/content/js/irc_channel.js",
 "chrome://chat/content/js/irc_user.js",
 "chrome://chat/content/js/log.js",
].forEach(function(){
  var service = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                .getService(Ci.mozIJSSubScriptLoader);
  return function( script ){
    service.loadSubScript( script );
  }
}());


try{
// 
// rest of files
//







// get's and sets the saved irc.nick
var user_pref = function(user){
  var user_pref_key = 'irc.user';
  if(user){
    Preferences.set( user_pref_key, user );
    irc.nick = user;
  }else{
    user = Preferences.get( user_pref_key, "guest" );
  }
  return user;
};

// helper to get the current nick or set it
var get_nick = function(){
  var nick = user_pref();
  if(nick!='guest')return;
  var message = "Please select a name!";
  do{
    nick = prompt( message, nick||'guest' );
  }while(!nick);
  user_pref( nick );
};

// helper to change the next
var account_change_nick = function(){
  var message = "Select a new nick.";
  var new_nick = prompt( message, user_pref() );
  user_pref( new_nick );
  irc.send_nick( new_nick );
  return true;
};


// list of used colors
var colors = {};

// delete a color from used list
var free_color = function( color ){
  if(!color)return;
  var name = color.split('(')[1].split(')')[0].split(',').join('');
  colors[name] = undefined;
}

// get a free random color
var get_free_color = function(){
  var color = [Util.rand(1,255),Util.rand(1,255),Util.rand(1,255)]; // get random color
  if((color.join('')=='000')|| // don't allow black
      colors[color.join('')]) // we using this color already?
    return get_free_color(); // get another color
  colors[ color.join('') ] = true; // store it
  var formatted = 'rgb('+color.join(',')+')'; // formated for css value
  return formatted; // return unique color
};

// get color for user
var get_user_color = function( _user ){
  if(!_user)return "#000000";
  var user = irc.users[_user.toLowerCase()];
  if(!user) user = irc.users[_user.toLowerCase()] = {};
  if(!user.color) user.color = get_free_color();
  return user.color;
};

// adds a user to a user list
var add_user = function( channel, user, count ){
try{

  // make sure nick is passed in
  if( !user || !user.nick ){
    log('--- Attempted to add empty user');
    return;
  }

  // make sure panel status is at 2
  // at status 2 we have a users box
  var  panel = get_panel_for_target( channel );
  if( !panel.hasAttribute('status') || 
        parseInt(panel.getAttribute('status')) < 2 ){
    //log("--- Defering add_user until browser status is == 2");
    if(!count || count<50){
      setTimeout(function(){

        //log("--- Executing add_user again");
        add_user( channel, user, (count?count+=1:1) );

      },500);
    // stop an infinite loop
    }else{
      log("--- add_user defferred over 50 times giving up.");
    }
    return;
  }

  //log("--- Processing add_user");

  var doc = get_doc_for_target( channel );
  var user_box = $('#users',doc)[0];

  // create user
  //log("--- creating element");
  var el = doc.createElement( 'listitem' );
  el.setAttribute('label',user.nick);
  $(el).addClass('user listitem-iconic');
  el.setAttribute('crop','end');
  el.setAttribute('value',user.nick_down);
  el.setAttribute('nick',user.nick_down);
  el.setAttribute('context','user-context');
  log("--- stub: need to set image type for user");
  //  el.setAttribute('image','');
  el.style.color = get_user_color( user.nick_down );
  el.addEventListener('dblclick',function(){
    add_panel( user.nick_down );
  },false);

irc.users[ user.nick_down ].element = el;


/*
  var nick = user.nick;

  // find sort position 
  // list of valid lowercase characters for a username
  var position = ['a','b','c','d','e','f','g','h','i',
                  'j','k','l','m','n','o','p','q','r',
                  's','t','u','v','x','y','z',
                  '[',']','_','|',
                  0,1,2,3,4,5,6,7,8,9];

  // find correct sort position and enter element
//  var users = $('.user',user_box);

var users = irc.channels[ channel.toLowerCase() ].users;
//log("--- users: "+users.toSource(),true);

  // for each user
  for(var x = 0; x < users.length; x++){

// check if same  user
var _user = users[x].element;
if(_user.getAttribute('id') == el.getAttribute('id')){
  log("--- Same user skipping",true);
  continue;
}

//    var _nick = users[x].getAttribute('value').toLowerCase();
var _nick = _user.getAttribute('value').toLowerCase();

    log("--- Checking ("+nick+") vs ("+_nick+")",true);

    for( var y = 0; y < _nick.length; y++ ){
      // make sure we still have letters to check in the new username
      if(!nick[y]){  // new nick doesn't have any more letters, short names go on top
        user_box.insertBefore( el, users[x] );
        log("--- target word to short adding here",true);
        break;
      }
      // get position of characters in order list
      var _i = position.indexOf(_nick[y]);
      var  i = position.indexOf( nick[y]);
      // make sure letters exist
      // other wise skip this letter
      if( i == -1 ){
        log('--- letter does not exist in order tree: '+nick[y],true);
        break;
      }
      if( _i == -1 ){
        log('--- letter does not exist in order tree: '+_nick[y],true);
        break;
      }
      // new letter is sorted after old letter
      // hence this words sort order is after
      if( i > _i ){
        // stop checking letters
        // and proceed to next word
        break;
      // new letter has better sort order
      // hence the new word sorts ealier
      }else if ( i < _i ){
        // add the new word before current one
//        user_box.insertBefore( el, users[x] );

user_box.insertBefore( el, _user );

        log("--- adding before current",true);
        break;
      // these letters are equal
      }else{
        // this is the last iteration!
        // and so far the words were equal!
        if( (_nick.length-1) == y ){
          // since longer names go afer shorter ones
          // add this name after the current one
          log("--- adding last",true);
//          user_box.insertBefore( el, users[x].nextSibling ); 

user_box.insertBefore( el, _user.nextSibling ); 

        }
      }
    }
    // looks like we've been added to the DOM
    // time to quit checking against other usernames!
    if(el.parentNode)break;
  }
*/

  // we never added this word to the list
  // hence it belongs at the end of the list
  if(!el.parentNode){
    user_box.appendChild(el);
    log("--- added user to the end",true);
  }

  //log("--- finished processing user",true);
}catch(e){
  log("--- We got an error on insert_user: "+e);
}
};

IrcUsers.observers.new.register(function(){
  add_user( channel, _user );
});



// goes over all users and updates settings
var update_user = function( old_nick, new_nick ){
  for( channel in irc.channels ){
    if( !channel.users || ! channel.users[ new_nick ])
      continue;
    var doc = get_doc_for_target( channel );
    $('.user',doc).each(function(){
      if( this.getAttribute('value') != old_nic ) return;
      this.setAttribute( 'value', new_nick );
      this.setAttribute( 'label', new_nick );
    });
  }
};

// get's the panel for a doc
var panels = {};
var get_panel_for_target = function( target ){
  // build the id
  var type = "user"
  if(target[0] == '#')
    type = "channel"
  var id = '#' + type + '-' + Util.hex(target) + '-panel';
  // check cache
  if(panels[id] && panels[id].parentNode.parentNode){ // element still lives in dom
    //log("--- Using existing panel ref",true);
    return panels[id];
  }
  // get fresh
  var ref = $( id )[0];
  //log("--- Getting fresh panel ref.",true);
  if(!ref){
    //log('--- Could not find panel for: '+id,true);
    return null;
  }
  panels[id] = ref;
  return ref;
};

// gets the document object for a panel
var get_doc_for_target = function( target ){
  var panel = get_panel_for_target( target );
  if(!panel)return null;
  return panel.contentDocument;
};

// ignores a user
var ignore = {

  key: "irc.ignore",

  get: function(){ return Preferences.get( this.key, "" ); },
  set: function( value ){ return Preferences.set( this.key, value ); },
  has: function( nick ){ return !nick ? false :
                         this.get().split(',')
                         .indexOf( nick.toLowerCase() ) != -1; },
  add: function( nick ){
    if(this.has(nick))return true;
    var nicks = this.get().split(',');
    nicks.push( nick.toLowerCase() );
    return this.set( nicks.join(',') );
  },
  del: function( nick ){
    return this.set( this.get().split(',').filter(function( _nick ){
      return (nick.toLowerCase() != _nick);
    }));
  }

};

// print currrent topic to textarea
var print_topic = function(){
  var channel = current_target();
  // must be a channel
  if(channel[0]!='#')return;
  // add the line
  add_line({
            target: channel,
            text:   'The topic for '+channel+' is: '+irc.channels[channel].topic,
            label:  true,
            time:   true,
            type:   'system' });
};

// creates a new panel
var add_panel = function( target, onload ){
  var target_formatted = target.toLowerCase();
  // if tab already exists just focus it.
  var tabs = $('tab');
  for( var x = 0; x < tabs.length; x++ ){
    var _target = tabs[x].getAttribute('label');
    if(_target == target_formatted){
      // tab already exists just focus it
      $('tabbox')[0].selectedIndex = x;
      return; 
    }
  }
  // the id for the browser
  var type = "user";
  if(target[0] == '#')
    type = "channel";
  var browser_id = type +"-"+ Util.hex(target_formatted) +"-panel";
  var tab_id     = type +"-"+ Util.hex(target_formatted) +"-tab";
  // if set to ignore than don't create it
  if(type=="user" && ignore.has(target_formatted))
    return false;
  // make sure doesn't exist
  if( $(browser_id)[0] ){
    if(onload)
      onload();
    return;
  }
  // create tab
  var tab = document.createElement('tab');
  tab.setAttribute('id',tab_id);
  tab.setAttribute('label',target);
  // create browser
  var browser = document.createElement('iframe');//('browser');
  browser.setAttribute('src','chrome://chat/content/chat_panel.xul');
  browser.setAttribute('type','content');
  browser.setAttribute('id',browser_id);
  browser.addEventListener('pageshow',function(e){
    browser.setAttribute('status','1');
    //log("--- pageshow has been called");
    var doc = browser.contentDocument;
    if( type == "channel" ){
      //log("--- adding overlay to panel");
      var observer = new Observer(function(){

        //log("--- chat_channel overlay has been merged");

        browser.setAttribute('status','2');

        $('#topic',doc)[0].addEventListener( 'click', function(){
          print_topic();
        }, false );

        $('#user-context',doc)[0].addEventListener('popupshowing',function(){
          var item = doc.popupNode;
          if(!item || !item.hasAttribute('nick'))return;
          var nick = item.getAttribute('nick');
          if(ignore.has(nick)){
            $('#user-ignore',doc)[0].setAttribute('hidden','true');
            $('#user-unignore',doc)[0].removeAttribute('hidden');
          }else{
            $('#user-ignore',doc)[0].removeAttribute('hidden');
            $('#user-unignore',doc)[0].setAttribute('hidden','true');
          }
        },false);

        $('#user-pm',doc)[0].addEventListener('command',function(){
          var item = doc.popupNode;
          if(item && item.hasAttribute('value'))
            add_panel( item.getAttribute('value') );
        },false);

        $('#user-ignore',doc)[0].addEventListener('command',function(){
          var item = doc.popupNode;
          if(item && item.hasAttribute('value'))
            ignore.add( item.getAttribute('value') );
        },false);

        $('#user-unignore',doc)[0].addEventListener('command',function(){
          var item = doc.popupNode;
          if(item && item.hasAttribute('value'))
            ignore.del( item.getAttribute('value') );
        },false);

//        $('#user-info',doc)[0].addEventListener();

      });
      doc.loadOverlay('chrome://chat/content/chat_channel.xul',observer);
    }


    // textbox callback
    $('#message',doc)[0].addEventListener( 'keypress', textbox_keypress, false );

    // caller callback
    if(onload) onload();

    // focus onto this tab
    $('tabbox')[0].selectedTab = tab;


  },false);
  // create panel
  var tabpanel = document.createElement('tabpanel');
  // add elements
  tabpanel.appendChild(browser);
  $('tabs')[0].appendChild(tab);
  $('tabpanels')[0].appendChild(tabpanel);
  //log("--- panel has been added to the dom width id: ("+target_formatted+") "+browser_id)
};

// removes a panel and tab
var remove_panel = function( target ){
  var target_formatted = target.toLowerCase();

  // don't allow remove of raw tab
  if(target_formatted == "raw")return;

  // the id for the browser
  var type = "user";
  if(target[0] == '#')
    type = "channel";

  // the id's
  var browser_id = '#' + type +"-"+ Util.hex(target_formatted) +"-panel";
  var tab_id     = '#' + type +"-"+ Util.hex(target_formatted) +"-tab";

  //
  // log("--- Removing tab/panel for: ("+target+") "+Util.hex(target_formatted)); 

  // remove the panel
  var iframe = $(browser_id)[0];
  if(!iframe){
    log("--- Trying to remove panel but there is no iframe");
    return;
  }
  var panel = iframe.parentNode
  panel.parentNode.removeChild( panel );
  $(tab_id).remove();

  // select last item
  $('tabbox')[0].selectedIndex = $('tabpanel').length-1;

};

IrcChannel.observers.leave.register(function(){
  remove_panel( channel_down );
});

// sets the topic
var set_topic = function( channel, topic, sender, count ){
  var channel_down = channel.toLowerCase();
  var panel = get_panel_for_target( channel );
  if(!panel){
    log("--- Got set_topic but no panel exists!");
    return;
  }
  if( !panel.hasAttribute('status') ||
         parseInt(panel.getAttribute('status')) < 2 ){
    //log("--- Defering set_topic");
    if(!count || count < 50)
      setTimeout(function(){
        //log("--- Executing defer of set_topic");
        set_topic( channel, topic, sender, (count?count+=1:1));
      },500);
    return;
  }
  var doc = get_doc_for_target( channel );
  var _topic = $('#topic',doc)[0];
  if(!_topic){
    log("--- Could not find #topic on "+channel+"'s pannel!");
    return;
  }
  //log("--- setting topic for channel: "+channel);
  //var text = doc.createTextNode( topic );
  //_topic.appendChild( text );
  _topic.setAttribute('tooltiptext',topic);
  _topic.setAttribute('value',topic);
  // notify channel
  var message = sender ?
                sender+' has changed the topic to: '+topic :
                'The topic for '+channel+' is: '+topic ;
  var el = add_line({
                 target: channel,
                 text:   message,
                 label:  true,
                 time:   true,
                 type:   'system' });
};

// sends message to all channels
var broadcast_line = function( message ){
  for( channel in irc.channels ){
    message.target = channel;
    add_line( message );
  }
};

// add's a line to a target
// options:  target, source, text, type, time
var add_line = function( message ){

  // irc does not support empty text
  if(!message.text){
    log("--- got empty message");
    return;
  }
  
  // hide if source is ignored
  if(ignore.has(message.source))
    return;

  // if target is null then use current showing target
  if(!message.target)
    message.target = current_target();

  // get the doc for the target
  var doc = get_doc_for_target( message.target );
  if(!doc){
 
    //log("--- no pannel for "+message.target );

    // channels should exist from a join message
    if(message.target[0] == "#"){
      log("--- Got privmsg for ("+message.target+") "+
          "but pannel does not exist!");
      return;
    }

    // add a new user panel
    //log("--- add_line called for non existsant panel... adding it: "+message.target);
    add_panel(message.target, function(){
      // make sure we get the line
      //log("--- Calling callback");
      add_line( message );
    });

    return;
  }
 
  // content
  var content = $('#content',doc)[0];

  // has to exist!
  if(!content){
    log('--- No content element found in panel for: '+message.target);
    // most likely we called add_line just after the browser is created
    // but the src content hasn't loaded yet!
    var target = get_panel_for_target( message.target );
    target.addEventListener('pageshow',function(){
      add_line( message );
    },false);
    return;
  }

  // log we got this far
  //log("--- proccessing add_line");

  // time of message
  var time = (new Date());

  // clean leading # from target
  if(message.target[0]=="#")
    message.target = message.target.slice(1);

  // our new line
  var line = doc.createElement('description');

  // add context
//  line.setAttribute('context','line-context');

  // add classes
  $(line).addClass('line');
  if(message.type)
    $(line).addClass(message.type);

  // update tab color to signify new message
  // only if user is not on the tab currently
  var _target = current_target();
  if(_target!=message.target){
    var type = "user";
    if(message.target[0] == "#")
      type = "channel";
    var tab = $('#'+type+'-'+Util.hex(message.target)+'-tab');
    if(message.type)
      tab.addClass(message.type);
    else
      tab.addClass('normal');
  }

  // set color
  if(message.color)
    line.style.color = message.color;

  // create label
  if(message.label){

    var label = doc.createElement('label');

    if(message.action)
      $(label).addClass('action');

    if(message.time){
      var _time = doc.createElement('label');
      $(_time).addClass('time');
      _time.appendChild(
        doc.createTextNode(
          time.toLocaleFormat(
            "("+ Preferences.get('chat.time.format','%H:%M:%S')+ ") ")));
      label.appendChild(_time);
    }

    if(message.source){
      var _source = doc.createElement('label');
      $(_source).addClass('source');
      _source.appendChild(
        doc.createTextNode(
          (message.action) ?  ("***"+message.source) :
                              (message.source + ": ")));
      _source.setAttribute('context','user-context');
      _source.setAttribute('nick',message.source.toLowerCase());
      label.appendChild(_source);
    }

    if(message.label_color)
      label.style.color = message.label_color;
    else if(message.source)
      label.style.color = get_user_color( message.source );

    line.appendChild(label);

  }

  // add text
  if( message.text ){
    var words = message.text.split(' ');
    words.forEach(function( word ){
      // test for http links
      var type = false;
      if(word.slice(0,"http://".length) == "http://"){
        type = "http";
      }else if(word.slice(0,"https://".length) == "https://"){
        type = "http";
      }else if(word.slice(0,"www.".length) == "www."){
        type = "www";
      }
      if( type ){
        if(type=="www") word = "http://"+word;
        var link = doc.createElement('label');
        // create element
	link.setAttribute('href',word);
        link.setAttribute('className','text-link');
        $(link).addClass('text-link');
        // break up long words so they wrap in client
        var text = word.replace(/[^ ]{40}/g,'$& ');
        text = " "+text; // add space back
        text = doc.createTextNode(text);
        link.appendChild(text);
        line.appendChild(link);
      // add raw text
      }else{
        // break up long words so they wrap in client
        var text = word.replace(/[^ ]{40}/g,'$& ');
        text = " "+text; // add space back
        line.appendChild( doc.createTextNode( text ) );
      }
    });
  }

  // check scrollbar
  var scroller = $('#scroller',doc)[0];
  ChatScroll.do_scroll( scroller );

  // add it
  content.appendChild( line );

  // return node
  return line;

};

// remove the user from the ui
// and do any other cleaning up     
var remove_user = function( nick, channel, message ){
try{

  log("--- removing user: "+[channel,nick,message].join(', '));

  // vars 
  var nick_down = nick.toLowerCase();

  // get the document that holds the user
  var doc = get_doc_for_target( channel );
  if(!doc){
    log("-- Called remove_user but panel for channel doesn't exist!");
    return;
  }

  // remove the user from the ui
  var users = $('.user',doc);
  users.each(function(){
    if(!this.hasAttribute('value'))return;
    if ( this.getAttribute('value') == nick_down )
      this.parentNode.removeChild( this );
  });

  // send message
  add_line({ target: channel,
             label: true,
             type: 'system',
             time: true,
             text: nick+' left the room ('+(message||'')+').' });

}catch(e){
  log("--- Error: "+e);
}
};


IrcUsers.observers.part.register(function(){
  remove_user( source_nick, channel, message );
});


// updates the total user count in a panel
var update_users_total_for = function( channel, count ){

  //log("--- Updating user total",true);

  var panel = get_panel_for_target( channel );

  if(!panel || !panel.hasAttribute('status') || parseInt(panel.getAttribute('status')) < 2 ){
    //log("--- Defering user total",true);
    if(!count || count < 20)
      setTimeout(function(){
        //log("--- Executing Defer for user total",true);
        update_users_total_for( channel, count?count+=1:1 );
      },500);
    return;
  }
  var doc = get_doc_for_target( channel );
  var total = $('#users-total',doc)[0];
  if(!total){
    //log("--- Could not find #users-total",true);
    return;
  }
  //log("--- Updating user total to: "+irc.channels[ channel ].length,true);
  var value = total.getAttribute('value')
              .replace( /^[0-9]+/, irc.channels[ channel ].length );
  total.setAttribute('value',value);

}




/*
var copy_selection = function(){
  var text = window.getSelection().toString();
  if(!text)return false;
  Util.ClipBoard.set(text);
  return true;
};
var copy_line = function(){
  // copy selection first
  if(copy_selection())return;
  // else copy clicked line
  if(!last_selectable) return false;
  var text = last_selectable.textContent;
  Util.ClipBoard.set(text);
};
*/


var get_keys = function(o){var ps=[];for(p in o){ps.push(p)};return ps;};

var tab_expansion = function( textbox ){
  // make sure we are not tabing on a space
  var previous_character = textbox.value[(textbox.selectionStart-1)];
  var invalid_characters = ["\n","\t"," "]; // decent
  if( invalid_characters.indexOf( previous_character ) != -1 )
    return; // user is not tabbing on a word
  // the word user is tabbing on
  var word = textbox.value.slice(0,textbox.selectionStart).split(' ').reverse()[0];
  if(!word) return; // don't check if empty
  // list of available names in user list
  var names = get_keys(irc.users);
  // container for list of matched names
  var matches = [];
  // for each name in the user list
  names.forEach(function(name){
    // if name is to small then it can't match
    if(name.length < word.length) return;
    // if name matches so far
    if(name.slice(0,word.length) == word){
      // add the name to the list of matches
      matches.push(name);
      return;
    }
  });
  // if we have no matches then don't do anything
  if(!matches.length){
    return;
  // if we have more than one match
  // print list of matches into chat box
  }else{
    add_line({
      text: matches.join(' '),
      type: 'raw'
    });
    // define our match
    // if there is only one match use whole word
    var match = null;
    // but if there is more than one match
    // find common text between all words
    if( matches.length > 1 ){
      // remove parts that we know already match
      var _matches = [];
      matches.forEach(function( match ){
        _matches.push( match.slice( word.length ));
      });
      // find similar prefix between all matches
      // so you can pick first word and test against rest char by char
      var _first = _matches.shift();
      // for each character in the word
      for( var c=0; c < _first.length; c++ ){
        // check against each word in list
        for( var i=0; i < _matches.length; c++ ){
          // if match has no more letters
          // then we have found most similarity
          if( ! _matches[i][c] ){
            match = _first.slice(0,c);
            break;
          }
          // if letters don't match we found most similarity
          if( _matches[i][c] != _first[c] ){
            match = _first.slice(0,c);
            break;
          }
        }
        // we found a match
        if(match)break;
      }
      // we are at the most ambiguity
      // so stop here
      if(!match)return;
    }
    //  we have only one match
    if(!match)
      match = matches[0];
    // the entire value of textbox
    var value = textbox.value;
    // remove everything after cursor
    var before = value.slice(0,textbox.selectionStart);
    // remove everything after the cursor
    var after  = value.slice(textbox.selectionStart);
    // replace the last word with new word!
        var temp = before.split(' ').reverse();
        // if more than one match then add the extra matched chars
        // other wise we should have a full matched word so replace whole thing
log('--- match: '+match,true);
        temp[0] = (matches.length>1) ?
           (word + match) :
           // get the real nick name with caps and add space
           irc.users[match.toLowerCase()].nick+(temp.length==1?": ":" "); // if temp==1 then we have first word
        var new_value = temp.reverse().join(' ');
    // add back the rest of the line!
    new_value += after;
    // set the new value!
    textbox.value = new_value;
  }
  return false;
};

/*
var assign_handlers = function(){
  $('#copy-line')[0].addEventListener('command',copy_line,false);
  $('.line').click(function(e){
    window.last_selectable = e.target;
  });
};
*/

// get the target name of tab
var current_target = function(){
  return $('tabbox')[0].selectedTab.getAttribute('label').toLowerCase();
};

// get the current content of iframe
var current_content = function(){
  var doc = document;
  var id = "#raw-content";
  // check too see if we are on iframe
  var iframe = $('iframe',$('tabbox')[0].selectedPanel)[0];
  if(iframe){
    doc = iframe.contentDocument;
    id = "#content";
  }
  return $( id , doc )[0];
};

// closes the current tab
var close_current_tab = function( message ){
      var current = current_target();
      // don't allow close of raw tab
      if( current == "raw" )return;
      // user tab
      if(current[0]!='#'){
        remove_panel( current );
        return;
      }
      // channel tab
      irc.send_part( current, message );
}

// user typed commands
var user_commands = {
  "help": {
    help: "help [command]: Get help on a command.",
    execute: function( args ){
      var context = (current_target()[0] == '#') ? "channel" : "pm" ;
      if(args.length){
        var command = user_commands[ args.shift().toLowerCase() ];
        if(!command) return add_line({type:'raw',text:'No such command.'});
        add_line({ type: 'raw', text: user_commands[ command ].help });
        add_line({ type: 'raw',
                   text: "NOTE: This command is only valid in ("+context+") context." });
        return;
      }
      var commands = [];
      for( command in user_commands )
        if( !command.context || command.context == context )
          commands.push( command );
      var message =
        'Use "/help <command>" for help on a specific command.\n'+
        'The following commands are available in this context:\n'+            
      commands.join(', ');
      message.split('\n').forEach(function( line ){
        add_line({ type: 'raw', text: line });
      });
    }
  },
  "me": {
    help: "me <action>: Send an IRC style action.",
    execute: function( args ){
      irc.send_privmsg( current_target(), "\001ACTION "+args.join(' ')+"\001" );
    }
  },
  "nick": {
    help: "nick <new nick>",
    execute: function( args ){
      var nick = args.shift();
      irc.send_nick( nick );
      if(nick.length > 16)
        add_line({
          text: 'NOTICE: Nick names are truncated up to 16 characters...',
          type: 'raw' });
    }
  },
  "join": {
    help: "join <room>: Enter one or more channels.",
    execute: function( args ){
      irc.send_join( args.join(',') );
    }
  },
  "clear": {
    help: "clear: Clears the screen.",
    execute: function( args ){
      $( current_content() ).children().remove();
    }
  },
  "away": {
    help: "away [message]: Set away mode with message.",
    execute: function( args ){
      irc.send_away( args.join(' ')||"afk" );
    }
  },
  "back": {
    help: "back: Removes the away message",
    execute: function(){
      irc.send_away();
    }
  },
  "invite": {
    help: "invite <nick> [room]: Invite the user to current or specified room.",
    context: "channel",
    execute: function( args ){
      irc.send_invite( args.shift(), current_target() );
    }
  },
  "msg": {
    help: "msg <nick> <message>: Send a private message to the user.",
    execute: function( args ){
      irc.send_privmsg( args.shift(), args.join(' ') );
    }
  },
  "part": {
    help: "part <message>: Leaves the current channel.",
    execute: function( args ){
      close_current_tab( args.join(' ') );
    }
  },
  "quit": {
    help: "quit <message>: Quits the chat leaving a message.",
    execute: function( args ){
      irc.send_quit( args.join(" ") );
      window.close();
    }
  },
  "quote": {
    help: "quote [line]: Send a raw line to the server.",
    execute: function( args ){
      irc.send_line( args.join(" ") );
      $('tabbox')[0].selectedIndex=0; // focus on raw tab
    }
  },
  // need to catch reply
  "time": {
    help: "time: Get your irc server's local time.",
    execute: function(){
      irc.send_time();
    }
  },
  "topic": {
    help: "topic <content>: Set to the topic.",
    context: "channel",
    execute: function( args ){
      if(args.length < 1) print_topic();
      irc.send_topic( current_target(), args.join(' ') );
    }
  },
  "version": {
    help: "version [nick]: Send CTCP VERSION request to user or entire channel.",
    execute: function( args ){
      irc.send_version( args.shift()||current_target() );
    }
  },
  "ping": {
    help: "ping [nick]: Send CTCP PING request to user or entire channel.",
    execute: function( args ){
      irc.send_ping( args.shift()||current_target() );
    }
  }
  // MISSING COMMANDS:
  //   deop, devoice, kick, list, memorserv, mode,
  //   names, nickserv, op, operserv, operwall,
  //   umode, voice, wallops, whois, whowas
}

// aliases
user_commands.leave = user_commands.part;
user_commands.me = user_commands.action;
user_commands.j = user_commands.join;

// parse lines from input
var handle_command = function(line){

  // regular privmsg
  if(line[0]!="/")
    return false;

  // remove leading marker
  line = line.slice(1);

  // words
  var words = line.split(' ');
  var _command = words.shift();

  // get the command
  var command = user_commands[ _command ];

  // command doesn't exist
  if(!command){
    add_line({ type: 'raw', text: 'Command does not exist.' });
    return true;
  }

  // is available in context?
  var context = (current_target()[0] == '#') ? "channel" : "pm" ;
  if(command.context && context != command.context){
    add_line({ type: 'raw', text: "That command does not exist (in this context)." });
    return true;
  }

  // execute command
  command.execute( words );

  return true;
};

var handle_message = function( textbox ){
  if(!socket){
    log("--- User typed message but there is no socket!");
    return;
  }
  var message = textbox.value;
  var lines = message.split('\n');
  // only first line can be a command
  if(lines[0][0] == "/")
    handle_command(lines.shift()) // remove it
  // send rest to target
  lines.forEach(function(line){
    irc.send_privmsg( current_target(), line );
  });
  // causes this code to execute after this function is finished
  // because the actual key just pressed will not be erase other wise
  // that key is "enter" so we don't care if it isn't sent
  setTimeout(function(){
    textbox.value = "";
  },0);
  //log("--- Done handeling message");
};

var textbox_keypress = function(e){
    var textbox = this;
    // up arrow + ctrl
    if(e.ctrlKey && e.keyCode == 38){ 
      textbox.editor.undo(1);
    // down arrow + ctrl
    }else if(e.ctrlKey && e.keyCode == 40){
      textbox.editor.redo(1);
    // tab key
    }else if(e.keyCode==9){
      tab_expansion( textbox );
      setTimeout(function(){
        textbox.focus();
      },100);
    // enter without shift
    }else if(e.keyCode!=13||e.shiftKey){
      // allow movement to next line
      return;
    // process the message
    }else{
      handle_message( textbox );
    }
}

var current_textbox = function(){
  var doc = document;
  var id = "#raw-message";
  // check too see if we are on iframe
  var iframe = $('iframe',$('tabbox')[0].selectedPanel)[0];
  if(iframe){
    doc = iframe.contentDocument;
    id = "#message";
  }
  var textbox = $( id , doc )[0];
  log('--- current textbox editor: '+textbox.editor);
  return textbox;
};


var command_helper = {
  help: function(){ current_textbox().setAttribute('value',  "/help") },
  action: function(){ current_textbox().setAttribute('value',  "/me <message>") },
  nick: function(){ current_textbox().setAttribute('value',  "/nick <nick>") },
  clear: function(){ current_textbox().setAttribute('value',  "/clear") },
};

var undo = function(){ current_textbox().editor.undo(1); };
var redo = function(){ current_textbox().editor.redo(1); };

var handle_raw_message = function(e){
  if( e.keyCode != 13 )return;
  irc.send_line( this.value );
  this.value = '';
}

var tab_click = function(){
  $(this).removeClass('system raw normal');
  var iframe = $('iframe',$('tabbox').selectedPanel)[0];
  var doc = document;
  if(iframe){
    if(!iframe.contentDocument){
      log("--- tab click but not iframe.contentDocument");
      return;
    }
    doc = iframe.contentDocument;
  }
  var message = $('#message',iframe.contentDocument)[0];
  if(message)
    message.focus();
}

var panel_click = function(){
  // you can't click on a tab that isn't selected!
  var tab = $('tabbox')[0].selectedTab;
  $(tab).removeClass('system raw normal');
}

var assign_chat_handlers = function(){
  $('#undo')[0].addEventListener('command',undo,false);
  $('#redo')[0].addEventListener('command',redo,false);
  $('#raw-message')[0].addEventListener('keypress',handle_raw_message,false);
  $('#account-change-nick')[0].addEventListener('command',account_change_nick,false);
  $('tab').livequery( 'click', tab_click );
  $('panel').livequery( panel_click );
  $('#close-window')[0].addEventListener('command',function(){ window.close(); },false);
  $('#irc-command-help')[0].addEventListener('command',command_helper.help,false);
  $('#irc-command-action')[0].addEventListener('command',command_helper.action,false);
  $('#irc-command-nick')[0].addEventListener('command',command_helper.nick,false);
  $('#irc-command-clear')[0].addEventListener('command',command_helper.clear,false);
  $('#tab-close')[0].addEventListener('command',function(){ close_current_tab() },false);
};

$(document).ready(function(){
  assign_chat_handlers();
  start_connection();
});

window.onunload=function(){
  irc.send_quit();
};



}catch(e){ throw(e) };


