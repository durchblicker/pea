/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

var fs = require('fs');
var Pea = require('./pea.js');

var files = [__dirname + '/pea.js', __dirname + '/package.json', __dirname + '/Readme.md'];

function run(file) {
  var callback = arguments[arguments.length - 1];
  setTimeout(function() {
    //console.error(Date.now() + ' ' + file);
    fs.readFile(file, 'utf-8', callback);
  }, 1000);
}

Pea.each(files, run).then(function(err, args) {
  console.error('== Pea.each ====================================================');
  console.error(err, args.map(function(arg) {
    return arg ? arg.length : -1;
  }));
  console.error('===============================================================');
}).then(function() {
  Pea.map(files, run).then(function(err, args) {
    console.error('== Pea.map =====================================================');
    console.error(err, args.map(function(arg) {
      return arg ? arg.length : -1;
    }));
    console.error('===============================================================');
    Pea.all.apply(Pea, files.map(function(file) {
      return Pea(run, file);
    })).then(function(err) {
      console.error('== Pea.all =====================================================');
      console.error.apply(console, [err].concat(Array.prototype.slice.call(arguments, 1).map(function(arg) {
        return arg.length;
      })));
      console.error('===============================================================');
      Pea.first(['none', 'none', ].concat(files), run).then(function(err) {
        var args = Array.prototype.slice.call(arguments, 1);
        console.error('== Pea.first ===================================================');
        console.error(err, args.map(function(arg) {
          return arg ? arg.length : -1;
        }));
        console.error('===============================================================');
      });
    });
  });
});
