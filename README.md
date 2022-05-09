# PropC Online [![Deploy](https://github.com/DvvCz/PropC-Online/actions/workflows/deploy.yml/badge.svg)](https://github.com/DvvCz/PropC-Online/actions) [![License](https://img.shields.io/github/license/DvvCz/PropC-Online?color=red)](https://opensource.org/licenses/MIT)
Program in C/C++ with [Propeller C](https://www.parallax.com/education/programming-languages/propeller-c) for Parallax Activity Boards.
This is an alternative to the solo editor and essentially [SimpleIDE](https://learn.parallax.com/tutorials/language/propeller-c/propeller-c-set-simpleide) in your browser.

Uses [monaco](https://github.com/microsoft/monaco-editor) for the editor, [BlocklyPropLauncher](https://github.com/parallaxinc/BlocklyPropLauncher) to communicate with your processor, and [Cloud-Compiler](https://github.com/parallaxinc/Cloud-Compiler) (hosted on [solo](https://solo.parallax.com/)) to compile the PropC code.

### 👉 [Try Me](https://dvvcz.github.io/PropC-Online) 👈

## Features
* Diagnostics in your IDE (warnings/editors) 📈
* Sleek monaco editor
* Autocomplete from Parallax Standard Libraries
* Autosave your sessions (Configs at the top, alongside your code in every file)
* Have multiple files in your IDE to keep stuff organized.
* Editor themes (dark and light)
* Automatic compilation as you type

## Previews
### Multiple files
![multifiles](assets/multifiles.gif)

### Console / Overview
![console](assets/overview.gif)

## Why?

I created this project in my freetime during high school for use in my Vex Robotics projects. This is because the website provided by parallax to program the robot uses [block programming](https://developers.google.com/blockly) which is clunky and very quickly causes freezes, especially on school laptops. Students can use this as an alternative assuming they have basic knowledge of C programming.

It is MIT licensed for learning and usage convenience.
