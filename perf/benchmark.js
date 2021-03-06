'use strict';

var _ = require('lodash');
var Benchmark = require('benchmark');

module.exports = function(defaults) {
  return function benchmark(task, name, callback) {
    var count = task.count || defaults.count;
    var data = {};
    var setup = task.setup;
    if (setup) {
      setup.call(data, count);
    }
    var expect = data.expect;
    var result = {};

    var suite = new Benchmark.Suite();
    _.forEach(task.funcs, function(func, key) {
      if (_.isObject(expect)) {
        result[key] = [];
        suite.add(key, function() {
          result[key].push(func.call(data));
        });
      } else if (expect !== undefined) {
        result[key] = 0;
        suite.add(key, function() {
          if (expect !== func.call(data)) {
            result[key]++;
          }
        });
      } else {
        suite.add(key, function() {
          func.call(data);
        });
      }
    });
    suite
    // .on('cycle', function(event) {
    //   var mean = event.target.stats.mean * 1000;
    //   console.log(event.target + ', ' + (+mean.toPrecision(2)) + 'ms per run');
    // })
    .on('complete', function() {
      _.chain(this)
        .map(function(data) {
          return {
            name: data.name,
            mean: data.stats.mean
          };
        })
        .sortBy('mean')
        .forEach(function(data, index, array) {
          var name = data.name;
          var mean = data.mean * 1000;
          var diff = mean / (_.first(array).mean * 1000);
          var failed;
          if (_.isObject(expect)) {
            failed = _.reduce(result[name], function(count, result) {
              if (!_.isEqual(expect, result)) {
                return count + 1;
              }
            }, 0);
          } else if (expect !== undefined) {
            failed = result[name];
          }
          if (failed) {
            console.log('[' + (++index) + ']', '"' + name + '"', (mean.toPrecision(2)) + 'ms', '[Failed] ' + failed);
          } else {
            console.log('[' + (++index) + ']', '"' + name + '"', (mean.toPrecision(2)) + 'ms', '[' + diff.toPrecision(3) + ']');
          }
        })
        .value();
      callback();
    })
    .run();
  };
};
