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

            if (t.hasAttribute('each')) {
                t.isRepeated_ = true;
            }

            t.instances = [];

            t.create = function(context) {
                var fragment = this.content.cloneNode(true),
                    firstNode, lastNode, instance;

                instance = new Instance(fragment, context);

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
                this.parentNode.appendChild(instance.fragment);
            };

            t.bind = function(context, observePath)
            {
                var observedContext,
                    that = this;

                this.observePath_ = observePath;

                if (observePath) {
                    observedContext = Path.get(observePath).getValueFrom(context);

                    pants.observe(context, observePath, function(change) {
                        if (that.isRepeated_) {
                            that.instances.forEach(function(instance) {
                                console.log(instance);
                            });
                            if (observedContext.forEach) {
                                observedContext.forEach(function(eachContext) {
                                    that.insert(that.create(eachContext, observePath));
                                });
                            }
                        }
                    });
                } else {
                    this.insert(this.create(context, observePath));
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

    var Instance = template.Instance = function(fragment, context) {
        this.context = context;
        this.fragment = fragment;
    };

    Instance.prototype.bind = function(node) {
        var context = this.context;
        if (node instanceof HTMLTemplateElement) {
            var templateNode = template(node);

            var templateContext = context;

            if (templateNode.hasAttribute('each')) {

                Expression.extract(templateNode.getAttribute('each')).forEach(function(key) {
                    templateNode.bind(context, key);
                });
            }
            // if (node.hasAttribute('shadow')) {
            //     newNode = document.createElement('div');
            //     newNode.setAttribute('shadow', node.getAttribute('shadow'));
            //     fragment = pants.template(node, context);

            //     newNode.shadow = newNode.createShadowRoot();
            //     newNode.shadow.appendChild(fragment);

            //     return newNode;
            // } else if (node.hasAttribute('if')) {
            //     var cond = node.getAttribute('if');
            //     cond = Mustache.render(cond, context);
            //     // if not satisfied
            //     if (cond === '') {
            //         return null;
            //         // var tmpNode = node;
            //         // node = node.previousSibling;
            //         // node.removeChild(tmpNode);
            //     } else {
            //         return pants.template(node, context);
            //         // node.replaceChild(fragment, node);
            //         // node = fragment.childNodes[0];
            //         // parseNode(fragment, context);
            //     }
            // } else {
            //     throw new Error('Unimplemented yet!');
            // }

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