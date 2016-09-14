/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports WfsUrlBuilder
 */
define([
        '../error/ArgumentError',
        '../util/Logger'
    ],
    function (ArgumentError,
              Logger) {
        "use strict";

        var WfsUrlBuilder = function (serviceAddress, wfsVersion) {
            if (!serviceAddress || (serviceAddress.length === 0)) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WfsUrlBuilder", "constructor",
                        "The WFS service address is missing."));
            }

            this.serviceAddress = serviceAddress;

            this.wfsVersion = (wfsVersion && wfsVersion.length > 0) ? wfsVersion : "1.0.0";

            this.crs = "EPSG:4326";
        };

        WfsUrlBuilder.prototype.urlForGetFeature = function (featureName, sector, outputFormat) {

            var sb = WfsUrlBuilder.fixGetMapString(this.serviceAddress);

            if (sb.search(/service=wfs/i) < 0) {
                sb = sb + "service=WFS";
            }

            sb = sb + "&request=GetFeature";
            sb = sb + "&version=" + this.wfsVersion;
            sb = sb + "&typeName=" + featureName;
            sb = sb + "&outputFormat=" + outputFormat;
            sb = sb + "&bbox=";
            sb = sb + sector.minLongitude + "," + sector.minLatitude + ",";
            sb = sb + sector.maxLongitude+ "," + sector.maxLatitude;

            sb = sb.replace(" ", "%20");

            return sb;
        };

        WfsUrlBuilder.fixGetMapString = function (serviceAddress) {
            if (!serviceAddress) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WfsUrlBuilder", "fixGetMapString",
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

        return WfsUrlBuilder;
    });