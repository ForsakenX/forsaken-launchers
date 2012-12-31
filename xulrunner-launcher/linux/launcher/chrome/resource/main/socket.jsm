/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Observers.
 *
 * The Initial Developer of the Original Code is Daniel Aquino.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Aquino <mr.danielaquino@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

let EXPORTED_SYMBOLS = ["Socket"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var status_codes = {};
status_codes[Ci.nsISocketTransport.STATUS_RESOLVING]       =   "resolving";
status_codes[Ci.nsISocketTransport.STATUS_CONNECTING_TO]   =   "connecting";
status_codes[Ci.nsISocketTransport.STATUS_CONNECTED_TO]    =   "connected";
status_codes[Ci.nsISocketTransport.STATUS_SENDING_TO]      =   "sending";
status_codes[Ci.nsISocketTransport.STATUS_WAITING_FOR]     =   "waiting";
status_codes[Ci.nsISocketTransport.STATUS_RECEIVING_FROM]  =   "receiving";
status_codes[Ci.nsITransport.STATUS_READING]               =   "reading";
status_codes[Ci.nsITransport.STATUS_WRITING]               =   "writing";

/*
 *  Socket Class
 */

var Socket = function( host, port, listener ){
  this._construct( host, port, listener );
};

/*
 *  Socket Constructor
 */

Socket.prototype = {

  wrappedJSObject: null, 
  _connected: false, // connection state
  _scriptable_input_stream: null, // scriptable access to input stream
  _transport : null,    // the connection object
  _input_stream: null,  // input stream
  _output_stream: null, // output stream
  _listener: null,      // user passed asynchronouse listenter

  _construct: function( host, port, listener ){

    // so we can access this instance from nsi context's
    // particularly with the pump listener
    this.wrappedJSObject = this;

    // alias for this scope
    var socket = this;

    // create transport
    // this is the connection object
    var transport_service = 
      Cc["@mozilla.org/network/socket-transport-service;1"].
      getService(Ci.nsISocketTransportService);
    this._transport = transport_service.createTransport( null, 0, host, port, null );
    if(!this._transport) throw ("Error opening transport.");

    // create event listener
    // this is how we get connection events
    this._transport.setEventSink({
      onTransportStatus: function( transport, status, progress, progressMax ){
        switch( status_codes[ status ] ){
          case "connected":
            socket._connected = true;
          break;
        }
      }
    }, null );

    // create input stream
    // this is how we read data
    // this actually starts the connection
    this._input_stream = this._transport.openInputStream( 0, 0, 0 );
    if(!this._input_stream) throw("Error opening input stream.");

    // create output stream
    // this is how we send data
    this._output_stream = this._transport.openOutputStream( 0, 0, 0 );
    if(!this._output_stream) throw("Error opening output stream.");

    // associate input stream with scriptable interface
    // this is how javascript accessess the input stream
    this._scriptable_input_stream =
      Cc["@mozilla.org/scriptableinputstream;1"].
      createInstance(Ci.nsIScriptableInputStream);
    this._scriptable_input_stream.init( this._input_stream );

    // setup asynchronouse listener
    if(listener)
      this._setup_listener( listener );

  },

  _setup_listener: function( listener ){

    // save it
    this._listener = listener;

    // extend the user listener
    listener.socket = this;
    listener.send_data = function( str ){ listener.socket.write( str ); };

    // create input stream pump
    // this is used to read data asynchronously via a listener
    var pump =
      Cc["@mozilla.org/network/input-stream-pump;1"].
      createInstance(Ci.nsIInputStreamPump);
    pump.init(this._input_stream,-1,-1,0,0,false);
    pump.asyncRead({
      onStartRequest: function(channel,context){
          if( listener.post_init )
            listener.post_init( channel, context.wrappedJSObject );
      },
      onStopRequest: function(channel,context,status,error_msg){
          if( listener.unbind )
            listener.unbind(channel,context.wrappedJSObject,status,error_msg);
      },
      onDataAvailable: function(channel, context, input_stream, source_offset, count ){
        if( listener.receive_data )
          listener.receive_data(
            context.wrappedJSObject
              ._scriptable_input_stream.read( count ) 
          );
      }
    }, this);

  }
};

/*
 *  Instance
 */

// write data to the socket
Socket.prototype.write = function( str ){
  if(!this.alive()) throw("Socket not connected.");
  this._output_stream.write( str, str.length );
  return this; // let them keep chaining
};

// checks to see if socket is alive
// note:
//  isAlive() will not return true until initial stack has unwound
//  meaning that the stack that creates the connection will get false even if connected
//  _connected as well will not be set until the current stack unwinds
//  possible solutions I can think of are:
//    - hack mozilla to make this work instantly
//    - you can check available() for data
//       ` for instance if a header is always expected to be sent on initial connect from server
//    - if your protocol supports some type of ping/pong (echo/keep-alive/etc) negotiation
//       ` you could send such a packet and check available() for response
//    - use js coroutines to suspend the stack momentarly to other stacks unwind?
//       ` that would at least let the event sink set _connected to true...
//       ` not sure about isAlive() though
//    - perhaps moz has some built in way to block stack until connect is made and set timeout?
//  attempted hacks in place (should i use these?)
//    - I set _connected if available() has data right after connection attempt
//    - I set _connected if stream listener is set and onStartRequest is hit
Socket.prototype.alive = function(){
  if(!this._connected)return false; // event sink initially sets this
  if(this._transport.isAlive())return true; // true if connection (still) alive
  this._connected = false;
  return false;
};

// returns number of bytes in input buffer
Socket.prototype.available = function(){
  if (!this.alive()) return 0;
  return this._scriptable_input_stream.available();
};
  
// closes the socket
Socket.prototype.close = function(){
  if (this.open())this._transport.close(0);
};

// read data from socket
Socket.prototype.read = function( bytes ){
  if (!this.alive()) throw "Socket.read: Not Connected.";
  var data = "";
  if (!bytes)
    return data;
  var available = this.available();
  if (!available)
    return data;
  // get smallest of two
  bytes = Math.min(availableBytes, bytes);
  if (bytes)
    data = this._scriptable_input_stream.read( bytes );
  return data;
}


/*
 *  Protocol Helpers
 */

Socket.extend = function( taker, giver ){ for( p in giver ) taker[ p ] = giver[ p ]; };

// holder for protocol helpers
Socket.protocols = {};

// implements send_line and receive_line using singe new line as separator
Socket.protocols.lineText1 = {
  send_line: function( data ) {
    this.send_data( data + "\n" );
  },
  receive_buffer: "",
  receive_data: function( data ){
    // get initial new line position
    var index = data.indexOf( "\n" );
    // slice up and dispatch lines of data without trailing new line
    while( index != -1 ){ // while we have new line characters
      // pack single line onto buffer
      // not including new line
      this.receive_buffer += data.slice( 0, index );
      // dispatch line
      this.receive_line( this.receive_buffer );
      // reset buffer
      this.receive_buffer = "";
      // reset data to rest of data without the new line
      data = data.slice( (index+1) );
      // find next line
      index = data.indexOf( "\n" );
    }
    // pack trailing data onto buffer
    this.receive_buffer = data;
  }
};


/*
 *  Listener Spec
 *
 *    methods:
 *
 *      post_init( nsIChannel, Socket )
 *
 *      unbind( channel, Socket, status, error_msg )
 *      
 *      receive_data( data )
 *
 */



/*
 *  Example Usage
 */

// talk back client

/*

  var listener = {

    receive_data: function( data ){
      this.send_data( data );
    }

  };

  var socket = new Socket( '127.0.0.1', 23, listener );

*/



// using line based protocol

/*

  var listener = {

    post_init: function( socket ){
      this.send_line( 'I am a talk back client!' );
    },

    unbind: function(){
      alert('Connection closed!');
    },

    receive_line: function( line ){
      this.send_line( line );
    }

  };

  Socket.extend( listener, Socket.protocols.lineText1 );

  var socket = new Socket( '127.0.0.1', 23, listener );

*/
