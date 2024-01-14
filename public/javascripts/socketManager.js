// socketManager.js

// Use a singleton pattern to ensure only one socket instance is created
var socketManager = (function () {
    var instance;

    function init() {
        var socket = io({
            query: { "token": localStorage.getItem('auth_token') },
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionAttempts: 10
        });

        // You can add any additional socket-related logic here

        return socket;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };
})();
