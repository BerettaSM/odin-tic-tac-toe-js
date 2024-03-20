'use strict';

var Utils = (function () {
    var publicAPI = {
        clone,
    };

    return publicAPI;

    // =====================================

    function clone(obj) {
        var prototype = Object.getPrototypeOf(obj);
        var clone = Object.assign(Object.create(prototype), obj);
        return clone;
    }
})();
