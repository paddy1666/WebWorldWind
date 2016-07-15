/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([
	'../error/ArgumentError',
	'../geom/Location',
	'./Logger',
	'../geom/Position',
	'../layer/RenderableLayer',
	'../gesture/SelectionRecognizer',
	'../shapes/ShapeAttributes',
	'../shapes/SurfaceCircle',
	'../shapes/SurfacePolygon'
], function (ArgumentError,
			 Location,
			 Logger,
			 Position,
			 RenderableLayer,
			 SelectionRecognizer,
			 ShapeAttributes,
			 SurfaceCircle,
			 SurfacePolygon) {
	/**
	 * It represents controller for handling selection. When this controller is active it recognizes the clicks and based on the click it allows you either to select a point, select an area or work with already selected areas. Each of the selection controller remembers and handles the shapes it selected. It is therefore possible to create multiple selection controllers handling for example different types of objects or different areas on the globe.
	 * @constructor
	 * @alias SelectionController
	 * @classdesc Controller for handling different scenarios for selection of Area.
	 * @param {WorldWindow} worldWindow The world window to monitor for mouse-move and tap events.
	 * @param options {Object}
	 * @param options.onSelectionChangeListener {Function} Function which is called when the selection changes.
	 * @param options.type {String} Possible types are boundingBox, polygon and circle. If nothing is supplied polygon is default.
	 * @throws {ArgumentError} If the specified world window is null or undefined.
	 */
	var SelectionController = function (worldWindow, options) {
		if (!worldWindow) {
			throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "HighlightController", "constructor",
				"missingWorldWindow"));
		}

		/**
		 * This controller's world window
		 * @type {WorldWindow}
		 * @readonly
		 * @private
		 */
		this._worldWindow = worldWindow;

		/**
		 * It represents all points which were selected by the user. Usually it will draw polyline.
		 * @type {Point[]}
		 * @private
		 */
		this._selectedArea = [];

		/**
		 * It represents controller, which interacts with user and gathers his actions.
		 * @type {SelectionRecognizer}
		 * @private
		 */
		this._eventRecognizer = new SelectionRecognizer(this._worldWindow, this.handleClick.bind(this));

		/**
		 * It represents a layer, which contains the shape drawn as a part of the selection.
		 * @type {RenderableLayer}
		 * @private
		 */
		this._layerOfSelectedObjects = new RenderableLayer("Selected objects.");
		this._worldWindow.addLayer(this._layerOfSelectedObjects);

		/**
		 * Shape representing the are, user is selecting.
		 * @type {SurfaceShape|null}
		 * @private
		 */
		this._visibleRepresentation = null;

		/**
		 * Method which is called when the array of selected points update.
		 * @type {Function}
		 * @private
		 */
		this._onSelectionChangeListener = options.onSelectionChangeListener;

		/**
		 * It decides what type of objects it is possible to select with this controller.
		 * @type {String}
		 * @private
		 */
		this._type = options.type || 'polygon';
	};

	Object.defineProperties(SelectionController.prototype, {
		/**
		 * It decides whether current controller will be active and therefore handling the user actions.
		 * @type {Boolean}
		 * @memberOf SelectionController.prototype
		 */
		enabled: {
			set: function(enabled) {
				this._eventRecognizer.enabled = enabled;
			}
		},

		/**
		 * It returns all the points user clicked on during the show of a selection.
		 * @type {Point[]}
		 * @memberOf SelectionController.prototype
		 */
		pointsEncompassingSelectedAres: {
			get: function() {
				return this._selectedArea;
			}
		},

		/**
		 * One of the types this controller could get. boundingBox, polygon, circle
		 * @type {String}
		 * @memberOf SelectionController.prototype
		 */
		type: {
			get: function() {
				return this._type;
			}
		}
	});

	/**
	 * Use this function when you ended up with the usage of the controller, so it can properly clean all used resources.
	 */
	SelectionController.prototype.destroy = function() {
		this._worldWindow.removeLayer(this._layerOfSelectedObjects);
		this._eventRecognizer.destroy();
	};

	/**
	 * Internal function for handling click on the globe.
	 * @param event {Event} Event which originated this call.
	 * @private
	 */
	SelectionController.prototype.handleClick = function(event) {
		if(event.type == 'click' && event.shiftKey) {
			this.handleSingleClick(event.clientX, event.clientY);
		} else if(event.type == 'dblclick') {
			this.handleDoubleClick();
		}
	};

	/**
	 * When user clicks once add the position to the selected ones.
	 * @param clientX {Number} Pixel position on the canvas
	 * @param clientY {Number} Pixel position on the canvas
	 * @private
	 */
	SelectionController.prototype.handleSingleClick = function(clientX, clientY) {
		var coordinates = this._worldWindow.canvasCoordinates(clientX, clientY);
		var position = this.getPosition(coordinates);
		// Ignore if the click is outside of the globe.
		if(position) {
			var isAlreadyInArray = false;

			this._selectedArea.forEach(function(point){
				if(point.equals(position)) {
					isAlreadyInArray = true;
				}
			});

			if (!isAlreadyInArray) {
				// For circle and bounding box allow at most two points.
				if(this._type == "polygon" || this._selectedArea.length < 2) {
					this._selectedArea.push(position);
					this._onSelectionChangeListener(this._selectedArea);
				} else {
					this.enabled = false;
				}
			}

			this.redrawCurrentlySelectedArea();
		}
	};

	/**
	 * Double click ends selection for polygon
	 * @private
	 */
	SelectionController.prototype.handleDoubleClick = function() {
		if(this._type == 'polygon') {
			this.enabled = false;
		}
	};

	/**
	 * It converts the position on the canvas to the geograpfical position on the globe.
	 * @param point {Object}
	 * @param point.clientX {Number} X coordinate for the geographical position.
	 * @param point.clientY {Number} Y coordinate for the geographical position.
	 * @returns {Point}
	 * @private
	 */
	SelectionController.prototype.getPosition = function(point) {
		var location = this._worldWindow.pickTerrain(point).objects;
		if (location.length > 0){
			return location[0].position;
		} else {
			return null;
		}
	};

	SelectionController.prototype.redrawCurrentlySelectedArea = function() {
		if(this._selectedArea.length > 1) {
			if(this._visibleRepresentation) {
				this._layerOfSelectedObjects.removeRenderable(this._visibleRepresentation);
			}

			this._visibleRepresentation = this.prepareCorrectShape();
			this._layerOfSelectedObjects.addRenderable(this._visibleRepresentation);

			this._worldWindow.redraw();
		}
	};

	SelectionController.prototype.prepareCorrectShape = function() {
		var visibleRepresentation = null;

		if(this._type == "polygon") {
			visibleRepresentation = new SurfacePolygon(this._selectedArea, new ShapeAttributes());
		} else if(this._type == "circle") {
			// Radius is distance between these two points in meters.
			var centralLocation = new Location(this._selectedArea[0].latitude, this._selectedArea[0].longitude);
			var perimeterLocation = new Location(this._selectedArea[1].latitude, this._selectedArea[1].longitude);
			var radiusInMeters = 6371000 * Location.greatCircleDistance(centralLocation, perimeterLocation);

			visibleRepresentation = new SurfaceCircle(this._selectedArea[0], radiusInMeters, new ShapeAttributes());
		} else if(this._type == "boundingBox") {
			var topLeftCorner = this._selectedArea[0];
			var bottomRightCorner = this._selectedArea[1];
			var topRightCorner = new Position(topLeftCorner.latitude, bottomRightCorner.longitude);
			var bottomLeftCorner = new Position(bottomRightCorner.latitude, topLeftCorner.longitude);

			visibleRepresentation = new SurfacePolygon([topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner], new ShapeAttributes());
		} else {
			Logger.logMessage(Logger.LEVEL_WARNING, "SelectionController", "redrawCurrentlySelectedArea", "Unknown type");
		}

		return visibleRepresentation;
	};

	return SelectionController;
});