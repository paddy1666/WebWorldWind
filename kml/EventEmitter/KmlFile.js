/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlFile = function() {

    };

    KmlFile.prototype.generate = function() {

    };

    KmlFile.prototype.parseNode = function(node) {
        var self = this;
        this._node.descendants.forEach(function(descendant){
            if(descendant.containsNode()) {
                descendant.descendants.forEach(self.parseNode)
            } else {

            }
        })
    };

    return KmlFile;
});