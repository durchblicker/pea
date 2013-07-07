/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

var Pea = require('./lib/pea.js');
var Soup = require('./lib/soup.js');
var Raw = require('./lib/raw.js');

module.exports = Pea;

Pea.map = Raw.map;
Pea.mapall = Raw.mapall;
Pea.each = Raw.each;
Pea.eachall = Raw.eachall;
Pea.any = Raw.any;
Pea.anyall = Raw.anyall;
Pea.first = Raw.first;
Pea.Soup = Soup;
