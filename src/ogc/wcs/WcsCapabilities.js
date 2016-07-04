/*
 * Copyright (C) 2015 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports WcsCapabilities
 */
define([
        '../../error/ArgumentError',
        '../../util/Logger',
        '../../ogc/OwsLanguageString',
        '../../ogc/OwsOperationsMetadata',
        '../../ogc/OwsServiceIdentification',
        '../../ogc/OwsServiceProvider',
        './WcsCoverageSummaryCapabilities'
    ],
    function (ArgumentError,
              Logger,
              OwsLanguageString,
              OwsOperationsMetadata,
              OwsServiceIdentification,
              OwsServiceProvider,
              WcsCoverageSummaryCapabilities) {
        "use strict";

        WcsCapabilities.prototype.assembleDocument = function (dom) {
            var root = dom.documentElement;

            var children = root.children || root.childNodes;
            for (var c = 0; c < children.length; c++) {
                var child = children[c];
                if (child.localName === "ServiceIdentification") {
                    this.serviceIdentification = new OwsServiceIdentification(child);
                } else if (child.localName === "ServiceProvider") {
                    this.serviceProvider = new OwsServiceProvider(child);
                } else if (child.localName === "OperationsMetadata") {
                    this.operationsMetadata = new OwsOperationsMetadata(child);
                } else if (child.localName === "Contents") {
                    this.contents = this.assembleContents(child);
                }
            }
        };

        WcsCapabilities.prototype.assembleContents = function (element) {
            var contents = {};

            var children = element.children || element.childNodes;
            for (var c = 0; c < children.length; c++) {
                var child = children[c];

                if (child.localName === "CoverageSummary") {

                    contents.coverageSummary = contents.coverageSummary || [];
                    try{
                        contents.coverageSummary.push(new WcsCoverageSummaryCapabilities(child, this));
                    } catch (e) {
                        Logger.logMessage(Logger.LEVEL_SEVERE, "WcsCapabilities", "constructor",
                            "Exception reading WCS coverage summary description: " + e.message);
                    }
                }
            }

            return contents;
        };

        return WcsCapabilities;
    });
