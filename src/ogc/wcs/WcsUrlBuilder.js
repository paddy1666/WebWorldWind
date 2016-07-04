/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports WcsUrlBuilder
 */
define([
        '../../error/ArgumentError',
        '../../util/Logger'
    ],
    function (ArgumentError,
              Logger) {
        "use strict";

        var WcsUrlBuilder = function (serviceAddress, coverageName, wcsVersion) {
            if (!serviceAddress || (serviceAddress.length === 0)) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "constructor",
                        "The WCS service address is missing."));
            }

            if (!coverageName || (coverageName.length === 0)) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "constructor",
                        "The WCS coverage name is missing."));
            }

            this.serviceAddress = serviceAddress;

            this.coverageName = coverageName;

            this.wcsVersion = (wcsVersion && wcsVersion.length > 0) ? wcsVersion : "1.0.0";

            this.crs = "EPSG:4326";
        };

        WcsUrlBuilder.prototype.urlForTile = function (tile, coverageFormat) {

            if (!tile) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "urlForTile", "missingTile"));
            }

            if (!coverageFormat) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "urlForTile",
                        "The coverage format is null or undefined."));
            }

            var sector = tile.sector;

            var sb = WcsUrlBuilder.fixGetCoverageString(this.serviceAddress);

            if (sb.search(/service=wcs/i) < 0) {
                sb = sb + "service=WCS";
            }

            sb = sb + "&request=GetCoverage";
            sb = sb + "&version=" + this.wcsVersion;
            sb = sb + "&coverage=" + this.coverageName;
            sb = sb + "&format=" + coverageFormat;
            sb = sb + "&width=" + tile.tileWidth;
            sb = sb + "&height=" + tile.tileHeight;

            sb = sb + "&crs=" + this.crs;
            sb = sb + "&bbox=";
            sb = sb + sector.minLongitude + "," + sector.minLatitude + ",";
            sb = sb + sector.maxLongitude + "," +sector. maxLatitude;

            return sb;
        };

        WcsUrlBuilder.prototype.urlForGetCoverage = function (coverageName, minLongitude, maxLongitude, minLatitude,
                                                              maxLatitude, width, height, coverageFormat) {
            var sb = WcsUrlBuilder.fixGetCoverageString(this.serviceAddress);

            if (sb.search(/service=wcs/i) < 0) {
                sb = sb + "service=WCS";
            }

            sb = sb + "&version=" + this.wcsVersion;
            sb = sb + "&request=GetCoverage";
            sb = sb + "&format=" + coverageFormat;
            sb = sb + "&coverage=" + coverageName;
            sb = sb + "&bbox=";
            sb = sb + minLongitude + "," + minLatitude + ",";
            sb = sb + maxLongitude + "," + maxLatitude;
            sb = sb + "&crs=" + this.crs;
            sb = sb + "&width=" + width;
            sb = sb + "&height=" + height;

            return sb;
        };

        WcsUrlBuilder.prototype.urlForGetCapabilities = function () {
            var sb = WcsUrlBuilder.fixGetCoverageString(this.serviceAddress);

            if (sb.search(/service=wcs/i) < 0) {
                sb = sb + "service=WCS";
            }

            sb = sb + "&request=GetCapabilities";

            return sb;
        };

        WcsUrlBuilder.fixGetCoverageString = function (serviceAddress) {
            if (!serviceAddress) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "fixGetCoverageString",
                        "The specified service address is null or undefined."));
            }

            var index = serviceAddress.indexOf("?");

            if (index < 0) { // if string contains no question mark
                serviceAddress = serviceAddress + "?"; // add one
            } else if (index !== serviceAddress.length - 1) { // else if question mark not at end of string
                index = serviceAddress.search(/&$/);
                if (index < 0) {
                    serviceAddress = serviceAddress + "&"; // add a parameter separator
                }
            }

            return serviceAddress;
        };

        return WcsUrlBuilder;
    });