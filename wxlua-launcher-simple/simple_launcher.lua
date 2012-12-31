
package.cpath = package.cpath..
	";./?.dll;./?.so;../lib/?.so;"..
	"../lib/vc_dll/?.dll;../lib/bcc_dll/?.dll;"..
	"../lib/mingw_dll/?.dll;"

require("wx")

function alert( str )
	wx.wxMessageBox( ""..str, "Alert", wx.wxOK + wx.wxCENTRE)
end

function get(url)
	local ret = wx.wxURL(url)
	local stream = ret:GetInputStream()
	local size = stream:GetSize()
	local data = stream:Read(size)
	return data
end

function games()
	local list = {}
	--local data = get("http://fly.thruhere.net/status/games-testing.json")
	local data = get("http://fly.thruhere.net/status/games.json")
	data = "return " .. data
	local rv,f = pcall(loadstring, data)
	if not (rv and f) then return list end
	list = f()
	return list
end

function create_taskbar(my_app, frame, icon)

	local taskbar = wx.wxTaskBarIcon()

	if ( taskbar:IsIconInstalled() ) then
		return
	end

	taskbar:SetIcon( icon, "ProjectX" )
	--taskbar:RemoveIcon()

	if ( not taskbar:IsOk() ) then
		alert("Could not set taskbar icon!")
		return
	end

	local menu = wx.wxMenu("pxLauncher Menu")
	menu:Append( wx.wxID_HIGHEST+6, "Exit", "help", wx.wxITEM_NORMAL )

	-- close window systray menu option
	menu:Connect( wx.wxEVT_COMMAND_MENU_SELECTED, function(event)
		frame:Destroy()
		taskbar:delete()
	end)

	-- right click for menu
	taskbar:Connect( wx.wxEVT_TASKBAR_RIGHT_DOWN, function(event)
		taskbar:PopupMenu(menu)
	end)

	-- raise / lower window when left clicking on systray
	taskbar:Connect( wx.wxEVT_TASKBAR_LEFT_DOWN, function(event)
		frame:Iconize(not frame:IsIconized())
	end)

	-- remove window from taskbar on minimize
	frame:Connect( wx.wxEVT_ICONIZE, function(event)
		local show = not frame:IsIconized()
		frame:Show(show)
		if show then
			frame:Raise() -- bring to front
		end
	end)

	-- minimize on clicking close button
	frame:Connect( wx.wxEVT_CLOSE_WINDOW, function(event)
		frame:Iconize(true)
		return false
	end)
			
	-- wxEVT_TASKBAR_MOVE wxEVT_TASKBAR_LEFT_DCLICK wxEVT_TASKBAR_RIGHT_DCLICK

	return taskbar

end

function log(str)
	wx.wxLogVerbose(str)
end

