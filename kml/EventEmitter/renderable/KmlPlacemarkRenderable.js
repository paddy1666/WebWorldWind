/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    /**
     *
     * @param options
     * @constructor
     */
    var KmlPlacemarkRenderable = function(options) {
        Placemark.apply(this, arguments);

        this._geometry = options.geometry;
    };

    KmlPlacemarkRenderable.prototype = Object.create(Placemark.prototype);

    Object.defineProperties(KmlPlacemarkRenderable.prototype, {
        geometry: {
            get: function() {
                return this._geometry;
            }
        }
    });

    KmlPlacemarkRenderable.prototype.render = function(){
        // Render the placemarks itself
        this.geometry.render();
    };

    return KmlPlacemarkRenderable;
});