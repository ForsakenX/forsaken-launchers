
EXPORTED_SYMBOLS = ["Zip"];

// class
var Zip = function( path ){ this.construct( path ); };

// nsIZipReader
Zip.prototype.instance = null;

// constructor
Zip.prototype.construct = function( file ){
  this.instance = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                  .createInstance(Components.interfaces.nsIZipReader);
  this.open( file );
};

/*
 * methods that return a value
 */

// test for entry
Zip.prototype.has = function( entry ){
  return this.instance.hasEntry( entry );
};

// test integrity
Zip.prototype.test = function( entry ){
  return this.instance.test( entry );
};

// get entry
Zip.prototype.get = function( entry ){
  return this.instance.getEntry( entry );
};

// get multiple entries
Zip.prototype.find = function( pattern ){
  return this.instance.findEntries( pattern );
};

// stream entry
Zip.prototype.stream = function( entry, spec ){
  if(spec) return this.instance.getInputStreamWithSpec( spec, entry );
  else return this.instance.getInputStream( entry );
};

// get the opened file
Zip.prototype.file = function(){
  return this.instance.file;
};

// is there an open file?
Zip.prototype.opened = function(){
  return !!this.instance.file;
};


/*
 * methods that return `this'
 */

// open a zip
Zip.prototype.open = function( file ){a
  if( this.instance.file ) this.close();
  if( file ) this.instance.open( file );
  return this;
};

// close the zip
Zip.prototype.close = function(){
  this.instance.close();
  return this;
};

// extract a file
Zip.prototype.extract = function( source, target ){
  this.instance.extract( source, target );
  return this;
};

// extract all contents to folder
/*
Zip.prototype.unzip = function( directory ){
  if(!directory){
    var zip       = this.instance.file.clone();
    var name      = zip.leafName.replace('.zip','');
    var parent    = zip.parent;
    var directory = parent.append( name );
    directory.createUnique();
  }
  if(!directory.exists())
    directory.create();
  // now what?
};
*/

