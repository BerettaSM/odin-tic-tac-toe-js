'use strict';

var Utils = (function () {
    var publicAPI = {
        clone,
        deepClone,
        getRandomChoice,
        getRandomNumber,
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

    function getRandomChoice(...options) {
        if(Array.isArray(options[0])) {
            options = options[0];
        }
        if(options.length === 0) {
            return null;
        }
        var randomIndex = getRandomNumber(0, options.length - 1);
        return options[randomIndex];
    }

    function getRandomNumber(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
})();
