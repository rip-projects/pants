(function(global) {
    "use strict";

    var pants = global.pants = global.pants || {};

    var parseNode = function(parentNode, context, evalNode) {
        var children = parentNode.children;
        var fragment, newNode;

        // parse htmltemplate
        if (parentNode instanceof HTMLTemplateElement) {
            if (parentNode.hasAttribute('shadow')) {
                newNode = document.createElement('div');
                newNode.setAttribute('shadow', parentNode.getAttribute('shadow'));
                fragment = pants.template(parentNode, context);

                newNode.shadow = newNode.createShadowRoot();
                newNode.shadow.appendChild(fragment);

                return newNode;
            } else if (parentNode.hasAttribute('if')) {
                var cond = parentNode.getAttribute('if');
                cond = Mustache.render(cond, context);
                // if not satisfied
                if (cond === '') {
                    return null;
                    // var tmpNode = parentNode;
                    // node = node.previousSibling;
                    // parentNode.removeChild(tmpNode);
                } else {
                    return pants.template(parentNode, context);
                    // parentNode.replaceChild(fragment, node);
                    // node = fragment.childNodes[0];
                    // parseNode(fragment, context);
                }
            } else {
                throw new Error('Unimplemented yet!');
            }
        // parse non htmltemplate
        } else if (evalNode) {
            // console.log('>', parentNode);
            Array.prototype.forEach.call(parentNode.attributes, function(attribute) {
                if (attribute.value.match(/{{[^]+}}/)) {
                    var matches = attribute.name.match(/^on-(.*)$/);
                    if (matches) {
                        var eventName = matches[1];
                        var m = attribute.value.match(/{{([^}]+)}}/);
                        var method = m[1].trim();
                        context.delegateEvent(eventName, parentNode, method);
                    } else {
                        attribute.value = Mustache.render(attribute.value, context);
                    }

                    // console.log(splitted);
                    // console.log(attribute.name.substr(0, 3), attribute.name, attribute.value);
                }
            });
        }

        if (parentNode.hasChildNodes()) {
            for( var node = parentNode.firstChild; node; node = node.nextSibling) {
                switch (node.nodeType) {
                    case Node.TEXT_NODE:
                        node.textContent = Mustache.render(node.textContent, context);
                        break;
                    case Node.COMMENT_NODE:
                        break;
                    default:
                        newNode = parseNode(node, context, true);
                        if (!newNode) {
                            var prevNode = node.previousSibling;
                            parentNode.removeChild(node);
                            node = prevNode;
                        } else if (newNode != node) {
                            if (newNode instanceof DocumentFragment) {
                                var lastNode = newNode.lastChild;
                                parentNode.replaceChild(newNode, node);
                                node = lastNode;
                            } else {
                                parentNode.replaceChild(newNode, node);
                                node = newNode;
                            }
                        }
                        break;
                }
            }
        }

        return parentNode;
    };

    pants.template = function(template, context, evalContext) {
        var fragment = template.content.cloneNode(true);

        return parseNode(fragment, context);
    };

})(window);