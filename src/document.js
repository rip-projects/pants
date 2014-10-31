(function(global) {
    "use strict";

    var pants = global.pants = global.pants || {};

    pants.getCurrentDocument = function() {
        try {
            return document.currentScript.ownerDocument;
        } catch(e) {
        }
    };

    pants.populate = function(doc) {
        if (doc.templates) return;

        doc.mainTemplate = null;
        doc.templates = [];
        doc.namedTemplates = [];

        var templates = doc.querySelectorAll('template');
        for(var i = 0; i < templates.length; i++) {
            var template = templates[i];

            if (i === 0) {
                doc.mainTemplate = template;
            } else if (template.id) {
                doc.namedTemplates[template.id] = template;
            }

            doc.templates.push(template);
        }

        doc.getNamedTemplate = function(name) {
            return doc.namedTemplates[name] || null;
        };
    };
})(window);