/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */

require(['../src/WorldWind', './LayerManager', './LayerOrder'], function (WorldWind, LayerManager, LayerOrder) {
    'use strict';

    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

    var wwd = new WorldWind.WorldWindow("canvasOne");

    new LayerOrder(wwd);

    var layers = [
        {layer: new WorldWind.BMNGLayer(), enabled: true, zIndex: 100},
        {layer: new WorldWind.BMNGLandsatLayer(), enabled: true, zIndex: 90},
        {layer: new WorldWind.BingAerialLayer(null), enabled: true, zIndex: 80},
        {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true, zIndex: 70},
        {layer: new WorldWind.BingRoadsLayer(null), enabled: true, zIndex: 60},
        {layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: true, zIndex: 50},
        {layer: new WorldWind.CompassLayer(), enabled: true, zIndex: 40},
        {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true, zIndex: 30},
        {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true, zIndex: 20}
    ];

    for (var l = 0; l < layers.length; l++) {
        layers[l].layer.enabled = layers[l].enabled;
        layers[l].layer.zIndex = layers[l].zIndex;
        wwd.addLayer(layers[l].layer);
    }

    new LayerManager(wwd);

});