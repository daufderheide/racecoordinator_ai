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
                if (options.defaults)
                    object.success = false;
                if (message.success != null && message.hasOwnProperty("success"))
                    object.success = message.success;
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

        antigravity.RaceModel = (function() {

            /**
             * Properties of a RaceModel.
             * @memberof com.antigravity
             * @interface IRaceModel
             * @property {com.antigravity.IModel|null} [model] RaceModel model
             * @property {string|null} [name] RaceModel name
             * @property {com.antigravity.ITrackModel|null} [track] RaceModel track
             */

            /**
             * Constructs a new RaceModel.
             * @memberof com.antigravity
             * @classdesc Represents a RaceModel.
             * @implements IRaceModel
             * @constructor
             * @param {com.antigravity.IRaceModel=} [properties] Properties to set
             */
            function RaceModel(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RaceModel model.
             * @member {com.antigravity.IModel|null|undefined} model
             * @memberof com.antigravity.RaceModel
             * @instance
             */
            RaceModel.prototype.model = null;

            /**
             * RaceModel name.
             * @member {string} name
             * @memberof com.antigravity.RaceModel
             * @instance
             */
            RaceModel.prototype.name = "";

            /**
             * RaceModel track.
             * @member {com.antigravity.ITrackModel|null|undefined} track
             * @memberof com.antigravity.RaceModel
             * @instance
             */
            RaceModel.prototype.track = null;

            /**
             * Creates a new RaceModel instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {com.antigravity.IRaceModel=} [properties] Properties to set
             * @returns {com.antigravity.RaceModel} RaceModel instance
             */
            RaceModel.create = function create(properties) {
                return new RaceModel(properties);
            };

            /**
             * Encodes the specified RaceModel message. Does not implicitly {@link com.antigravity.RaceModel.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {com.antigravity.IRaceModel} message RaceModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceModel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                    $root.com.antigravity.Model.encode(message.model, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                if (message.track != null && Object.hasOwnProperty.call(message, "track"))
                    $root.com.antigravity.TrackModel.encode(message.track, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified RaceModel message, length delimited. Does not implicitly {@link com.antigravity.RaceModel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {com.antigravity.IRaceModel} message RaceModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceModel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RaceModel message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RaceModel} RaceModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceModel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RaceModel();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.model = $root.com.antigravity.Model.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.name = reader.string();
                            break;
                        }
                    case 3: {
                            message.track = $root.com.antigravity.TrackModel.decode(reader, reader.uint32());
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
             * Decodes a RaceModel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceModel} RaceModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceModel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RaceModel message.
             * @function verify
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RaceModel.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.model != null && message.hasOwnProperty("model")) {
                    let error = $root.com.antigravity.Model.verify(message.model);
                    if (error)
                        return "model." + error;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.track != null && message.hasOwnProperty("track")) {
                    let error = $root.com.antigravity.TrackModel.verify(message.track);
                    if (error)
                        return "track." + error;
                }
                return null;
            };

            /**
             * Creates a RaceModel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RaceModel} RaceModel
             */
            RaceModel.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RaceModel)
                    return object;
                let message = new $root.com.antigravity.RaceModel();
                if (object.model != null) {
                    if (typeof object.model !== "object")
                        throw TypeError(".com.antigravity.RaceModel.model: object expected");
                    message.model = $root.com.antigravity.Model.fromObject(object.model);
                }
                if (object.name != null)
                    message.name = String(object.name);
                if (object.track != null) {
                    if (typeof object.track !== "object")
                        throw TypeError(".com.antigravity.RaceModel.track: object expected");
                    message.track = $root.com.antigravity.TrackModel.fromObject(object.track);
                }
                return message;
            };

            /**
             * Creates a plain object from a RaceModel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {com.antigravity.RaceModel} message RaceModel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RaceModel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.model = null;
                    object.name = "";
                    object.track = null;
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.track != null && message.hasOwnProperty("track"))
                    object.track = $root.com.antigravity.TrackModel.toObject(message.track, options);
                return object;
            };

            /**
             * Converts this RaceModel to JSON.
             * @function toJSON
             * @memberof com.antigravity.RaceModel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RaceModel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RaceModel
             * @function getTypeUrl
             * @memberof com.antigravity.RaceModel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RaceModel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RaceModel";
            };

            return RaceModel;
        })();

        antigravity.TrackModel = (function() {

            /**
             * Properties of a TrackModel.
             * @memberof com.antigravity
             * @interface ITrackModel
             * @property {com.antigravity.IModel|null} [model] TrackModel model
             * @property {string|null} [name] TrackModel name
             * @property {Array.<com.antigravity.ILaneModel>|null} [lanes] TrackModel lanes
             */

            /**
             * Constructs a new TrackModel.
             * @memberof com.antigravity
             * @classdesc Represents a TrackModel.
             * @implements ITrackModel
             * @constructor
             * @param {com.antigravity.ITrackModel=} [properties] Properties to set
             */
            function TrackModel(properties) {
                this.lanes = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TrackModel model.
             * @member {com.antigravity.IModel|null|undefined} model
             * @memberof com.antigravity.TrackModel
             * @instance
             */
            TrackModel.prototype.model = null;

            /**
             * TrackModel name.
             * @member {string} name
             * @memberof com.antigravity.TrackModel
             * @instance
             */
            TrackModel.prototype.name = "";

            /**
             * TrackModel lanes.
             * @member {Array.<com.antigravity.ILaneModel>} lanes
             * @memberof com.antigravity.TrackModel
             * @instance
             */
            TrackModel.prototype.lanes = $util.emptyArray;

            /**
             * Creates a new TrackModel instance using the specified properties.
             * @function create
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {com.antigravity.ITrackModel=} [properties] Properties to set
             * @returns {com.antigravity.TrackModel} TrackModel instance
             */
            TrackModel.create = function create(properties) {
                return new TrackModel(properties);
            };

            /**
             * Encodes the specified TrackModel message. Does not implicitly {@link com.antigravity.TrackModel.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {com.antigravity.ITrackModel} message TrackModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TrackModel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                    $root.com.antigravity.Model.encode(message.model, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                if (message.lanes != null && message.lanes.length)
                    for (let i = 0; i < message.lanes.length; ++i)
                        $root.com.antigravity.LaneModel.encode(message.lanes[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified TrackModel message, length delimited. Does not implicitly {@link com.antigravity.TrackModel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {com.antigravity.ITrackModel} message TrackModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TrackModel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TrackModel message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.TrackModel} TrackModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TrackModel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.TrackModel();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.model = $root.com.antigravity.Model.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.name = reader.string();
                            break;
                        }
                    case 3: {
                            if (!(message.lanes && message.lanes.length))
                                message.lanes = [];
                            message.lanes.push($root.com.antigravity.LaneModel.decode(reader, reader.uint32()));
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
             * Decodes a TrackModel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.TrackModel} TrackModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TrackModel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TrackModel message.
             * @function verify
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TrackModel.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.model != null && message.hasOwnProperty("model")) {
                    let error = $root.com.antigravity.Model.verify(message.model);
                    if (error)
                        return "model." + error;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.lanes != null && message.hasOwnProperty("lanes")) {
                    if (!Array.isArray(message.lanes))
                        return "lanes: array expected";
                    for (let i = 0; i < message.lanes.length; ++i) {
                        let error = $root.com.antigravity.LaneModel.verify(message.lanes[i]);
                        if (error)
                            return "lanes." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a TrackModel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.TrackModel} TrackModel
             */
            TrackModel.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.TrackModel)
                    return object;
                let message = new $root.com.antigravity.TrackModel();
                if (object.model != null) {
                    if (typeof object.model !== "object")
                        throw TypeError(".com.antigravity.TrackModel.model: object expected");
                    message.model = $root.com.antigravity.Model.fromObject(object.model);
                }
                if (object.name != null)
                    message.name = String(object.name);
                if (object.lanes) {
                    if (!Array.isArray(object.lanes))
                        throw TypeError(".com.antigravity.TrackModel.lanes: array expected");
                    message.lanes = [];
                    for (let i = 0; i < object.lanes.length; ++i) {
                        if (typeof object.lanes[i] !== "object")
                            throw TypeError(".com.antigravity.TrackModel.lanes: object expected");
                        message.lanes[i] = $root.com.antigravity.LaneModel.fromObject(object.lanes[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a TrackModel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {com.antigravity.TrackModel} message TrackModel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TrackModel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.lanes = [];
                if (options.defaults) {
                    object.model = null;
                    object.name = "";
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.lanes && message.lanes.length) {
                    object.lanes = [];
                    for (let j = 0; j < message.lanes.length; ++j)
                        object.lanes[j] = $root.com.antigravity.LaneModel.toObject(message.lanes[j], options);
                }
                return object;
            };

            /**
             * Converts this TrackModel to JSON.
             * @function toJSON
             * @memberof com.antigravity.TrackModel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TrackModel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for TrackModel
             * @function getTypeUrl
             * @memberof com.antigravity.TrackModel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            TrackModel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.TrackModel";
            };

            return TrackModel;
        })();

        antigravity.LaneModel = (function() {

            /**
             * Properties of a LaneModel.
             * @memberof com.antigravity
             * @interface ILaneModel
             * @property {string|null} [backgroundColor] LaneModel backgroundColor
             * @property {string|null} [foregroundColor] LaneModel foregroundColor
             * @property {number|null} [length] LaneModel length
             */

            /**
             * Constructs a new LaneModel.
             * @memberof com.antigravity
             * @classdesc Represents a LaneModel.
             * @implements ILaneModel
             * @constructor
             * @param {com.antigravity.ILaneModel=} [properties] Properties to set
             */
            function LaneModel(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * LaneModel backgroundColor.
             * @member {string} backgroundColor
             * @memberof com.antigravity.LaneModel
             * @instance
             */
            LaneModel.prototype.backgroundColor = "";

            /**
             * LaneModel foregroundColor.
             * @member {string} foregroundColor
             * @memberof com.antigravity.LaneModel
             * @instance
             */
            LaneModel.prototype.foregroundColor = "";

            /**
             * LaneModel length.
             * @member {number} length
             * @memberof com.antigravity.LaneModel
             * @instance
             */
            LaneModel.prototype.length = 0;

            /**
             * Creates a new LaneModel instance using the specified properties.
             * @function create
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {com.antigravity.ILaneModel=} [properties] Properties to set
             * @returns {com.antigravity.LaneModel} LaneModel instance
             */
            LaneModel.create = function create(properties) {
                return new LaneModel(properties);
            };

            /**
             * Encodes the specified LaneModel message. Does not implicitly {@link com.antigravity.LaneModel.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {com.antigravity.ILaneModel} message LaneModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            LaneModel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.backgroundColor != null && Object.hasOwnProperty.call(message, "backgroundColor"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.backgroundColor);
                if (message.foregroundColor != null && Object.hasOwnProperty.call(message, "foregroundColor"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.foregroundColor);
                if (message.length != null && Object.hasOwnProperty.call(message, "length"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.length);
                return writer;
            };

            /**
             * Encodes the specified LaneModel message, length delimited. Does not implicitly {@link com.antigravity.LaneModel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {com.antigravity.ILaneModel} message LaneModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            LaneModel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a LaneModel message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.LaneModel} LaneModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            LaneModel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.LaneModel();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.backgroundColor = reader.string();
                            break;
                        }
                    case 2: {
                            message.foregroundColor = reader.string();
                            break;
                        }
                    case 3: {
                            message.length = reader.int32();
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
             * Decodes a LaneModel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.LaneModel} LaneModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            LaneModel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a LaneModel message.
             * @function verify
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            LaneModel.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.backgroundColor != null && message.hasOwnProperty("backgroundColor"))
                    if (!$util.isString(message.backgroundColor))
                        return "backgroundColor: string expected";
                if (message.foregroundColor != null && message.hasOwnProperty("foregroundColor"))
                    if (!$util.isString(message.foregroundColor))
                        return "foregroundColor: string expected";
                if (message.length != null && message.hasOwnProperty("length"))
                    if (!$util.isInteger(message.length))
                        return "length: integer expected";
                return null;
            };

            /**
             * Creates a LaneModel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.LaneModel} LaneModel
             */
            LaneModel.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.LaneModel)
                    return object;
                let message = new $root.com.antigravity.LaneModel();
                if (object.backgroundColor != null)
                    message.backgroundColor = String(object.backgroundColor);
                if (object.foregroundColor != null)
                    message.foregroundColor = String(object.foregroundColor);
                if (object.length != null)
                    message.length = object.length | 0;
                return message;
            };

            /**
             * Creates a plain object from a LaneModel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {com.antigravity.LaneModel} message LaneModel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            LaneModel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.backgroundColor = "";
                    object.foregroundColor = "";
                    object.length = 0;
                }
                if (message.backgroundColor != null && message.hasOwnProperty("backgroundColor"))
                    object.backgroundColor = message.backgroundColor;
                if (message.foregroundColor != null && message.hasOwnProperty("foregroundColor"))
                    object.foregroundColor = message.foregroundColor;
                if (message.length != null && message.hasOwnProperty("length"))
                    object.length = message.length;
                return object;
            };

            /**
             * Converts this LaneModel to JSON.
             * @function toJSON
             * @memberof com.antigravity.LaneModel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            LaneModel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for LaneModel
             * @function getTypeUrl
             * @memberof com.antigravity.LaneModel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            LaneModel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.LaneModel";
            };

            return LaneModel;
        })();

        antigravity.Model = (function() {

            /**
             * Properties of a Model.
             * @memberof com.antigravity
             * @interface IModel
             * @property {string|null} [entityId] Model entityId
             */

            /**
             * Constructs a new Model.
             * @memberof com.antigravity
             * @classdesc Represents a Model.
             * @implements IModel
             * @constructor
             * @param {com.antigravity.IModel=} [properties] Properties to set
             */
            function Model(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Model entityId.
             * @member {string} entityId
             * @memberof com.antigravity.Model
             * @instance
             */
            Model.prototype.entityId = "";

            /**
             * Creates a new Model instance using the specified properties.
             * @function create
             * @memberof com.antigravity.Model
             * @static
             * @param {com.antigravity.IModel=} [properties] Properties to set
             * @returns {com.antigravity.Model} Model instance
             */
            Model.create = function create(properties) {
                return new Model(properties);
            };

            /**
             * Encodes the specified Model message. Does not implicitly {@link com.antigravity.Model.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.Model
             * @static
             * @param {com.antigravity.IModel} message Model message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Model.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.entityId != null && Object.hasOwnProperty.call(message, "entityId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.entityId);
                return writer;
            };

            /**
             * Encodes the specified Model message, length delimited. Does not implicitly {@link com.antigravity.Model.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.Model
             * @static
             * @param {com.antigravity.IModel} message Model message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Model.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Model message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.Model
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.Model} Model
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Model.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.Model();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.entityId = reader.string();
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
             * Decodes a Model message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.Model
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.Model} Model
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Model.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Model message.
             * @function verify
             * @memberof com.antigravity.Model
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Model.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.entityId != null && message.hasOwnProperty("entityId"))
                    if (!$util.isString(message.entityId))
                        return "entityId: string expected";
                return null;
            };

            /**
             * Creates a Model message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.Model
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.Model} Model
             */
            Model.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.Model)
                    return object;
                let message = new $root.com.antigravity.Model();
                if (object.entityId != null)
                    message.entityId = String(object.entityId);
                return message;
            };

            /**
             * Creates a plain object from a Model message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.Model
             * @static
             * @param {com.antigravity.Model} message Model
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Model.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.entityId = "";
                if (message.entityId != null && message.hasOwnProperty("entityId"))
                    object.entityId = message.entityId;
                return object;
            };

            /**
             * Converts this Model to JSON.
             * @function toJSON
             * @memberof com.antigravity.Model
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Model.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Model
             * @function getTypeUrl
             * @memberof com.antigravity.Model
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Model.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.Model";
            };

            return Model;
        })();

        antigravity.DriverModel = (function() {

            /**
             * Properties of a DriverModel.
             * @memberof com.antigravity
             * @interface IDriverModel
             * @property {com.antigravity.IModel|null} [model] DriverModel model
             * @property {string|null} [name] DriverModel name
             * @property {string|null} [nickname] DriverModel nickname
             */

            /**
             * Constructs a new DriverModel.
             * @memberof com.antigravity
             * @classdesc Represents a DriverModel.
             * @implements IDriverModel
             * @constructor
             * @param {com.antigravity.IDriverModel=} [properties] Properties to set
             */
            function DriverModel(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DriverModel model.
             * @member {com.antigravity.IModel|null|undefined} model
             * @memberof com.antigravity.DriverModel
             * @instance
             */
            DriverModel.prototype.model = null;

            /**
             * DriverModel name.
             * @member {string} name
             * @memberof com.antigravity.DriverModel
             * @instance
             */
            DriverModel.prototype.name = "";

            /**
             * DriverModel nickname.
             * @member {string} nickname
             * @memberof com.antigravity.DriverModel
             * @instance
             */
            DriverModel.prototype.nickname = "";

            /**
             * Creates a new DriverModel instance using the specified properties.
             * @function create
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {com.antigravity.IDriverModel=} [properties] Properties to set
             * @returns {com.antigravity.DriverModel} DriverModel instance
             */
            DriverModel.create = function create(properties) {
                return new DriverModel(properties);
            };

            /**
             * Encodes the specified DriverModel message. Does not implicitly {@link com.antigravity.DriverModel.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {com.antigravity.IDriverModel} message DriverModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DriverModel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                    $root.com.antigravity.Model.encode(message.model, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                if (message.nickname != null && Object.hasOwnProperty.call(message, "nickname"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.nickname);
                return writer;
            };

            /**
             * Encodes the specified DriverModel message, length delimited. Does not implicitly {@link com.antigravity.DriverModel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {com.antigravity.IDriverModel} message DriverModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DriverModel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DriverModel message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.DriverModel} DriverModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DriverModel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.DriverModel();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.model = $root.com.antigravity.Model.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.name = reader.string();
                            break;
                        }
                    case 3: {
                            message.nickname = reader.string();
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
             * Decodes a DriverModel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.DriverModel} DriverModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DriverModel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DriverModel message.
             * @function verify
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DriverModel.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.model != null && message.hasOwnProperty("model")) {
                    let error = $root.com.antigravity.Model.verify(message.model);
                    if (error)
                        return "model." + error;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.nickname != null && message.hasOwnProperty("nickname"))
                    if (!$util.isString(message.nickname))
                        return "nickname: string expected";
                return null;
            };

            /**
             * Creates a DriverModel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.DriverModel} DriverModel
             */
            DriverModel.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.DriverModel)
                    return object;
                let message = new $root.com.antigravity.DriverModel();
                if (object.model != null) {
                    if (typeof object.model !== "object")
                        throw TypeError(".com.antigravity.DriverModel.model: object expected");
                    message.model = $root.com.antigravity.Model.fromObject(object.model);
                }
                if (object.name != null)
                    message.name = String(object.name);
                if (object.nickname != null)
                    message.nickname = String(object.nickname);
                return message;
            };

            /**
             * Creates a plain object from a DriverModel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {com.antigravity.DriverModel} message DriverModel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DriverModel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.model = null;
                    object.name = "";
                    object.nickname = "";
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.nickname != null && message.hasOwnProperty("nickname"))
                    object.nickname = message.nickname;
                return object;
            };

            /**
             * Converts this DriverModel to JSON.
             * @function toJSON
             * @memberof com.antigravity.DriverModel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DriverModel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DriverModel
             * @function getTypeUrl
             * @memberof com.antigravity.DriverModel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DriverModel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.DriverModel";
            };

            return DriverModel;
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

        antigravity.PauseRaceRequest = (function() {

            /**
             * Properties of a PauseRaceRequest.
             * @memberof com.antigravity
             * @interface IPauseRaceRequest
             */

            /**
             * Constructs a new PauseRaceRequest.
             * @memberof com.antigravity
             * @classdesc Represents a PauseRaceRequest.
             * @implements IPauseRaceRequest
             * @constructor
             * @param {com.antigravity.IPauseRaceRequest=} [properties] Properties to set
             */
            function PauseRaceRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new PauseRaceRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {com.antigravity.IPauseRaceRequest=} [properties] Properties to set
             * @returns {com.antigravity.PauseRaceRequest} PauseRaceRequest instance
             */
            PauseRaceRequest.create = function create(properties) {
                return new PauseRaceRequest(properties);
            };

            /**
             * Encodes the specified PauseRaceRequest message. Does not implicitly {@link com.antigravity.PauseRaceRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {com.antigravity.IPauseRaceRequest} message PauseRaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PauseRaceRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified PauseRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.PauseRaceRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {com.antigravity.IPauseRaceRequest} message PauseRaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PauseRaceRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PauseRaceRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.PauseRaceRequest} PauseRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PauseRaceRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.PauseRaceRequest();
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
             * Decodes a PauseRaceRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.PauseRaceRequest} PauseRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PauseRaceRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PauseRaceRequest message.
             * @function verify
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PauseRaceRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a PauseRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.PauseRaceRequest} PauseRaceRequest
             */
            PauseRaceRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.PauseRaceRequest)
                    return object;
                return new $root.com.antigravity.PauseRaceRequest();
            };

            /**
             * Creates a plain object from a PauseRaceRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {com.antigravity.PauseRaceRequest} message PauseRaceRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PauseRaceRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this PauseRaceRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.PauseRaceRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PauseRaceRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PauseRaceRequest
             * @function getTypeUrl
             * @memberof com.antigravity.PauseRaceRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PauseRaceRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.PauseRaceRequest";
            };

            return PauseRaceRequest;
        })();

        antigravity.PauseRaceResponse = (function() {

            /**
             * Properties of a PauseRaceResponse.
             * @memberof com.antigravity
             * @interface IPauseRaceResponse
             * @property {boolean|null} [success] PauseRaceResponse success
             * @property {string|null} [message] PauseRaceResponse message
             */

            /**
             * Constructs a new PauseRaceResponse.
             * @memberof com.antigravity
             * @classdesc Represents a PauseRaceResponse.
             * @implements IPauseRaceResponse
             * @constructor
             * @param {com.antigravity.IPauseRaceResponse=} [properties] Properties to set
             */
            function PauseRaceResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PauseRaceResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.PauseRaceResponse
             * @instance
             */
            PauseRaceResponse.prototype.success = false;

            /**
             * PauseRaceResponse message.
             * @member {string} message
             * @memberof com.antigravity.PauseRaceResponse
             * @instance
             */
            PauseRaceResponse.prototype.message = "";

            /**
             * Creates a new PauseRaceResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {com.antigravity.IPauseRaceResponse=} [properties] Properties to set
             * @returns {com.antigravity.PauseRaceResponse} PauseRaceResponse instance
             */
            PauseRaceResponse.create = function create(properties) {
                return new PauseRaceResponse(properties);
            };

            /**
             * Encodes the specified PauseRaceResponse message. Does not implicitly {@link com.antigravity.PauseRaceResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {com.antigravity.IPauseRaceResponse} message PauseRaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PauseRaceResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified PauseRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.PauseRaceResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {com.antigravity.IPauseRaceResponse} message PauseRaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PauseRaceResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PauseRaceResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.PauseRaceResponse} PauseRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PauseRaceResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.PauseRaceResponse();
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
             * Decodes a PauseRaceResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.PauseRaceResponse} PauseRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PauseRaceResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PauseRaceResponse message.
             * @function verify
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PauseRaceResponse.verify = function verify(message) {
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
             * Creates a PauseRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.PauseRaceResponse} PauseRaceResponse
             */
            PauseRaceResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.PauseRaceResponse)
                    return object;
                let message = new $root.com.antigravity.PauseRaceResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a PauseRaceResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {com.antigravity.PauseRaceResponse} message PauseRaceResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PauseRaceResponse.toObject = function toObject(message, options) {
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
             * Converts this PauseRaceResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.PauseRaceResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PauseRaceResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PauseRaceResponse
             * @function getTypeUrl
             * @memberof com.antigravity.PauseRaceResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PauseRaceResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.PauseRaceResponse";
            };

            return PauseRaceResponse;
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
             * @property {number|null} [lapNumber] Lap lapNumber
             * @property {number|null} [averageLapTime] Lap averageLapTime
             * @property {number|null} [medianLapTime] Lap medianLapTime
             * @property {number|null} [bestLapTime] Lap bestLapTime
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
             * Lap lapNumber.
             * @member {number} lapNumber
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.lapNumber = 0;

            /**
             * Lap averageLapTime.
             * @member {number} averageLapTime
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.averageLapTime = 0;

            /**
             * Lap medianLapTime.
             * @member {number} medianLapTime
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.medianLapTime = 0;

            /**
             * Lap bestLapTime.
             * @member {number} bestLapTime
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.bestLapTime = 0;

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
                if (message.lapNumber != null && Object.hasOwnProperty.call(message, "lapNumber"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.lapNumber);
                if (message.averageLapTime != null && Object.hasOwnProperty.call(message, "averageLapTime"))
                    writer.uint32(/* id 4, wireType 5 =*/37).float(message.averageLapTime);
                if (message.medianLapTime != null && Object.hasOwnProperty.call(message, "medianLapTime"))
                    writer.uint32(/* id 5, wireType 5 =*/45).float(message.medianLapTime);
                if (message.bestLapTime != null && Object.hasOwnProperty.call(message, "bestLapTime"))
                    writer.uint32(/* id 6, wireType 5 =*/53).float(message.bestLapTime);
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
                    case 3: {
                            message.lapNumber = reader.int32();
                            break;
                        }
                    case 4: {
                            message.averageLapTime = reader.float();
                            break;
                        }
                    case 5: {
                            message.medianLapTime = reader.float();
                            break;
                        }
                    case 6: {
                            message.bestLapTime = reader.float();
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
                if (message.lapNumber != null && message.hasOwnProperty("lapNumber"))
                    if (!$util.isInteger(message.lapNumber))
                        return "lapNumber: integer expected";
                if (message.averageLapTime != null && message.hasOwnProperty("averageLapTime"))
                    if (typeof message.averageLapTime !== "number")
                        return "averageLapTime: number expected";
                if (message.medianLapTime != null && message.hasOwnProperty("medianLapTime"))
                    if (typeof message.medianLapTime !== "number")
                        return "medianLapTime: number expected";
                if (message.bestLapTime != null && message.hasOwnProperty("bestLapTime"))
                    if (typeof message.bestLapTime !== "number")
                        return "bestLapTime: number expected";
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
                if (object.lapNumber != null)
                    message.lapNumber = object.lapNumber | 0;
                if (object.averageLapTime != null)
                    message.averageLapTime = Number(object.averageLapTime);
                if (object.medianLapTime != null)
                    message.medianLapTime = Number(object.medianLapTime);
                if (object.bestLapTime != null)
                    message.bestLapTime = Number(object.bestLapTime);
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
                    object.lapNumber = 0;
                    object.averageLapTime = 0;
                    object.medianLapTime = 0;
                    object.bestLapTime = 0;
                }
                if (message.lane != null && message.hasOwnProperty("lane"))
                    object.lane = message.lane;
                if (message.lapTime != null && message.hasOwnProperty("lapTime"))
                    object.lapTime = options.json && !isFinite(message.lapTime) ? String(message.lapTime) : message.lapTime;
                if (message.lapNumber != null && message.hasOwnProperty("lapNumber"))
                    object.lapNumber = message.lapNumber;
                if (message.averageLapTime != null && message.hasOwnProperty("averageLapTime"))
                    object.averageLapTime = options.json && !isFinite(message.averageLapTime) ? String(message.averageLapTime) : message.averageLapTime;
                if (message.medianLapTime != null && message.hasOwnProperty("medianLapTime"))
                    object.medianLapTime = options.json && !isFinite(message.medianLapTime) ? String(message.medianLapTime) : message.medianLapTime;
                if (message.bestLapTime != null && message.hasOwnProperty("bestLapTime"))
                    object.bestLapTime = options.json && !isFinite(message.bestLapTime) ? String(message.bestLapTime) : message.bestLapTime;
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
             * @property {com.antigravity.IFullUpdate|null} [fullUpdate] RaceData fullUpdate
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

            /**
             * RaceData fullUpdate.
             * @member {com.antigravity.IFullUpdate|null|undefined} fullUpdate
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.fullUpdate = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * RaceData data.
             * @member {"raceTime"|"lap"|"fullUpdate"|undefined} data
             * @memberof com.antigravity.RaceData
             * @instance
             */
            Object.defineProperty(RaceData.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["raceTime", "lap", "fullUpdate"]),
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
                if (message.fullUpdate != null && Object.hasOwnProperty.call(message, "fullUpdate"))
                    $root.com.antigravity.FullUpdate.encode(message.fullUpdate, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
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
                    case 3: {
                            message.fullUpdate = $root.com.antigravity.FullUpdate.decode(reader, reader.uint32());
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
                if (message.fullUpdate != null && message.hasOwnProperty("fullUpdate")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.FullUpdate.verify(message.fullUpdate);
                        if (error)
                            return "fullUpdate." + error;
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
                if (object.fullUpdate != null) {
                    if (typeof object.fullUpdate !== "object")
                        throw TypeError(".com.antigravity.RaceData.fullUpdate: object expected");
                    message.fullUpdate = $root.com.antigravity.FullUpdate.fromObject(object.fullUpdate);
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
                if (message.fullUpdate != null && message.hasOwnProperty("fullUpdate")) {
                    object.fullUpdate = $root.com.antigravity.FullUpdate.toObject(message.fullUpdate, options);
                    if (options.oneofs)
                        object.data = "fullUpdate";
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

        antigravity.FullUpdate = (function() {

            /**
             * Properties of a FullUpdate.
             * @memberof com.antigravity
             * @interface IFullUpdate
             * @property {com.antigravity.IRaceModel|null} [race] FullUpdate race
             * @property {Array.<com.antigravity.IDriverModel>|null} [drivers] FullUpdate drivers
             * @property {Array.<com.antigravity.IHeat>|null} [heats] FullUpdate heats
             * @property {com.antigravity.IHeat|null} [currentHeat] FullUpdate currentHeat
             */

            /**
             * Constructs a new FullUpdate.
             * @memberof com.antigravity
             * @classdesc Represents a FullUpdate.
             * @implements IFullUpdate
             * @constructor
             * @param {com.antigravity.IFullUpdate=} [properties] Properties to set
             */
            function FullUpdate(properties) {
                this.drivers = [];
                this.heats = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FullUpdate race.
             * @member {com.antigravity.IRaceModel|null|undefined} race
             * @memberof com.antigravity.FullUpdate
             * @instance
             */
            FullUpdate.prototype.race = null;

            /**
             * FullUpdate drivers.
             * @member {Array.<com.antigravity.IDriverModel>} drivers
             * @memberof com.antigravity.FullUpdate
             * @instance
             */
            FullUpdate.prototype.drivers = $util.emptyArray;

            /**
             * FullUpdate heats.
             * @member {Array.<com.antigravity.IHeat>} heats
             * @memberof com.antigravity.FullUpdate
             * @instance
             */
            FullUpdate.prototype.heats = $util.emptyArray;

            /**
             * FullUpdate currentHeat.
             * @member {com.antigravity.IHeat|null|undefined} currentHeat
             * @memberof com.antigravity.FullUpdate
             * @instance
             */
            FullUpdate.prototype.currentHeat = null;

            /**
             * Creates a new FullUpdate instance using the specified properties.
             * @function create
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {com.antigravity.IFullUpdate=} [properties] Properties to set
             * @returns {com.antigravity.FullUpdate} FullUpdate instance
             */
            FullUpdate.create = function create(properties) {
                return new FullUpdate(properties);
            };

            /**
             * Encodes the specified FullUpdate message. Does not implicitly {@link com.antigravity.FullUpdate.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {com.antigravity.IFullUpdate} message FullUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FullUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.race != null && Object.hasOwnProperty.call(message, "race"))
                    $root.com.antigravity.RaceModel.encode(message.race, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.drivers != null && message.drivers.length)
                    for (let i = 0; i < message.drivers.length; ++i)
                        $root.com.antigravity.DriverModel.encode(message.drivers[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.heats != null && message.heats.length)
                    for (let i = 0; i < message.heats.length; ++i)
                        $root.com.antigravity.Heat.encode(message.heats[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.currentHeat != null && Object.hasOwnProperty.call(message, "currentHeat"))
                    $root.com.antigravity.Heat.encode(message.currentHeat, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified FullUpdate message, length delimited. Does not implicitly {@link com.antigravity.FullUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {com.antigravity.IFullUpdate} message FullUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FullUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FullUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.FullUpdate} FullUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FullUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.FullUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.race = $root.com.antigravity.RaceModel.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            if (!(message.drivers && message.drivers.length))
                                message.drivers = [];
                            message.drivers.push($root.com.antigravity.DriverModel.decode(reader, reader.uint32()));
                            break;
                        }
                    case 3: {
                            if (!(message.heats && message.heats.length))
                                message.heats = [];
                            message.heats.push($root.com.antigravity.Heat.decode(reader, reader.uint32()));
                            break;
                        }
                    case 4: {
                            message.currentHeat = $root.com.antigravity.Heat.decode(reader, reader.uint32());
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
             * Decodes a FullUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.FullUpdate} FullUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FullUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FullUpdate message.
             * @function verify
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FullUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.race != null && message.hasOwnProperty("race")) {
                    let error = $root.com.antigravity.RaceModel.verify(message.race);
                    if (error)
                        return "race." + error;
                }
                if (message.drivers != null && message.hasOwnProperty("drivers")) {
                    if (!Array.isArray(message.drivers))
                        return "drivers: array expected";
                    for (let i = 0; i < message.drivers.length; ++i) {
                        let error = $root.com.antigravity.DriverModel.verify(message.drivers[i]);
                        if (error)
                            return "drivers." + error;
                    }
                }
                if (message.heats != null && message.hasOwnProperty("heats")) {
                    if (!Array.isArray(message.heats))
                        return "heats: array expected";
                    for (let i = 0; i < message.heats.length; ++i) {
                        let error = $root.com.antigravity.Heat.verify(message.heats[i]);
                        if (error)
                            return "heats." + error;
                    }
                }
                if (message.currentHeat != null && message.hasOwnProperty("currentHeat")) {
                    let error = $root.com.antigravity.Heat.verify(message.currentHeat);
                    if (error)
                        return "currentHeat." + error;
                }
                return null;
            };

            /**
             * Creates a FullUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.FullUpdate} FullUpdate
             */
            FullUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.FullUpdate)
                    return object;
                let message = new $root.com.antigravity.FullUpdate();
                if (object.race != null) {
                    if (typeof object.race !== "object")
                        throw TypeError(".com.antigravity.FullUpdate.race: object expected");
                    message.race = $root.com.antigravity.RaceModel.fromObject(object.race);
                }
                if (object.drivers) {
                    if (!Array.isArray(object.drivers))
                        throw TypeError(".com.antigravity.FullUpdate.drivers: array expected");
                    message.drivers = [];
                    for (let i = 0; i < object.drivers.length; ++i) {
                        if (typeof object.drivers[i] !== "object")
                            throw TypeError(".com.antigravity.FullUpdate.drivers: object expected");
                        message.drivers[i] = $root.com.antigravity.DriverModel.fromObject(object.drivers[i]);
                    }
                }
                if (object.heats) {
                    if (!Array.isArray(object.heats))
                        throw TypeError(".com.antigravity.FullUpdate.heats: array expected");
                    message.heats = [];
                    for (let i = 0; i < object.heats.length; ++i) {
                        if (typeof object.heats[i] !== "object")
                            throw TypeError(".com.antigravity.FullUpdate.heats: object expected");
                        message.heats[i] = $root.com.antigravity.Heat.fromObject(object.heats[i]);
                    }
                }
                if (object.currentHeat != null) {
                    if (typeof object.currentHeat !== "object")
                        throw TypeError(".com.antigravity.FullUpdate.currentHeat: object expected");
                    message.currentHeat = $root.com.antigravity.Heat.fromObject(object.currentHeat);
                }
                return message;
            };

            /**
             * Creates a plain object from a FullUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {com.antigravity.FullUpdate} message FullUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FullUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.drivers = [];
                    object.heats = [];
                }
                if (options.defaults) {
                    object.race = null;
                    object.currentHeat = null;
                }
                if (message.race != null && message.hasOwnProperty("race"))
                    object.race = $root.com.antigravity.RaceModel.toObject(message.race, options);
                if (message.drivers && message.drivers.length) {
                    object.drivers = [];
                    for (let j = 0; j < message.drivers.length; ++j)
                        object.drivers[j] = $root.com.antigravity.DriverModel.toObject(message.drivers[j], options);
                }
                if (message.heats && message.heats.length) {
                    object.heats = [];
                    for (let j = 0; j < message.heats.length; ++j)
                        object.heats[j] = $root.com.antigravity.Heat.toObject(message.heats[j], options);
                }
                if (message.currentHeat != null && message.hasOwnProperty("currentHeat"))
                    object.currentHeat = $root.com.antigravity.Heat.toObject(message.currentHeat, options);
                return object;
            };

            /**
             * Converts this FullUpdate to JSON.
             * @function toJSON
             * @memberof com.antigravity.FullUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FullUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for FullUpdate
             * @function getTypeUrl
             * @memberof com.antigravity.FullUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FullUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.FullUpdate";
            };

            return FullUpdate;
        })();

        antigravity.Heat = (function() {

            /**
             * Properties of a Heat.
             * @memberof com.antigravity
             * @interface IHeat
             * @property {Array.<com.antigravity.IDriverHeatData>|null} [heatDrivers] Heat heatDrivers
             * @property {number|null} [heatNumber] Heat heatNumber
             */

            /**
             * Constructs a new Heat.
             * @memberof com.antigravity
             * @classdesc Represents a Heat.
             * @implements IHeat
             * @constructor
             * @param {com.antigravity.IHeat=} [properties] Properties to set
             */
            function Heat(properties) {
                this.heatDrivers = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Heat heatDrivers.
             * @member {Array.<com.antigravity.IDriverHeatData>} heatDrivers
             * @memberof com.antigravity.Heat
             * @instance
             */
            Heat.prototype.heatDrivers = $util.emptyArray;

            /**
             * Heat heatNumber.
             * @member {number} heatNumber
             * @memberof com.antigravity.Heat
             * @instance
             */
            Heat.prototype.heatNumber = 0;

            /**
             * Creates a new Heat instance using the specified properties.
             * @function create
             * @memberof com.antigravity.Heat
             * @static
             * @param {com.antigravity.IHeat=} [properties] Properties to set
             * @returns {com.antigravity.Heat} Heat instance
             */
            Heat.create = function create(properties) {
                return new Heat(properties);
            };

            /**
             * Encodes the specified Heat message. Does not implicitly {@link com.antigravity.Heat.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.Heat
             * @static
             * @param {com.antigravity.IHeat} message Heat message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Heat.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.heatDrivers != null && message.heatDrivers.length)
                    for (let i = 0; i < message.heatDrivers.length; ++i)
                        $root.com.antigravity.DriverHeatData.encode(message.heatDrivers[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.heatNumber != null && Object.hasOwnProperty.call(message, "heatNumber"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.heatNumber);
                return writer;
            };

            /**
             * Encodes the specified Heat message, length delimited. Does not implicitly {@link com.antigravity.Heat.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.Heat
             * @static
             * @param {com.antigravity.IHeat} message Heat message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Heat.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Heat message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.Heat
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.Heat} Heat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Heat.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.Heat();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.heatDrivers && message.heatDrivers.length))
                                message.heatDrivers = [];
                            message.heatDrivers.push($root.com.antigravity.DriverHeatData.decode(reader, reader.uint32()));
                            break;
                        }
                    case 2: {
                            message.heatNumber = reader.int32();
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
             * Decodes a Heat message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.Heat
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.Heat} Heat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Heat.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Heat message.
             * @function verify
             * @memberof com.antigravity.Heat
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Heat.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.heatDrivers != null && message.hasOwnProperty("heatDrivers")) {
                    if (!Array.isArray(message.heatDrivers))
                        return "heatDrivers: array expected";
                    for (let i = 0; i < message.heatDrivers.length; ++i) {
                        let error = $root.com.antigravity.DriverHeatData.verify(message.heatDrivers[i]);
                        if (error)
                            return "heatDrivers." + error;
                    }
                }
                if (message.heatNumber != null && message.hasOwnProperty("heatNumber"))
                    if (!$util.isInteger(message.heatNumber))
                        return "heatNumber: integer expected";
                return null;
            };

            /**
             * Creates a Heat message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.Heat
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.Heat} Heat
             */
            Heat.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.Heat)
                    return object;
                let message = new $root.com.antigravity.Heat();
                if (object.heatDrivers) {
                    if (!Array.isArray(object.heatDrivers))
                        throw TypeError(".com.antigravity.Heat.heatDrivers: array expected");
                    message.heatDrivers = [];
                    for (let i = 0; i < object.heatDrivers.length; ++i) {
                        if (typeof object.heatDrivers[i] !== "object")
                            throw TypeError(".com.antigravity.Heat.heatDrivers: object expected");
                        message.heatDrivers[i] = $root.com.antigravity.DriverHeatData.fromObject(object.heatDrivers[i]);
                    }
                }
                if (object.heatNumber != null)
                    message.heatNumber = object.heatNumber | 0;
                return message;
            };

            /**
             * Creates a plain object from a Heat message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.Heat
             * @static
             * @param {com.antigravity.Heat} message Heat
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Heat.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.heatDrivers = [];
                if (options.defaults)
                    object.heatNumber = 0;
                if (message.heatDrivers && message.heatDrivers.length) {
                    object.heatDrivers = [];
                    for (let j = 0; j < message.heatDrivers.length; ++j)
                        object.heatDrivers[j] = $root.com.antigravity.DriverHeatData.toObject(message.heatDrivers[j], options);
                }
                if (message.heatNumber != null && message.hasOwnProperty("heatNumber"))
                    object.heatNumber = message.heatNumber;
                return object;
            };

            /**
             * Converts this Heat to JSON.
             * @function toJSON
             * @memberof com.antigravity.Heat
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Heat.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Heat
             * @function getTypeUrl
             * @memberof com.antigravity.Heat
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Heat.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.Heat";
            };

            return Heat;
        })();

        antigravity.DriverHeatData = (function() {

            /**
             * Properties of a DriverHeatData.
             * @memberof com.antigravity
             * @interface IDriverHeatData
             * @property {com.antigravity.IRaceParticipant|null} [driver] DriverHeatData driver
             */

            /**
             * Constructs a new DriverHeatData.
             * @memberof com.antigravity
             * @classdesc Represents a DriverHeatData.
             * @implements IDriverHeatData
             * @constructor
             * @param {com.antigravity.IDriverHeatData=} [properties] Properties to set
             */
            function DriverHeatData(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DriverHeatData driver.
             * @member {com.antigravity.IRaceParticipant|null|undefined} driver
             * @memberof com.antigravity.DriverHeatData
             * @instance
             */
            DriverHeatData.prototype.driver = null;

            /**
             * Creates a new DriverHeatData instance using the specified properties.
             * @function create
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {com.antigravity.IDriverHeatData=} [properties] Properties to set
             * @returns {com.antigravity.DriverHeatData} DriverHeatData instance
             */
            DriverHeatData.create = function create(properties) {
                return new DriverHeatData(properties);
            };

            /**
             * Encodes the specified DriverHeatData message. Does not implicitly {@link com.antigravity.DriverHeatData.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {com.antigravity.IDriverHeatData} message DriverHeatData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DriverHeatData.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.driver != null && Object.hasOwnProperty.call(message, "driver"))
                    $root.com.antigravity.RaceParticipant.encode(message.driver, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified DriverHeatData message, length delimited. Does not implicitly {@link com.antigravity.DriverHeatData.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {com.antigravity.IDriverHeatData} message DriverHeatData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DriverHeatData.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DriverHeatData message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.DriverHeatData} DriverHeatData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DriverHeatData.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.DriverHeatData();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.driver = $root.com.antigravity.RaceParticipant.decode(reader, reader.uint32());
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
             * Decodes a DriverHeatData message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.DriverHeatData} DriverHeatData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DriverHeatData.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DriverHeatData message.
             * @function verify
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DriverHeatData.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.driver != null && message.hasOwnProperty("driver")) {
                    let error = $root.com.antigravity.RaceParticipant.verify(message.driver);
                    if (error)
                        return "driver." + error;
                }
                return null;
            };

            /**
             * Creates a DriverHeatData message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.DriverHeatData} DriverHeatData
             */
            DriverHeatData.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.DriverHeatData)
                    return object;
                let message = new $root.com.antigravity.DriverHeatData();
                if (object.driver != null) {
                    if (typeof object.driver !== "object")
                        throw TypeError(".com.antigravity.DriverHeatData.driver: object expected");
                    message.driver = $root.com.antigravity.RaceParticipant.fromObject(object.driver);
                }
                return message;
            };

            /**
             * Creates a plain object from a DriverHeatData message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {com.antigravity.DriverHeatData} message DriverHeatData
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DriverHeatData.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.driver = null;
                if (message.driver != null && message.hasOwnProperty("driver"))
                    object.driver = $root.com.antigravity.RaceParticipant.toObject(message.driver, options);
                return object;
            };

            /**
             * Converts this DriverHeatData to JSON.
             * @function toJSON
             * @memberof com.antigravity.DriverHeatData
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DriverHeatData.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DriverHeatData
             * @function getTypeUrl
             * @memberof com.antigravity.DriverHeatData
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DriverHeatData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.DriverHeatData";
            };

            return DriverHeatData;
        })();

        antigravity.RaceParticipant = (function() {

            /**
             * Properties of a RaceParticipant.
             * @memberof com.antigravity
             * @interface IRaceParticipant
             * @property {com.antigravity.IDriverModel|null} [driver] RaceParticipant driver
             */

            /**
             * Constructs a new RaceParticipant.
             * @memberof com.antigravity
             * @classdesc Represents a RaceParticipant.
             * @implements IRaceParticipant
             * @constructor
             * @param {com.antigravity.IRaceParticipant=} [properties] Properties to set
             */
            function RaceParticipant(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RaceParticipant driver.
             * @member {com.antigravity.IDriverModel|null|undefined} driver
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.driver = null;

            /**
             * Creates a new RaceParticipant instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {com.antigravity.IRaceParticipant=} [properties] Properties to set
             * @returns {com.antigravity.RaceParticipant} RaceParticipant instance
             */
            RaceParticipant.create = function create(properties) {
                return new RaceParticipant(properties);
            };

            /**
             * Encodes the specified RaceParticipant message. Does not implicitly {@link com.antigravity.RaceParticipant.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {com.antigravity.IRaceParticipant} message RaceParticipant message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceParticipant.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.driver != null && Object.hasOwnProperty.call(message, "driver"))
                    $root.com.antigravity.DriverModel.encode(message.driver, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified RaceParticipant message, length delimited. Does not implicitly {@link com.antigravity.RaceParticipant.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {com.antigravity.IRaceParticipant} message RaceParticipant message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceParticipant.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RaceParticipant message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RaceParticipant} RaceParticipant
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceParticipant.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RaceParticipant();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.driver = $root.com.antigravity.DriverModel.decode(reader, reader.uint32());
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
             * Decodes a RaceParticipant message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceParticipant} RaceParticipant
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceParticipant.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RaceParticipant message.
             * @function verify
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RaceParticipant.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.driver != null && message.hasOwnProperty("driver")) {
                    let error = $root.com.antigravity.DriverModel.verify(message.driver);
                    if (error)
                        return "driver." + error;
                }
                return null;
            };

            /**
             * Creates a RaceParticipant message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RaceParticipant} RaceParticipant
             */
            RaceParticipant.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RaceParticipant)
                    return object;
                let message = new $root.com.antigravity.RaceParticipant();
                if (object.driver != null) {
                    if (typeof object.driver !== "object")
                        throw TypeError(".com.antigravity.RaceParticipant.driver: object expected");
                    message.driver = $root.com.antigravity.DriverModel.fromObject(object.driver);
                }
                return message;
            };

            /**
             * Creates a plain object from a RaceParticipant message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {com.antigravity.RaceParticipant} message RaceParticipant
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RaceParticipant.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.driver = null;
                if (message.driver != null && message.hasOwnProperty("driver"))
                    object.driver = $root.com.antigravity.DriverModel.toObject(message.driver, options);
                return object;
            };

            /**
             * Converts this RaceParticipant to JSON.
             * @function toJSON
             * @memberof com.antigravity.RaceParticipant
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RaceParticipant.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RaceParticipant
             * @function getTypeUrl
             * @memberof com.antigravity.RaceParticipant
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RaceParticipant.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RaceParticipant";
            };

            return RaceParticipant;
        })();

        return antigravity;
    })();

    return com;
})();

export { $root as default };
