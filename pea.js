/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Pea;

var next = (function() {
  try {
    if('function' === typeof global.setImmediate) return global.setImmediate;
  } catch(e1) {}
  try {
    if('function' === typeof process.nextTick) return process.nextTick;
  } catch(e2) {}
  return function next(fn) {
    setTimeout(fn, 0);
  };
}());

function Pea(fn) {
  var it = {};
  var cbs = [];
  it.then = then.bind(it, cbs);
  it.fail = it.failure = failure;
  it.done = it.success = success;
  var args = Array.prototype.slice.call(arguments, 1).concat([done.bind(it, cbs)]);
  Object.defineProperty(it, 'run', {
    value: run.bind(it, fn, args),
    configurable: false,
    writable: false,
    enumerable: false
  });
  Object.defineProperty(it, 'pause', {
    value: pause.bind(it, fn, args),
    configurable: false,
    writable: false,
    enumerable: false
  });
  Object.defineProperty(it, 'resume', {
    value: resume.bind(it, fn, args),
    configurable: false,
    writable: false,
    enumerable: false
  });
  Object.defineProperty(it, 'running', {
    value: false,
    configurable: true,
    writable: false,
    enumerable: false
  });
  Object.defineProperty(it, 'paused', {
    value: false,
    configurable: true,
    writable: false,
    enumerable: false
  });
  Object.defineProperty(it, 'complete', {
    value: false,
    configurable: true,
    writable: false,
    enumerable: false
  });
  next(it.run);
  return it;
}

function run(fn, args) {
  if(this.running || this.complete || this.paused) return this;
  Object.defineProperty(this, 'running', {
    value: true,
    configurable: true,
    writable: false,
    enumerable: false
  });
  fn.apply(null, args);
  return this;
}

function pause(fn, args) {
  if(this.running || this.complete) return this;
  Object.defineProperty(this, 'paused', {
    value: true,
    configurable: true,
    writable: false,
    enumerable: false
  });
  return this;
}

function resume(fn, args) {
  if(this.running || this.complete) return this;
  if(!this.paused) return this;
  Object.defineProperty(this, 'paused', {
    value: false,
    configurable: true,
    writable: false,
    enumerable: false
  });
  next(this.run);
  return this;
}

function then(cbs, cb) {
  cbs.push(cb);
  return this;
}

function failure(cb) {
  return this.then(function(err) {
    if(!err) return;
    cb(err);
  });
}

function success(cb) {
  return this.then(function(err) {
    if(err) return;
    cb.apply(this, Array.prototype.slice.call(arguments, 1));
  });
}

function done(cbs) {
  if(this.complete) return this;
  Object.defineProperty(this, 'complete', {
    value: true,
    configurable: false,
    writable: false,
    enumerable: false
  });
  Object.defineProperty(this, 'running', {
    value: false,
    configurable: true,
    writable: false,
    enumerable: false
  });
  var then = this.then = after.bind(this, Array.prototype.slice.call(arguments, 1));
  cbs.forEach(function(cb) {
    then(cb);
  });
  return this;
}

function after(args, cb) {
  cb.apply(this, args);
  return this;
}

Pea.paused = function paused(fn) {
  return Array.isArray(fn) ? fn.map(function(fn) {
    return Pea.apply(null, arguments).pause();
  }) : Pea.apply(null, arguments).pause();
};

Pea.parallel = function parallel(fns) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Pea(function(callback) {
    var errs = {};
    var vals = {};
    fns.forEach(function(fn, idx) {
      Pea.apply(Pea, [fn].concat(args)).then(function(err) {
        errs[idx] = err;
        vals[idx] = Array.prototype.slice.call(arguments, 1);

        if(Object.keys(vals).length === fns.length) {
          errs = Object.keys(errs).map(function(key) {
            return errs[key];
          });
          errs = errs.filter(function(err) {
            return !!err;
          }).length ? errs : null;
          callback(errs,
          Object.keys(vals).map(function(key) {
            return vals[key];
          }).map(function(val) {
            return Array.isArray(val) && val.length > 1 ? val : val[0];
          }));
        }
      });
    });
  });
};

