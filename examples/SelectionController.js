/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * Illustrates how to handle selection of a geographical area.
 */

requirejs(['../src/WorldWind',
		'./LayerManager'],
	function (ww,
			  LayerManager) {
		"use strict";

		// Tell World Wind to log only warnings.
		WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

		// Create the World Window.
		var wwd = new WorldWind.WorldWindow("canvasOne");

		/**
		 * Added imagery layers.
		 */
		var layers = [
			{layer: new WorldWind.BMNGLayer(), enabled: true},
			{layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
			{layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
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
		new LayerManager(wwd);

		function writeDownInformation(selectedPoints) {
			var textRepresentationOfPoints = '';

			selectedPoints.forEach(function(point){
				textRepresentationOfPoints += point.toString() + "<br />";
			});

			$('#selectedPoints').html(textRepresentationOfPoints);
		}

		// Create the selection controller.
		var currentSelector = new WorldWind.SelectionController(wwd, {
			onSelectionChangeListener: writeDownInformation,
			type: 'polygon'
		});

		$( "#typeOfSelection" ).change(function(){
			currentSelector.destroy();
			currentSelector = new WorldWind.SelectionController(wwd, {
				onSelectionChangeListener: writeDownInformation,
				type: $( "#typeOfSelection" ).val()
			});
			$('#selectedPoints').html('');
		});

	});