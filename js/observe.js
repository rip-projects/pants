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
     * observe.CallbackContext
     *
     * @param {object}   context
     * @param {string}   path
     * @param {Function} callback
     */
    var CallbackContext = observe.CallbackContext = function(context, path, callback) {
        this.context = context;
        this.path = path;
        this.callback = callback;

        this.callback__ = this.callback_.bind(this);
        this.children = [];

        this.open();

        var pathO = Path.get(path);
        if (pathO.length > 0) {
            Object.getNotifier(context).notify({
                type: 'add',
                object: context,
                name: pathO[0]
            });
        }
    };

    CallbackContext.prototype.open = function() {
        if (this.isOpened) {
            return;
        }

        this.isOpened = true;

        if (Array.observe) {
            Array.observe(this.context, this.callback__);
        } else {
            Object.observe(this.context, this.callback__);
        }

        CallbackContext.entries.push(this);
    };

    CallbackContext.prototype.close = function() {
        if (!this.isOpened) {
            return;
        }

        var that = this;

        this.children.forEach(function(child) {
            child.close();
        });

        CallbackContext.entries.some(function(entry, index) {
            if (that === entry) {
                CallbackContext.entries.splice(index, 1);
                return true;
            }
        });

        if (Array.observe) {
            Array.unobserve(this.context, this.callback__);
        } else {
            Object.unobserve(this.context, this.callback__);
        }

        this.isOpened = false;

    };

    CallbackContext.prototype.callback_ = function(changes) {
        var that = this,
            names = {};

        var path = Path.get(that.path);

        changes.forEach(function(change) {
            var indexName = change.name || '';

            if (names[indexName]) {
                return;
            }

            if (path.length > 0 && path.indexOf(change.name) === -1) {
                return;
            }

            names[indexName] = indexName;

            if (path.length === 0) {
                that.callback(changes);
            } else if (path[path.length - 1] === change.name) {
                // console.log(that.children.length, that.children);

                if (change.oldValue instanceof Array) {
                    that.children.some(function(child) {
                        if (child.context === change.oldValue && child.path === '') {
                            child.close();
                            return true;
                        }
                    });
                }

                try {
                    var arrContext = that.context[change.name];
                    if (arrContext instanceof Array) {
                        that.children.push(observe(arrContext, '', that.callback));
                    }
                } catch(e) {
                    console.error(e);
                }

                that.callback(changes);
            } else {
                var subPath = Path.get(path.slice(1)),
                    subContext = that.context[path[0]] || {};

                that.children.forEach(function(child) {
                    child.close();
                });


                that.children.push(observe(subContext, subPath.toString(), that.callback));

                Object.getNotifier(subContext).notify({
                    type: 'add',
                    object: subContext[subPath[0]],
                    name: subPath[0]
                });
            }

        });
    };

    CallbackContext.entries = [];

    return observe;
}));