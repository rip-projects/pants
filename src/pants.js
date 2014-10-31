(function(global) {
    "use strict";

    String.prototype.camelize = function (forPropertyName) {
        return this.replace (/(?:^|[-])(\w)/g, function (_, c, i) {
            if (forPropertyName) {
                return c ? (i === 0 ? c.toLowerCase() : c.toUpperCase()) : '';
            } else {
                return c ? c.toUpperCase() : '';
            }
        });
    };

    var pants = global.pants = global.pants || {};

    var uniqueId = 0;

    var createPants = function(tagName, o) {
        o = o || {};
        o.prototype = HTMLElement.prototype;

        var proto = Object.create(o.prototype);
        for (var key in o) {
            proto[key] = o[key];
        }

        proto.doc = pants.getCurrentDocument();

        if (!o.template) {
            proto.template = proto.doc.mainTemplate;
        } else if (o.template instanceof HTMLTemplateElement) {
            proto.template = o.template;
        } else {
            proto.template = proto.doc.getNamedTemplate(o.template) || proto.doc.mainTemplate;
        }

        proto.listeners = {};

        proto.emit = function(eventName) {
            var segments = eventName.trim().split(':');
            var names = [];
            var args = Array.prototype.slice.call(arguments, 1);

            var that = this;
            segments.forEach(function(v, i) {
                var s = [];
                for(var j = 0; j <= i; j++) {
                    s.push(segments[j]);
                }
                s = s.join(':');

                if (that.listeners[s]) {
                    that.listeners[s].forEach(function(fn) {
                        fn.apply(null, args);
                    });
                }
            });
        };

        proto.on = function(eventName, fn) {
            this.listeners[eventName] = this.listeners[eventName] || [];
            this.listeners[eventName].push(fn);
        };


        // proto.events = {};
        proto.delegateEvent = function(eventName, target, method) {
            var tagName = this.tagName.toLowerCase();
            var nsEventName = eventName + '.delegated' + this.id;
            var selector = target;

            if (typeof target !== 'string') {
                var clazz = eventName + '-' + tagName;
                selector = '.' + clazz;

                $(target).addClass(clazz);
            }

            var that = this;
            $(this).on(nsEventName, selector, function() {
                var args = [];
                for(var i in arguments) {
                    args.push(arguments[i]);
                }
                args.push(this);
                that[method].apply(that, args);
            });
        };

        proto.undelegateEvent = function(eventName) {
            $(this).off('.delegated' + this.id);
        };

        // define lifecycle created callback
        proto.createdCallback = function() {
            this.id = uniqueId++;
            // this.normalizedAttributes = {};
            this.originalTextContent = this.textContent;

            var that = this;
            Array.prototype.forEach.call(this.attributes, function(attribute) {
                if (attribute.name.substr(-4) === '-ref') {
                    var propName = attribute.name.substr(0, attribute.name.length - 4).camelize(true);

                    var ref = document.getElementById(attribute.value);
                    try {
                        switch (ref.type) {
                            case 'application/json':
                            case 'text/json':
                                that[propName] = JSON.parse(ref.textContent);
                                break;
                            default:
                                throw new Error('No parser for type [' + ref.type + ']');
                                // eval('that[propName] = ' + ref.textContent);
                        }
                    } catch(e) {
                        throw new Error('Parse error of [' + attribute.name + '] attribute. "' + e.message + '"', e);
                    }
                }
            });

            if (o.events) {
                for(var k in o.events) {
                    var methodName = o.events[k];
                    var matches = k.match(/^(\w+)\s*(.*)$/);
                    var eventName = matches[1];
                    var selector = matches[2];
                    this.delegateEvent(eventName, selector, methodName);
                }
            }

            Array.prototype.forEach.call(this.attributes, function(attribute) {
                that.attributeChangedCallback(attribute.name);
            });

            var fragment = pants.template(this.template, this);
            this.innerHTML = '';
            this.appendChild(fragment);

            if (o.onCreated) {
                o.onCreated.apply(this, arguments);
            }
            // var shadowTemplate = scriptDoc.querySelector('template[role=shadow]');
            // var surfaceTemplate = scriptDoc.querySelector('template[role=surface]');

            // this.shadow = this.surface = null;
            // if (shadowTemplate && surfaceTemplate) {
            //     this.innerHTML = '<div role="shadow"></div><div role="surface"></div>';
            //     this.shadow = this.querySelector('[role=shadow]').createShadowRoot();
            //     this.surface = this.querySelector('[role=surface]');
            // } else if (shadowTemplate) {
            //     this.shadow = this.createShadowRoot();
            // } else {
            //     this.surface = this;
            // }

            // if (this.shadow) {
            //     // pants.bind(this.shadow, shadowTemplate.innerHTML);
            //     // this.shadow.appendChild(shadowTemplate.content.cloneNode(true));
            // }

            // if (this.surface) {
            //     this.surface.appendChild(surfaceTemplate.content.cloneNode(true));
            // }


        };

        proto.attributeChangedCallback = function(attributeName) {
            var propName = attributeName.camelize(true);
            var value;

            if (this.hasAttribute(attributeName)) {
                value = this.getAttribute(attributeName) || true;
            } else {
                value = null;
            }

            this[propName] = value;
            // if (!this.normalizedAttributes[propName] || this.normalizedAttributes[propName] != value) {
            //     this.normalizedAttributes[propName] = value;
            //     this.emit('change:' + propName, value, propName);
            // }
        };

        return proto;
    };

    pants.create = function(tagName, o) {
        pants.populate(pants.getCurrentDocument());

        var proto = createPants(tagName, o);
        document.registerElement(tagName, {
            'prototype': proto
        });
    };
})(window);