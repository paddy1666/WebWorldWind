/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlObject = function() {

    };

    KmlObject.prototype.renderable = function() {
        // Override in descendants
        // Returns associated renderable.
    };

    return KmlObject;
});