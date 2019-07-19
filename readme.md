# Overview

Common atlas generator for [corona](https://ru.coronalabs.com/)

What is image sheet you can read [here](https://docs.coronalabs.com/api/library/graphics/newImageSheet.html)

# Dependencies

- [Image magic](https://imagemagick.org/index.php)

# Install
	
	npm install -g corona-image-sheet

# Hot to use

	corona-image-sheet < atlases.txt

where `atlases.txt` contents:

	out .
	
	atlas atlas.png
	config atlas.cfg
	size 1024 1024
	root C:\Projects\Game\images
	put .
	put ui

Now you see output like this

	DEBUG: >> out .
	DEBUG: >> atlas atlas.png
	DEBUG: >> config atlas.cfg
	DEBUG: >> size 1024 1024
	DEBUG: >> root C:\Projects\Game\images
	DEBUG: >> put .
	INFO: Find 25 files in <.>
	[##########################################################################] 100%
	DEBUG: >> put ui
	INFO: Find 13 files in <ui>
	[##########################################################################] 100%
	INFO: build atlas atlas.png

And now you see `atlas.png` and `atlas.cfg` in directory

# Commands

## out [output directory name]

Set ouptup directory

## atlas [output atlas name]

Start new atlas and set name

## config [output atlas config name]

Set atlas config name

## size [width] [height]

Set current atlas size

## root [rood directory]

Set current atlas root directory

## put [directory]

Append to atlas images (png and jpg) from `${root_directory}/{directory}`

# Features

You can declare few atlases in one file like this

	out atlases

	atlas characters.png
	config characters.cfg
	size 1024 1024
	root images
	put characters

	atlas inventory.png
	config inventory.cfg
	size 512 512
	root images
	put food
	put weapons
	put hats

# Futures

- 9 scales
- resize images
- package in to and more atlases
- more comfortable resource managment from corona