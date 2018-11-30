<p align="center">
	<img src='assets/img/logo-full.png' />
	<br>
	<small>v2.0.228</small>
	<br><br>
	<h1>:point_right:<a href='https://pamblam.github.io/Go-Life/'>Click here to play</a>:point_left:</h1>
</p>

A complete implementation of Conway's Game of life (and derivative cellular automata) in the form of a JS library, web app, and console app.

I had fun building this for the last week or so. I don't know if I'll ever touch this again, but there's still a lot that could be improved upon. I've listed some potential *to-do* items for possible future version in the change log. If anyone is interested in contributing, be my guest.

Version 1 is still available in the `Version 1` branch, if you're interested.

## JS Library

I don't expect anyone is going to use this as a library, since it already comes with 2 working interfaces, but it's available to use if you so desire.

#### Installation

    npm install go-life

#### Usage

GoL.js or GoL.min.js contain all the classes you need.

Create a renderer that extends the `GoLRenderer` class, or use the existing canvas renderer (`GoLCanvasRenderer`) or SVG renderer (`GoLSVGRenderer`), or even the `GoLTerminalRenderer` if you want to build a CLI. The renderers have a few otions, which you can check out in the parent class constructos, and all but the terminal renderer require an element (eg `<canvas>` or `<svg>` to render on.

Create an instance of the game with `new GoL(renderer, options)`. See the constructor for available options.

If you want to use the built-in mouse control APIs, you can create a new instance of `GoLMouse` and pass the instance of the game to it.

Finally if you want to read and write RLE pattern files you will want to look at the `GoLRLE` class.

For examples, refer to the javascript for the included UI, `assets/js/index.js`. 

## Web App

<p align="center">
	<img src='assets/img/browser-demo.gif' />
</p>

You can play online without downloading anything [right here](https://pamblam.github.io/Go-Life/).

Everything you need to know about how it works is explained in detail in the help section, so if you need help, click the help button or press `CTRL + H`.

## Console App

<p align="center">
	<img src='assets/img/console-demo.gif' />
</p>

The CLI only runs existing RLE files. You can provide a full file name to your own pattern files or you can use the name of a pattern file in the pattern library.

You can scroll through the pattern library with `./go-life ls`. 

You can then get info about any pattern file, including your own files, with `./go-life info filename.rle`

To run the pattern file in the CLI, simply `./go-life filename.rle`. See below for other options.

 - **Run an RLE file** `./go-life file [color [color [speed [runtime]]]]`
 - **Get info about an RLE file:** `./go-life info file`
 - **List RLE files in the pattern library:** `./go-life ls`

## Change Log

 - [ChangeLog](CHANGELOG.md)

## Credit

Pattern file source: [conwaylife.com](http://www.conwaylife.com/). Thanks a bunch.

## License

   Copyright 2018 Rob Parham

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.