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

    var template = function(template) {
        if (template instanceof HTMLTemplateElement) {
            template.create = function(context) {
                var fragment = this.content.cloneNode(true),
                    firstNode, lastNode;

                context.bindings = context.bindings || {};
                Object.observe(context, function(changes) {
                    changes.forEach(function(change) {
                        var bindings = context.bindings[change.name] || [];
                        bindings.forEach(function(binding) {
                            // console.log('observed', change.object[change.name]);
                            binding.render();
                        });
                    });
                });

                var instance = new Instance(fragment, context);

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

            template.insert = function(instance) {
                this.parentNode.appendChild(instance.fragment);
            };

            template.bindContext = function(context)
            {
                this.insert(this.create(context));
            };

            template.render = function(context) {
                this.bindContext(context);
            };

            return template;
        }
    };

    var Binding = template.Binding = function(text, context, onContextChanged) {
        this.text = text;
        this.context = context;
        this.onContextChanged = onContextChanged;

        this.render();
    };

    Binding.prototype.render = function() {
        var str = Mustache.render(this.text, this.context);
        if (typeof this.onContextChanged === 'function') {
            this.onContextChanged(str);
        } else {
            return str;
        }
    };

    var Instance = template.Instance = function(fragment, context) {
        this.context = context;
        this.fragment = fragment;
    };

    Instance.prototype.bind = function(node) {
        var context = this.context;

        if (node instanceof HTMLTemplateElement) {
            if (node.hasAttribute('each')) {
                var key = node.getAttribute('each');
                console.log(context[key], key, node);
                for(var i in context[key]) {
                    var subInstance = node.create(context[key][i]);
                    console.log(subInstance);
                    node.insert(subInstance);
                }
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
                Mustache.parse(node.textContent).forEach(function(token) {
                    if (token[0] !== 'name') return;

                    var name = token[1];
                    var bindings = context.bindings[name] = context.bindings[name] || [];
                    var binding = new Binding(node.textContent, context, function(str) {
                        node.textContent = str;
                    });
                    bindings.push(binding);
                });
                break;
            case Node.ELEMENT_NODE:
                Array.prototype.forEach.call(node.attributes, function(attribute) {
                    Mustache.parse(attribute.value).forEach(function(token) {
                        if (token[0] !== 'name') return;

                        var name = token[1];
                        var bindings = context.bindings[name] = context.bindings[name] || [];
                        var binding = new Binding(attribute.value, context, function(str) {
                            attribute.value = str;
                        });
                        bindings.push(binding);
                    });
                });

                for (var child = node.childNodes[0]; child; child = child.nextSibling) {
                    this.bind(child);
                }

                break;
            default:
                throw "Unimplemented instance#bind() for " + node;
        }
    };

    return template;

    // var parseNode = function(parentNode, context, evalNode) {
    //     var children = parentNode.children;
    //     var fragment, newNode;

    //     // parse htmltemplate
    //     if (parentNode instanceof HTMLTemplateElement) {
    //         if (parentNode.hasAttribute('shadow')) {
    //             newNode = document.createElement('div');
    //             newNode.setAttribute('shadow', parentNode.getAttribute('shadow'));
    //             fragment = pants.template(parentNode, context);

    //             newNode.shadow = newNode.createShadowRoot();
    //             newNode.shadow.appendChild(fragment);

    //             return newNode;
    //         } else if (parentNode.hasAttribute('if')) {
    //             var cond = parentNode.getAttribute('if');
    //             cond = Mustache.render(cond, context);
    //             // if not satisfied
    //             if (cond === '') {
    //                 return null;
    //                 // var tmpNode = parentNode;
    //                 // node = node.previousSibling;
    //                 // parentNode.removeChild(tmpNode);
    //             } else {
    //                 return pants.template(parentNode, context);
    //                 // parentNode.replaceChild(fragment, node);
    //                 // node = fragment.childNodes[0];
    //                 // parseNode(fragment, context);
    //             }
    //         } else {
    //             throw new Error('Unimplemented yet!');
    //         }
    //     // parse non htmltemplate
    //     } else if (evalNode) {
    //         // console.log('>', parentNode);
    //         Array.prototype.forEach.call(parentNode.attributes, function(attribute) {
    //             if (attribute.value.match(/{{[^]+}}/)) {
    //                 var matches = attribute.name.match(/^on-(.*)$/);
    //                 if (matches) {
    //                     var eventName = matches[1];
    //                     var m = attribute.value.match(/{{([^}]+)}}/);
    //                     var method = m[1].trim();
    //                     context.delegateEvent(eventName, parentNode, method);
    //                 } else {
    //                     attribute.value = Mustache.render(attribute.value, context);
    //                 }

    //                 // console.log(splitted);
    //                 // console.log(attribute.name.substr(0, 3), attribute.name, attribute.value);
    //             }
    //         });
    //     }

    //     if (parentNode.hasChildNodes()) {
    //         for( var node = parentNode.firstChild; node; node = node.nextSibling) {
    //             switch (node.nodeType) {
    //                 case Node.TEXT_NODE:
    //                     node.textContent = Mustache.render(node.textContent, context);
    //                     break;
    //                 case Node.COMMENT_NODE:
    //                     break;
    //                 default:
    //                     newNode = parseNode(node, context, true);
    //                     if (!newNode) {
    //                         var prevNode = node.previousSibling;
    //                         parentNode.removeChild(node);
    //                         node = prevNode;
    //                     } else if (newNode != node) {
    //                         if (newNode instanceof DocumentFragment) {
    //                             var lastNode = newNode.lastChild;
    //                             parentNode.replaceChild(newNode, node);
    //                             node = lastNode;
    //                         } else {
    //                             parentNode.replaceChild(newNode, node);
    //                             node = newNode;
    //                         }
    //                     }
    //                     break;
    //             }
    //         }
    //     }

    //     return parentNode;
    // };

    // pants.template = function(template, context, evalContext) {
    //     if (!template) {
    //         return;
    //     }
    //     var fragment = template.content.cloneNode(true);

    //     return parseNode(fragment, context);
    // };
}));