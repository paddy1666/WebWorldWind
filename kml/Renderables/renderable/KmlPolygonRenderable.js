/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlPolygonRenderable = function(options) {
        Polygon.apply(this, arguments);

        this._locations = options.locations;

        // Style will be hooked when approaching the StyleResolver.
        this._style = StyleResolver.getStyle(options.style);
    };

    KmlPolygonRenderable.prototype = Object.create(Polygon.prototype);

    KmlPolygonRenderable.prototype.shapeAttributes = function(style) {
        return new ShapeAttributes(style);
    };

    return KmlPolygonRenderable;
});