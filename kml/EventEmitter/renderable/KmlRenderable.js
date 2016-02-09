/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    /**
     *
     * @constructor
     */
    var KmlRenderable = function() {
        Renderable.apply(this, arguments);
    };

    KmlRenderable.prototype = Object.create(Renderable.prototype);

    return KmlRenderable;
});