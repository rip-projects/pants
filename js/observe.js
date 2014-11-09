(function(root, factory) {
    "use strict";

    if( typeof define === 'function' && define.amd ){
        define([], factory );
    }else if( typeof exports === 'object' ){
        module.exports = factory();
    }else{
        root.pants = root.pants || {};
        root.pants.observe = factory();
    }
} (this, function() {
    "use strict";

    var observe = function(context, path, callback) {
        return new CallbackContext(context, path, callback);
    };

    /**
     * observe.Observable
     *
     * @param {object} context
     */
    var Observable = observe.Observable = function(context) {
        this.context = context;
        this.callbackContexts = [];
        this.isOpened = false;

        this.callback__ = this.callback_.bind(this);
    };

    Observable.prototype.open = function() {
        if (this.isOpened) {
            return;
        }

        this.isOpened = true;

        if (Array.observe) {
            Array.observe(this.context, this.callback__);
        } else {
            Object.observe(this.context, this.callback__);
        }

        Observable.map.set(this.context, this);
    };

    Observable.prototype.close = function() {
        if (!this.isOpened) {
            return;
        }

        Observable.map.delete(this.context, this);

        if (Array.observe) {
            Array.unobserve(this.context, this.callback__);
        } else {
            Object.unobserve(this.context, this.callback__);
        }

        this.isOpened = false;

    };

    Observable.prototype.add = function(callbackContext) {
        this.callbackContexts.push(callbackContext);
    };

    // Observable.prototype.remove = function(callbackContext) {
    // };

    Observable.prototype.find = function(name) {
        var result = [];
        this.callbackContexts.forEach(function(callbackContext) {
            var path = Path.get(callbackContext.path);
            if (path[0] === name) {
                result.push(callbackContext);
            }
        });
        return result;
    };

    Observable.prototype.callback_ = function(changes) {
        var that = this;


        changes.forEach(function(change) {
            var callbackContexts = that.find(change.name);

            callbackContexts.forEach(function(callbackContext) {
                try {
                    var path = Path.get(callbackContext.path);

                    if (change.oldValue && Observable.exists(change.oldValue)) {
                        Observable.remove(change.oldValue);
                    }
                } catch(e) {
                    console.error(e);
                }
            });

            callbackContexts.forEach(function(callbackContext) {
                var path = Path.get(callbackContext.path);
                if (path.length === 0) {
                    callbackContext.callback(change);
                } else if (path.length === 1) {
                    try {
                        var arrContext = path.getValueFrom(that.context);
                        if (arrContext instanceof Array) {
                            observe(arrContext, '', callbackContext.callback);
                        }
                    } catch(e) {
                        console.error(e);
                    }

                    callbackContext.callback(change);
                } else if (path.length > 1) {

                    var subPath = Path.get(path.slice(1)),
                        subContext = that.context[change.name] || {};

                    observe(subContext, subPath.toString(), callbackContext.callback);

                    Object.getNotifier(subContext).notify({
                        type: 'add',
                        object: subContext,
                        name: subPath[0]
                    });
                }
            });
        });
    };

    Observable.map = new WeakMap();

    Observable.get = function(context) {
        var observable = Observable.map.get(context);
        if (!observable) {
            observable = new Observable(context);
            observable.open();
        }

        return observable;
    };

    Observable.exists = function(context) {
        return Observable.map.has(context);
    };

    Observable.remove = function(context) {
        console.log(context);
        if (Observable.exists(context)) {
            var observable = Observable.get(context);
            console.log(observable);
            observable.close();
        }
    };

    /**
     * observe.CallbackContext
     *
     * @param {object}   context
     * @param {string}   path
     * @param {Function} callback
     */
    var CallbackContext = function(context, path, callback) {
        this.observable = Observable.get(context);
        this.path = path;
        this.callback = callback;

        this.observable.add(this);
    };

    return observe;
}));