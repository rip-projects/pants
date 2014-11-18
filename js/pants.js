/**
 * pants
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
(function(root, factory) {
    "use strict";

    if( typeof define === 'function' && define.amd ){
        define([], factory );
    }else if( typeof exports === 'object' ){
        module.exports = factory();
    }else{
        root.pants = factory();
    }
} (this, function() {
    "use strict";

    var matches = function(el, selector) {
        return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    };

    var pants = function(componentName, defaultAttributes) {
        switch(arguments.length) {
            case 1:
                if (typeof componentName === 'object') {
                    defaultAttributes = componentName;
                    componentName = null;
                }
                break;
        }

        var scope = document.currentScript.ownerDocument;

        if (!componentName) {
            var node = document.currentScript;
            do {
                node = node.parentNode;
                if (node && node.tagName === 'PANTS-ELEMENT') {
                    componentName = node.getAttribute('name');
                    scope = node;
                    break;
                }
            } while (node);
        }

        if (!componentName) {
            throw "Element does not have name!";
        }

        return new Pants(componentName, scope, defaultAttributes);
    };

    var Pants = pants.Pants = function(componentName, scope, defaultAttributes) {
        this.componentName = componentName;
        this.defaultAttributes = defaultAttributes || {};
        this.attributeNames = Object.keys(this.defaultAttributes);
        this.scope = scope;
        this.template = scope.querySelector('template') || document.createElement('template');
        this.listeners = {};
        this.events = {};

        this.parsers = {
            'application/json': JSON.parse
        };
    };

    Pants.prototype.on = function(eventName, eventCallback) {
        this.listeners[eventName] = this.listeners[eventName] || [];
        this.listeners[eventName].push(eventCallback);

        return this;
    };

    Pants.prototype.emit = function(eventName) {
        var component = arguments[arguments.length - 1],
            args = Array.prototype.slice.call(arguments, 1, -1),
            listeners = this.listeners[eventName] || [];

        listeners.forEach(function(listener) {
            listener.apply(component, args);
        });
    };

    Pants.prototype.event = function(eventName, eventCallback) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(eventCallback);

        return this;
    };

    Pants.prototype.parse = function(contentType, textContent) {

        // registering
        if (typeof textContent === 'function') {
            if (typeof contentType === 'string') {
                contentType = [contentType];
            }

            for(var i in contentType) {
                this.parsers[contentType[i]] = textContent;
            }

            return this;
        } else {
            try {
                return this.parsers[contentType].call(this, textContent);
            } catch(e) {
                console.error('Error parsing textContent:', textContent);
            }
        }

    };

    Pants.prototype.register = function(prototype, ext) {
        var that = this;

        prototype = prototype || HTMLElement.prototype;

        this.prototype = Object.create(prototype);
        if (ext) {
            this.extends = ext;
        }

        this.prototype.getContentType = function() {
            return this.getAttribute('type') || 'application/json';
        };

        this.prototype.createdCallback = function() {
            Object.keys(this.pants.defaultAttributes).forEach(function(key) {
                var attr = this.pants.defaultAttributes[key];
                if (typeof attr === 'function') {
                    attr = attr.bind(this);
                }
                this[key] = attr;
            }.bind(this));

            // populate attribute values for the first time
            this.pants.attributeNames.forEach(function(attributeName) {
                var value = this.getAttribute(attributeName);
                if (value) {
                    this[attributeName] = value;
                }
            }.bind(this));

            var changeData = function(data) {
                if (this._data === data) {
                    return;
                }

                var notifier = Object.getNotifier(this);

                this._data = data;

                notifier.notify({
                    type:'update',
                    name: 'data'
                });

                notifier.notify({
                    type:'update',
                    name: 'textData'
                });
            }.bind(this);

            Object.defineProperty(this, 'data', {
                get: function() {
                    return this._data;
                },

                set: function(data) {
                    changeData(data);
                }
            });

            Object.defineProperty(this, 'textData', {
                get: function() {
                    return JSON.stringify(this.data, null, 4);
                },

                set: function(textData) {
                    try {
                        var data = this.pants.parse(this.getContentType(), textData);
                        changeData(data);
                    } catch(e) {

                    }
                }
            });

            if (this.hasAttribute('data')) {
                var refNode = document.getElementById(this.getAttribute('data'));
                if (refNode) {
                    this.data = refNode.data;
                }
            } else {
                this.data = this.pants.parse(this.getContentType(), this.innerHTML);
            }

            // preparing template for the first time
            this.template = this.pants.template.cloneNode(true);
            this.appendChild(this.template);
            pants.template(this.template);
            this.template.bind(this);

            this.pants.emit('created', this);
        };

        this.prototype.attachedCallback = function() {
            // delegate events
            this.delegateEvents_();

            this.pants.emit('attached', this);
        };

        this.prototype.detachedCallback = function() {
            // delegate events
            this.undelegateEvents_();

            this.pants.emit('detached', this);
        };

        this.prototype.attributeChangedCallback = function(attributeName, oldValue, newValue) {
            this[attributeName] = newValue;

            this.pants.emit(attributeName + 'Changed', oldValue, newValue, this);
        };

        this.prototype.delegateEvents_ = function() {
            this.events_ = {};
            Object.keys(this.pants.events).forEach(function(key) {
                var segments = key.split(/\s+/),
                    eventName = segments[0],
                    selector = segments.slice(1).join(' '),
                    callbacks = this.pants.events[key];

                if (!this.events_[eventName]) {
                    this.events_[eventName] = {};
                    this.addEventHandler_(eventName);
                }

                this.events_[eventName][selector] = this.events_[eventName][selector] || [];
                Array.prototype.push.apply(this.events_[eventName][selector], callbacks);
            }.bind(this));
        };

        this.prototype.undelegateEvents_ = function() {
            Object.keys(this.events_).forEach(function(eventName) {
                if (this.events_[eventName]) {
                    Object.keys(this.events_[eventName]).forEach(function(k) {
                        (this.events_[eventName][k] || []).forEach(function(callback) {
                            this.removeEventListener(this, eventName, callback);
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this));

            delete this.events_;
        };

        this.prototype.addEventHandler_ = function(eventName) {
            this.addEventListener(eventName, function(evt) {
                var that = this,
                    args = arguments;

                Object.keys(this.events_[eventName]).forEach(function(selector) {
                    Array.prototype.forEach.call(evt.path, function(el) {
                        if (el instanceof HTMLElement && el === that.querySelector(selector)) {
                            that.events_[eventName][selector].forEach(function(callback) {
                                callback.apply(that, args);
                            });
                        }
                    });
                });
            });
        };

        this.prototype.pants = this;

        document.registerElement(this.componentName, this);
    };

    return pants;
}));