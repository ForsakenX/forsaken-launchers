
--[[ Questions

	1) Can I minimize to systray?

	2) Can I select an icon from an ico?

	3) Can I embed the ico data into a string var?

	4) How do I know how much data is read on a Read()
		or how do I simply read all data available?

	5) How do I create my own wxEvtHandler ?

	6) notebook:Connect( wx.wxEVT_COMMAND_NOTEBOOK_PAGE_CHANGED
		causes my pages to not show...

	7) Can I create a custom wxluafreeze with more libraries ?

--]]

--[[ Notes

wxPasswordEntryDialog

wxPathList,
wxStandardPaths
	search for forsaken folder ??
	/, c:/, c:/Program Files, $HOME, $HOME/Desktop, $HOME/.forsaken

wxHTTP()

int GetResponse() const
// wxInputStream *GetInputStream(const wxString& path) - see wxProtocol
void SetHeader(const wxString& header, const wxString& h_data)
wxString GetHeader(const wxString& header)

wxCollapsiblePane

wxWizard

wxTimer

wxJoystick

--]]

--[[ Load wxLua, does nothing if running from wxLua, wxLuaFreeze, wxLuaEdit ]]

package.cpath = package.cpath..
	";./?.dll;./?.so;../lib/?.so;"..
	"../lib/vc_dll/?.dll;../lib/bcc_dll/?.dll;"..
	"../lib/mingw_dll/?.dll;"

require("wx")

--[[ Helper Functions ]]

-- collects regex matches into a table
function matches( str, regex ) 
        local matches = {}
        for match in str:gmatch(regex) do
                table.insert( matches, match )
        end
        return matches
end

-- split on seperator
function split( str, separator ) -- separator is still regex
	return matches( str, "[^("..separator..")]+" )
end

-- shifts a table
function shift( t )
        return table.remove(t, 1)
end

-- helper function that acts like web page alert box
function alert( str )
	wx.wxMessageBox(
		""..str, "Alert",
		wx.wxOK + wx.wxCENTRE
	)
end

-- helper function that centers text horizontally and vertically
function centered_textbox( parent, str )
    
	local text = wx.wxStaticText( parent, wx.wxID_ANY, str,
		wx.wxDefaultPosition, wx.wxDefaultSize, wx.wxALIGN_CENTER
	) -- centers text horizontally *inside* of the textbox

	local hbox = wx.wxBoxSizer( wx.wxHORIZONTAL )
	local vbox2 = wx.wxBoxSizer( wx.wxVERTICAL )
	local vbox = wx.wxBoxSizer( wx.wxVERTICAL )

	vbox2:Add( text, 0, 0, 0 )
	hbox:Add( vbox2, 1, wx.wxALIGN_CENTER, 0 ) -- centers vertically
	vbox:Add( hbox, 1, wx.wxALIGN_CENTER, 0 ) -- centers horizontally

	return vbox, hbox, vbox2

end

-- this is a helper function for creating a new tab
-- reduces repeated typing and complexity to create a proper tab area

-- content_builder
--	function that return a top level wrapper around the page for the tab
-- 	parent panel is passed in and all objects should be associated with it

function create_notebook_page( frame, notebook, content_builder, name )

    -- create a panel for the tab
    local panel = wx.wxPanel( notebook, wx.wxID_ANY )

    -- create box
    local container = wx.wxBoxSizer( wx.wxVERTICAL )

    -- get the content
    local content = content_builder( frame, panel )

    -- organize it
    container:Add( content, 1, wx.wxGROW, 0 ) -- wx.wxEXPAND

    -- size it
    --panel:SetSizerAndFit( container )
    panel:SetSizer( container )
    container:SetSizeHints( panel )

    -- add the page
    notebook:AddPage( panel, name )

end


--[[ Main Functions ]]

function create_frame()
    return wx.wxFrame( wx.NULL, wx.wxID_ANY,
			"ProjectX Launcher",
                        wx.wxDefaultPosition,
			wx.wxSize(400, 210), -- width, height
                        wx.wxDEFAULT_FRAME_STYLE )
