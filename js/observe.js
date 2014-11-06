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

/******************************************************************************
 * namespace pants.observe
 ******************************************************************************/

    var observe = function(context, path) {
        return new Observer(context, path);
    };

    var ObservableContext = observe.ObservableContext = function(tower, context) {
        this.tower = tower;
        this.context = context;
        this.callbacks = {};

        var that = this;
        this.objectCallback__ = function() {
            that.callback_.apply(that, arguments);
        };
        this.arrayCallback__ = function() {
            that.callback_.apply(that, arguments);
        };
    };

    ObservableContext.prototype.open = function() {
        if (Array.observe) {
            Array.observe(this.context, this.arrayCallback__);
        } else {
            Object.observe(this.context, this.objectCallback__);
        }
    };

    ObservableContext.prototype.close = function() {
        if (Array.observe) {
            Array.unobserve(this.context, this.arrayCallback__);
        } else {
            Object.unobserve(this.context, this.objectCallback__);
        }

    };

    ObservableContext.prototype.callback_ = function(changes) {
        var context = this.context,
            tower = this.tower,
            callbacks = this.callbacks;

        changes.forEach(function(change) {
            Object.keys(callbacks).forEach(function(path) {
                var pathO = Path.get(path);

                if (change.type === 'splice') {
                    callbacks[''].forEach(function(callback) {
                        callback(change);
                    });
                } else if (change.name === path) {
                    callbacks[path].forEach(function(callback) {
                        callback(change);
                    });
                } else {
                    if (path.indexOf(change.name + '.') === 0) {
                        try {

                            tower.removeObservableContext(change.oldValue);

                            var subPath = path.substr(change.name.length + 1);
                            var subPathO = Path.get(subPath);
                            var subContext = context[change.name] || {};

                            var subObservable = tower.getObservableContext(subContext);

                            var arrContext = subPathO.getValueFrom(subContext),
                                arrObservable;

                            if (arrContext instanceof Array) {
                                arrObservable = tower.getObservableContext(arrContext);
                            }

                            callbacks[path].forEach(function(callback) {
                                subObservable.observe(subPath, callback);

                                if (arrObservable) {
                                    arrObservable.observe(callback);
                                }
                            });

                            Object.getNotifier(subContext).notify({
                                type: 'add',
                                name: subPathO[0]
                            });

                        } catch(e) {
                            console.error(e);
                            // console.error(e.stack);
                        }
                    }
                }
            });
        });
    };

    ObservableContext.prototype.observe = function(path, callback) {
        if (arguments.length === 1) {
            callback = path;
            path = '';
        }

        var p = path.toString();
        this.callbacks[p] = this.callbacks[p] || [];
        this.callbacks[p].push(callback);
    };

    var Tower = function() {
        this.observables = new WeakMap();
    };

    Tower.prototype.getObservableContext = function(context) {
        if (!this.observables.has(context)) {
            var observable = new ObservableContext(this, context);
            this.observables.set(context, observable);
            observable.open();
        }
        return this.observables.get(context);
    };

    Tower.prototype.removeObservableContext = function(context) {
        if (context && this.observables.has(context)) {
            var observable = this.observables.get(context);
            observable.close();
            this.observables.delete(context);
        }
    };

    Tower.prototype.observe = function(context, path, callback) {
        var observable = this.getObservableContext(context);

        observable.observe(path, callback);
    };

    var tower = observe.tower = new Tower();

    var Observer = observe.Observer = function(context, path) {
        this.listeners = {};

        this.context = context;
        this.path = Path.get(path);

        this.start();
    };

    Observer.prototype.on = function(key, callback) {
        this.listeners[key] = this.listeners[key] || [];
        this.listeners[key].push(callback);
    };

    Observer.prototype.emit = function(key) {
        var listeners = this.listeners[key] || [],
            that = this,
            args = Array.prototype.slice.call(arguments, 1);

        listeners.forEach(function(listener) {
            listener.apply(that, args);
        });
    };

    Observer.prototype.start = function() {
        var that = this;
        tower.observe(this.context, this.path, function(change) {
            that.emit('change', change);
        });
    };

    return observe;


}));


