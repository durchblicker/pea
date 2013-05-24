/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

var fs = require('fs');
var Do = require('./do.js');

var files = [__dirname + '/do.js', __dirname + '/package.json', __dirname + '/Readme.md'];

function run(file) {
  var callback = arguments[arguments.length - 1];
  setTimeout(function() {
    //console.error(Date.now() + ' ' + file);
    fs.readFile(file, 'utf-8', callback);
  }, 1000);
}

Do.each(files, run).then(function(err, args) {
  console.error('== Do.each ====================================================');
  console.error(err, args.map(function(arg) {
    return arg ? arg.length : -1;
  }));
  console.error('===============================================================');
}).then(function() {
  Do.map(files, run).then(function(err, args) {
    console.error('== Do.map =====================================================');
    console.error(err, args.map(function(arg) {
      return arg ? arg.length : -1;
    }));
    console.error('===============================================================');
    Do.all.apply(Do, files.map(function(file) {
      return Do(run, file);
    })).then(function(err) {
      console.error('== Do.all =====================================================');
      console.error.apply(console, [err].concat(Array.prototype.slice.call(arguments, 1).map(function(arg) {
        return arg.length;
      })));
      console.error('===============================================================');
      Do.first(['none', 'none', ].concat(files), run).then(function(err) {
        var args = Array.prototype.slice.call(arguments, 1);
        console.error('== Do.first ===================================================');
        console.error(err, args.map(function(arg) {
          return arg ? arg.length : -1;
        }));
        console.error('===============================================================');
      });
    });
  });
});
