/*
 * Copyright (C) 2015 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports WfsPlaceNameLayer
 */
define([
    '../error/ArgumentError',
    '../util/Color',
    '../util/Logger',
    '../shapes/Placemark',
    '../shapes/PlacemarkAttributes',
    '../geom/Position',
    '../layer/RenderableLayer',
    '../geom/Sector',
    '../util/WfsUrlBuilder'

], function (ArgumentError,
             Color,
             Logger,
             Placemark,
             PlacemarkAttributes,
             Position,
             RenderableLayer,
             Sector,
             WfsUrlBuilder) {
    "use strict";

    var WfsPlaceNameLayer = function (placemarkAttributes) {
        RenderableLayer.call(this, "WFS Place Name");

        if (placemarkAttributes) {
            this._attributes = placemarkAttributes;
        } else {
            this._attributes = new PlacemarkAttributes(null);
            this._attributes.imageColor = Color.RED;
            this._attributes.imageScale = 3;
        }

        var features = [
            "topp:wpl_oceans",
            "topp:wpl_continents",
            //"topp:wpl_waterbodies",
            //"topp:wpl_trenchesridges",
            //"topp:wpl_desertsplains",
            //"topp:wpl_lakesrivers",
            //"topp:wpl_mountainsvalleys",
            "topp:wpl_countries",
            //"topp:wpl_geonet_p_pplc",
            //"topp:citiesover500k",
            //"topp:citiesover100k",
            //"topp:citiesover50k",
            //"topp:citiesover10k",
            //"topp:citiesover1k",
            //"topp:wpl_uscitiesover0",
            //"topp:wpl_uscities0",
            //"topp:wpl_us_anthropogenic",
            //"topp:wpl_us_water",
            //"topp:wpl_us_terrain",
            //"topp:wpl_geonet_a_adm1",
            //"topp:wpl_geonet_a_adm2",
            //"topp:wpl_geonet_p_ppla",
            //"topp:wpl_geonet_p_ppl",
            //"topp:wpl_geonet_p_pplC"
        ];

        var urlBuilder = new WfsUrlBuilder("http://worldwind22.arc.nasa.gov/geoserver/wfs?", "1.0.0");
        for (var i = 0; i < features.length; i++){
            var url = urlBuilder.urlForGetFeature(features[i], new Sector(-90, 90, -180, 180), "json");
            this.loadPlaceNameData(url, features[i]);
        }
    };

    WfsPlaceNameLayer.prototype = Object.create(RenderableLayer.prototype);

    Object.defineProperties(Placemark.prototype, {

        attributes: {
            get: function () {
                return this._attributes;
            },
            set: function (value) {
                if (value) {
                    this._attributes = value;
                }
            }
        }
    });

    WfsPlaceNameLayer.prototype.loadPlaceNameData = function (url, featureName) {
        //var url = "http://worldwind22.arc.nasa.gov/geoserver/wfs?version=1.0.0&&REQUEST=GetFeature&BBOX=-175.200012207031,-51.7000007629395,179.216674804688,78.216667175293&OUTPUTFORMAT=JSON&typeName=topp:geonet_20060905_capitals";
        //var url = "http://worldwind22.arc.nasa.gov/geoserver/wfs?version=1.0.0&&REQUEST=GetFeature&BBOX=-179.16670990584353,-77.8500138161935,179.30999090927148,78.21667681755594&OUTPUTFORMAT=JSON&typeName=topp:wpl_lakesrivers";

        var xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);
        xhr.onreadystatechange = (function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("*** start parsing: " + featureName + "***");
                    this.parse(xhr.responseText);
                }
                else {
                    Logger.log(Logger.LEVEL_WARNING,
                        "Place name data retrieval failed (" + xhr.statusText + "): " + url);
                }
            }
        }).bind(this);

        xhr.onerror = function () {
            Logger.log(Logger.LEVEL_WARNING, "Place name data retrieval failed: " + url);
        };

        xhr.ontimeout = function () {
            Logger.log(Logger.LEVEL_WARNING, "Place name data retrieval timed out: " + url);
        };

        xhr.send(null);
    };

    WfsPlaceNameLayer.prototype.parse = function (jsonText) {
        var placeNameData = JSON.parse(jsonText);
        console.log(placeNameData);
        var self = this;
        placeNameData.features.map(function(feature, featureIndex, features) {
            var coordinate = feature.geometry.coordinates;
                var position = new Position(coordinate[1], coordinate[0], 0);
                var placemark = new Placemark(position, false, self._attributes);
                placemark.label = feature.properties.full_name_nd;
                placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                self.addRenderable(placemark);
            });
        console.log("*** done ***");
    };

    return WfsPlaceNameLayer;
});