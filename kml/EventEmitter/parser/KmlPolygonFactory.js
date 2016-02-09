/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlPolygonFactory = function(){

    };

    KmlPolygonFactory.prototype.kmlPolygon = function(node) {
        // Either pass node further or do something here with it.
        return new KmlPolygonRenderable(node);
    };

    var workingInstance = new KmlPolygonFactory();
    EventEmitter.register(workingInstance);

    return workingInstance;
});