Mingler
=======

Mingler is an easy-to-use easy-to-install concatenation tool which
syntax is inspired by Sprockets and Juicer. Mingler doesn't try to
be anything else than what it is: A tool for concatenating (merging) and
minifying files. This makes it ideal to include in your project's build-tools,
Jakefile, etc. The package comes with a handy commandline tool which can be
used globally.

Installation
------------

Installation of Mingler is easy - It's an NPM package:
`npm install mingler -g`

Remember to install globally (the -g flag), else the commandline tool wont
be available to you.

Programmatical Usage
--------------------

Mingler was originally made for use in code, such as Jakefiles or custom build
systems. It builds on an internal event structure which gives complete control
over the concatenation of minification process.

```javascript
var mingler = require('mingler');

// The 'complete' callback, will be called when concatenation
// (and minification) is complete.
mingler.on('complete', function(concatenation) {
  console.log("Concatenation complete:", concatenation);
});

// The 'warning' callback will be called when a warning occures.
// This could for example be a missing file.
mingler.on('warning', function(warn) {
  console.warn(warn);
});

// When an error is thrown, the 'error' callback is called.
// It's important to handle this callback because the mingling doesn't
// automatically stop
mingler.on('error', function(error) {
  console.error(error);
});

// The 'concatenate' event is fired before a new file is concatenated.
// The argument 'feedback' has a property called filename, and a method
// called 'discard()'. The discard method will prevent the file from being
// merged into the 'master' file.
mingler.on('concatenate', function(feedback) {
  if(feedback.filename == 'something_ugly') {
    feedback.discard();
  } else {
    console.log("Wee concatenation of " + feedback.filename + " has begun");
  }
});

// index.js is for example a file which includes a lot of other files
// that is needed for the project.
mingler.mingle("index.js");
```

Issues
------

All issues with this package is encouraged to be reported as GitHub Issues
here in the repository. I'll try to fix the bug or implement the feature
suggestion as fast as possible.

