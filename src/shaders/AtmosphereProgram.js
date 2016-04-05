/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports AtmosphereProgram
 */
define([
        '../error/ArgumentError',
        '../shaders/GpuProgram',
        '../util/Logger',
        '../geom/Matrix',
        '../geom/Vec3'
    ],
    function (ArgumentError,
              GpuProgram,
              Logger,
              Matrix,
              Vec3) {
        "use strict";


        var AtmosphereProgram = function (gl) {

            var vertexShaderSource =
                    'precision mediump float;\n' +
                    'precision mediump int;\n' +

                    'const int FRAGMODE_SKY = 1;\n' +
                    'const int FRAGMODE_GROUND_PRIMARY = 2;\n' +
                    'const int FRAGMODE_GROUND_SECONDARY = 3;\n' +
                    'const int FRAGMODE_GROUND_PRIMARY_TEX_BLEND = 4;\n' +

                    'const int SAMPLE_COUNT = 2;\n' +
                    'const float SAMPLES = 2.0;\n' +

                    'uniform int fragMode;\n' +
                    'uniform mat4 mvpMatrix;\n' +
                    'uniform mat3 texCoordMatrix;\n' +
                    'uniform vec3 vertexOrigin;\n' +
                    'uniform vec3 eyePoint;\n' +
                    'uniform float eyeMagnitude;\n' + /* The eye point's magnitude */
                    'uniform float eyeMagnitude2;\n' + /* eyeMagnitude^2 */
                    'uniform vec3 lightDirection;\n' + /* The direction vector to the light source */
                    'uniform vec3 invWavelength;\n' + /* 1 / pow(wavelength, 4) for the red, green, and blue channels */
                    'uniform float atmosphereRadius;\n' + /* The outer (atmosphere) radius */
                    'uniform float atmosphereRadius2;\n' + /* atmosphereRadius^2 */
                    'uniform float globeRadius;\n' + /* The inner (planetary) radius */
                    'uniform float KrESun;\n' + /* Kr * ESun */
                    'uniform float KmESun;\n' + /* Km * ESun */
                    'uniform float Kr4PI;\n' + /* Kr * 4 * PI */
                    'uniform float Km4PI;\n' + /* Km * 4 * PI */
                    'uniform float scale;\n' + /* 1 / (atmosphereRadius - globeRadius) */
                    'uniform float scaleDepth;\n' + /* The scale depth (i.e. the altitude at which the atmosphere's average density is found) */
                    'uniform float scaleOverScaleDepth;\n' + /* fScale / fScaleDepth */

                    'attribute vec4 vertexPoint;\n' +
                    'attribute vec2 vertexTexCoord;\n' +

                    'varying vec3 primaryColor;\n' +
                    'varying vec3 secondaryColor;\n' +
                    'varying vec3 direction;\n' +
                    'varying vec2 texCoord;\n' +

                    'float scaleFunc(float cos) {\n' +
                    'float x = 1.0 - cos;\n' +
                    'return scaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));\n' +
                    '}\n' +

                    'void sampleSky() {\n' +
                        /* Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the
                         atmosphere) */
                    'vec3 point = vertexPoint.xyz + vertexOrigin;\n' +
                    'vec3 ray = point - eyePoint;\n' +
                    'float far = length(ray);\n' +
                    'ray /= far;\n' +

                    'vec3 start;\n' +
                    'float startOffset;\n' +

                    'if (eyeMagnitude < atmosphereRadius) {\n' +
                        /* Calculate the ray's starting point, then calculate its scattering offset */
                    'start = eyePoint;\n' +
                    'float height = length(start);\n' +
                    'float depth = exp(scaleOverScaleDepth * (globeRadius - eyeMagnitude));\n' +
                    'float startAngle = dot(ray, start) / height;\n' +
                    'startOffset = depth*scaleFunc(startAngle);\n' +
                    '} else {\n' +
                        /* Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray
                         passing through the atmosphere) */
                    'float B = 2.0 * dot(eyePoint, ray);\n' +
                    'float C = eyeMagnitude2 - atmosphereRadius2;\n' +
                    'float det = max(0.0, B*B - 4.0 * C);\n' +
                    'float near = 0.5 * (-B - sqrt(det));\n' +

                        /* Calculate the ray's starting point, then calculate its scattering offset */
                    'start = eyePoint + ray * near;\n' +
                    'far -= near;\n' +
                    'float startAngle = dot(ray, start) / atmosphereRadius;\n' +
                    'float startDepth = exp(-1.0 / scaleDepth);\n' +
                    'startOffset = startDepth*scaleFunc(startAngle);\n' +
                    '}\n' +

                        /* Initialize the scattering loop variables */
                    'float sampleLength = far / SAMPLES;\n' +
                    'float scaledLength = sampleLength * scale;\n' +
                    'vec3 sampleRay = ray * sampleLength;\n' +
                    'vec3 samplePoint = start + sampleRay * 0.5;\n' +

                        /* Now loop through the sample rays */
                    'vec3 frontColor = vec3(0.0, 0.0, 0.0);\n' +
                    'for(int i=0; i<SAMPLE_COUNT; i++)\n' +
                    '{\n' +
                    'float height = length(samplePoint);\n' +
                    'float depth = exp(scaleOverScaleDepth * (globeRadius - height));\n' +
                    'float lightAngle = dot(lightDirection, samplePoint) / height;\n' +
                    'float cameraAngle = dot(ray, samplePoint) / height;\n' +
                    'float scatter = (startOffset + depth*(scaleFunc(lightAngle) - scaleFunc(cameraAngle)));\n' +
                    'vec3 attenuate = exp(-scatter * (invWavelength * Kr4PI + Km4PI));\n' +
                    'frontColor += attenuate * (depth * scaledLength);\n' +
                    'samplePoint += sampleRay;\n' +
                    '}\n' +

                        /* Finally, scale the Mie and Rayleigh colors and set up the varying variables for the fragment shader */
                    'primaryColor = frontColor * (invWavelength * KrESun);\n' +
                    'secondaryColor = frontColor * KmESun;\n' +
                    'direction = eyePoint - point;\n' +
                    '}\n' +

                    'void main() {\n' +
                    'sampleSky();\n' +

                        /* Transform the vertex point by the modelview-projection matrix */
                    'gl_Position = mvpMatrix * vertexPoint;\n' +
                    '}',
                fragmentShaderSource =
                    'precision mediump float;\n' +
                    'precision mediump int;\n' +

                    'const int FRAGMODE_SKY = 1;\n' +
                    'const int FRAGMODE_GROUND_PRIMARY = 2;\n' +
                    'const int FRAGMODE_GROUND_SECONDARY = 3;\n' +
                    'const int FRAGMODE_GROUND_PRIMARY_TEX_BLEND = 4;\n' +

                    'uniform int fragMode;\n' +
                    'uniform sampler2D texSampler;\n' +
                    'uniform vec3 lightDirection;\n' +
                    'uniform float g;\n' +
                    'uniform float g2;\n' +

                    'varying vec3 primaryColor;\n' +
                    'varying vec3 secondaryColor;\n' +
                    'varying vec3 direction;\n' +
                    'varying vec2 texCoord;\n' +

                    'void main () {\n' +
                    'if (fragMode == FRAGMODE_SKY) {\n' +
                    'float cos = dot(lightDirection, direction) / length(direction);\n' +
                    'float miePhase = 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + cos*cos) / pow(1.0 + g2 - 2.0*g*cos, 1.5);\n' +
                    'vec3 color = primaryColor + secondaryColor * miePhase;\n' +
                    //'gl_FragColor = vec4(0.44, 0.63, 0.89, 0.5);\n' + /* test */
                    'gl_FragColor = vec4(color * color.b, color.b);\n' +
                    '} else if (fragMode == FRAGMODE_GROUND_PRIMARY) {\n' +
                    'gl_FragColor = vec4(primaryColor, 1.0);\n' +
                    '} else if (fragMode == FRAGMODE_GROUND_SECONDARY) {\n' +
                    'gl_FragColor = vec4(secondaryColor, 1.0);\n' +
                    '} else if (fragMode == FRAGMODE_GROUND_PRIMARY_TEX_BLEND) {\n' +
                    'vec4 texColor = texture2D(texSampler, texCoord);\n' +
                    'gl_FragColor = vec4(primaryColor + texColor.rgb * (1.0 - secondaryColor), 1.0);\n' +
                    '} else {\n' +
                    'gl_FragColor = vec4(1.0);\n' +
                    '}\n' +
                    '}';

            // Call to the superclass, which performs shader program compiling and linking.
            GpuProgram.call(this, gl, vertexShaderSource, fragmentShaderSource, ["vertexPoint", "vertexTexCoord"]);

            this.FRAGMODE_SKY = 1;
            this.FRAGMODE_GROUND_PRIMARY = 2;
            this.FRAGMODE_GROUND_SECONDARY = 3;
            this.FRAGMODE_GROUND_PRIMARY_TEX_BLEND = 4;

            this.altitude = 160000;

            this.invWavelength = new Vec3(
                1 / Math.pow(0.650, 4),  // 650 nm for red
                1 / Math.pow(0.570, 4),  // 570 nm for green
                1 / Math.pow(0.475, 4)); // 475 nm for blue

            this.rayleighScaleDepth = 0.25;

            this.Kr = 0.0025;        // Rayleigh scattering constant

            this.Km = 0.0010;        // Mie scattering constant

            this.ESun = 20.0;        // Sun brightness constant

            this.g = -0.990;        // The Mie phase asymmetry factor

            this.exposure = 2;


            this.fragModeLocation = this.uniformLocation(gl, "fragMode");
            gl.uniform1i(this.fragModeLocation, this.FRAGMODE_SKY);

            this.mvpMatrixLocation = this.uniformLocation(gl, "mvpMatrix");
            this.loadModelviewProjection(gl, new Matrix.fromIdentity());

            this.texCoordMatrixLocation = this.uniformLocation(gl, "texCoordMatrix");
            var texCoordInit = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            gl.uniformMatrix3fv(this.texCoordMatrixLocation, false, texCoordInit);

            this.texSamplerLocation = this.uniformLocation(gl, "texSampler");
            gl.uniform1i(this.texSamplerLocation, 0);

            this.vertexOriginLocation = this.uniformLocation(gl, "vertexOrigin");
            var vertexOriginInit = [0, 0, 0];
            gl.uniform3fv(this.vertexOriginLocation, vertexOriginInit);

            this.eyePointLocation = this.uniformLocation(gl, "eyePoint");
            var eyePointInit = [0, 0, 0];
            gl.uniform3fv(this.eyePointLocation, eyePointInit);

            this.eyeMagnitudeLocation = this.uniformLocation(gl, "eyeMagnitude");
            gl.uniform1f(this.eyeMagnitudeLocation, 0);

            this.eyeMagnitude2Location = this.uniformLocation(gl, "eyeMagnitude2");
            gl.uniform1f(this.eyeMagnitude2Location, 0);

            this.lightDirectionLocation = this.uniformLocation(gl, "lightDirection");
            var lightDirectionInit = [0, 0, 0];
            gl.uniform3fv(this.lightDirectionLocation, lightDirectionInit);

            this.invWavelengthLocation = this.uniformLocation(gl, "invWavelength");
            var invWavelengthInit = [
                1 / Math.pow(0.650, 4),  // 650 nm for red
                1 / Math.pow(0.570, 4),  // 570 nm for green
                1 / Math.pow(0.475, 4)];
            gl.uniform3fv(this.invWavelengthLocation, invWavelengthInit);

            this.atmosphereRadiusLocation = this.uniformLocation(gl, "atmosphereRadius");
            gl.uniform1f(this.atmosphereRadiusLocation, 0);

            this.atmosphereRadius2Location = this.uniformLocation(gl, "atmosphereRadius2");
            gl.uniform1f(this.atmosphereRadius2Location, 0);

            this.globeRadiusLocation = this.uniformLocation(gl, "globeRadius");
            gl.uniform1f(this.globeRadiusLocation, 0);

            this.KrESunLocation = this.uniformLocation(gl, "KrESun");
            gl.uniform1f(this.KrESunLocation, this.Kr * this.ESun);

            this.KmESunLocation = this.uniformLocation(gl, "KmESun");
            gl.uniform1f(this.KmESunLocation, this.Km * this.ESun);

            this.Kr4PILocation = this.uniformLocation(gl, "Kr4PI");
            gl.uniform1f(this.Kr4PILocation, this.Kr * 4 * Math.PI);

            this.Km4PILocation = this.uniformLocation(gl, "Km4PI");
            gl.uniform1f(this.Km4PILocation, this.Km * 4 * Math.PI);

            this.scaleLocation = this.uniformLocation(gl, "scale");
            gl.uniform1f(this.scaleLocation, 1 / this.altitude);

            this.scaleDepthLocation = this.uniformLocation(gl, "scaleDepth");
            gl.uniform1f(this.scaleDepthLocation, this.rayleighScaleDepth);

            this.scaleOverScaleDepthLocation = this.uniformLocation(gl, "scaleOverScaleDepth");
            gl.uniform1f(this.scaleOverScaleDepthLocation, (1 / this.altitude) / this.rayleighScaleDepth);

            this.gLocation = this.uniformLocation(gl, "g");
            gl.uniform1f(this.gLocation, this.g);

            this.g2Location = this.uniformLocation(gl, "g2");
            gl.uniform1f(this.g2Location, this.g * this.g);

            this.exposureLocation = this.uniformLocation(gl, "exposure");
            gl.uniform1f(this.exposureLocation, this.exposure);
        };

        AtmosphereProgram.key = "WorldWindGpuAtmosphereProgram";

        AtmosphereProgram.prototype = Object.create(GpuProgram.prototype);

        AtmosphereProgram.prototype.getAltitude = function () {
            return this.altitude;
        };

        AtmosphereProgram.prototype.loadFragMode = function (gl, fragMode) {
            gl.uniform1i(this.fragModeLocation, fragMode);
        };

        AtmosphereProgram.prototype.loadModelviewProjection = function (gl, matrix) {
            if (!matrix) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "AtmosphereProgram", "loadModelviewProjection", "missingMatrix"));
            }

            this.loadUniformMatrix(gl, matrix, this.mvpMatrixLocation);
        };

        AtmosphereProgram.prototype.loadTexCoordmatrix = function (gl, matrix) {
            //todo
            gl.uniformMatrix3fv(this.texCoordMatrixLocation, false, matrix); // ???
        };

        AtmosphereProgram.prototype.loadVertexOrigin = function (gl, vector) {
            if (!vector) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "AtmosphereProgram", "loadVertexOrigin", "missingVector"));
            }

            gl.uniform3fv(this.vertexOriginLocation, vector);
        }

        AtmosphereProgram.prototype.loadLightDirection = function (gl, vector) {
            if (!vector) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "AtmosphereProgram", "loadLightDirection", "missingVector"));
            }

            gl.uniform3fv(this.lightDirectionLocation, [vector[0], vector[1], vector[2]]);
        }

        AtmosphereProgram.prototype.loadEyePoint = function (gl, vector) {
            if (!vector) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "AtmosphereProgram", "loadEyePoint", "missingVector"));
            }

            gl.uniform3fv(this.eyePointLocation, [vector[0], vector[1], vector[2]]);
            gl.uniform1f(this.eyeMagnitudeLocation, vector.magnitude());
            gl.uniform1f(this.eyeMagnitude2Location, vector.magnitudeSquared());

        }

        AtmosphereProgram.prototype.loadGlobe = function (gl, globe) {
            if (!globe) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "AtmosphereProgram", "loadGlobe", "missingGlobe"));
            }

            var gr = globe.equatorialRadius;
            var ar = gr + this.altitude;

            gl.uniform1f(this.globeRadiusLocation, gr);
            gl.uniform1f(this.atmosphereRadiusLocation, ar);
            gl.uniform1f(this.atmosphereRadius2Location, ar * ar);
        }

        return AtmosphereProgram;
    });

