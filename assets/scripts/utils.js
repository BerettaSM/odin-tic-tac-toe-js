'use strict';

var Utils = (function () {
    var publicAPI = {
        clone,
        createInitProxy,
        deepClone,
        deepFreeze,
        getRandomChoice,
        getRandomNumber,
        sleep,
    };

    return Object.freeze(publicAPI);

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

    function deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        for (let [key, value] of Object.entries(obj)) {
            obj[key] = deepFreeze(value);
        }
        return Object.freeze(obj);
    }

    function getRandomChoice(...options) {
        if (Array.isArray(options[0])) {
            options = options[0];
        }
        if (options.length === 0) {
            return null;
        }
        var randomIndex = getRandomNumber(0, options.length - 1);
        return options[randomIndex];
    }

    function getRandomNumber(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    function createInitProxy(
        wrappeeObj,
        initProp = 'init',
        allowReinitialization = false
    ) {
        var initiated = false;

        return new Proxy(wrappeeObj, {
            get: function (target, prop) {
                if (!allowReinitialization && initiated && prop === initProp) {
                    throw new Error('This object cannot be reinitialized.');
                } else if (!initiated && prop !== initProp) {
                    throw new Error(
                        `You must initiate this object by calling .${initProp}().`
                    );
                }
                initiated = true;
                return target[prop];
            },
        });
    }

    async function sleep(ms = 1000) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }
})();
