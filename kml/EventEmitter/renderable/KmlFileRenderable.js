/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([], function () {
    "use strict";

    var KmlFileRenderable = function() {
        this._descendants = [];
    };

    KmlFileRenderable.prototype.render = function(){
        this._descendants.forEach(function(descendant){
            descendant.render();
        });
    };

    KmlFileRenderable.prototype.addDescendant = function(descendant){
        this._descendants.push(descendant);
    };

    return KmlFileRenderable;
});