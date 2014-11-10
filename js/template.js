(function(root, factory) {
    "use strict";

    if( typeof define === 'function' && define.amd ){
        define([], factory );
    }else if( typeof exports === 'object' ){
        module.exports = factory();
    }else{
        root.pants = root.pants || {};
        root.pants.template = factory();
    }
} (this, function() {
    "use strict";

    var template = function(t) {
        if (t instanceof HTMLTemplateElement) {
            if (t.wearPants_) {
                return t;
            }

            t.wearPants_ = true;

            t.each_ = t.getAttribute('each');
            t.bind_ = t.getAttribute('bind');
            t.if_ = t.getAttribute('if');
            switch (t.getAttribute('shadow')) {
                case '':
                case '1':
                case 'yes':
                case 'true':
                    t.shadow_ = t.parentNode;
                    break;
                default:
                    t.shadow_ = null;
            }

            t.instances = [];

            t.create = function(context) {
                var fragment = this.content.cloneNode(true),
                    firstNode, lastNode, instance;

                instance = new Instance(this, fragment, context);

                firstNode = fragment.firstChild;
                if (firstNode) {
                    for (var child = fragment.firstChild; child; child = child.nextSibling) {
                        if (!child.nextSibling) {
                            lastNode = child;
                        }

                        instance.bind(child);
                    }

                    instance.firstNode = firstNode;
                    instance.lastNode = lastNode;
                }

                return instance;
            };

            t.insert = function(instance) {
                this.instances.push(instance);
                if (t.shadow_) {
                    t.getShadowRoot().appendChild(instance.fragment);
                } else {
                    this.parentNode.appendChild(instance.fragment);
                }
            };

            t.getShadowRoot = function() {
                if (!t.shadowRoot_) {
                    t.shadowRoot_ = t.shadow_.createShadowRoot();
                }
                return t.shadowRoot_;
            };

            t.bind = function(context, observePath)
            {
                var observedContext,
                    that = this;

                if (that.if_) {
                    Expression.extract(that.if_).forEach(function(key) {
                        pants.observe(context, key, function(changes) {
                            var exp = (that.each_) ? that.each_ : that.bind_;
                            Expression.extract(exp).forEach(function(k) {
                                Object.getNotifier(context).notify({
                                    type: 'update',
                                    object: context,
                                    name: k,
                                    oldValue: context[k]
                                });
                            });

                        });
                    });
                }

                if (observePath) {
                    pants.observe(context, observePath, function(changes) {
                        try {
                            that.instances.forEach(function(instance) {
                                var children = [];
                                for(var c = instance.lastNode; c && c !== instance.firstNode; c = c.previousSibling) {
                                    if (c) {
                                        children.push(c);
                                    }
                                }
                                children.push(instance.firstNode);


                                for(var i in children) {
                                    try {
                                        that.parentNode.removeChild(children[i]);
                                    } catch(e) {

                                    }
                                }
                            });
                        } catch(e) {
                            console.error(e);
                        }

                        var tobeRendered = false;
                        if (that.if_) {
                            try {
                                Expression.extract(that.if_).forEach(function(key) {
                                    if (context[key]) {
                                        tobeRendered = true;
                                    }
                                });
                            } catch(e) {
                                console.error(e);
                            }
                        } else {
                            tobeRendered = true;
                        }

                        if (tobeRendered) {
                            if (that.each_) {
                                observedContext = Path.get(observePath).getValueFrom(context);
                                if (observedContext.forEach) {
                                    observedContext.forEach(function(eachContext) {
                                        that.insert(that.create(eachContext));
                                    });
                                }
                            } else {
                                observedContext = Path.get(observePath).getValueFrom(context);
                                that.insert(that.create(observedContext));
                            }
                        }
                    });
                } else {
                    this.insert(this.create(context));
                }

            };

            return t;
        }
    };

    var Expression = template.Expression = {

        extract: function(s) {
            var extracted = {};
            Expression.parse(s).forEach(function(token) {
                if (token[0] === 'name') {
                    extracted[token[1]] = token[1];
                }
            });

            return Object.keys(extracted);
        },

        parse: function(s) {
            // console.log('parse', s.trim());
            return Mustache.parse.apply(null, arguments);
        },

        render: function(s, context) {
            if (s.match(/{{\s*}}/)) {
                return s.replace(/{{\s*}}/, context);
            }
            return Mustache.render.apply(null, arguments);
        },

        bind: function(node, context) {
            if (node instanceof Attr) {
                Expression.extract(node.value).forEach(function(key) {
                    node.templateExpression = node.value;
                    if ('object' === typeof context) {
                        pants.observe(context, key, function() {
                            node.value = Expression.render(node.templateExpression, context);
                        });
                    }
                    node.value = Expression.render(node.templateExpression, context);
                });
            } else {
                Expression.extract(node.textContent).forEach(function(key) {
                    node.templateExpression = node.textContent;
                    if ('object' === typeof context) {
                        pants.observe(context, key, function() {
                            node.textContent = Expression.render(node.templateExpression, context);
                        });
                    }
                    node.textContent = Expression.render(node.templateExpression, context);
                });
            }
        }

    };

    var Instance = template.Instance = function(template, fragment, context) {
        this.template = template;
        this.context = context;
        this.fragment = fragment;
    };

    Instance.prototype.bind = function(node) {

        var context = this.context;

        if (node instanceof HTMLTemplateElement) {
            var templateNode = template(node);

            var templateContext = context;

            if (templateNode.each_) {
                Expression.extract(templateNode.each_).forEach(function(key) {
                    templateNode.bind(context, key);
                });
            } else if (templateNode.bind_) {
                Expression.extract(templateNode.bind_).forEach(function(key) {
                    templateNode.bind(context, key);
                });
            } else {
                console.log(templateNode);
                templateNode.insert(templateNode.create(templateContext));
            }
            return;
        }


        switch (node.nodeType) {
            case Node.TEXT_NODE:
                Expression.bind(node, context);
                break;
            case Node.ELEMENT_NODE:
                Array.prototype.forEach.call(node.attributes, function(attribute) {
                    Expression.bind(attribute, context);
                });
                if (node.childNodes.length) {
                    for (var child = node.childNodes[0]; child; child = child.nextSibling) {
                        this.bind(child);
                    }
                }
                break;
            case Node.COMMENT_NODE:
                // noop
                break;
            default:
                throw "Unimplemented instance#bind() for " + node;
        }
    };

    return template;
}));