end

function show_frame( frame )

    -- fix the placement of elements
    frame:Layout()

    -- show the frame window
    frame:Show(true)

end

function create_menu_bar( frame )

	-- create the menu bar
	local menuBar = wx.wxMenuBar()
	frame:SetMenuBar(menuBar)

	-- return reference
	return menuBar

end

function create_file_menu( frame, menuBar )

    -- create the file menu
    local fileMenu = wx.wxMenu()
 
    -- create the exit menu entry
    fileMenu:Append(wx.wxID_EXIT, "E&xit", "Quit the program")
    
    -- connect the exit menu entry selection event
    frame:Connect(wx.wxID_EXIT, wx.wxEVT_COMMAND_MENU_SELECTED,
        function (event) frame:Close(true) end )

    -- add it 
    menuBar:Append(fileMenu, "&File")

end

function create_help_menu( frame, menuBar )

    -- create the help menu
    local helpMenu = wx.wxMenu()
    
    -- create the help menu entry
    helpMenu:Append( wx.wxID_ABOUT,
	"&About",
	"About the ProjectX Launcher Application")
    
    -- create the selection event for about menu entry
    frame:Connect(wx.wxID_ABOUT, wx.wxEVT_COMMAND_MENU_SELECTED,
        function (event)
            wx.wxMessageBox(
		'This is a helper application for launching ProjectX.\n'..
		'It is written in '..wxlua.wxLUA_VERSION_STRING..
                ' built with '..wx.wxVERSION_STRING,
                'About ProjectX Launcher',
                wx.wxOK + wx.wxICON_INFORMATION,
                frame
		)
        end )

    -- add it
    menuBar:Append(helpMenu, "&Help")

end

function create_menu( frame )

	local menuBar = create_menu_bar( frame )
	create_file_menu( frame, menuBar )
	create_help_menu( frame, menuBar )

end

function create_statusbar( frame )

    frame:CreateStatusBar(1)

    -- this is how you set the status from the frame reference
    frame:SetStatusText("Welcome to ProjectX Launcher")

end

function create_game_page( frame, parent )

--[[ 1st row ]]

    -- game list
    local game_list = wx.wxListBox( parent, wx.wxID_ANY )

    -- add a fake game
    game_list:Append( "Method's Game - IP: 68.35.224.33 - VERSION: 1.04.686" )

--[[ 2nd row ]]

    -- bottom horizontal box
    local hbox = wx.wxBoxSizer( wx.wxHORIZONTAL )

    -- add a text field for the ip
    local ip_box = wx.wxTextCtrl( parent, wx.wxID_ANY,
		"Type an IP address or select a game above.",
		wx.wxDefaultPosition, 
		wx.wxDefaultSize, 
		wx.wxTE_PROCESS_ENTER )

    -- add to horizontal
    hbox:Add( ip_box,  1, wx.wxEXPAND, 0 )

--[[ container ]]

    -- main vbox
    local container = wx.wxBoxSizer( wx.wxVERTICAL )

    -- add to container
    container:Add( game_list, 1, wx.wxEXPAND, 0 )
    container:Add( hbox, 0, wx.wxEXPAND, 0 )

    -- return it
    return container

end

function create_config_page( frame, parent )

	local vbox, hbox, vbox2 = centered_textbox( parent,
		"Here you will save and load various ProjectX options.\n"..
        	"Such as fullscreen, pilot, vsync, etc..\n"..
		"\n"..
		"For a (current) list of options:"
	)
    
    local address = "http://fly.thruhere.net/CLI.txt"
    local link = wx.wxHyperlinkCtrl( parent, wx.wxID_ANY, address, address )
    
    vbox2:Add( link, 0, wx.wxALIGN_CENTER+wx.wxBOTTOM, 0 )
    
    return vbox

end

function create_updates_page( frame, parent )

	return centered_textbox( parent,
		"Here you will be able to check for updates to ProjectX.\n"..
        	"This includes new versions and updates to the data folder.\n"
	)

end

