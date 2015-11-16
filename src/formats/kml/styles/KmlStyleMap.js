/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([
    '../../../util/extend',
    '../KmlElements',
    './KmlSubStyle',
    '../util/Pair',
    '../../../util/Promise'
], function (extend,
             KmlElements,
             KmlSubStyle,
             Pair,
             Promise) {
    "use strict";
    /**
     * Constructs an KmlStyleMap. Applications usually don't call this constructor. It is called by {@link KmlFile} as
     * objects from Kml file are read. This object is already concrete implementation.
     * @alias KmlStyleMap
     * @classdesc Contains the data associated with StyleMap node.
     * @param node {Node} Node representing style map in the document.
     * @constructor
     * @throws {ArgumentError} If the node is null or undefined.
     * @see https://developers.google.com/kml/documentation/kmlreference#stylemap
     */
    var KmlStyleMap = function (node) {
        KmlSubStyle.call(this, node);

        Object.defineProperties(this, {
            /**
             * Defines a key/value pair that maps a mode (normal or highlight) to the predefined &lt;styleUrl&gt;.
             * &lt;Pair&gt;
             * contains two elements (both are required):
             * &lt;key&gt;, which identifies the key
             * &lt;styleUrl&gt; or &lt;Style&gt;, which references the style. In &lt;styleUrl&gt;, for referenced style elements that are
             *  local to the KML document, a simple # referencing is used. For styles that are contained in external
             * files, use a full URL along with # referencing.
             * @memberof KmlStyleMap.prototype
             * @readonly
             * @type {Pair[]}
             */
            kmlPairs: {
                get: function () {
                    return this.parse();
                }
            },

            isMap: {
                get: function() {
                    return true;
                }
            }
        });

        extend(this, KmlStyleMap.prototype);
    };

    KmlStyleMap.prototype.resolve = function(resolve, reject) {
        // Create promise which resolves, when all styles are resolved.
        var self = this;
        var results = {};
        var promises = [];
        var pairs = self.kmlPairs;
        pairs.forEach(function(pair) {
            var key = pair.kmlKey;
            var style = pair.getStyle();
            promises.push(style);
            style.then(function(pStyle){
                results[key] = pStyle.normal;
            });
        });

        var compoundPromise = Promise.all(promises);
        compoundPromise.then(function(){
            if(!results['normal']){
                results['normal'] = null;
            }

            if(!results['highlight']){
                results['highlight'] =  null;
            }

            resolve(results);
        });
    };

    /**
     * Returns tag name of this Node.
     * @returns {String[]}
     */
    KmlStyleMap.prototype.getTagNames = function() {
        return ['StyleMap'];
    };

    KmlElements.addKey(KmlStyleMap.prototype.getTagNames()[0], KmlStyleMap);

    return KmlStyleMap;
});