function main()

	local my_app = wx.wxGetApp()

	--

	local app_name = my_app:GetAppName()
	local checker = wx.wxSingleInstanceChecker( app_name )
	local lock_file = "."..app_name
	checker:Create( lock_file ) 
	if ( checker:IsAnotherRunning() ) then
		alert( "Another instance is running...\n"..
			"If not then delete: "..
			os.getenv('HOME').."/"..lock_file )
		os.exit()
		return false
	end

	--

	local exe = wx.wxStandardPaths:Get():GetExecutablePath()
	local cwd = string.gsub(exe, '[^/\\]*.exe$', '')

	--

	local file = cwd.."launcher.config"
	local config = wx.wxFileConfig("launcher", "projectx", file)

	--

	local icon = wx.wxIcon(exe, wx.wxBITMAP_TYPE_ICO, 16, 16 ) -- TODO: make exe icon px icon

	local frame = wx.wxFrame( wx.NULL, wx.wxID_ANY, "ProjectX Launcher",
                        wx.wxDefaultPosition, wx.wxSize(350, 200), wx.wxDEFAULT_FRAME_STYLE )

	local taskbar = create_taskbar(my_app, frame, icon)

	frame:SetIcon( icon )

	local parent = wx.wxPanel(frame, wx.wxID_ANY)

	--
	
	wx.wxLog.SetVerbose(true)
	local log_window = wx.wxLogWindow( frame, "Log", true, false )

	--

	local bool, path = config:Read("exe_file_dir","")
	local bool, file = config:Read("exe_file_path","")
	local bool, args = config:Read("exe_args","")

	--

	local mainSizer = wx.wxBoxSizer(wx.wxVERTICAL)

	local flexGridSizer = wx.wxFlexGridSizer( 3, 2, 0, 0 )
	flexGridSizer:AddGrowableCol(1, 0)

	-- row 1

	local version_text = wx.wxStaticText(
		parent, wx.wxID_ANY, "Version", wx.wxDefaultPosition, wx.wxDefaultSize )

	local version_picker = wx.wxFilePickerCtrl( 
		parent, wx.wxID_ANY, "", "Select a ProjectX EXE", "*.exe")

	version_picker:SetPath(file)

	flexGridSizer:Add( version_text, 0, wx.wxALIGN_CENTER_VERTICAL+wx.wxALL, 5 )
	flexGridSizer:Add( version_picker, 0, wx.wxGROW+wx.wxALIGN_CENTER_VERTICAL+wx.wxALL, 5 )

	frame:Connect(wx.wxEVT_COMMAND_FILEPICKER_CHANGED,
		function (event)
			path = version_picker:GetPath()
			file = string.gsub(path, '.*[/\\]', '')
			version_picker:SetPath(file)

			config:Write("exe_file_dir",path)
			config:Write("exe_file_path",file)
			config:Flush()
		end)

	-- row 2

	local options_text = wx.wxStaticText(
		parent, wx.wxID_ANY, "Options", wx.wxDefaultPosition, wx.wxDefaultSize, wx.wxALIGN_RIGHT)

	local options = wx.wxTextCtrl(
		parent, wx.wxID_HIGHEST+2, "", wx.wxDefaultPosition, wx.wxDefaultSize, wx.wxTE_PROCESS_ENTER)

	options:SetValue(args)

	frame:Connect(wx.wxID_HIGHEST+2, wx.wxEVT_COMMAND_TEXT_UPDATED,
		function (event) 
			local args = options:GetValue()
			config:Write("exe_args",args)
			config:Flush()
		end)

	flexGridSizer:Add( options_text, 0, wx.wxALIGN_CENTER_VERTICAL+wx.wxALL, 5 )
	flexGridSizer:Add( options, 0, wx.wxGROW+wx.wxALIGN_CENTER_VERTICAL+wx.wxALL, 5 )
	
	function launch(opts)
		args = options:GetValue()
		local folder = string.gsub(path, "[^\\/]*$", '')
		local cmd = path.." "..args.." "..opts.." -chdir "..folder  -- TODO: remove -chdir
		wx.wxExecute( cmd, wx.wxEXEC_ASYNC )
	end

	-- row 3

	local games_label = wx.wxStaticText(
		parent, wx.wxID_ANY, "Games", wx.wxDefaultPosition, wx.wxDefaultSize, wx.wxALIGN_RIGHT)

	local games_box_default = "Type ip address to join or select from the list."
	local games_box = wx.wxComboBox( parent, wx.wxID_HIGHEST+5, games_box_default )

	-- need way to detect on selection event to set the default_value
	-- then when you want to change the field check if deafult_value has changed
	--
	-- or just detect if the user has typed
	--
	-- or just use a box with listed games and a separate field for ip

		function update_games(event) 
			log("=========================================================")
			log("Updating games")
			local length = games_box:GetCount()
			log("Current games listed: "..length)
			local list = games()
			log("Games downloaded: "..table.maxn(list))
			-- if no games then delete all and set default value
			if table.maxn(list) < 1 then
				log("No games so delete all and set default value")
				for x=0, length-1 do
					log("Deleting: "..x)
					games_box:Delete(x)
				end
				log("Setting default: "..x)
				games_box:SetValue(games_box_default)
				return
			end
			-- delete any old games
			log("Deleting old games")
			local deleted = 0
			for x=0, length-1 do
				x = x - deleted
				local found = -1
				local address = games_box:GetStringClientObject(x):GetData()
				for key, game in pairs(list) do
					if address == (game['ip']..":"..game['port']) then
						found = key
						break
					end
				end
				-- game does not exist anymore
				if found == -1 then
					log("Game doesn't exist anymore, deleting from the list")
					games_box:Delete(x)
					deleted = deleted + 1 
					if not modified then
						games_box:SetSelection(0)
					else
						games_box:SetValue(games_box_default)
					end
				else
					log("Game found removing from download list so we don't add it twice")
					table.remove(list,found) -- easy to now append rest of list later
				end
			end
			-- for each new game add if doesn't exist
			log("Adding new games that don't exist")
			for key, game in pairs(list) do
				log("Adding game...")
				local name = game['nick'].." "..game['version'].." "..game['started_at']
				local address = game['ip']..":"..game['port']
				local value = wx.wxStringClientData( address )
				games_box:Append( name, value )
			end
			-- if no selection then set first game
			log("No selection found setting first game selected")
			if games_box:GetSelection() == -1 then
				games_box:SetSelection(0)
			end
		end

	local game_timer = wx.wxTimer(frame, wx.wxID_HIGHEST+7)
	game_timer:Start(5000)

	frame:Connect(wx.wxID_HIGHEST+7, wx.wxEVT_TIMER, update_games)
	update_games() -- initial call on load

	flexGridSizer:Add( games_label, 0, wx.wxALIGN_CENTER_VERTICAL+wx.wxALL, 5 )
	flexGridSizer:Add( games_box, 0, wx.wxGROW+wx.wxALIGN_CENTER_VERTICAL+wx.wxALL, 5 )

	-- row 4

 	local join_button = wx.wxButton( parent, wx.wxID_HIGHEST+4, "Join" )

	frame:Connect(wx.wxID_HIGHEST+4, wx.wxEVT_COMMAND_BUTTON_CLICKED,
		function (event) 
			local opts = "-quickjoin"
			local address = ""
			local name = ""
			local selection = games_box:GetSelection()
			if selection == -1 then
				address = games_box:GetValue()
			else
				address = games_box:GetStringClientObject(selection):GetData()
			end
			if address ~= "" then
				opts = opts.." -tcp "..address
			end
			launch(opts)
		end)

 	local launch_button = wx.wxButton( parent, wx.wxID_HIGHEST+1, "Launch" )

	frame:Connect(wx.wxID_HIGHEST+1, wx.wxEVT_COMMAND_BUTTON_CLICKED,
		function (event) 
			launch("")
		end)

 	local host_button = wx.wxButton( parent, wx.wxID_HIGHEST+3, "Host" )

	frame:Connect(wx.wxID_HIGHEST+3, wx.wxEVT_COMMAND_BUTTON_CLICKED,
		function (event) 
			launch("-quickHost")
		end)

	local commands = wx.wxBoxSizer( wx.wxHORIZONTAL )
	commands:Add( launch_button, 1, wx.wxALL, 3 )
	commands:Add( host_button, 1, wx.wxALL, 3 )
	commands:Add( join_button, 1, wx.wxALL, 3 )
	
	--

	mainSizer:Add( flexGridSizer, 1, wx.wxGROW+wx.wxALIGN_CENTER+wx.wxALL, 2 )
	mainSizer:Add( commands, 0,  wx.wxALIGN_RIGHT+wx.wxALL, 0 )

	parent:SetSizer( mainSizer )
	mainSizer:SetSizeHints( frame )

	frame:Layout()
	frame:Show(true)

	frame:Connect(wx.wxEVT_CLOSE_WINDOW,
		function(event)
			event:Skip(); 
		end)
end

main()

wx.wxGetApp():MainLoop()