function create_host_page( frame, parent )

	local vbox, hbox, vbox2 = centered_textbox( parent,
		"Here you will save and load various host options.\n"..
        	"Such as level, allowed pickups, max kills, etc...\n"..
		"\n"..
		"For a (current) list of options:"
	)
    
    local address = "http://fly.thruhere.net/CLI.txt"
    local link = wx.wxHyperlinkCtrl( parent, wx.wxID_ANY, address, address )
    
    vbox2:Add( link, 0, wx.wxALIGN_CENTER, 0 )
    
    return vbox

end

function create_welcome_page( frame, parent )

	local vbox, hbox, vbox2 = centered_textbox( parent,
		"\n"..
		"This is a preview of the new launcher.\n"..
	        "It comes as a single file with a small footprint.\n"..
		"\n"..
        	"It will act as an interface for various common tasks.\n"..
		"Including integrated chat window and systray applet.\n"..
		"Browse through the tabs for more information.\n"..
		"\n"..
		"If you have any suggestions please email:"
	)
    
    local email = "fskn.methods@gmail.com"
    local link = wx.wxHyperlinkCtrl( parent, wx.wxID_ANY, 
			email, 
			"mailto://"..email )
    
    vbox2:Add( link, 0, wx.wxALIGN_CENTER, 0 )
    
    return vbox

end

function create_main_area( frame )

--[[ create objects needed to be referenced ]]

    -- add a launch button
    local launch_button = wx.wxButton( frame, wx.wxID_ANY, "Launch" )
	-- launch_button:SetLabel( "new label" )

--[[ 1st row ]]

    -- create a notebook wrapper
    local wrapper = wx.wxBoxSizer( wx.wxVERTICAL )

    -- create tabbed area
    local notebook = wx.wxNotebook( frame, wx.wxID_ANY )

	-- list of launch_button names based on tab
	local launch_button_names = {
			Games   = "Join",
			Host    = "Host",
			Config  = "Test",
			Updates = "Launch",
			Welcome = "Launch"
		}

--[[ This fucks win32 from showing the page
	notebook:Connect( wx.wxEVT_COMMAND_NOTEBOOK_PAGE_CHANGED,
		function(event)
			-- event { 
			-- 	GetOldSelection() 
			-- 	GetSelection() 
			-- 	SetOldSelection(int page) 
			-- 	SetSelection(int page) 
			-- 	}
		local index = event:GetSelection()
		event:SetSelection( index )
		local tab = notebook:GetPageText( index )
		if (tab == "") then return end -- first time tabs are shown
		launch_button:SetLabel( launch_button_names[ tab ] )
		event:SetSelection( index )
		return true
	end)
--]]

    -- create tabs
    create_notebook_page( frame, notebook, create_welcome_page, "Welcome" )
    create_notebook_page( frame, notebook, create_game_page, "Games" )
    create_notebook_page( frame, notebook, create_host_page, "Host" )
    create_notebook_page( frame, notebook, create_updates_page, "Updates" )
    create_notebook_page( frame, notebook, create_config_page, "Config" )

    -- add notebook to the wrapper
    wrapper:Add( notebook, 1, wx.wxEXPAND, 0 )

    -- size wrapper to notebook
    wrapper:SetSizeHints(
		frame,
		notebook:GetBestSize():GetWidth(),
		notebook:GetBestSize():GetHeight())

--[[ 2nd row ]]

    -- bottom horizontal box
    local hbox = wx.wxBoxSizer( wx.wxHORIZONTAL )

    -- the version picker
    local version_picker = wx.wxFilePickerCtrl(
        frame,
        wx.wxID_ANY, 
        "", 
        "Select a ProjectX exe",
        "*.exe"
    )

    -- add to hbox
    hbox:Add( version_picker, 1, wx.wxEXPAND, 0 ) -- set expandable
    hbox:Add( launch_button,  0, wx.wxEXPAND, 0 )

