/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports KmlObject
 */
define([
    '../../error/ArgumentError',
    '../../util/extend',
    './KmlElements',
    '../../util/Logger',
    '../../util/Promise'
], function (ArgumentError,
             extend,
             KmlElements,
             Logger,
             Promise
) {
    "use strict";
    /**
     * Constructs an Kml object. Every node in the Kml document is either basic type or Kml object. Applications usually
     * don't call this constructor. It is usually called only by its descendants.
     * It should be treated as mixin.
     * @alias KmlObject
     * @classdesc Contains the data associated with every Kml object.
     * @param objectNode Node representing Kml Object
     * @constructor
     * @throws {ArgumentError} If either node is null or id isn't present on the object.
     * @see https://developers.google.com/kml/documentation/kmlreference#object
     */
    var KmlObject = function (objectNode) {
        if (!objectNode) {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, "KmlObject", "constructor", "Passed node isn't defined.")
            );
        }
        this._node = objectNode;
        this._shape = null;

        Object.defineProperties(this, {
            /**
             * Every object, which is part of the KML document has its identity. We will use it for changes in the document
             * for binding.
             * @memberof KmlObject.prototype
             * @type {Number}
             * @readonly
             */
            id: {
                get: function () {
                    return this.retrieve({
                        name: 'id',
                        isAttribute: true
                    });
                }
            },

            /**
             * Node of this object. It may be overridden by other users of some functions like parse.
             * @memberof KmlObject.prototype
             * @type {Node}
             * @readonly
             */
            node: {
                get: function () {
                    return this._node;
                }
            }
        });

        extend(this, KmlObject.prototype);
    };



    /**
     * It returns last node found with given name. It accepts array of possible node names
     * for the node.
     * @param options {Object} name: ['name', 'name2']
     * @returns {Node} Retrieved node or null, if none such node is found.
     */
    KmlObject.prototype.retrieveNode = function (options) {
        var nodes = this.retrieveNodes(options);
        if (nodes.length == 0) {
            return null;
        } else {
            return nodes[0];
        }
    };

    /**
     * It allows retrieval of attributes from any child node. If kml node contains another node, where the values
     * are given as attributes, this is way to go. It can retrieve the node and find the correct attribute on it.
     * @param options - name, attributeName
     * @returns {String | null} Either found value or null if such value doesn't exist.
     */
    KmlObject.prototype.retrieveAttribute = function (options) {
        if (!options.name || !options.attributeName) {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_WARNING, "KmlObject", "retrieveAttribute", "name and attributeName" +
                    " must be specified. Name: " + options.name + " Attribute Name: " + options.attributeName)
            );
        }
        var validNode = this.retrieveNode(options);
        if(this.doesAttributeExist(validNode, options.attributeName)) {
            return this.getValueOfAttribute(validNode, options.attributeName);
        }
        return null;
    };

    // Intenationally undocumented. Internal use only.
    KmlObject.prototype.doesAttributeExist = function (node, attribute) {
        return node.attributes && node.attributes && node.attributes.getNamedItem(attribute) &&
            node.attributes.getNamedItem(attribute).value
    };

    // Intenationally undocumented. Internal use only.
    KmlObject.prototype.getValueOfAttribute = function (node, attributeName) {
        return node.attributes.getNamedItem(attributeName).value
    };

    /**
     * It retrieves value based on the options. It support retrieving top level attribute as well as value of node.
     * @param options {Object} isAttribute: Boolean, name: String
     * @returns {String} Retrieved value of either node or attribute. If the node doesn't exist return null.
     */
    KmlObject.prototype.retrieve = function (options) {
        var self = this;
        var result = null;
        if (options.isAttribute && self.doesAttributeExist(self.node, options.name)) {
            result = self.getValueOfAttribute(self.node, options.name);
        } else {
            options.name = [options.name];
            result = self.retrieveNode(options);
            if (result != null && result.childNodes[0]) {
                result = result.childNodes[0].nodeValue;
            } else if (result != null) {
                result = "";
            }
        }

        if (options.transformer && result != null) {
            result = options.transformer(result);
        }

        return result;
    };

    /**
     * It retrieves all nodes with names in the options.name
     * @param options {Object} name: Array
     * @returns {Array} Array of nodes with given names. If there is no such node empty array is returned.
     */
    KmlObject.prototype.retrieveNodes = function (options) {
        var self = this;
        var result = [];
        [].forEach.call(self.node.childNodes, function (node) {
            if (options.name.indexOf(node.nodeName) != -1) {
                result.push(node);
            }
        });

        return result;
    };

    /**
     * Retrieve all shapes, which are children of current node. It fails if there is some element for which there is no
     * adequate internal representation.
     * @returns {Array} Array of retrieved shapes.
     */
    KmlObject.prototype.parse = function (options) {
        var self = this;
        var node = options && options.node || self.node;
        var shapes = [];
        [].forEach.call(node.childNodes, function (node) {
            if (node.nodeType != 1) {
                return;
            }

            var constructor = self.retrieveElementForNode(node.nodeName);
            if (constructor == null) {
                Logger.logMessage(Logger.LEVEL_WARNING, "KmlObject", "parse", "Element, which doesn't have internal " +
                        "representation. Node name: " + node.nodeName);
                return;
            }
            var style = new Promise(function(resolve, reject){
                if(self.getStyle) {
                    resolve(self.getStyle());
                } else {
                    // Maybe reject. We will see later.
                    resolve({});
                }
            });
            shapes.push(new constructor(node, style));
        });

        return shapes;
    };

    /**
     * It returns either associated shape for given element or null, if no such node exist.
     * @param name Name of the element.
     * @returns {KmlObject|null}
     */
    KmlObject.prototype.retrieveElementForNode = function (name) {
        return KmlElements.getKey(name) || null;
    };

    /**
     * Create correct child element for node retrieve by the options.
     * @param options {Object} name: Array
     * @returns {KmlObject|null}
     */
    KmlObject.prototype.createChildElement = function (options) {
        var node = this.retrieveNode(options);
        if(node == null) {
            return null;
        }
        var constructor = this.retrieveElementForNode(node.nodeName);
        return new constructor(node, this.getStyle());
    };

    /**
     * To be overridden in subclasses.
     * It is prepared to update the current state of renderables in the KML tree.
     */
    KmlObject.prototype.update = function () {
        Logger.logMessage(Logger.LEVEL_WARNING, "KmlObject", "update", this.getTagNames()[0] + " doesn't yet support " +
            "rendering.");
    };

    // To be overriden in descendants.
    KmlObject.prototype.getStyle = function() {
        Logger.logMessage(Logger.LEVEL_WARNING, "KmlObject", "getStyle", this.getTagNames()[0] + " doesn't override  " +
            "getStyle.");
    };

    return KmlObject;
});