(function() {
    "use strict";

    var initWeakMap = function(map) {
        map.index_ = map.index_ || 0;
        map.keys_ = map.keys_ || {};
        // map.values_ = map.values_ || {};
    };

    var oldSet = WeakMap.prototype.set;
    WeakMap.prototype.set = function(key, value) {
        initWeakMap(this);

        this.index_++;
        this.keys_[this.index_] = key;
        // this.values_[this.index_] = value;

        oldSet.apply(this, arguments);
    };

    var oldDelete = WeakMap.prototype.delete;
    WeakMap.prototype.delete = function(key) {
        var that = this;
        initWeakMap(this);

        Object.keys(this.keys_).forEach(function(k) {
            if (that.keys_[k] === key) {
                delete that.keys_[k];
                // delete that.values_[k];
            }
        });

        oldDelete.apply(this, arguments);
    };

    var oldClear = WeakMap.prototype.clear;
    WeakMap.prototype.clear = function(key) {
        var that = this;
        initWeakMap(this);

        this.keys_ = {};
        // this.values_ = {};

        oldDelete.apply(this, arguments);
    };

    WeakMap.prototype.forEach = function(callback, thisArg) {
        var that = this;

        Object.keys(this.keys_).forEach(function(k) {
            var key = that.keys_[k];

            if (!key) {
                return;
            }
            try {

                callback.call(thisArg || that, key, that.get(key), that);
            } catch(e) {
                console.log('c', thisArg || that);
                console.log('k', key);
                console.log('t', that);
                console.log('v', that.get(key));
                console.error('e', e);
                throw e;
            }
        });
    };

    WeakMap.prototype.size = function() {
        return Object.keys(this.keys_).length;
    };

    WeakMap.prototype.values = function() {
        var values = [];
        this.forEach(function(key, value) {
            values.push(value);
        });
        return values;
    };

    WeakMap.prototype.keys = function() {
        var keys = [];
        this.forEach(function(key, value) {
            keys.push(key);
        });
        return keys;
    };

})();