--[[ container ]]

    -- create container
    local container = wx.wxBoxSizer( wx.wxVERTICAL )

    -- add children
    container:Add( wrapper, 1, wx.wxEXPAND, 0 )
    container:Add( hbox, 0, wx.wxEXPAND, 0 )

    -- set the sizer
    frame:SetSizerAndFit( container )


end

--[[ Init Routines ]]

function check_is_running( my_app )
	-- check if another process is running then quit
	local app_name = my_app:GetAppName()
	local checker = wx.wxSingleInstanceChecker( app_name )
	local lock_file = "."..app_name -- $HOME/.app_name
	checker:Create( lock_file ) 
	if ( checker:IsAnotherRunning() ) then
		-- stale lock file is deleted if detected anyway...
		alert( "pxLauncher is already running...\n"..
			"If not then delete: "..
			os.getenv('HOME').."/"..lock_file )
		os.exit()
		return false
	end
end

function create_taskbar()

	local taskbar = wx.wxTaskBarIcon()

	-- if SetIcon and no subsequent RemoveIcon()
	if ( taskbar:IsIconInstalled() ) then
		return
	end

	local path = "./ProjectX.ico"
	local icon = wx.wxIcon( path, wx.wxBITMAP_TYPE_ICO )

	taskbar:SetIcon( icon, "ProjectX" )
	--taskbar:RemoveIcon()

	icon:delete()

	if ( not taskbar:IsOk() ) then
		alert("Could not set taskbar icon!")
		return
	end

	local menu = wx.wxMenu("pxLauncher Menu")
	menu:Append( wx.wxID_ANY, "Dumy Button", "help", wx.wxITEM_NORMAL )

	-- this should really be EVT_TASKBAR_CLICK
	taskbar:Connect( wx.wxEVT_TASKBAR_RIGHT_DOWN, function(event)
		-- event { wxEventType evtType, wxTaskBarIcon *tbIcon }
		taskbar:PopupMenu(menu)
	end)

	return taskbar

end

function on_exit( frame, taskbar )
	frame:Connect(wx.wxEVT_CLOSE_WINDOW, function(event)
		event:Skip();
		if taskbar then
 			-- must delete() it for program to exit in MSW
			taskbar:delete()
		end
	end)
end

function create_main_window( my_app )

	check_is_running( my_app ) -- run once

	local taskbar = create_taskbar() -- the systray
	
	local frame = create_frame() -- the window
	
	create_menu( frame )
	
	create_statusbar( frame )
	
	create_main_area( frame )
	
	show_frame( frame ) -- show window

	on_exit( frame, taskbar ) -- cleanup stuff

end

-- EventMachine style interface to wxSockets
function connect( server, port, listener )
	-- this should be an actual event handler not a frame/window
	local event_handler = create_frame() --wx.wxFrame()
	local socket = wx.wxSocketClient()
	socket:SetFlags( wx.wxSOCKET_NOWAIT ) -- no blocking
	socket:SetEventHandler( event_handler, wx.wxEVT_SOCKET )
	socket:Notify( true ) -- notify of events
	socket:SetNotify( -- events to notify
		wx.wxSOCKET_INPUT_FLAG		+
		wx.wxSOCKET_OUTPUT_FLAG		+
		wx.wxSOCKET_CONNECTION_FLAG	+
		wx.wxSOCKET_LOST_FLAG)
	-- detect missing callbacks
	if ( not listener.unbind ) then
		listener.unbind = function( self )
			print('socket: lost connection')
		end
	end
	if ( not listener.post_init ) then
		listner.post_init = function( self )
			print('socket: got connection')
		end
	end
	-- implement users reconnect
	listener.reconnect = function()
		--socket:Reconnect()
	end
	-- implement users close connection
	listener.close_connection = function()
		socket:Close()
	end
	-- implement users line sender
	listener.send_line = function( line )
		print("irc <-- "..line)
		socket:Write( line.."\n" )
		if ( socket:Error() ) then
	 		print( "Socket Error:", socket:LastError() )
		end
	end
	local input_buffer = "" -- collect strings
	local receive_data = function( data )
		if ( data == "\n" ) then -- cycle buffer
			print("irc --> "..input_buffer)
			-- call users line receiver
			listener:receive_line( input_buffer )
			input_buffer = ""
		elseif ( data == "\r" ) then -- do nothing
		else
			input_buffer = input_buffer..data
		end
	end
	event_handler:Connect( wx.wxEVT_SOCKET, function( event )
		local eventType = event:GetSocketEvent()
		if ( eventType == wx.wxSOCKET_INPUT ) then
			--print("Socket Event: ", "Input", data)
			local data = socket:Read( 1 )
			receive_data( data )

		-- what is this ?
		elseif( eventType == wx.wxSOCKET_OUTPUT ) then
			print("Socket Event: ", "Output")

		elseif( eventType == wx.wxSOCKET_CONNECTION ) then
			print("Socket Event: ", "Connected")
			-- call user post initialization code
			listener:post_init()
		elseif( eventType == wx.wxSOCKET_LOST ) then
			print("Socket Event: ", "Lost")
			-- call user unbind code
			listener:unbind()
		else
			print("Socket eventType: Unknown = ", eventType)
		end
	end)
	local address = wx.wxIPV4address()
	address:Hostname( server )
	address:Service( port ) -- irc port
	socket:Connect( address, false ) -- address, wait
