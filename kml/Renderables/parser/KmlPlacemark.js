/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([
    '../renderable/KmlPlacemarkRenderable'
], function (KmlPlacemarkRenderable) {
    "use strict";

    var KmlPlacemark = function () {
        KmlObject.apply(this, arguments);
    };

    KmlPlacemark.prototype = Object.create(KmlObject.prototype);

    KmlPlacemark.prototype.renderable = function () {
        return new KmlPlacemarkRenderable();
    };

    return KmlPlacemark;
});