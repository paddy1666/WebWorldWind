/*
 * Copyright (C) 2015 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports WcsCoverageSummaryCapabilities
 */
define([
        '../../error/ArgumentError',
        '../../util/Logger',
        '../../ogc/OwsLanguageString'
    ],
    function (ArgumentError,
              Logger,
              OwsLanguageString) {
        "use strict";

        var WcsCoverageSummaryCapabilities = function (coverageSummaryElement, capabilities) {
            if (!coverageSummaryElement) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsCoverageSummaryCapabilities", "constructor", "missingDomElement"));
            }

            this.capabilities = capabilities;

            this.identifier;

            this.title;

            this.abstract;

            this.wgs84BoundingBox;

            this.boundingBox;

            this.assembleCoverageSummary(coverageSummaryElement);
        };

        WcsCoverageSummaryCapabilities.prototype.assembleCoverageSummary = function (element) {
            var children = element.children || element.childNodes;
            for (var c = 0; c < children.length; c++) {
                var child = children[c];

                if (child.localName === "Identifier") {
                    this.identifier = child.textContent;
                } else if (child.localName === "Title") {
                    this.title = this.title || [];
                    this.title.push(new OwsLanguageString(child));
                } else if (child.localName === "Abstract") {
                    this.abstract = this.abstract || [];
                    this.abstract.push(new OwsLanguageString(child));
                } else if (child.localName === "WGS84BoundingBox") {
                    this.wgs84BoundingBox = WcsCoverageSummaryCapabilities.assembleBoundingBox(child);
                } else if (child.localName === "BoundingBox") {
                    this.boundingBox = this.boundingBox || [];
                    this.boundingBox.push(WcsCoverageSummaryCapabilities.assembleBoundingBox(child));
                }
            }
        };

        WcsCoverageSummaryCapabilities.assembleBoundingBox = function (element) {
            var result = {};

            var crs = element.getAttribute("crs");
            if (crs) {
                result.crs = crs;
            }

            var children = element.children || element.childNodes;
            for (var c = 0; c < children.length; c++) {
                var child = children[c];

                if (child.localName === "LowerCorner") {
                    var lc = child.textContent.split(" ");
                    result.lowerCorner = [parseFloat(lc[0]), parseFloat(lc[1])];
                } else if (child.localName === "UpperCorner") {
                    var uc = child.textContent.split(" ");
                    result.upperCorner = [parseFloat(uc[0]), parseFloat(uc[1])];
                }
            }

            return result;
        };

        return WcsCoverageSummaryCapabilities;
    }
);