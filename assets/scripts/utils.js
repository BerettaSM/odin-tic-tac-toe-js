'use strict';

var Utils = (function () {
    var publicAPI = {
        clone,
        deepClone,
    };

    return publicAPI;

    // =====================================

    function clone(obj) {
        var prototype = Object.getPrototypeOf(obj);
        var clone = Object.assign(Object.create(prototype), obj);
        return clone;
    }

    function _deepClone(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        var copy = Array.isArray(obj) ? [] : {};
        for (let [key, value] of Object.entries(obj)) {
            copy[key] = _deepClone(value);
        }
        return copy;
    }

    function deepClone(obj) {
        var clone = _deepClone(obj);
        Object.setPrototypeOf(clone, Object.getPrototypeOf(obj));
        return clone;
    }
})();
