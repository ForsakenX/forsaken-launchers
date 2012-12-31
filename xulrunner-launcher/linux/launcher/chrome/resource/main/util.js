
var EXPORTED_SYMBOLS = [ "Util" ];

const Cc = Components.classes;
const Cu = Components.utils;
const Ci = Components.interfaces;

var Util = {};

//
// ClipBoard
//

Util.ClipBoard = {};

Util.ClipBoard.service =
    Cc["@mozilla.org/widget/clipboardhelper;1"]
    .getService(Ci.nsIClipboardHelper);

Util.ClipBoard.set = function( str ){
  Util.ClipBoard.service.copyString( str );
};

//
// Rand
// 	Returns a random integer between min and max
// 	Using Math.round() will give you a non-uniform distribution!

Util.rand = function( min, max ){
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

//  
// converts a string to a hexidecimal hash
//

Util.string_to_hex = function( str ){
  var converter =
    Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  // we use UTF-8 here, you can choose other encodings.
  converter.charset = "UTF-8";
  // result is an out parameter,
  // result.value will contain the array length
  var result = {};
  // data is an array of bytes
  var data = converter.convertToByteArray(str, result);
  var ch = Components.classes["@mozilla.org/security/hash;1"]
                     .createInstance(Components.interfaces.nsICryptoHash);
  ch.init(ch.MD5);
  ch.update(data, data.length);
  var hash = ch.finish(false);
  // return the two-digit hexadecimal code for a byte
  function toHexString(charCode)
  {
    return ("0" + charCode.toString(16)).slice(-2);
  }
  // convert the binary hash data to a hex string.
  var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
  // s now contains your hash in hex: should be
  // 5eb63bbbe01eeed093cb22bb8f5acdc3
  return s;
};


