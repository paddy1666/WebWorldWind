/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * It is basically a collection of KmlRecords.
 * @exports KmlParser
 */
define([
        '../../error/ArgumentError',
        '../../util/jszip',
        '../../util/Logger',
        '../../util/Promise',
        '../../util/Remote',
        '../../util/XmlDocument',
        './KmlElements',
        './KmlObject'
    ],
    function(
        ArgumentError,
        JsZip,
        Logger,
        Promise,
        Remote,
        XmlDocument,
        KmlElements,
        KmlObject
    ){
        "use strict";

        /**
         * Constructs an object for Kml file. Applications usually don't call this constructor.
         * Parses associated KmlFile and allows user to draw the whole KmlFile in passed layer. The whole file is
         * rendered in one Layer.
         * @constructor
         * @param {Object} Different options specifying how will the file behave.
         * @alias KmlFile
         * @classdesc Support for Kml File parsing and display.
         */
        var KmlFile = function(options) {
            var self = this;
            if(!options || (!options.document && !options.url)) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "KmlFile", "constructor", "invalidDocumentPassed")
                );
            }

            // Default values.
            options.local = options.local || false;

            if(options.local) {
                this._document = new XmlDocument(options.document).dom();
                return new Promise(function(resolve, reject) {
                    window.setTimeout(function(){
                        resolve(self);
                    }, 0);
                });
            } else {
                // Load the document
                return new Promise(function(resolve, reject){
                    var promise = self.requestUrl(options.url);
                    promise.then(function(loadedDocument){
                        var rootDocument;
                        if(options.url.indexOf('.kmz') == -1) {
                            rootDocument = loadedDocument;
                        } else {
                            var kmzFile = new JsZip();
                            kmzFile.load(loadedDocument);
                            kmzFile.files.forEach(function (file) {
                                if (file.endsWith(".kml") && rootDocument == null) {
                                    rootDocument = file.asText();
                                }
                            });
                        }
                        self._document = new XmlDocument(rootDocument).dom();
                        window.setTimeout(function(){
                            resolve(self);
                        }, 0);
                    });


                });
            }
        };

        Object.defineProperties(KmlFile.prototype, {
            /**
             * Contains shapes present in the document. Cache so that we don't need to parse the document every time
             * it is passed through.
             * @type {Array}
             * @memberof KmlFile.prototype
             * @readonly
             */
            shapes: {
                get: function() {
                    return this.parseDocument();
                }
            },

            /**
             * Root node of current document associated with this file.
             * @type {Node}
             * @memberof KmlFile.prototype
             * @readonly
             */
            node: {
                get: function() {
                    return this._document.getElementsByTagName("kml")[0];
                }
            }
        });

        /**
         * @see KmlObject.prototype.parse
         */
        KmlFile.prototype.parseDocument = function() {
            return KmlObject.prototype.parse.call(this);
        };

        /**
         * It understands the name of the node and based on this name returns correct shape, which must be instantiated.
         * @param name
         * @returns {KmlObject} Descendant of KmlObject or null if none with given name exists.
         */
        KmlFile.prototype.retrieveElementForNode = KmlObject.prototype.retrieveElementForNode;

        /**
         * It renders all shapes, which are associated with current file.
         * @param layer
         */
        KmlFile.prototype.update = function(layer) {
            if(!layer) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "KmlFile", "update", "Layer must be defined in order to update document.")
                );
            }

            this.shapes.forEach(function(shape){
                shape.update(layer);
            });
        };

        KmlFile.prototype.requestUrl = function(url, options) {
            options.url = url;
            if(url.endsWith(".kmz")) {
                options.zip = true;
            } else {
                options.ajax = true;
            }

            return new Remote(options);
        };

         return KmlFile;
});