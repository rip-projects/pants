(function(global) {
    "use strict";

    var pants = global.pants = global.pants || {};
    if (pants.addResolver) return;

    var $ = global.$;

    pants.resolvers = [];
    pants.addResolver = function(resolver) {
        pants.resolvers.push(resolver);
    };

    pants.scan = function(el) {
        var $el = $(el || 'body');

        var activeResolver;
        pants.resolvers.some(function(resolver) {
            if (resolver.matcher($el)) {
                activeResolver = resolver;
                return resolver;
            }
        });

        if (activeResolver) {
            activeResolver.run($el, $el.data());
        } else {
            $el.children().each(function() {
                pants.scan(this);
            });
        }

    };

    $(function() {
        pants.scan('body');
    });

})(window);