CSS Presenter
=====

Enjoy CSS Presenter!

Hosted version:
http://achicu.github.com/css-presentation

Running
-----

### Build

CSS Presenter uses [Grunt.js](http://gruntjs.com/) to concatenate and minify JavaScript & CSS resources. [Grunt.js](http://gruntjs.com/) is build on nodejs, so if you don't have it already installed, go to [node.js website](http://nodejs.org/) and follow the instructions to install it. After that use the command line node package manager to install grunt.js:

<pre>
$ sudo npm install -g grunt
</pre>

The grunt.js project file uses other node.js modules. To quicly install all the required libraries run "npm install" in the project folder.

<pre>
cd ./path/to/css/presenter/
$ npm install
</pre>

You also need to make sure you have Ruby & Sass installed.  If you're on OS X or Linux you probably already have them installed.  Try <code>ruby -v</code> in your terminal.  When you've confirmed you have Ruby installed, run <code>sudo gem install sass</code> to get Sass.

To build CSS Presenter, you need to run the "grunt" command line tool in the project folder. This will generate the "dist/" folder.

<pre>
cd ./path/to/css/presenter/
$ grunt
</pre>

Open /path/to/css/presenter/dist/index.html in your browswer.

Legal
----

Notices, terms and conditions pertaining to third party software are located at [http://www.adobe.com/go/thirdparty/](http://www.adobe.com/go/thirdparty/) and incorporated by reference herein.

### jQuery

Copyright 2012 jQuery Foundation and other contributors [http://jquery.com/](http://jquery.com/)

[MIT license](https://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt)
