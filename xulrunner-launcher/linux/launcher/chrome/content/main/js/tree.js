
/*
 * Tree Listener
 */

// Observers for builder's
var tree_listener = {
  // first visible row
  row: null,
  // about to rebuild
  willRebuild : function(builder) {
    var tree = builder.root;
    var treebox = tree.treeBoxObject;
    // remember scroll position
    this.row = treebox.getFirstVisibleRow();
  },
  // finished rebuilding
  didRebuild : function(builder) {
    var tree = builder.root;
    var treebox = tree.treeBoxObject;
    // restore scroll position
    if(this.row != null)
      treebox.scrollToRow( this.row );
  }
};

// bind listeners
var setup_tree_listeners = function(){
  // tree listeners
  $.each($('tree[datasources]'), function(){
    this.builder.addListener( tree_listener );
  });
};

