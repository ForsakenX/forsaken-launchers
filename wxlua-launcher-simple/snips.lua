
		--[[
	local path = wx.wxTextCtrl(
		parent, wx.wxID_ANY, "", wx.wxDefaultPosition, wx.wxDefaultSize, wx.wxTE_PROCESS_ENTER )

 	local button = wx.wxButton( parent, wx.wxID_HIGHEST+1, "Browse" )

	frame:Connect(wx.wxID_HIGHEST+1, wx.wxEVT_COMMAND_BUTTON_CLICKED,
		function (event) 
			dialog = wx.wxFileDialog( parent, "Select a ProjectX EXE", "", "", "*.exe" )
			dialog:Layout()
			dialog:Show(true)
		end)
		--]]

