/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports CyclicPickController
 */

define([], function () {
    'use strict';

    /**
     * Constructs a CyclicPickController.
     * @alias CyclicPickController
     * @constructor
     * @classdesc The CyclicPickController highlights picked renderables in top to bottom order. After a full pass all
     * the renderabes are highlighted.
     * @param {WorldWindow} wwd The WorldWindow instance.
     * @param {String[]} events An array with the events that this controller will react to.
     * @param {Function} cb A callback function to call with the current highlighted renderables.
     */
    var CyclicPickController = function (wwd, events, cb) {

        for (var i = 0; i < events.length; i++) {
            wwd.addEventListener(events[i], doPick);
        }

        function doPick(event) {
            var x = event.clientX,
                y = event.clientY;

            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
            var highlightedRenderables = setNextHighlightStage(pickList.objects);
            wwd.redraw();
            if (cb) {
                cb(highlightedRenderables);
            }

        }

    };

    /**
     * Sets the highlight of the picked renderables.
     * @param {Renderable[]} renderables An array of renderables.
     * @returns {Renderable[]} An array with the highlighted renderables.
     */
    function setNextHighlightStage(renderables) {

        renderables = renderables.filter(function (r) {
            return !r.isTerrain;
        }).reverse();

        var numHighlighted = 0;
        var currentHighlight;
        var len = renderables.length;
        var highlightedRenderables = [];

        if (len === 0) {
            return highlightedRenderables;
        }

        if (len === 1) {
            renderables[0].userObject.highlighted = true;
            highlightedRenderables.push(renderables[0]);
            return highlightedRenderables;
        }

        for (var i = 0; i < len; i++) {
            if (renderables[i].userObject.highlighted) {
                numHighlighted++;
                currentHighlight = i;
                renderables[i].userObject.highlighted = false;
            }
        }

        if (numHighlighted === len) {
            renderables[0].userObject.highlighted = true;
            highlightedRenderables.push(renderables[0]);
            return highlightedRenderables;
        }
        else if (currentHighlight === len - 1 || numHighlighted === 0) {
            for (i = 0; i < len; i++) {
                renderables[i].userObject.highlighted = true;
            }
            return renderables;
        }
        else {
            renderables[currentHighlight + 1].userObject.highlighted = true;
            highlightedRenderables.push(renderables[currentHighlight + 1]);
            return highlightedRenderables;
        }

    }

    return CyclicPickController;

});