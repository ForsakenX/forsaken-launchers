

EXPORTED_SYMBOLS = ["ChatScroll"];


// checks to see if the scrollbar is at the bottom
var is_scrollbar_at_bottom = function( target ){
  var box = target.boxObject.QueryInterface(Ci.nsIScrollBoxObject);
  var x = {}, y = {};
  try{
    box.getScrolledSize(x,y);
  }catch(e){}
  var max = y.value;
  var height = box.height;
  try{
    box.getPosition(x,y);
  }catch(e){
    return 0;
  }
  pos = y.value;
  var result = (max - pos - height);
  var bottom = (result <= 0); // at bottom (idealy == 0)
  //dump('--- '+id+', result: '+result+', max: '+max+', pos: '+pos+', height: '+height+'\n');
  if(result<15) // threshold
    return true;
  return bottom;
};

// scrolls a scroller to the bottom
var scroll_to_bottom = function( target ){
  var box = target.boxObject.QueryInterface(Ci.nsIScrollBoxObject);
  var x = {}, y = {};
  try{
    box.getScrolledSize(x,y);
  }catch(e){
    return;
  }
  var max = y.value;
  box.scrollTo( 0, max*100 );
  //dump(target+ ' scroll to: '+max+'\n');
};

// scroll to bottom helper
var do_scroll = function( scroller ){
    var z = 0;
    var scroll = function(){
      z+=1;
      //dump('z: '+z+'\n')
      setTimeout(function(){
        if(is_scrollbar_at_bottom( scroller ))return;  
        if(z > 15) return; // just in case
        scroll_to_bottom( scroller );
        scroll();        
      },100);
    }
    scroll();
}
