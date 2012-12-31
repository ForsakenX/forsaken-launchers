
/*
 TODO

  navigation type methods for siblings children etc...

  support for uri

*/


/*
 * File class
 */

var File = function( path ){ this.construct( path ): };

File.umode = 0755;
File.type  = Components.interfaces.nsIFile.NORMAL_FILE_TYPE;
File.filePickerTitle = "Select Item"
File.filePickerMode = Components.interfaces.nsIFilePicker.modeOpen;

// get a special directory
// available names at following urls
// http://mxr.mozilla.org/mozilla/source/xpcom/io/nsAppDirectoryServiceDefs.h
// http://mxr.mozilla.org/mozilla/source/xpcom/io/nsDirectoryServiceDefs.h
// if string starts with a ":" then following extra names are supported
// :ExtensionD
File.getDir( dir ){

  // default directories
  if(dir[0] != ":"){
    return Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get( dir, Components.interfaces.nsIFile );

  // extra directories
  dir = dir.slice(1); // remove /^:/
  
  // extension directory
  var type = "ExtensionD:";
  var regex = "/^"+type+"/";
  if( dir.search( type ) != -1 ){
    var extension_id = dir.replace(type,'');
    var ExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"].
                           getService(Components.interfaces.nsIExtensionManager);
    // the path may use forward slash ("/") as the delimiter
    var nsIInstallLocation = ExtensionManager.getInstallLocation( extension_id );
    return nsIInstallLocation.location; // nsIFile pointing to extension folder
  }

  throw("Unknown directory passed to File.getDir()");
};

// show file picker to user
File.filePicker = function( title, mode, _window ){
  var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                  .createInstance(Components.interfaces.nsIFilePicker);
  filePicker.init(
             _window || window,
             title || File.filePickerTitle,
             mode || File.filePickerMode
  );
  var rv = filePicker.show();
  if(rv == Components.interfaces.nsIFilePicker.returnCancel)
    return false;
  return new File(filePicker.file);
};

/*
 * Constructor
 */

// need to finish supporting other types
// list: nsIFileURI
// can we support loading a file:// uri or do we need another constructor?
File.prototype.construct = function( type ){
  // wrap an existing nsIFile
  if( type instanceof nsIFile){
    this.nsIFile = type;
    return;
  }
  // let user pick type
  if( type instanceof Boolean && type ){
    this.filePicker();
    return;
  }
  // default instance
  this.nsIFile = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
  // type passed in by path string
  if( type instanceof String && type ){
    this.init( path );
    return;
  }
};

/*
 * Actions (always return 'this')
 */

File.prototype.append = function( path, native ){
  var parts = path.split(/\\\//); // either \ or / separators
  parts.foreach(function( part ){
    if(native) this.nsIFile.appendNative( part );
    else this.nsIFile.append( part );
  },this);
  return this;
};

File.prototype.create = function( mode, unique ){
  if( unique ) this.nsIFile.createUnique( File.type, mode || File.umode );
  else if ( ! this.exists() ) this.nsIFile.create( File.type, mode || File.umode );
  return this;
};

File.prototype.init = function( path ){
  this.nsIFile.initWithPath( path );
  return this;
};

// note
// these next two should be rewritten to accept nice string mode's
// for list of modes look in these urls
// http://mxr.mozilla.org/mozilla/source/nsprpub/pr/include/prio.h
// http://developer.mozilla.org/en/docs/Code_snippets:File_I/O

File.prototype.write = function( data, mode ){
  if(!this.exists())this.create();
  // file is nsIFile, data is a string
  var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                 .createInstance(Components.interfaces.nsIFileOutputStream);
  // default mode:  write | create | truncate
  mode = mode || 0x02 | 0x08 | 0x20
  foStream.init(file, mode, 0666, 0); 
  // In a c file operation, we have no need to set file mode with or operation,
  // directly using "r" or "w" usually.
  foStream.write(data, data.length);
  foStream.close();
  return this;
};

// append data to the file
File.prototype.append = function( data ){
  // mode: write | append
  var mode = 0x02 | 0x10;
  this.write( data, mode );
  return this;
};

// copy a file
// if dir is nul then uses current dir
// if file is nul then moves to dir
// if both are null well then what do you think happens ?
// dereference will call copyToFollowingLinks
File.prototype.copy = File.prototype.copyTo;
File.prototype.copyTo = function( name, dir, dereference, native ){
  if(this.isSymlink()&&dereference)
    return this.copyToFollowingLinks( name, dir, native );
  if(native) this.nsIFile.copyToNative( dir, name );
  else this.nsIFile.copyTo( dir, name );
  return this;
};

// copy the file a symlink points to not the symlink
// you can also just pass true for dereference above
File.prototype.copyToFollowingLinks = function( name, dir, native ){
  if(native) this.nsIFile.copyToNativeFollowingLinks( dir, name );
  else this.nsIFile.copyToFollowingLinks( dir, name );
  return this;
};

// move a file
File.prototype.move = File.prototype.moveTo;
File.prototype.moveTo = function( name, dir, native ){
  if(native) this.nsIFile.moveToNative( dir, name );
  else this.nsIFile.moveTo( dir, name );
  return this;
};

// renames a file
File.prototype.rename = function( name, native ){
  return this.moveTo( name, null, native );
};

// removes the file
File.prototype.remove = function(){
  this.nsIFile.remove();
  return this;
};

/*
 * Getters (return values)
 */

// These next two will still return a nice File handle but to new instances

// if it's special file == ! (file|directory|symlink)
File.prototype.clone = function(){ return new File( this.nsIFile.clone() ); };

// parent file object
File.prototype.parent = function(){ return new File( this.nsIFile.parent ); };

// os specific path
File.prototype.path = function( native ){
  return native ? this.nsIFile.nativePath : this.nsIFile.path ;
};

// dereferences links
File.prototype.target = function( native ){
  return native ? this.nsIFile.nativeTarget : this.nsIFile.target ;
};

// os cannocialized path (only in unix|mac)
// works out ../ /././ etc.. 
File.prototype.normalize = function(){ return this.nsIFile.normalize(); };

// if the file|dir exists
File.prototype.exists = function(){ return this.nsIFile.exists(); };

// if it's a directory
File.prototype.isDirectory = function(){ return this.nsIFile.isDirectory(); };

// if it's a file
File.prototype.isFile = function(){ return this.nsIFile.isFile(); };

// if it's writable
File.prototype.isWritable = function(){ return this.nsIFile.isWritable(); };

// if it's readable
File.prototype.isReadable = function(){ return this.nsIFile.isReadable(); };

// if it's executable
File.prototype.isExecutable = function(){ return this.nsIFile.isExecutable(); };

// if it's hidden
File.prototype.isHidden = function(){ return this.nsIFile.isHidden(); };

// if it's a symlink == symbolic, shortcut, alias
File.prototype.isSymlink = function(){ return this.nsIFile.isSymlink(); };

// size of the item
File.prototype.size = File.prototype.fileSize;
File.prototype.fileSize = function( dereference ){
  return dereference ? this.nsIFile.fileSize : this.nsIFile.fileSizeOfLink ;
};

// unix style permissions
File.prototype.permissions = function( dereference ){
  if(dereference) return this.nsIFile.permissions;
  else return this.nsIFile.permissionsOfLink;
};

// when the file was modified (unix epoch in ms)
File.prototype.modified = File.prototype.lastModifiedTime;
File.prototype.lastModifiedTime = function( dereference ){
  if(dereference) return this.lastModifiedTime;
  else return this.nsIFile.lastModifiedTimeOfLink;
};

// name of item
File.prototype.leafName = function( native ){
  if(native) return this.nsIFile.leafNameNative;
  else return this.nsIFile.leafName;
};

File.prototype.leaf = File.prototype.leafName;
File.prototype.name = File.prototype.leafName;

// if two file objects are equal
// accepts a nsIFile or anything that quakes like Object#nsIFile
File.prototype.equals = function( file ){
  if( file.nsIFile ) file = file.nsIFile;
  return this.nsIFile.equals( file );
};

// check to see if file is descent of folder
// accepts a nsIFile or anything that quakes like Object#nsIFile
File.prototype.has = File.prototype.contains;
File.prototype.contains = function( file, recurse ){
  if( file.nsIFile ) file = file.nsIFile;
  return this.nsIFile.contains( file, recurse );
};

// return a fileURI of this object
File.prototype.fileURI = function(){
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
  return ios.newFileURI(file);
};

// return the file uri as a string
File.prototype.uri = function(){ this.fileURI().spec; };

// return the unnatural entries
File.prototype.directoryEntries = function(){
  return this.nsIFile.directoryEntries;
};

// returns an array of nsIFile's in the directory
File.prototype.nsIEntries = function(){ 
  var natural = [];
  var weird = this.nsIFile.directoryEntries;
  while( weird.hasMoreElements() )
  {
    var entry = entries.getNext();
    entry.QueryInterface(Components.interfaces.nsIFile);
    natural.push( entry );
  }
  return natural;
};

// returns an array of File() entries :]
File.prototype.entries = function(){
  return this.nsIEntries.map(function( nsIFile ){
    return new File( nsIFile );
  },this);
};

// question:
// how does the following 3 functions deal with binary files?

// return the data as a string
// blocks!
File.prototype.read = function(){

  if(!this.isFile)throw("Called File#read on a directory!");

  var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
               .createInstance(Components.interfaces.nsIFileInputStream);
  var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                .createInstance(Components.interfaces.nsIScriptableInputStream);

  fstream.init(this.nsIFile, -1, 0, 0);
  sstream.init(fstream); 

  var data = "";

  var str = sstream.read(4096);
  while (str.length > 0) {
    data += str;
    str = sstream.read(4096);
  }

  sstream.close();
  fstream.close();

  return data;

};

// returns an array of lines in the file
// blocks!
File.prototype.lines = function(){ return this.readLines(); };
File.prototype.readLines = function(){
  
  if(!this.isFile())throw("Called readLines on a directory!");

  // open an input stream from file
  var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
               .createInstance(Components.interfaces.nsIFileInputStream);

  istream.init(this.nsIFile, 0x01, 0444, 0);
  istream.QueryInterface(Components.interfaces.nsILineInputStream);

  // read lines into array
  var line = {}, lines = [], hasmore;
  do {
    hasmore = istream.readLine(line);
    lines.push(line.value); 
  } while(hasmore);

  istream.close();

  return lines;

};

// load file asynchronously
// must pass in an object with callbacks
File.prototype.readAsync = function( options ){
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
  var fileURI = ios.newFileURI(this.nsIFile);
  var channel = ios.newChannelFromURI(fileURI);
  var observer = {
    onStreamComplete : function(aLoader, aContext, aStatus, aLength, aResult)
    {
      options.complete( aResult );
    }
  };
  var sl = Components.classes["@mozilla.org/network/stream-loader;1"]
           .createInstance(Components.interfaces.nsIStreamLoader);
  sl.init(channel, observer, null);
};





