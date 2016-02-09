/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlFileParser = function(options) {
        this._node = options.node;
        this._descendants = [];
    };

    KmlFileParser.prototype.parse = function() {
        var self = this;
        this._node.descendants.forEach(function(descendant){
            if(isValidElement(descendant)){
                self._descendants.push(new KmlElement(descendant));
            }
        });

        return KmlFileRenderable;
    };

    KmlFileParser.prototype.generateRenderables = function() {
        var renderables = [];

        this._descendants.forEach(function(descendant){
            renderables.push(descendant.renderable());
        });

        return renderables;
    };

    KmlFileParser.prototype.isValidElement = function(element) {
        if(element.nodeName == "Placemark") {
            return true;
        }
        return false;
    };

    return KmlFileParser;
});