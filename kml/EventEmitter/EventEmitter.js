/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var EventEmitter = function(options) {
        this._listeners = options.listeners;
    };

    EventEmitter.prototype.emitEvent = function(event){
        this._listeners.notify(event);
    };

    return EventEmitter;
});