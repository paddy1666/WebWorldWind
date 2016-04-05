/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports AtmosphereLayer
 */
define([
        '../error/ArgumentError',
        '../shaders/AtmosphereProgram',
        '../layer/Layer',
        '../geom/Location',
        '../util/Logger',
        '../geom/Matrix',
        '../geom/Sector',
        '../geom/Vec3'
    ],
    function (ArgumentError,
              AtmosphereProgram,
              Layer,
              Location,
              Logger,
              Matrix,
              Sector,
              Vec3) {
        "use strict";

        var AtmosphereLayer = function (worldWindow) {
            if (!worldWindow) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "ViewControlsLayer", "constructor", "missingWorldWindow"));
            }

            Layer.call(this, "Atmosphere");

            this.wwd = worldWindow;

            this.pickEnabled = false;

            this.nightImageSource = null;

            this.lightLocation = new Location();

            this._mvpMatrix = new Matrix();

            this.texCoordMatrix = new Matrix();

            this.vector = new Vec3();

            this._fullSphereSector = Sector.FULL_SPHERE;

            this._skyWidth = 128;

            this._skyHeight = 128;

            this._skyPoints = null;

            this._skyTriStrip = null;

            this._scratchMatrix = Matrix.fromIdentity();

        };

        AtmosphereLayer.prototype = Object.create(Layer.prototype);

        // Documented in superclass.
        AtmosphereLayer.prototype.doRender = function (dc) {
            this.drawSky(dc);
        };

        AtmosphereLayer.prototype.drawSky = function(dc) {
            var gl = dc.currentGlContext,
                program = dc.findAndBindProgram(AtmosphereProgram);

            program.loadGlobe(gl, dc.globe);

            var eyePoint = dc.navigatorState.eyePoint;
            program.loadEyePoint(gl, dc.navigatorState.eyePoint);

            var vertexOriginArray = [0, 0, 0];
            program.loadVertexOrigin(gl, vertexOriginArray);

            // Use the draw context's modelview projection matrix.
            program.loadModelviewProjection(gl, dc.navigatorState.modelviewProjection);

            program.loadFragMode(gl, program.FRAGMODE_SKY);

            var res = new Vec3(eyePoint[0], eyePoint[1], eyePoint[2]);
            program.loadLightDirection(gl, res);


            gl.depthMask(false);
            gl.frontFace(gl.CW);

            this.setSkyPoints(dc, program.getAltitude());
            this.setSkyTrianglesIndices();
            var triangleVertices = this._skyPoints;
            var triangleIndices = this._skyTriStrip;

            var vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

            var indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(triangleIndices), gl.STATIC_DRAW);

            gl.vertexAttribPointer(program.vertexPointLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(program.vertexPointLocation);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.drawElements(gl.TRIANGLE_STRIP, triangleIndices.length, gl.UNSIGNED_SHORT, 0);

            gl.depthMask(true);
            gl.frontFace(gl.CCW);
        }

        AtmosphereLayer.prototype.setSkyPoints = function(dc, altitude) {
            if (this._skyPoints == null) {
                var count = this._skyWidth * this._skyHeight;
                var array = Array(count).fill(altitude);
                this._skyPoints = new Float64Array(3 * array.length);

                dc.globe.computePointsForGrid(
                    this._fullSphereSector,
                    this._skyWidth,
                    this._skyHeight,
                    array,
                    Vec3.ZERO,
                    this._skyPoints);
            }
        }

        AtmosphereLayer.prototype.setSkyTrianglesIndices = function() {
            if (this._skyTriStrip == null) {
                this._skyTriStrip = this.assembleTriStripIndices(this._skyWidth, this._skyHeight);
            }
        }

        AtmosphereLayer.prototype.assembleTriStripIndices = function(numLat, numLon) {
            var result = [];
            var index = [];
            var vertex = 0;

            for (var latIndex = 0; latIndex < numLat - 1; latIndex++) {
                // Create a triangle strip joining each adjacent column of vertices, starting in the bottom left corner and
                // proceeding to the right. The first vertex starts with the left row of vertices and moves right to create
                // a counterclockwise winding order.
                for (var lonIndex = 0; lonIndex < numLon; lonIndex++) {
                    vertex = lonIndex + latIndex * numLon;
                    index[0] = (vertex + numLon);
                    index[1] =  vertex;
                    result.push(index[0]);
                    result.push(index[1]);
                }

                // Insert indices to create 2 degenerate triangles:
                // - one for the end of the current row, and
                // - one for the beginning of the next row
                if (latIndex < numLat - 2) {
                    index[0] = vertex;
                    index[1] = (latIndex + 2) * numLon;
                    result.push(index[0]);
                    result.push(index[1]);
                }
            }

            return result;
        }

        return AtmosphereLayer;
    });

