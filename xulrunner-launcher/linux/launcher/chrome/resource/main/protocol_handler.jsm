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

let EXPORTED_SYMBOLS = ["HandlerInfo","ProtocolHandler"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var protocol_service = Cc['@mozilla.org/uriloader/external-protocol-service;1']
                      .getService(Ci.nsIExternalProtocolService);

var handler_service = Cc['@mozilla.org/uriloader/handler-service;1']
                      .getService(Ci.nsIHandlerService);

var get_uri = function( uri ){
  if( uri instanceof Ci.nsIURI ) return uri; // other wise assume <string>
 	var ios = Cc["@mozilla.org/network/io-service;1"].
      getService(Ci.nsIIOService);
  try{
    uri = ios.newURI(uri, null, null);
  }catch(e){return false;} // bad uri
  return uri;
};

var createFile = function( path ){
	var file = Components.classes["@mozilla.org/file/local;1"].
		   createInstance(Components.interfaces.nsILocalFile);
try{
	file.initWithPath( path );
}catch(e){
	return false;
}
	return file;
};

var HandlerInfo = {};

HandlerInfo.get = function( scheme ){
  return HandlerInfo.bootstrap( scheme );
};

// in case there is no default handler info object
// creates a default handler and set's handler to os default
// os default is handled by nsIExternalProtocol from db or os
HandlerInfo.bootstrap = function( scheme ){
  var handler = protocol_service.getProtocolHandlerInfo( scheme );
  handler.preferredAction = handler.useSystemDefault;
  handler.alwaysAskBeforeHandling = false;
  handler_service.store( handler );
  return handler;
};

HandlerInfo.set_default = function( scheme, path, name ){
  var handler_app = Cc['@mozilla.org/uriloader/local-handler-app;1'].
                    createInstance(Ci.nsILocalHandlerApp);
  var file = createFile( path );
  handler_app.name = (name || file.leaf);
  handler_app.executable = file;
  var handler = HandlerInfo.get( scheme );
  handler.preferredApplicationHandler = handler_app;
  handler_service.store( handler );
  return handler;
};

HandlerInfo.exists = function( scheme ){
  // this just returns a template if not found
  var handler = HandlerInfo.get( scheme );
  // this checks to see if handler of handler.type actually exists
  return handler_service.exists(handler);
};

HandlerInfo.default = function( scheme ){
  var handler = HandlerInfo.get( scheme );
  return (handler.hasDefaultHandler || handler.preferredApplicationHandler);
};

HandlerInfo.has_handlers = function( scheme ){
	var e = HandlerInfo.get( scheme ).possibleApplicationHandlers.enumerate();
	return e.hasMoreElements(); // this is true if we have at least 1
};

var ProtocolHandler = {};

ProtocolHandler.exists = function( scheme ){
  return protocol_service.externalProtocolHandlerExists( scheme );
};

ProtocolHandler.launch = function( uri ){
  uri = get_uri( uri );
  if(!uri) return false; // bad uri
  var handler = HandlerInfo.get( uri.scheme ); // this bootsraps it too
  if(!ProtocolHandler.exists( uri.scheme )){ // if os default then will be true
    if( ! HandlerInfo.default( uri.scheme )) // check for user default
      throw("No OS/User default handler for scheme: "+handler.type);
  }
  return handler.launchWithURI( uri ); // launch it 
};

