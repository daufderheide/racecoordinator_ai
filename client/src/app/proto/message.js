/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const com = $root.com = (() => {

    /**
     * Namespace com.
     * @exports com
     * @namespace
     */
    const com = {};

    com.antigravity = (function() {

        /**
         * Namespace antigravity.
         * @memberof com
         * @namespace
         */
        const antigravity = {};

        antigravity.InitializeRaceRequest = (function() {

            /**
             * Properties of an InitializeRaceRequest.
             * @memberof com.antigravity
             * @interface IInitializeRaceRequest
             * @property {string|null} [raceId] InitializeRaceRequest raceId
             * @property {Array.<string>|null} [driverIds] InitializeRaceRequest driverIds
             * @property {boolean|null} [isDemoMode] InitializeRaceRequest isDemoMode
             */

            /**
             * Constructs a new InitializeRaceRequest.
             * @memberof com.antigravity
             * @classdesc Represents an InitializeRaceRequest.
             * @implements IInitializeRaceRequest
             * @constructor
             * @param {com.antigravity.IInitializeRaceRequest=} [properties] Properties to set
             */
            function InitializeRaceRequest(properties) {
                this.driverIds = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InitializeRaceRequest raceId.
             * @member {string} raceId
             * @memberof com.antigravity.InitializeRaceRequest
             * @instance
             */
            InitializeRaceRequest.prototype.raceId = "";

            /**
             * InitializeRaceRequest driverIds.
             * @member {Array.<string>} driverIds
             * @memberof com.antigravity.InitializeRaceRequest
             * @instance
             */
            InitializeRaceRequest.prototype.driverIds = $util.emptyArray;

            /**
             * InitializeRaceRequest isDemoMode.
             * @member {boolean} isDemoMode
             * @memberof com.antigravity.InitializeRaceRequest
             * @instance
             */
            InitializeRaceRequest.prototype.isDemoMode = false;

            /**
             * Creates a new InitializeRaceRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {com.antigravity.IInitializeRaceRequest=} [properties] Properties to set
             * @returns {com.antigravity.InitializeRaceRequest} InitializeRaceRequest instance
             */
            InitializeRaceRequest.create = function create(properties) {
                return new InitializeRaceRequest(properties);
            };

            /**
             * Encodes the specified InitializeRaceRequest message. Does not implicitly {@link com.antigravity.InitializeRaceRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {com.antigravity.IInitializeRaceRequest} message InitializeRaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeRaceRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.raceId != null && Object.hasOwnProperty.call(message, "raceId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.raceId);
                if (message.driverIds != null && message.driverIds.length)
                    for (let i = 0; i < message.driverIds.length; ++i)
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.driverIds[i]);
                if (message.isDemoMode != null && Object.hasOwnProperty.call(message, "isDemoMode"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.isDemoMode);
                return writer;
            };

            /**
             * Encodes the specified InitializeRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.InitializeRaceRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {com.antigravity.IInitializeRaceRequest} message InitializeRaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeRaceRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeRaceRequest} InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeRaceRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.InitializeRaceRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.raceId = reader.string();
                            break;
                        }
                    case 2: {
                            if (!(message.driverIds && message.driverIds.length))
                                message.driverIds = [];
                            message.driverIds.push(reader.string());
                            break;
                        }
                    case 3: {
                            message.isDemoMode = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeRaceRequest} InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeRaceRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InitializeRaceRequest message.
             * @function verify
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InitializeRaceRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.raceId != null && message.hasOwnProperty("raceId"))
                    if (!$util.isString(message.raceId))
                        return "raceId: string expected";
                if (message.driverIds != null && message.hasOwnProperty("driverIds")) {
                    if (!Array.isArray(message.driverIds))
                        return "driverIds: array expected";
                    for (let i = 0; i < message.driverIds.length; ++i)
                        if (!$util.isString(message.driverIds[i]))
                            return "driverIds: string[] expected";
                }
                if (message.isDemoMode != null && message.hasOwnProperty("isDemoMode"))
                    if (typeof message.isDemoMode !== "boolean")
                        return "isDemoMode: boolean expected";
                return null;
            };

            /**
             * Creates an InitializeRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.InitializeRaceRequest} InitializeRaceRequest
             */
            InitializeRaceRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.InitializeRaceRequest)
                    return object;
                let message = new $root.com.antigravity.InitializeRaceRequest();
                if (object.raceId != null)
                    message.raceId = String(object.raceId);
                if (object.driverIds) {
                    if (!Array.isArray(object.driverIds))
                        throw TypeError(".com.antigravity.InitializeRaceRequest.driverIds: array expected");
                    message.driverIds = [];
                    for (let i = 0; i < object.driverIds.length; ++i)
                        message.driverIds[i] = String(object.driverIds[i]);
                }
                if (object.isDemoMode != null)
                    message.isDemoMode = Boolean(object.isDemoMode);
                return message;
            };

            /**
             * Creates a plain object from an InitializeRaceRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {com.antigravity.InitializeRaceRequest} message InitializeRaceRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InitializeRaceRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.driverIds = [];
                if (options.defaults) {
                    object.raceId = "";
                    object.isDemoMode = false;
                }
                if (message.raceId != null && message.hasOwnProperty("raceId"))
                    object.raceId = message.raceId;
                if (message.driverIds && message.driverIds.length) {
                    object.driverIds = [];
                    for (let j = 0; j < message.driverIds.length; ++j)
                        object.driverIds[j] = message.driverIds[j];
                }
                if (message.isDemoMode != null && message.hasOwnProperty("isDemoMode"))
                    object.isDemoMode = message.isDemoMode;
                return object;
            };

            /**
             * Converts this InitializeRaceRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.InitializeRaceRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InitializeRaceRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InitializeRaceRequest
             * @function getTypeUrl
             * @memberof com.antigravity.InitializeRaceRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InitializeRaceRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.InitializeRaceRequest";
            };

            return InitializeRaceRequest;
        })();

        antigravity.InitializeRaceResponse = (function() {

            /**
             * Properties of an InitializeRaceResponse.
             * @memberof com.antigravity
             * @interface IInitializeRaceResponse
             * @property {boolean|null} [success] InitializeRaceResponse success
             * @property {string|null} [message] InitializeRaceResponse message
             */

            /**
             * Constructs a new InitializeRaceResponse.
             * @memberof com.antigravity
             * @classdesc Represents an InitializeRaceResponse.
             * @implements IInitializeRaceResponse
             * @constructor
             * @param {com.antigravity.IInitializeRaceResponse=} [properties] Properties to set
             */
            function InitializeRaceResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InitializeRaceResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.InitializeRaceResponse
             * @instance
             */
            InitializeRaceResponse.prototype.success = false;

            /**
             * InitializeRaceResponse message.
             * @member {string} message
             * @memberof com.antigravity.InitializeRaceResponse
             * @instance
             */
            InitializeRaceResponse.prototype.message = "";

            /**
             * Creates a new InitializeRaceResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {com.antigravity.IInitializeRaceResponse=} [properties] Properties to set
             * @returns {com.antigravity.InitializeRaceResponse} InitializeRaceResponse instance
             */
            InitializeRaceResponse.create = function create(properties) {
                return new InitializeRaceResponse(properties);
            };

            /**
             * Encodes the specified InitializeRaceResponse message. Does not implicitly {@link com.antigravity.InitializeRaceResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {com.antigravity.IInitializeRaceResponse} message InitializeRaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeRaceResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified InitializeRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.InitializeRaceResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {com.antigravity.IInitializeRaceResponse} message InitializeRaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeRaceResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeRaceResponse} InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeRaceResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.InitializeRaceResponse();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.success = reader.bool();
                            break;
                        }
                    case 2: {
                            message.message = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeRaceResponse} InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeRaceResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InitializeRaceResponse message.
             * @function verify
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InitializeRaceResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.success != null && message.hasOwnProperty("success"))
                    if (typeof message.success !== "boolean")
                        return "success: boolean expected";
                if (message.message != null && message.hasOwnProperty("message"))
                    if (!$util.isString(message.message))
                        return "message: string expected";
                return null;
            };

            /**
             * Creates an InitializeRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.InitializeRaceResponse} InitializeRaceResponse
             */
            InitializeRaceResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.InitializeRaceResponse)
                    return object;
                let message = new $root.com.antigravity.InitializeRaceResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from an InitializeRaceResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {com.antigravity.InitializeRaceResponse} message InitializeRaceResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InitializeRaceResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.success = false;
                    object.message = "";
                }
                if (message.success != null && message.hasOwnProperty("success"))
                    object.success = message.success;
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                return object;
            };

            /**
             * Converts this InitializeRaceResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.InitializeRaceResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InitializeRaceResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InitializeRaceResponse
             * @function getTypeUrl
             * @memberof com.antigravity.InitializeRaceResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InitializeRaceResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.InitializeRaceResponse";
            };

            return InitializeRaceResponse;
        })();

        antigravity.StartRaceRequest = (function() {

            /**
             * Properties of a StartRaceRequest.
             * @memberof com.antigravity
             * @interface IStartRaceRequest
             */

            /**
             * Constructs a new StartRaceRequest.
             * @memberof com.antigravity
             * @classdesc Represents a StartRaceRequest.
             * @implements IStartRaceRequest
             * @constructor
             * @param {com.antigravity.IStartRaceRequest=} [properties] Properties to set
             */
            function StartRaceRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new StartRaceRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {com.antigravity.IStartRaceRequest=} [properties] Properties to set
             * @returns {com.antigravity.StartRaceRequest} StartRaceRequest instance
             */
            StartRaceRequest.create = function create(properties) {
                return new StartRaceRequest(properties);
            };

            /**
             * Encodes the specified StartRaceRequest message. Does not implicitly {@link com.antigravity.StartRaceRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {com.antigravity.IStartRaceRequest} message StartRaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StartRaceRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified StartRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.StartRaceRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {com.antigravity.IStartRaceRequest} message StartRaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StartRaceRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a StartRaceRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.StartRaceRequest} StartRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StartRaceRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.StartRaceRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a StartRaceRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.StartRaceRequest} StartRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StartRaceRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a StartRaceRequest message.
             * @function verify
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            StartRaceRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a StartRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.StartRaceRequest} StartRaceRequest
             */
            StartRaceRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.StartRaceRequest)
                    return object;
                return new $root.com.antigravity.StartRaceRequest();
            };

            /**
             * Creates a plain object from a StartRaceRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {com.antigravity.StartRaceRequest} message StartRaceRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            StartRaceRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this StartRaceRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.StartRaceRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            StartRaceRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for StartRaceRequest
             * @function getTypeUrl
             * @memberof com.antigravity.StartRaceRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            StartRaceRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.StartRaceRequest";
            };

            return StartRaceRequest;
        })();

        antigravity.StartRaceResponse = (function() {

            /**
             * Properties of a StartRaceResponse.
             * @memberof com.antigravity
             * @interface IStartRaceResponse
             * @property {boolean|null} [success] StartRaceResponse success
             * @property {string|null} [message] StartRaceResponse message
             */

            /**
             * Constructs a new StartRaceResponse.
             * @memberof com.antigravity
             * @classdesc Represents a StartRaceResponse.
             * @implements IStartRaceResponse
             * @constructor
             * @param {com.antigravity.IStartRaceResponse=} [properties] Properties to set
             */
            function StartRaceResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * StartRaceResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.StartRaceResponse
             * @instance
             */
            StartRaceResponse.prototype.success = false;

            /**
             * StartRaceResponse message.
             * @member {string} message
             * @memberof com.antigravity.StartRaceResponse
             * @instance
             */
            StartRaceResponse.prototype.message = "";

            /**
             * Creates a new StartRaceResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {com.antigravity.IStartRaceResponse=} [properties] Properties to set
             * @returns {com.antigravity.StartRaceResponse} StartRaceResponse instance
             */
            StartRaceResponse.create = function create(properties) {
                return new StartRaceResponse(properties);
            };

            /**
             * Encodes the specified StartRaceResponse message. Does not implicitly {@link com.antigravity.StartRaceResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {com.antigravity.IStartRaceResponse} message StartRaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StartRaceResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified StartRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.StartRaceResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {com.antigravity.IStartRaceResponse} message StartRaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StartRaceResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a StartRaceResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.StartRaceResponse} StartRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StartRaceResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.StartRaceResponse();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.success = reader.bool();
                            break;
                        }
                    case 2: {
                            message.message = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a StartRaceResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.StartRaceResponse} StartRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StartRaceResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a StartRaceResponse message.
             * @function verify
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            StartRaceResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.success != null && message.hasOwnProperty("success"))
                    if (typeof message.success !== "boolean")
                        return "success: boolean expected";
                if (message.message != null && message.hasOwnProperty("message"))
                    if (!$util.isString(message.message))
                        return "message: string expected";
                return null;
            };

            /**
             * Creates a StartRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.StartRaceResponse} StartRaceResponse
             */
            StartRaceResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.StartRaceResponse)
                    return object;
                let message = new $root.com.antigravity.StartRaceResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a StartRaceResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {com.antigravity.StartRaceResponse} message StartRaceResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            StartRaceResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.success = false;
                    object.message = "";
                }
                if (message.success != null && message.hasOwnProperty("success"))
                    object.success = message.success;
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                return object;
            };

            /**
             * Converts this StartRaceResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.StartRaceResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            StartRaceResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for StartRaceResponse
             * @function getTypeUrl
             * @memberof com.antigravity.StartRaceResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            StartRaceResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.StartRaceResponse";
            };

            return StartRaceResponse;
        })();

        antigravity.RaceTime = (function() {

            /**
             * Properties of a RaceTime.
             * @memberof com.antigravity
             * @interface IRaceTime
             * @property {number|null} [time] RaceTime time
             */

            /**
             * Constructs a new RaceTime.
             * @memberof com.antigravity
             * @classdesc Represents a RaceTime.
             * @implements IRaceTime
             * @constructor
             * @param {com.antigravity.IRaceTime=} [properties] Properties to set
             */
            function RaceTime(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RaceTime time.
             * @member {number} time
             * @memberof com.antigravity.RaceTime
             * @instance
             */
            RaceTime.prototype.time = 0;

            /**
             * Creates a new RaceTime instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {com.antigravity.IRaceTime=} [properties] Properties to set
             * @returns {com.antigravity.RaceTime} RaceTime instance
             */
            RaceTime.create = function create(properties) {
                return new RaceTime(properties);
            };

            /**
             * Encodes the specified RaceTime message. Does not implicitly {@link com.antigravity.RaceTime.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {com.antigravity.IRaceTime} message RaceTime message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceTime.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                    writer.uint32(/* id 1, wireType 5 =*/13).float(message.time);
                return writer;
            };

            /**
             * Encodes the specified RaceTime message, length delimited. Does not implicitly {@link com.antigravity.RaceTime.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {com.antigravity.IRaceTime} message RaceTime message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceTime.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RaceTime message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RaceTime} RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceTime.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RaceTime();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.time = reader.float();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a RaceTime message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceTime} RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceTime.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RaceTime message.
             * @function verify
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RaceTime.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.time != null && message.hasOwnProperty("time"))
                    if (typeof message.time !== "number")
                        return "time: number expected";
                return null;
            };

            /**
             * Creates a RaceTime message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RaceTime} RaceTime
             */
            RaceTime.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RaceTime)
                    return object;
                let message = new $root.com.antigravity.RaceTime();
                if (object.time != null)
                    message.time = Number(object.time);
                return message;
            };

            /**
             * Creates a plain object from a RaceTime message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {com.antigravity.RaceTime} message RaceTime
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RaceTime.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.time = 0;
                if (message.time != null && message.hasOwnProperty("time"))
                    object.time = options.json && !isFinite(message.time) ? String(message.time) : message.time;
                return object;
            };

            /**
             * Converts this RaceTime to JSON.
             * @function toJSON
             * @memberof com.antigravity.RaceTime
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RaceTime.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RaceTime
             * @function getTypeUrl
             * @memberof com.antigravity.RaceTime
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RaceTime.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RaceTime";
            };

            return RaceTime;
        })();

        antigravity.Lap = (function() {

            /**
             * Properties of a Lap.
             * @memberof com.antigravity
             * @interface ILap
             * @property {number|null} [lane] Lap lane
             * @property {number|null} [lapTime] Lap lapTime
             */

            /**
             * Constructs a new Lap.
             * @memberof com.antigravity
             * @classdesc Represents a Lap.
             * @implements ILap
             * @constructor
             * @param {com.antigravity.ILap=} [properties] Properties to set
             */
            function Lap(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Lap lane.
             * @member {number} lane
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.lane = 0;

            /**
             * Lap lapTime.
             * @member {number} lapTime
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.lapTime = 0;

            /**
             * Creates a new Lap instance using the specified properties.
             * @function create
             * @memberof com.antigravity.Lap
             * @static
             * @param {com.antigravity.ILap=} [properties] Properties to set
             * @returns {com.antigravity.Lap} Lap instance
             */
            Lap.create = function create(properties) {
                return new Lap(properties);
            };

            /**
             * Encodes the specified Lap message. Does not implicitly {@link com.antigravity.Lap.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.Lap
             * @static
             * @param {com.antigravity.ILap} message Lap message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Lap.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.lane != null && Object.hasOwnProperty.call(message, "lane"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.lane);
                if (message.lapTime != null && Object.hasOwnProperty.call(message, "lapTime"))
                    writer.uint32(/* id 2, wireType 5 =*/21).float(message.lapTime);
                return writer;
            };

            /**
             * Encodes the specified Lap message, length delimited. Does not implicitly {@link com.antigravity.Lap.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.Lap
             * @static
             * @param {com.antigravity.ILap} message Lap message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Lap.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Lap message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.Lap
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.Lap} Lap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Lap.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.Lap();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.lane = reader.int32();
                            break;
                        }
                    case 2: {
                            message.lapTime = reader.float();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Lap message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.Lap
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.Lap} Lap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Lap.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Lap message.
             * @function verify
             * @memberof com.antigravity.Lap
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Lap.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.lane != null && message.hasOwnProperty("lane"))
                    if (!$util.isInteger(message.lane))
                        return "lane: integer expected";
                if (message.lapTime != null && message.hasOwnProperty("lapTime"))
                    if (typeof message.lapTime !== "number")
                        return "lapTime: number expected";
                return null;
            };

            /**
             * Creates a Lap message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.Lap
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.Lap} Lap
             */
            Lap.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.Lap)
                    return object;
                let message = new $root.com.antigravity.Lap();
                if (object.lane != null)
                    message.lane = object.lane | 0;
                if (object.lapTime != null)
                    message.lapTime = Number(object.lapTime);
                return message;
            };

            /**
             * Creates a plain object from a Lap message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.Lap
             * @static
             * @param {com.antigravity.Lap} message Lap
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Lap.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.lane = 0;
                    object.lapTime = 0;
                }
                if (message.lane != null && message.hasOwnProperty("lane"))
                    object.lane = message.lane;
                if (message.lapTime != null && message.hasOwnProperty("lapTime"))
                    object.lapTime = options.json && !isFinite(message.lapTime) ? String(message.lapTime) : message.lapTime;
                return object;
            };

            /**
             * Converts this Lap to JSON.
             * @function toJSON
             * @memberof com.antigravity.Lap
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Lap.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Lap
             * @function getTypeUrl
             * @memberof com.antigravity.Lap
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Lap.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.Lap";
            };

            return Lap;
        })();

        antigravity.RaceData = (function() {

            /**
             * Properties of a RaceData.
             * @memberof com.antigravity
             * @interface IRaceData
             * @property {com.antigravity.IRaceTime|null} [raceTime] RaceData raceTime
             * @property {com.antigravity.ILap|null} [lap] RaceData lap
             */

            /**
             * Constructs a new RaceData.
             * @memberof com.antigravity
             * @classdesc Represents a RaceData.
             * @implements IRaceData
             * @constructor
             * @param {com.antigravity.IRaceData=} [properties] Properties to set
             */
            function RaceData(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RaceData raceTime.
             * @member {com.antigravity.IRaceTime|null|undefined} raceTime
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.raceTime = null;

            /**
             * RaceData lap.
             * @member {com.antigravity.ILap|null|undefined} lap
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.lap = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * RaceData data.
             * @member {"raceTime"|"lap"|undefined} data
             * @memberof com.antigravity.RaceData
             * @instance
             */
            Object.defineProperty(RaceData.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["raceTime", "lap"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new RaceData instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RaceData
             * @static
             * @param {com.antigravity.IRaceData=} [properties] Properties to set
             * @returns {com.antigravity.RaceData} RaceData instance
             */
            RaceData.create = function create(properties) {
                return new RaceData(properties);
            };

            /**
             * Encodes the specified RaceData message. Does not implicitly {@link com.antigravity.RaceData.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RaceData
             * @static
             * @param {com.antigravity.IRaceData} message RaceData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceData.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.raceTime != null && Object.hasOwnProperty.call(message, "raceTime"))
                    $root.com.antigravity.RaceTime.encode(message.raceTime, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.lap != null && Object.hasOwnProperty.call(message, "lap"))
                    $root.com.antigravity.Lap.encode(message.lap, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified RaceData message, length delimited. Does not implicitly {@link com.antigravity.RaceData.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RaceData
             * @static
             * @param {com.antigravity.IRaceData} message RaceData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceData.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RaceData message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RaceData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RaceData} RaceData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceData.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RaceData();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.raceTime = $root.com.antigravity.RaceTime.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.lap = $root.com.antigravity.Lap.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a RaceData message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RaceData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceData} RaceData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceData.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RaceData message.
             * @function verify
             * @memberof com.antigravity.RaceData
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RaceData.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.raceTime != null && message.hasOwnProperty("raceTime")) {
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.RaceTime.verify(message.raceTime);
                        if (error)
                            return "raceTime." + error;
                    }
                }
                if (message.lap != null && message.hasOwnProperty("lap")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.Lap.verify(message.lap);
                        if (error)
                            return "lap." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a RaceData message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RaceData
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RaceData} RaceData
             */
            RaceData.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RaceData)
                    return object;
                let message = new $root.com.antigravity.RaceData();
                if (object.raceTime != null) {
                    if (typeof object.raceTime !== "object")
                        throw TypeError(".com.antigravity.RaceData.raceTime: object expected");
                    message.raceTime = $root.com.antigravity.RaceTime.fromObject(object.raceTime);
                }
                if (object.lap != null) {
                    if (typeof object.lap !== "object")
                        throw TypeError(".com.antigravity.RaceData.lap: object expected");
                    message.lap = $root.com.antigravity.Lap.fromObject(object.lap);
                }
                return message;
            };

            /**
             * Creates a plain object from a RaceData message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RaceData
             * @static
             * @param {com.antigravity.RaceData} message RaceData
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RaceData.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (message.raceTime != null && message.hasOwnProperty("raceTime")) {
                    object.raceTime = $root.com.antigravity.RaceTime.toObject(message.raceTime, options);
                    if (options.oneofs)
                        object.data = "raceTime";
                }
                if (message.lap != null && message.hasOwnProperty("lap")) {
                    object.lap = $root.com.antigravity.Lap.toObject(message.lap, options);
                    if (options.oneofs)
                        object.data = "lap";
                }
                return object;
            };

            /**
             * Converts this RaceData to JSON.
             * @function toJSON
             * @memberof com.antigravity.RaceData
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RaceData.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RaceData
             * @function getTypeUrl
             * @memberof com.antigravity.RaceData
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RaceData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RaceData";
            };

            return RaceData;
        })();

        return antigravity;
    })();

    return com;
})();

export { $root as default };