end

function irc_init()

	local connection = {
		nick = 'guest',
		pass = 'xxx',
		user = {'x', 'x', 'x', 'x'},
		channels = {'#6dof'}
	}

	function connection:post_init()
		self.send_line( "PASS "..self.pass )
--		self.send_line( ("USER %s %s %s :%s"):format(
--					unpack( self.user ))
		self.send_line( "NICK "..self.nick )
		self.send_line( "JOIN "..table.concat(self.channels,' ') )
	end

	function connection:unbind()
		self.reconnect() -- does this call post_init for us?
	end

	function connection:receive_line( line )
		local command, params = line:match("^([^ ]+) (.*)")
		if ( not command or not params ) then
			print('Error: could not parse command or params')
			return
		end
		--[[ simple commands ]]
		local simple = string.lower( command )
		if ( simple  == 'ping' ) then
			local token = table.concat( words, ' ' )
			self.send_line( 'PONG '..token )
			return
		end
		if ( simple == 'error' ) then
			self.close_connection()
			return
		end
		--[[ parse if it's from server or user ]]
		local from = simple:sub(2) -- remove leading colon
		local nick,hostname = nil,nil
		if ( string.find( from, '!' ) ) then -- from user
			nick,hostname = from:match( "([^!]+)!(.*)" )
		else
			hostname = from
		end
		if ( not hostname ) then
			print('Error: could not parse hostname')
			return
		end
		--[[ parse the new command ]]
		command, params = params:match("^([^ ]+) (.*)")
		if ( not command or not params ) then
			print('Error: could not parse 2nd command or params')
			return
		end
		--[[ server commands ]]
		if ( not nick ) then

			print("Got server message")

		--[[ user commands ]]
		else

			print("Got user message")

		end
	end

	connect( 'irc.freenode.net', 6667, connection )

end

function create_chat_window()
	irc_init()
end

function get_games()

	local http = wx.wxHTTP()
	local server = "fly.thruhere.net"
	local path = "/status/games.xml"
	local address = wx.wxIPV4address()
	address:Hostname( server )
	address:Service( 80 ) -- irc port
	http:Connect( address )
	http:GetInputStream( path )
	local output = http:Read(100)
	while ( http:LastCount() > 0 ) do
		output = output..http:Read(100)
	end
	print( output )

end

function main()
	local my_app = wx.wxGetApp()
	--get_games()
	create_main_window( my_app )
	--create_chat_window()
end

main()

-- Call wx.wxGetApp():MainLoop() last to start the wxWidgets event loop,
-- otherwise the wxLua program will exit immediately.
-- Does nothing if running from wxLua, wxLuaFreeze, or wxLuaEdit since the
-- MainLoop is already running or will be started by the C++ program.
wx.wxGetApp():MainLoop()

