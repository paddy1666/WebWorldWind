/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlFile = function(url) {
        KmlRenderable.call(this);
    };

    KmlFile.prototype = Object.create(KmlRenderable.prototype);

    return KmlFile;
});