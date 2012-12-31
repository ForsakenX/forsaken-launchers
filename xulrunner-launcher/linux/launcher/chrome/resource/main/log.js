
// message to the raw tab
var log = function( line, override ){
//if(!override)return;

  // make sure it's converted to line
  line = ''+line;

  // add spaces into long lines
  // so that content wraps in the scrollbox
  var line = line.replace(/[^ ]{30}/g,'$& ');

  // references
  var scroller = $('#raw-scroller')[0];
  var content = $('#raw-content')[0];

  // create element
  var description = document.createElement("description");
  var text = document.createTextNode(line);
  description.appendChild( text );
  $(description).addClass('line');
//  description.setAttribute('context','line-context');

  // get this first
  var at_bottom = ChatScroll.is_scrollbar_at_bottom( scroller );

  // add content
  content.appendChild( description );
 
  // scroll to bottom
  if(at_bottom)
    ChatScroll.do_scroll( scroller );

};


