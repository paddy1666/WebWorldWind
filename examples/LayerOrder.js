/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports LayerOrder
 */

define([], function () {
    'use strict';

    /**
     * Constructs LayerOrder.
     * @alias LayerOrder
     * @constructor
     * @classdesc The LayerOrder will sort layers in ascending order based on the zIndex property. 
     * @param {WorldWindow} wwd The world window instance.
     */
    var LayerOrder = function (wwd) {

        var onFrameStart = function (wwd, stage) {
            if (stage === WorldWind.BEFORE_REDRAW) {
                wwd.layers.sort(function (a, b) {
                    return a.zIndex - b.zIndex;
                });
            }
        };

        wwd.redrawCallbacks.push(onFrameStart);

    };
    
    return LayerOrder;

});