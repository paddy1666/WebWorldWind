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



        // load WMS capabilities
        var wmsAddress = 'http://185.104.180.39/eumetsat';
        var layersFilter = [
            {key: "title", value: "msg_dust"},
            {key: "title", value: "msg_eview"},
            {key: "name", value: "meteosat:msg_ir108"}
        ];
        var wmsLayers = {};
        $.ajax(wmsAddress + '?service=WMS&request=GetCapabilities&version=1.3.0')
            .done(function(data){

                var xmlDom = null;
                if (data.indexOf("<?xml") === 0) {
                    xmlDom = new window.DOMParser().parseFromString(data, "text/xml");
                } else {
                    console.error("WMS capabilities document is invalid");
                    return;
                }
                var wmsCapsDoc = new WorldWind.WmsCapabilities(xmlDom);

                if (!wmsCapsDoc.version) {
                    console.error("WMS capabilities document is invalid");
                    return;
                }
                
                var layersCaps = wmsCapsDoc.capability.layers[0].layers;
                var layersConfigs = [];

                layersFilter.forEach(function (filter) {
                    for (var layer in layersCaps) {
                        if (layersCaps.hasOwnProperty(layer) && layersCaps[layer][filter.key] == filter.value) {
                            var config = WorldWind.WmsLayer.formLayerConfiguration(layersCaps[layer]);
                            layersConfigs.push(config);
                            break;
                        }
                    }
                });

                for(var confIndex in layersConfigs){
                    if(!layersConfigs.hasOwnProperty(confIndex)){
                        return;
                    }
                    var config = layersConfigs[confIndex];

                    wmsLayers[confIndex] = new WorldWind.WmsLayer(config, config.timeSequences[config.timeSequences.length - 1].toISOString());
                    wwd.addLayer(wmsLayers[confIndex]);

                    layerManger.synchronizeLayerList();

                    var id = "selector_" + confIndex;

                    var selector = $("<select></select>").attr("id", id);
                    $.each(config.timeSequences, function(key, value){
                        var option = $("<option></option>").attr("value", value.toISOString()).text(value.toISOString());
                        if(key == config.timeSequences.length - 1){
                            option.attr('selected','selected');
                        }
                        $(selector).append(option);
                    });
                    var label = $("<label></label>").attr("for", config.name).text(config.title + " time:");
                    $('#time-selectors').append(label).append($("<br>")).append(selector).append($("<br>"));

                    (function(layer){
                        $('#' + id).change(function(){
                            layer.updateTime($(this).val(), function () {
                                layerManger.synchronizeLayerList();
                            });

                            // this doesn't work: (redrawCallback is executed, layer name changes, but the button doesn't work)
                            // wwd.redrawCallbacks.push(function () {
                            //     layerManger.synchronizeLayerList();
                            // });
                        });
                    }(wmsLayers[confIndex]));

                }

            }).fail(function(){
            console.error("Failed to load WMS getCapabilities");
        });



    });