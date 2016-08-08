/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * Illustrates usage of WMS layer and updating it's time dimension
 * @version $Id: WMSLayer.js 3320 2015-07-15 20:53:05Z dcollins $
 */

requirejs(['../src/WorldWind',
        './LayerManager'],
    function (ww,
              LayerManager) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        var wwd = new WorldWind.WorldWindow("canvasOne");

        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: true},
            {layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
            //{layer: new WorldWind.BingAerialLayer(null), enabled: false},
            //{layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.BingRoadsLayer(null), enabled: false},
            {layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: false},
            {layer: new WorldWind.CompassLayer(), enabled: true},

            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        // Create a layer manager for controlling layer visibility.
        var layerManger = new LayerManager(wwd);



        // load WMTS capabilities
        var wmtsAddress = 'http://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi';
        var layersFilter = [
            {key: "title", value: "msg_dust"},
            {key: "title", value: "msg_eview"},
            {key: "name", value: "meteosat:msg_ir108"}
        ];
        var wmtsLayers = {};
        $.ajax(wmtsAddress + '?service=WMTS&request=GetCapabilities&version=1.0.0')
            .done(function(xmlDom){

                var wmtsCaps = new WorldWind.WmtsCapabilities(xmlDom);

                if (!wmtsCaps.version) {
                    console.error("WMTS capabilities document is invalid");
                    return;
                }

                var count = 0;
                for(var confIndex in wmtsCaps.contents.layer){

                    if(Math.random() > 0.8){ // load only random ~20 % of layers
                        continue;
                    }

                    if(!wmtsCaps.contents.layer.hasOwnProperty(confIndex)){
                        continue;
                    }
                    var layerCaps = wmtsCaps.contents.layer[confIndex];

                    // filter out unsupported CRS' - at this time, it filters all layers out
                    // var supportedCRS = layerCaps.tileMatrixSetLink[0].tileMatrixSetRef.supportedCRS;
                    // if(!WorldWind.WmtsLayer.isEpsg3857Crs(supportedCRS) && !WorldWind.WmtsLayer.isEpsg4326Crs(supportedCRS)){
                    //     console.log(supportedCRS, layerCaps.identifier);
                    //     continue;
                    // }

                    ///////// CRS hack, doesn't help
                    // layerCaps.tileMatrixSetLink[0].tileMatrixSetRef.supportedCRS = "EPSG4326";

                    // todo add latest time
                    var latestTimeString = null;
                    // var latestTime = layerCaps.timeSequences[layerCaps.timeSequences.length - 1];
                    // latestTimeString = latestTime.toISOString();

                    // todo handle styles?
                    wmtsLayers[confIndex] = new WorldWind.WmtsLayer(layerCaps, null, latestTimeString);
                    wwd.addLayer(wmtsLayers[confIndex]);

                    layerManger.synchronizeLayerList();

                    // todo add time selector
                    // var id = "selector_" + confIndex;
                    //
                    // var selector = $("<select></select>").attr("id", id);
                    // $.each(layerCaps.timeSequences, function(key, value){
                    //     var option = $("<option></option>").attr("value", value.toISOString()).text(value.toISOString());
                    //     if(key == layerCaps.timeSequences.length - 1){
                    //         option.attr('selected','selected');
                    //     }
                    //     $(selector).append(option);
                    // });
                    // var label = $("<label></label>").attr("for", layerCaps.name).text(layerCaps.title + " time:");
                    // $('#time-selectors').append(label).append($("<br>")).append(selector).append($("<br>"));
                    //
                    // (function(layer){
                    //     $('#' + id).change(function(){
                    //         layer.updateTime($(this).val(), function () {
                    //             layerManger.synchronizeLayerList();
                    //         });
                    //
                    //         // this doesn't work: (redrawCallback is executed, layer name changes, but the button doesn't work)
                    //         // wwd.redrawCallbacks.push(function () {
                    //         //     layerManger.synchronizeLayerList();
                    //         // });
                    //     });
                    // }(wmtsLayers[confIndex]));

                }

            }).fail(function(){
                console.error("Failed to load WMTS getCapabilities");
            });

    });