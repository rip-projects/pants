(function() {
    "use strict";

    if (Object.observe) return;

    function clone(obj) {
        if (null === obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }


    var oldContextMap = Object.oldContextMap_ = new WeakMap(),
        callbackContextMap = Object.callbackContextMap_ = new WeakMap();

    var TIMEOUT = 300;
    var schedule_;
    var startSchedule = Object.startSchedule_ = function() {
        if (!schedule_) {
            var scheduleFn = function () {
                // console.log('schedule', new Date());

                oldContextMap.forEach(function(oldContext, newContext) {
                    var changes = [];

                    var indices = {};
                    Object.keys(oldContext).forEach(function(index) {
                        indices[index] = index;
                    });
                    Object.keys(newContext).forEach(function(index) {
                        indices[index] = index;
                    });

                    Object.keys(indices).forEach(function(i) {
                        if (oldContext[i] !== newContext[i]) {
                            changes.push({
                                type: 'update',
                                name: i,
                                oldValue: oldContext[i]
                            });
                        }
                    });

                    if (changes.length) {
                        Object.getNotifier(oldContext).bulkNotify(changes);
                    }

                });
                schedule_ = setTimeout(scheduleFn, TIMEOUT);
            };

            scheduleFn();
        }
    };

    var stopSchedule = Object.stopSchedule_ = function() {
        clearInterval(schedule_);
        schedule_ = null;
    };



    Object.observe = function(context, callback) {
        if (!oldContextMap.has(context)) {
            var old = clone(context);
            oldContextMap.set(context, old);
        }

        var callbacks = [];
        if (callbackContextMap.has(context)) {
            callbacks = callbackContextMap.get(context);
        }

        callbacks.push(callback);
        callbackContextMap.set(context, callbacks);

        startSchedule();

    };

    Object.unobserve = function(context, callback) {
        if (callbackContextMap.has(context)) {
            var callbacks = callbackContextMap.get(context);
            var newCallbacks = [];
            for (var i in callbacks) {
                if (callback === callbacks[i]) continue;
                newCallbacks.push(callback);
            }
            if (newCallbacks.length) {
                callbackContextMap.set(context, newCallbacks);
            } else {
                callbackContextMap.delete(context);
                oldContextMap.delete(context);
            }
        }

        if (0 === callbackContextMap.size()) {
            stopSchedule();
        }
    };

    var notifiers = Object.notifiers_ = new WeakMap();

    var Notifier = function(context) {
        this.context = context;
    };

    Notifier.prototype.notify = function(change) {
        return this.bulkNotify([change]);
    };

    Notifier.prototype.bulkNotify = function(changes) {
        try {
        callbackContextMap.forEach(function(context, callbacks) {
            if (callbacks && callbacks.length) {
                callbacks.forEach(function(callback) {
                    callback(changes);
                });
            }
        });
        } catch(e) {
            console.error(e);
            throw e;
        }
    };

    Object.getNotifier = function(context) {
        if (context === null || context === undefined) {
            return;
        }

        if (!notifiers.has(context)) {
            notifiers.set(context, new Notifier(context));
        }
        return notifiers.get(context);
    };

})();