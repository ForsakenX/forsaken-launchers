#!/bin/sh

# build linux

wxlua \
	./wxLua-linux/apps/wxluafreeze/src/wxluafreeze.lua \
	/usr/bin/wxluafreeze \
	pxLauncher.lua \
	pxLauncher

chmod +x pxLauncher

# build win32

wine \
	./wxLua-win32/bin/wxlua.exe \
	./wxLua-win32/bin/wxluafreeze.lua \
	./wxLua-win32/bin/wxluafreeze.exe \
	pxLauncher.lua \
	pxLauncher.exe

wine ./upx303w/upx.exe pxLauncher.exe