Pea.serial = function serial(fns) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Pea(function(callback) {
    var results = [];
    var items = fns.map(function(fn, idx) {
      return Pea.paused.apply(Pea, [fn].concat(args)).failure(callback).success(function() {
        results.push(Array.prototype.slice.call(arguments, 0));
        if(items[idx + 1]) {
          items[idx + 1].resume();
        } else {
          callback(null, results.map(function(res) {
            return Array.isArray(res) && res.length > 2 ? res : res[0];
          }));
        }
      });
    });
    items[0].resume();
  });
};

Pea.until = function until(fns) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Pea(function(callback) {
    var items = fns.map(function(fn, idx) {
      return Pea.paused.apply(Pea, [fn].concat(args)).success(function() {
        callback.apply(null, [null].concat(Array.prototype.slice.call(arguments, 0)));
      }).failure(function(err) {
        if(items[idx + 1]) {
          items[idx + 1].resume();
        } else {
          callback(err);
        }
      });
    });
    items[0].resume();
  });
};

Pea.series = function series(fns) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Pea(function(callback) {
    var fn = fns.slice(0, 1).concat(args);
    fns = fns.slice(1);
    Pea.apply(null, fn).failure(callback).success(function() {
      var args = Array.prototype.slice.call(arguments);
      if(!fns.length) return callback.apply(null, args);
      Pea.series.apply(Pea, [fns].concat(args)).then(callback);
    });
  });
};

Pea.forcedSeries = function forcedseries(fns) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Pea(function(callback) {
    var fn = fns.slice(0, 1).concat(args);
    fns = fns.slice(1);
    Pea.apply(null, fn).then(function() {
      var args = Array.prototype.slice.call(arguments);
      if(!fns.length) return callback.apply(null, args);
      Pea.forcedSeries.apply(Pea, [fns].concat(args)).then(callback);
    });
  });
};

Pea.forcedSerial = function forcedSerial(fns) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Pea(function(callback) {
    var fn = fns.slice(0, 1).concat(args);
    fns = fns.slice(1);
    Pea.apply(null, fn).then(function(err, val) {
      err = [err || null];
      val = [val || null];
      if(!fns.length) {
        return callback(err.filter(function(e) {
          return !!e;
        }).length ? err : null, val);
      }
      Pea.forcedSerial.apply(Pea, [fns].concat(args)).then(function(errs, vals) {
        err = err.concat(errs || [null]);
        val = val.concat(vals || [null]);
        callback(err, val);
      });
    });
  });
};

Pea.map = function map(items, fn) {
  items = items.map(function(item, idx, items) {
    return fn.bind(null, item, idx, items);
  });
  return Pea.parallel(items);
};

Pea.each = function each(items, fn) {
  items = items.map(function(item, idx, items) {
    return fn.bind(null, item, idx, items);
  });
  return Pea.serial(items);
};

Pea.eachForced = function(items, fn) {
  var args = Array.prototype.slice.call(arguments, 2);
  return Pea.forcedSerial(items.map(function(item, idx, items) {
    return fn.bind.apply(fn, [null, item, idx, items].concat(args));
  }));
};

Pea.first = function first(items, fn) {
  items = items.map(function(item, idx, items) {
    return fn.bind(null, item, idx, items);
  });
  return Pea.until(items);
};

Pea.all = function all() {
  var dos = Array.prototype.slice.call(arguments, 0).map(function(dop) {
    return('function' === typeof dop) ? dop : function(callback) {
      dop.then(callback);
    };
  });
  return Pea(function(callback) {
    Pea.parallel(dos).then(function(errs, vals) {
      var err = (errs || []).filter(function(err) {
        return !!err;
      }).shift();
      if(err) return callback(err, errs);
      callback.apply(null, [null].concat(vals.map(function(val) {
        return val.length < 2 ? val.shift() : val;
      })));
    });
  });
};
