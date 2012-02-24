/*
 * Mingler - An easy to use source concatenation tool
 * Inspired by both Sprockets and Juicer
 */
var path  = require('path'),
    fs    = require('fs');

// Util functions
function notify(event) {
  var args = Array.prototype.slice.call(arguments).slice(1);
  mingler._listeners[event].forEach(function(listener) {
    listener.apply(null, args);
  });
}

function FeedbackObject(filename) {
  var isDiscarded = false;
  this.filename = filename;

  this.discard = function() {
    isDiscarded = true;
  };

  this.discarded = function() {
    return isDiscarded;
  };
}

var Concatenater = {
  concatenate: function(filename, branch, parent) {
    if(!path.existsSync(filename)) {
      notify('error', filename + ' doesn\'t exist!');
      return false;
    }

    var feed = new FeedbackObject(filename);
    notify('concatenate', feed);
    if(feed.discarded()) {
      return '';
    }

    var content = fs.readFileSync(filename, 'utf8');
    var match, file, files = {};

    // First run
    if(typeof branch == 'undefined') {
      this.branch = branch = {};
      this.original = content;
    }

    // Check for infinite loop
    if(this.inBranch(filename, parent, this.branch)) {
      notify('error', 'Infinite loop detected in ' + filename);
      return null;
    }

    branch[filename] = {};

    // Add main file, to "already concatenated files" list
    var includeRegex = this.includeRegex;
    includeRegex.lastIndex = 0;

    // Find each //=include <file> instance
    while((match = includeRegex.exec(content)) != null) {
      file = match[1];
      var line = this.getLineNumber(match.index, this.original);
      // If <file> is included from <file> then error
      if(file == filename) {
        notify('error', 'Recursive concatenation in ' + file 
                + ' at line: ' + line);
        return null;
      }

      // If the file doesn't exist, warn about it
      if(!path.existsSync(file)) {
        notify('warning', 'Couldn\'t find ' + file + ', requested in: '
                + filename + ' at line: ' + line);
        continue;
      }

      // Recursive concatenation
      var newfile = this.concatenate(file, branch[filename], filename);
      if(typeof newfile != 'string') {
        return;
      }

      var conc = content.substr(0, match.index);
      conc += newfile;

      // Dont search in the newly included file
      includeRegex.lastIndex = conc.length-1;
      content = conc + content.substr(match.index + match[0].length);
    }

    return content;
  },

  getLineNumber: function(index, content) {
    count = content.substr(0, index);
    count = count.split('\n');

    return count.length;
  },

  inBranch: function(needle, parent, branch, sparent) {
    var found = false;
    for(var i in branch) {
      if(branch.hasOwnProperty(i)) {
        if(i == needle && parent == sparent) {
          found = true;
          break;
        }

        found = this.inBranch(needle, parent, branch[i], i);
      }
    }

    return found;
  },

  includeRegex: /\/\/=include\s([\w\/\.]+)/g
};

var mingler = exports = module.exports = {};

// Mingler properties
mingler._listeners = {
  minify: [],
  concatenate: [],
  complete: [],
  error: [],
  warning: []
};

// Mingler#mingle - Concatenates a file and all its dependencies
mingler.mingle = function(file, callback) {
  process.chdir(path.dirname(file));
  file = path.basename(file);
  path.exists(file, function(exists) {
    if(!exists) {
      return notify('error', 'File ' + file + ' doesn\'t exist');
    }

    var content = Concatenater.concatenate(file);
    if(typeof callback == 'function') {
      callback(content);
    }

    notify('complete', content);
  });
}

// Mingler#on - Adds an event listener
mingler.on = function(event, listener) {
  if(event in mingler._listeners) {
    mingler._listeners[event].push(listener);
  }
}

// Mingler#un - Removes an event listener
mingler.un = function(event, listener) {
  if(!(event in mingler._listeners)) {
    return false;
  }

  var index = mingler._listeners[event].indexOf(listener);
  if(index != -1) {
    return mingler._listeners[event].splice(index, 1);
  }

  return false;
}
