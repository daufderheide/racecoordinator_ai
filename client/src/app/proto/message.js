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

        antigravity.RaceScoring = (function() {

            /**
             * Properties of a RaceScoring.
             * @memberof com.antigravity
             * @interface IRaceScoring
             * @property {com.antigravity.RaceScoring.FinishMethod|null} [finishMethod] RaceScoring finishMethod
             * @property {number|Long|null} [finishValue] RaceScoring finishValue
             * @property {com.antigravity.RaceScoring.HeatRanking|null} [heatRanking] RaceScoring heatRanking
             * @property {com.antigravity.RaceScoring.TieBreaker|null} [heatRankingTiebreaker] RaceScoring heatRankingTiebreaker
             */

            /**
             * Constructs a new RaceScoring.
             * @memberof com.antigravity
             * @classdesc Represents a RaceScoring.
             * @implements IRaceScoring
             * @constructor
             * @param {com.antigravity.IRaceScoring=} [properties] Properties to set
             */
            function RaceScoring(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RaceScoring finishMethod.
             * @member {com.antigravity.RaceScoring.FinishMethod} finishMethod
             * @memberof com.antigravity.RaceScoring
             * @instance
             */
            RaceScoring.prototype.finishMethod = 0;

            /**
             * RaceScoring finishValue.
             * @member {number|Long} finishValue
             * @memberof com.antigravity.RaceScoring
             * @instance
             */
            RaceScoring.prototype.finishValue = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * RaceScoring heatRanking.
             * @member {com.antigravity.RaceScoring.HeatRanking} heatRanking
             * @memberof com.antigravity.RaceScoring
             * @instance
             */
            RaceScoring.prototype.heatRanking = 0;

            /**
             * RaceScoring heatRankingTiebreaker.
             * @member {com.antigravity.RaceScoring.TieBreaker} heatRankingTiebreaker
             * @memberof com.antigravity.RaceScoring
             * @instance
             */
            RaceScoring.prototype.heatRankingTiebreaker = 0;

            /**
             * Creates a new RaceScoring instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {com.antigravity.IRaceScoring=} [properties] Properties to set
             * @returns {com.antigravity.RaceScoring} RaceScoring instance
             */
            RaceScoring.create = function create(properties) {
                return new RaceScoring(properties);
            };

            /**
             * Encodes the specified RaceScoring message. Does not implicitly {@link com.antigravity.RaceScoring.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {com.antigravity.IRaceScoring} message RaceScoring message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceScoring.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.finishMethod != null && Object.hasOwnProperty.call(message, "finishMethod"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.finishMethod);
                if (message.finishValue != null && Object.hasOwnProperty.call(message, "finishValue"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int64(message.finishValue);
                if (message.heatRanking != null && Object.hasOwnProperty.call(message, "heatRanking"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.heatRanking);
                if (message.heatRankingTiebreaker != null && Object.hasOwnProperty.call(message, "heatRankingTiebreaker"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.heatRankingTiebreaker);
                return writer;
            };

            /**
             * Encodes the specified RaceScoring message, length delimited. Does not implicitly {@link com.antigravity.RaceScoring.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {com.antigravity.IRaceScoring} message RaceScoring message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceScoring.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RaceScoring message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RaceScoring} RaceScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceScoring.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RaceScoring();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.finishMethod = reader.int32();
                            break;
                        }
                    case 2: {
                            message.finishValue = reader.int64();
                            break;
                        }
                    case 3: {
                            message.heatRanking = reader.int32();
                            break;
                        }
                    case 4: {
                            message.heatRankingTiebreaker = reader.int32();
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
             * Decodes a RaceScoring message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceScoring} RaceScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceScoring.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RaceScoring message.
             * @function verify
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RaceScoring.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.finishMethod != null && message.hasOwnProperty("finishMethod"))
                    switch (message.finishMethod) {
                    default:
                        return "finishMethod: enum value expected";
                    case 0:
                    case 1:
                        break;
                    }
                if (message.finishValue != null && message.hasOwnProperty("finishValue"))
                    if (!$util.isInteger(message.finishValue) && !(message.finishValue && $util.isInteger(message.finishValue.low) && $util.isInteger(message.finishValue.high)))
                        return "finishValue: integer|Long expected";
                if (message.heatRanking != null && message.hasOwnProperty("heatRanking"))
                    switch (message.heatRanking) {
                    default:
                        return "heatRanking: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.heatRankingTiebreaker != null && message.hasOwnProperty("heatRankingTiebreaker"))
                    switch (message.heatRankingTiebreaker) {
                    default:
                        return "heatRankingTiebreaker: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a RaceScoring message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RaceScoring} RaceScoring
             */
            RaceScoring.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RaceScoring)
                    return object;
                let message = new $root.com.antigravity.RaceScoring();
                switch (object.finishMethod) {
                default:
                    if (typeof object.finishMethod === "number") {
                        message.finishMethod = object.finishMethod;
                        break;
                    }
                    break;
                case "Lap":
                case 0:
                    message.finishMethod = 0;
                    break;
                case "Timed":
                case 1:
                    message.finishMethod = 1;
                    break;
                }
                if (object.finishValue != null)
                    if ($util.Long)
                        (message.finishValue = $util.Long.fromValue(object.finishValue)).unsigned = false;
                    else if (typeof object.finishValue === "string")
                        message.finishValue = parseInt(object.finishValue, 10);
                    else if (typeof object.finishValue === "number")
                        message.finishValue = object.finishValue;
                    else if (typeof object.finishValue === "object")
                        message.finishValue = new $util.LongBits(object.finishValue.low >>> 0, object.finishValue.high >>> 0).toNumber();
                switch (object.heatRanking) {
                default:
                    if (typeof object.heatRanking === "number") {
                        message.heatRanking = object.heatRanking;
                        break;
                    }
                    break;
                case "LAP_COUNT":
                case 0:
                    message.heatRanking = 0;
                    break;
                case "FASTEST_LAP":
                case 1:
                    message.heatRanking = 1;
                    break;
                case "TOTAL_TIME":
                case 2:
                    message.heatRanking = 2;
                    break;
                }
                switch (object.heatRankingTiebreaker) {
                default:
                    if (typeof object.heatRankingTiebreaker === "number") {
                        message.heatRankingTiebreaker = object.heatRankingTiebreaker;
                        break;
                    }
                    break;
                case "FASTEST_LAP_TIME":
                case 0:
                    message.heatRankingTiebreaker = 0;
                    break;
                case "MEDIAN_LAP_TIME":
                case 1:
                    message.heatRankingTiebreaker = 1;
                    break;
                case "AVERAGE_LAP_TIME":
                case 2:
                    message.heatRankingTiebreaker = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a RaceScoring message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {com.antigravity.RaceScoring} message RaceScoring
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RaceScoring.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.finishMethod = options.enums === String ? "Lap" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.finishValue = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.finishValue = options.longs === String ? "0" : 0;
                    object.heatRanking = options.enums === String ? "LAP_COUNT" : 0;
                    object.heatRankingTiebreaker = options.enums === String ? "FASTEST_LAP_TIME" : 0;
                }
                if (message.finishMethod != null && message.hasOwnProperty("finishMethod"))
                    object.finishMethod = options.enums === String ? $root.com.antigravity.RaceScoring.FinishMethod[message.finishMethod] === undefined ? message.finishMethod : $root.com.antigravity.RaceScoring.FinishMethod[message.finishMethod] : message.finishMethod;
                if (message.finishValue != null && message.hasOwnProperty("finishValue"))
                    if (typeof message.finishValue === "number")
                        object.finishValue = options.longs === String ? String(message.finishValue) : message.finishValue;
                    else
                        object.finishValue = options.longs === String ? $util.Long.prototype.toString.call(message.finishValue) : options.longs === Number ? new $util.LongBits(message.finishValue.low >>> 0, message.finishValue.high >>> 0).toNumber() : message.finishValue;
                if (message.heatRanking != null && message.hasOwnProperty("heatRanking"))
                    object.heatRanking = options.enums === String ? $root.com.antigravity.RaceScoring.HeatRanking[message.heatRanking] === undefined ? message.heatRanking : $root.com.antigravity.RaceScoring.HeatRanking[message.heatRanking] : message.heatRanking;
                if (message.heatRankingTiebreaker != null && message.hasOwnProperty("heatRankingTiebreaker"))
                    object.heatRankingTiebreaker = options.enums === String ? $root.com.antigravity.RaceScoring.TieBreaker[message.heatRankingTiebreaker] === undefined ? message.heatRankingTiebreaker : $root.com.antigravity.RaceScoring.TieBreaker[message.heatRankingTiebreaker] : message.heatRankingTiebreaker;
                return object;
            };

            /**
             * Converts this RaceScoring to JSON.
             * @function toJSON
             * @memberof com.antigravity.RaceScoring
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RaceScoring.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RaceScoring
             * @function getTypeUrl
             * @memberof com.antigravity.RaceScoring
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RaceScoring.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RaceScoring";
            };

            /**
             * FinishMethod enum.
             * @name com.antigravity.RaceScoring.FinishMethod
             * @enum {number}
             * @property {number} Lap=0 Lap value
             * @property {number} Timed=1 Timed value
             */
            RaceScoring.FinishMethod = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "Lap"] = 0;
                values[valuesById[1] = "Timed"] = 1;
                return values;
            })();

            /**
             * HeatRanking enum.
             * @name com.antigravity.RaceScoring.HeatRanking
             * @enum {number}
             * @property {number} LAP_COUNT=0 LAP_COUNT value
             * @property {number} FASTEST_LAP=1 FASTEST_LAP value
             * @property {number} TOTAL_TIME=2 TOTAL_TIME value
             */
            RaceScoring.HeatRanking = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "LAP_COUNT"] = 0;
                values[valuesById[1] = "FASTEST_LAP"] = 1;
                values[valuesById[2] = "TOTAL_TIME"] = 2;
                return values;
            })();

            /**
             * TieBreaker enum.
             * @name com.antigravity.RaceScoring.TieBreaker
             * @enum {number}
             * @property {number} FASTEST_LAP_TIME=0 FASTEST_LAP_TIME value
             * @property {number} MEDIAN_LAP_TIME=1 MEDIAN_LAP_TIME value
             * @property {number} AVERAGE_LAP_TIME=2 AVERAGE_LAP_TIME value
             */
            RaceScoring.TieBreaker = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "FASTEST_LAP_TIME"] = 0;
                values[valuesById[1] = "MEDIAN_LAP_TIME"] = 1;
                values[valuesById[2] = "AVERAGE_LAP_TIME"] = 2;
                return values;
            })();

            return RaceScoring;
        })();

        antigravity.RaceModel = (function() {

            /**
             * Properties of a RaceModel.
             * @memberof com.antigravity
             * @interface IRaceModel
             * @property {com.antigravity.IModel|null} [model] RaceModel model
             * @property {string|null} [name] RaceModel name
             * @property {com.antigravity.ITrackModel|null} [track] RaceModel track
             * @property {com.antigravity.IRaceScoring|null} [raceScoring] RaceModel raceScoring
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
             * RaceModel raceScoring.
             * @member {com.antigravity.IRaceScoring|null|undefined} raceScoring
             * @memberof com.antigravity.RaceModel
             * @instance
             */
            RaceModel.prototype.raceScoring = null;

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
                if (message.raceScoring != null && Object.hasOwnProperty.call(message, "raceScoring"))
                    $root.com.antigravity.RaceScoring.encode(message.raceScoring, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
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
                    case 4: {
                            message.raceScoring = $root.com.antigravity.RaceScoring.decode(reader, reader.uint32());
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
                if (message.raceScoring != null && message.hasOwnProperty("raceScoring")) {
                    let error = $root.com.antigravity.RaceScoring.verify(message.raceScoring);
                    if (error)
                        return "raceScoring." + error;
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
                if (object.raceScoring != null) {
                    if (typeof object.raceScoring !== "object")
                        throw TypeError(".com.antigravity.RaceModel.raceScoring: object expected");
                    message.raceScoring = $root.com.antigravity.RaceScoring.fromObject(object.raceScoring);
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
                    object.raceScoring = null;
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.track != null && message.hasOwnProperty("track"))
                    object.track = $root.com.antigravity.TrackModel.toObject(message.track, options);
                if (message.raceScoring != null && message.hasOwnProperty("raceScoring"))
                    object.raceScoring = $root.com.antigravity.RaceScoring.toObject(message.raceScoring, options);
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
             * @property {string|null} [objectId] LaneModel objectId
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
             * LaneModel objectId.
             * @member {string} objectId
             * @memberof com.antigravity.LaneModel
             * @instance
             */
            LaneModel.prototype.objectId = "";

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
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.objectId);
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
                    case 4: {
                            message.objectId = reader.string();
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
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
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
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
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
                    object.objectId = "";
                }
                if (message.backgroundColor != null && message.hasOwnProperty("backgroundColor"))
                    object.backgroundColor = message.backgroundColor;
                if (message.foregroundColor != null && message.hasOwnProperty("foregroundColor"))
                    object.foregroundColor = message.foregroundColor;
                if (message.length != null && message.hasOwnProperty("length"))
                    object.length = message.length;
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
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

        antigravity.NextHeatRequest = (function() {

            /**
             * Properties of a NextHeatRequest.
             * @memberof com.antigravity
             * @interface INextHeatRequest
             */

            /**
             * Constructs a new NextHeatRequest.
             * @memberof com.antigravity
             * @classdesc Represents a NextHeatRequest.
             * @implements INextHeatRequest
             * @constructor
             * @param {com.antigravity.INextHeatRequest=} [properties] Properties to set
             */
            function NextHeatRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new NextHeatRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {com.antigravity.INextHeatRequest=} [properties] Properties to set
             * @returns {com.antigravity.NextHeatRequest} NextHeatRequest instance
             */
            NextHeatRequest.create = function create(properties) {
                return new NextHeatRequest(properties);
            };

            /**
             * Encodes the specified NextHeatRequest message. Does not implicitly {@link com.antigravity.NextHeatRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {com.antigravity.INextHeatRequest} message NextHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NextHeatRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified NextHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.NextHeatRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {com.antigravity.INextHeatRequest} message NextHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NextHeatRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a NextHeatRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.NextHeatRequest} NextHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NextHeatRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.NextHeatRequest();
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
             * Decodes a NextHeatRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.NextHeatRequest} NextHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NextHeatRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a NextHeatRequest message.
             * @function verify
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            NextHeatRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a NextHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.NextHeatRequest} NextHeatRequest
             */
            NextHeatRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.NextHeatRequest)
                    return object;
                return new $root.com.antigravity.NextHeatRequest();
            };

            /**
             * Creates a plain object from a NextHeatRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {com.antigravity.NextHeatRequest} message NextHeatRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            NextHeatRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this NextHeatRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.NextHeatRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            NextHeatRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for NextHeatRequest
             * @function getTypeUrl
             * @memberof com.antigravity.NextHeatRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            NextHeatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.NextHeatRequest";
            };

            return NextHeatRequest;
        })();

        antigravity.NextHeatResponse = (function() {

            /**
             * Properties of a NextHeatResponse.
             * @memberof com.antigravity
             * @interface INextHeatResponse
             * @property {boolean|null} [success] NextHeatResponse success
             * @property {string|null} [message] NextHeatResponse message
             */

            /**
             * Constructs a new NextHeatResponse.
             * @memberof com.antigravity
             * @classdesc Represents a NextHeatResponse.
             * @implements INextHeatResponse
             * @constructor
             * @param {com.antigravity.INextHeatResponse=} [properties] Properties to set
             */
            function NextHeatResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * NextHeatResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.NextHeatResponse
             * @instance
             */
            NextHeatResponse.prototype.success = false;

            /**
             * NextHeatResponse message.
             * @member {string} message
             * @memberof com.antigravity.NextHeatResponse
             * @instance
             */
            NextHeatResponse.prototype.message = "";

            /**
             * Creates a new NextHeatResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {com.antigravity.INextHeatResponse=} [properties] Properties to set
             * @returns {com.antigravity.NextHeatResponse} NextHeatResponse instance
             */
            NextHeatResponse.create = function create(properties) {
                return new NextHeatResponse(properties);
            };

            /**
             * Encodes the specified NextHeatResponse message. Does not implicitly {@link com.antigravity.NextHeatResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {com.antigravity.INextHeatResponse} message NextHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NextHeatResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified NextHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.NextHeatResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {com.antigravity.INextHeatResponse} message NextHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NextHeatResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a NextHeatResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.NextHeatResponse} NextHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NextHeatResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.NextHeatResponse();
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
             * Decodes a NextHeatResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.NextHeatResponse} NextHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NextHeatResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a NextHeatResponse message.
             * @function verify
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            NextHeatResponse.verify = function verify(message) {
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
             * Creates a NextHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.NextHeatResponse} NextHeatResponse
             */
            NextHeatResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.NextHeatResponse)
                    return object;
                let message = new $root.com.antigravity.NextHeatResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a NextHeatResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {com.antigravity.NextHeatResponse} message NextHeatResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            NextHeatResponse.toObject = function toObject(message, options) {
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
             * Converts this NextHeatResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.NextHeatResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            NextHeatResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for NextHeatResponse
             * @function getTypeUrl
             * @memberof com.antigravity.NextHeatResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            NextHeatResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.NextHeatResponse";
            };

            return NextHeatResponse;
        })();

        antigravity.RestartHeatRequest = (function() {

            /**
             * Properties of a RestartHeatRequest.
             * @memberof com.antigravity
             * @interface IRestartHeatRequest
             */

            /**
             * Constructs a new RestartHeatRequest.
             * @memberof com.antigravity
             * @classdesc Represents a RestartHeatRequest.
             * @implements IRestartHeatRequest
             * @constructor
             * @param {com.antigravity.IRestartHeatRequest=} [properties] Properties to set
             */
            function RestartHeatRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new RestartHeatRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {com.antigravity.IRestartHeatRequest=} [properties] Properties to set
             * @returns {com.antigravity.RestartHeatRequest} RestartHeatRequest instance
             */
            RestartHeatRequest.create = function create(properties) {
                return new RestartHeatRequest(properties);
            };

            /**
             * Encodes the specified RestartHeatRequest message. Does not implicitly {@link com.antigravity.RestartHeatRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {com.antigravity.IRestartHeatRequest} message RestartHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RestartHeatRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified RestartHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.RestartHeatRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {com.antigravity.IRestartHeatRequest} message RestartHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RestartHeatRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RestartHeatRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RestartHeatRequest} RestartHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RestartHeatRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RestartHeatRequest();
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
             * Decodes a RestartHeatRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RestartHeatRequest} RestartHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RestartHeatRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RestartHeatRequest message.
             * @function verify
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RestartHeatRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a RestartHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RestartHeatRequest} RestartHeatRequest
             */
            RestartHeatRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RestartHeatRequest)
                    return object;
                return new $root.com.antigravity.RestartHeatRequest();
            };

            /**
             * Creates a plain object from a RestartHeatRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {com.antigravity.RestartHeatRequest} message RestartHeatRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RestartHeatRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this RestartHeatRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.RestartHeatRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RestartHeatRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RestartHeatRequest
             * @function getTypeUrl
             * @memberof com.antigravity.RestartHeatRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RestartHeatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RestartHeatRequest";
            };

            return RestartHeatRequest;
        })();

        antigravity.RestartHeatResponse = (function() {

            /**
             * Properties of a RestartHeatResponse.
             * @memberof com.antigravity
             * @interface IRestartHeatResponse
             * @property {boolean|null} [success] RestartHeatResponse success
             * @property {string|null} [message] RestartHeatResponse message
             */

            /**
             * Constructs a new RestartHeatResponse.
             * @memberof com.antigravity
             * @classdesc Represents a RestartHeatResponse.
             * @implements IRestartHeatResponse
             * @constructor
             * @param {com.antigravity.IRestartHeatResponse=} [properties] Properties to set
             */
            function RestartHeatResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RestartHeatResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.RestartHeatResponse
             * @instance
             */
            RestartHeatResponse.prototype.success = false;

            /**
             * RestartHeatResponse message.
             * @member {string} message
             * @memberof com.antigravity.RestartHeatResponse
             * @instance
             */
            RestartHeatResponse.prototype.message = "";

            /**
             * Creates a new RestartHeatResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {com.antigravity.IRestartHeatResponse=} [properties] Properties to set
             * @returns {com.antigravity.RestartHeatResponse} RestartHeatResponse instance
             */
            RestartHeatResponse.create = function create(properties) {
                return new RestartHeatResponse(properties);
            };

            /**
             * Encodes the specified RestartHeatResponse message. Does not implicitly {@link com.antigravity.RestartHeatResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {com.antigravity.IRestartHeatResponse} message RestartHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RestartHeatResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified RestartHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.RestartHeatResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {com.antigravity.IRestartHeatResponse} message RestartHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RestartHeatResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RestartHeatResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RestartHeatResponse} RestartHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RestartHeatResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RestartHeatResponse();
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
             * Decodes a RestartHeatResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RestartHeatResponse} RestartHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RestartHeatResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RestartHeatResponse message.
             * @function verify
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RestartHeatResponse.verify = function verify(message) {
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
             * Creates a RestartHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RestartHeatResponse} RestartHeatResponse
             */
            RestartHeatResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RestartHeatResponse)
                    return object;
                let message = new $root.com.antigravity.RestartHeatResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a RestartHeatResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {com.antigravity.RestartHeatResponse} message RestartHeatResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RestartHeatResponse.toObject = function toObject(message, options) {
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
             * Converts this RestartHeatResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.RestartHeatResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RestartHeatResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RestartHeatResponse
             * @function getTypeUrl
             * @memberof com.antigravity.RestartHeatResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RestartHeatResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RestartHeatResponse";
            };

            return RestartHeatResponse;
        })();

        antigravity.SkipHeatRequest = (function() {

            /**
             * Properties of a SkipHeatRequest.
             * @memberof com.antigravity
             * @interface ISkipHeatRequest
             */

            /**
             * Constructs a new SkipHeatRequest.
             * @memberof com.antigravity
             * @classdesc Represents a SkipHeatRequest.
             * @implements ISkipHeatRequest
             * @constructor
             * @param {com.antigravity.ISkipHeatRequest=} [properties] Properties to set
             */
            function SkipHeatRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new SkipHeatRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {com.antigravity.ISkipHeatRequest=} [properties] Properties to set
             * @returns {com.antigravity.SkipHeatRequest} SkipHeatRequest instance
             */
            SkipHeatRequest.create = function create(properties) {
                return new SkipHeatRequest(properties);
            };

            /**
             * Encodes the specified SkipHeatRequest message. Does not implicitly {@link com.antigravity.SkipHeatRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {com.antigravity.ISkipHeatRequest} message SkipHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SkipHeatRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified SkipHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.SkipHeatRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {com.antigravity.ISkipHeatRequest} message SkipHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SkipHeatRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SkipHeatRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.SkipHeatRequest} SkipHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SkipHeatRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.SkipHeatRequest();
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
             * Decodes a SkipHeatRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.SkipHeatRequest} SkipHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SkipHeatRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SkipHeatRequest message.
             * @function verify
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SkipHeatRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a SkipHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.SkipHeatRequest} SkipHeatRequest
             */
            SkipHeatRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.SkipHeatRequest)
                    return object;
                return new $root.com.antigravity.SkipHeatRequest();
            };

            /**
             * Creates a plain object from a SkipHeatRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {com.antigravity.SkipHeatRequest} message SkipHeatRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SkipHeatRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this SkipHeatRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.SkipHeatRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SkipHeatRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SkipHeatRequest
             * @function getTypeUrl
             * @memberof com.antigravity.SkipHeatRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SkipHeatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.SkipHeatRequest";
            };

            return SkipHeatRequest;
        })();

        antigravity.SkipHeatResponse = (function() {

            /**
             * Properties of a SkipHeatResponse.
             * @memberof com.antigravity
             * @interface ISkipHeatResponse
             * @property {boolean|null} [success] SkipHeatResponse success
             * @property {string|null} [message] SkipHeatResponse message
             */

            /**
             * Constructs a new SkipHeatResponse.
             * @memberof com.antigravity
             * @classdesc Represents a SkipHeatResponse.
             * @implements ISkipHeatResponse
             * @constructor
             * @param {com.antigravity.ISkipHeatResponse=} [properties] Properties to set
             */
            function SkipHeatResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SkipHeatResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.SkipHeatResponse
             * @instance
             */
            SkipHeatResponse.prototype.success = false;

            /**
             * SkipHeatResponse message.
             * @member {string} message
             * @memberof com.antigravity.SkipHeatResponse
             * @instance
             */
            SkipHeatResponse.prototype.message = "";

            /**
             * Creates a new SkipHeatResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {com.antigravity.ISkipHeatResponse=} [properties] Properties to set
             * @returns {com.antigravity.SkipHeatResponse} SkipHeatResponse instance
             */
            SkipHeatResponse.create = function create(properties) {
                return new SkipHeatResponse(properties);
            };

            /**
             * Encodes the specified SkipHeatResponse message. Does not implicitly {@link com.antigravity.SkipHeatResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {com.antigravity.ISkipHeatResponse} message SkipHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SkipHeatResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified SkipHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.SkipHeatResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {com.antigravity.ISkipHeatResponse} message SkipHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SkipHeatResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SkipHeatResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.SkipHeatResponse} SkipHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SkipHeatResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.SkipHeatResponse();
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
             * Decodes a SkipHeatResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.SkipHeatResponse} SkipHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SkipHeatResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SkipHeatResponse message.
             * @function verify
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SkipHeatResponse.verify = function verify(message) {
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
             * Creates a SkipHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.SkipHeatResponse} SkipHeatResponse
             */
            SkipHeatResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.SkipHeatResponse)
                    return object;
                let message = new $root.com.antigravity.SkipHeatResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a SkipHeatResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {com.antigravity.SkipHeatResponse} message SkipHeatResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SkipHeatResponse.toObject = function toObject(message, options) {
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
             * Converts this SkipHeatResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.SkipHeatResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SkipHeatResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SkipHeatResponse
             * @function getTypeUrl
             * @memberof com.antigravity.SkipHeatResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SkipHeatResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.SkipHeatResponse";
            };

            return SkipHeatResponse;
        })();

        antigravity.DeferHeatRequest = (function() {

            /**
             * Properties of a DeferHeatRequest.
             * @memberof com.antigravity
             * @interface IDeferHeatRequest
             */

            /**
             * Constructs a new DeferHeatRequest.
             * @memberof com.antigravity
             * @classdesc Represents a DeferHeatRequest.
             * @implements IDeferHeatRequest
             * @constructor
             * @param {com.antigravity.IDeferHeatRequest=} [properties] Properties to set
             */
            function DeferHeatRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new DeferHeatRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {com.antigravity.IDeferHeatRequest=} [properties] Properties to set
             * @returns {com.antigravity.DeferHeatRequest} DeferHeatRequest instance
             */
            DeferHeatRequest.create = function create(properties) {
                return new DeferHeatRequest(properties);
            };

            /**
             * Encodes the specified DeferHeatRequest message. Does not implicitly {@link com.antigravity.DeferHeatRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {com.antigravity.IDeferHeatRequest} message DeferHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeferHeatRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified DeferHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.DeferHeatRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {com.antigravity.IDeferHeatRequest} message DeferHeatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeferHeatRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DeferHeatRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.DeferHeatRequest} DeferHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeferHeatRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.DeferHeatRequest();
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
             * Decodes a DeferHeatRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.DeferHeatRequest} DeferHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeferHeatRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DeferHeatRequest message.
             * @function verify
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DeferHeatRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a DeferHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.DeferHeatRequest} DeferHeatRequest
             */
            DeferHeatRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.DeferHeatRequest)
                    return object;
                return new $root.com.antigravity.DeferHeatRequest();
            };

            /**
             * Creates a plain object from a DeferHeatRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {com.antigravity.DeferHeatRequest} message DeferHeatRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DeferHeatRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this DeferHeatRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.DeferHeatRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DeferHeatRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DeferHeatRequest
             * @function getTypeUrl
             * @memberof com.antigravity.DeferHeatRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DeferHeatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.DeferHeatRequest";
            };

            return DeferHeatRequest;
        })();

        antigravity.DeferHeatResponse = (function() {

            /**
             * Properties of a DeferHeatResponse.
             * @memberof com.antigravity
             * @interface IDeferHeatResponse
             * @property {boolean|null} [success] DeferHeatResponse success
             */

            /**
             * Constructs a new DeferHeatResponse.
             * @memberof com.antigravity
             * @classdesc Represents a DeferHeatResponse.
             * @implements IDeferHeatResponse
             * @constructor
             * @param {com.antigravity.IDeferHeatResponse=} [properties] Properties to set
             */
            function DeferHeatResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DeferHeatResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.DeferHeatResponse
             * @instance
             */
            DeferHeatResponse.prototype.success = false;

            /**
             * Creates a new DeferHeatResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {com.antigravity.IDeferHeatResponse=} [properties] Properties to set
             * @returns {com.antigravity.DeferHeatResponse} DeferHeatResponse instance
             */
            DeferHeatResponse.create = function create(properties) {
                return new DeferHeatResponse(properties);
            };

            /**
             * Encodes the specified DeferHeatResponse message. Does not implicitly {@link com.antigravity.DeferHeatResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {com.antigravity.IDeferHeatResponse} message DeferHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeferHeatResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                return writer;
            };

            /**
             * Encodes the specified DeferHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.DeferHeatResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {com.antigravity.IDeferHeatResponse} message DeferHeatResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeferHeatResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DeferHeatResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.DeferHeatResponse} DeferHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeferHeatResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.DeferHeatResponse();
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
             * Decodes a DeferHeatResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.DeferHeatResponse} DeferHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeferHeatResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DeferHeatResponse message.
             * @function verify
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DeferHeatResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.success != null && message.hasOwnProperty("success"))
                    if (typeof message.success !== "boolean")
                        return "success: boolean expected";
                return null;
            };

            /**
             * Creates a DeferHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.DeferHeatResponse} DeferHeatResponse
             */
            DeferHeatResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.DeferHeatResponse)
                    return object;
                let message = new $root.com.antigravity.DeferHeatResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                return message;
            };

            /**
             * Creates a plain object from a DeferHeatResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {com.antigravity.DeferHeatResponse} message DeferHeatResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DeferHeatResponse.toObject = function toObject(message, options) {
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
             * Converts this DeferHeatResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.DeferHeatResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DeferHeatResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DeferHeatResponse
             * @function getTypeUrl
             * @memberof com.antigravity.DeferHeatResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DeferHeatResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.DeferHeatResponse";
            };

            return DeferHeatResponse;
        })();

        antigravity.RaceSubscriptionRequest = (function() {

            /**
             * Properties of a RaceSubscriptionRequest.
             * @memberof com.antigravity
             * @interface IRaceSubscriptionRequest
             * @property {boolean|null} [subscribe] RaceSubscriptionRequest subscribe
             */

            /**
             * Constructs a new RaceSubscriptionRequest.
             * @memberof com.antigravity
             * @classdesc Represents a RaceSubscriptionRequest.
             * @implements IRaceSubscriptionRequest
             * @constructor
             * @param {com.antigravity.IRaceSubscriptionRequest=} [properties] Properties to set
             */
            function RaceSubscriptionRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RaceSubscriptionRequest subscribe.
             * @member {boolean} subscribe
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @instance
             */
            RaceSubscriptionRequest.prototype.subscribe = false;

            /**
             * Creates a new RaceSubscriptionRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {com.antigravity.IRaceSubscriptionRequest=} [properties] Properties to set
             * @returns {com.antigravity.RaceSubscriptionRequest} RaceSubscriptionRequest instance
             */
            RaceSubscriptionRequest.create = function create(properties) {
                return new RaceSubscriptionRequest(properties);
            };

            /**
             * Encodes the specified RaceSubscriptionRequest message. Does not implicitly {@link com.antigravity.RaceSubscriptionRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {com.antigravity.IRaceSubscriptionRequest} message RaceSubscriptionRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceSubscriptionRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.subscribe != null && Object.hasOwnProperty.call(message, "subscribe"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.subscribe);
                return writer;
            };

            /**
             * Encodes the specified RaceSubscriptionRequest message, length delimited. Does not implicitly {@link com.antigravity.RaceSubscriptionRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {com.antigravity.IRaceSubscriptionRequest} message RaceSubscriptionRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RaceSubscriptionRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RaceSubscriptionRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RaceSubscriptionRequest} RaceSubscriptionRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceSubscriptionRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RaceSubscriptionRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.subscribe = reader.bool();
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
             * Decodes a RaceSubscriptionRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceSubscriptionRequest} RaceSubscriptionRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RaceSubscriptionRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RaceSubscriptionRequest message.
             * @function verify
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RaceSubscriptionRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.subscribe != null && message.hasOwnProperty("subscribe"))
                    if (typeof message.subscribe !== "boolean")
                        return "subscribe: boolean expected";
                return null;
            };

            /**
             * Creates a RaceSubscriptionRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RaceSubscriptionRequest} RaceSubscriptionRequest
             */
            RaceSubscriptionRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RaceSubscriptionRequest)
                    return object;
                let message = new $root.com.antigravity.RaceSubscriptionRequest();
                if (object.subscribe != null)
                    message.subscribe = Boolean(object.subscribe);
                return message;
            };

            /**
             * Creates a plain object from a RaceSubscriptionRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {com.antigravity.RaceSubscriptionRequest} message RaceSubscriptionRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RaceSubscriptionRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.subscribe = false;
                if (message.subscribe != null && message.hasOwnProperty("subscribe"))
                    object.subscribe = message.subscribe;
                return object;
            };

            /**
             * Converts this RaceSubscriptionRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RaceSubscriptionRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RaceSubscriptionRequest
             * @function getTypeUrl
             * @memberof com.antigravity.RaceSubscriptionRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RaceSubscriptionRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RaceSubscriptionRequest";
            };

            return RaceSubscriptionRequest;
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
                    writer.uint32(/* id 1, wireType 1 =*/9).double(message.time);
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
                            message.time = reader.double();
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
             * @property {string|null} [objectId] Lap objectId
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
             * Lap objectId.
             * @member {string} objectId
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.objectId = "";

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
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.objectId);
                if (message.lapTime != null && Object.hasOwnProperty.call(message, "lapTime"))
                    writer.uint32(/* id 2, wireType 1 =*/17).double(message.lapTime);
                if (message.lapNumber != null && Object.hasOwnProperty.call(message, "lapNumber"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.lapNumber);
                if (message.averageLapTime != null && Object.hasOwnProperty.call(message, "averageLapTime"))
                    writer.uint32(/* id 4, wireType 1 =*/33).double(message.averageLapTime);
                if (message.medianLapTime != null && Object.hasOwnProperty.call(message, "medianLapTime"))
                    writer.uint32(/* id 5, wireType 1 =*/41).double(message.medianLapTime);
                if (message.bestLapTime != null && Object.hasOwnProperty.call(message, "bestLapTime"))
                    writer.uint32(/* id 6, wireType 1 =*/49).double(message.bestLapTime);
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
                            message.objectId = reader.string();
                            break;
                        }
                    case 2: {
                            message.lapTime = reader.double();
                            break;
                        }
                    case 3: {
                            message.lapNumber = reader.int32();
                            break;
                        }
                    case 4: {
                            message.averageLapTime = reader.double();
                            break;
                        }
                    case 5: {
                            message.medianLapTime = reader.double();
                            break;
                        }
                    case 6: {
                            message.bestLapTime = reader.double();
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
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
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
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
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
                    object.objectId = "";
                    object.lapTime = 0;
                    object.lapNumber = 0;
                    object.averageLapTime = 0;
                    object.medianLapTime = 0;
                    object.bestLapTime = 0;
                }
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
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
             * @property {com.antigravity.IRace|null} [race] RaceData race
             * @property {com.antigravity.IReactionTime|null} [reactionTime] RaceData reactionTime
             * @property {com.antigravity.IStandingsUpdate|null} [standingsUpdate] RaceData standingsUpdate
             * @property {com.antigravity.IOverallStandingsUpdate|null} [overallStandingsUpdate] RaceData overallStandingsUpdate
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
             * RaceData race.
             * @member {com.antigravity.IRace|null|undefined} race
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.race = null;

            /**
             * RaceData reactionTime.
             * @member {com.antigravity.IReactionTime|null|undefined} reactionTime
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.reactionTime = null;

            /**
             * RaceData standingsUpdate.
             * @member {com.antigravity.IStandingsUpdate|null|undefined} standingsUpdate
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.standingsUpdate = null;

            /**
             * RaceData overallStandingsUpdate.
             * @member {com.antigravity.IOverallStandingsUpdate|null|undefined} overallStandingsUpdate
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.overallStandingsUpdate = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * RaceData data.
             * @member {"raceTime"|"lap"|"race"|"reactionTime"|"standingsUpdate"|"overallStandingsUpdate"|undefined} data
             * @memberof com.antigravity.RaceData
             * @instance
             */
            Object.defineProperty(RaceData.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["raceTime", "lap", "race", "reactionTime", "standingsUpdate", "overallStandingsUpdate"]),
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
                if (message.race != null && Object.hasOwnProperty.call(message, "race"))
                    $root.com.antigravity.Race.encode(message.race, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.reactionTime != null && Object.hasOwnProperty.call(message, "reactionTime"))
                    $root.com.antigravity.ReactionTime.encode(message.reactionTime, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.standingsUpdate != null && Object.hasOwnProperty.call(message, "standingsUpdate"))
                    $root.com.antigravity.StandingsUpdate.encode(message.standingsUpdate, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.overallStandingsUpdate != null && Object.hasOwnProperty.call(message, "overallStandingsUpdate"))
                    $root.com.antigravity.OverallStandingsUpdate.encode(message.overallStandingsUpdate, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
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
                            message.race = $root.com.antigravity.Race.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.reactionTime = $root.com.antigravity.ReactionTime.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.standingsUpdate = $root.com.antigravity.StandingsUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.overallStandingsUpdate = $root.com.antigravity.OverallStandingsUpdate.decode(reader, reader.uint32());
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
                if (message.race != null && message.hasOwnProperty("race")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.Race.verify(message.race);
                        if (error)
                            return "race." + error;
                    }
                }
                if (message.reactionTime != null && message.hasOwnProperty("reactionTime")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.ReactionTime.verify(message.reactionTime);
                        if (error)
                            return "reactionTime." + error;
                    }
                }
                if (message.standingsUpdate != null && message.hasOwnProperty("standingsUpdate")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.StandingsUpdate.verify(message.standingsUpdate);
                        if (error)
                            return "standingsUpdate." + error;
                    }
                }
                if (message.overallStandingsUpdate != null && message.hasOwnProperty("overallStandingsUpdate")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        let error = $root.com.antigravity.OverallStandingsUpdate.verify(message.overallStandingsUpdate);
                        if (error)
                            return "overallStandingsUpdate." + error;
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
                if (object.race != null) {
                    if (typeof object.race !== "object")
                        throw TypeError(".com.antigravity.RaceData.race: object expected");
                    message.race = $root.com.antigravity.Race.fromObject(object.race);
                }
                if (object.reactionTime != null) {
                    if (typeof object.reactionTime !== "object")
                        throw TypeError(".com.antigravity.RaceData.reactionTime: object expected");
                    message.reactionTime = $root.com.antigravity.ReactionTime.fromObject(object.reactionTime);
                }
                if (object.standingsUpdate != null) {
                    if (typeof object.standingsUpdate !== "object")
                        throw TypeError(".com.antigravity.RaceData.standingsUpdate: object expected");
                    message.standingsUpdate = $root.com.antigravity.StandingsUpdate.fromObject(object.standingsUpdate);
                }
                if (object.overallStandingsUpdate != null) {
                    if (typeof object.overallStandingsUpdate !== "object")
                        throw TypeError(".com.antigravity.RaceData.overallStandingsUpdate: object expected");
                    message.overallStandingsUpdate = $root.com.antigravity.OverallStandingsUpdate.fromObject(object.overallStandingsUpdate);
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
                if (message.race != null && message.hasOwnProperty("race")) {
                    object.race = $root.com.antigravity.Race.toObject(message.race, options);
                    if (options.oneofs)
                        object.data = "race";
                }
                if (message.reactionTime != null && message.hasOwnProperty("reactionTime")) {
                    object.reactionTime = $root.com.antigravity.ReactionTime.toObject(message.reactionTime, options);
                    if (options.oneofs)
                        object.data = "reactionTime";
                }
                if (message.standingsUpdate != null && message.hasOwnProperty("standingsUpdate")) {
                    object.standingsUpdate = $root.com.antigravity.StandingsUpdate.toObject(message.standingsUpdate, options);
                    if (options.oneofs)
                        object.data = "standingsUpdate";
                }
                if (message.overallStandingsUpdate != null && message.hasOwnProperty("overallStandingsUpdate")) {
                    object.overallStandingsUpdate = $root.com.antigravity.OverallStandingsUpdate.toObject(message.overallStandingsUpdate, options);
                    if (options.oneofs)
                        object.data = "overallStandingsUpdate";
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

        antigravity.Race = (function() {

            /**
             * Properties of a Race.
             * @memberof com.antigravity
             * @interface IRace
             * @property {com.antigravity.IRaceModel|null} [race] Race race
             * @property {Array.<com.antigravity.IRaceParticipant>|null} [drivers] Race drivers
             * @property {Array.<com.antigravity.IHeat>|null} [heats] Race heats
             * @property {com.antigravity.IHeat|null} [currentHeat] Race currentHeat
             */

            /**
             * Constructs a new Race.
             * @memberof com.antigravity
             * @classdesc Represents a Race.
             * @implements IRace
             * @constructor
             * @param {com.antigravity.IRace=} [properties] Properties to set
             */
            function Race(properties) {
                this.drivers = [];
                this.heats = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Race race.
             * @member {com.antigravity.IRaceModel|null|undefined} race
             * @memberof com.antigravity.Race
             * @instance
             */
            Race.prototype.race = null;

            /**
             * Race drivers.
             * @member {Array.<com.antigravity.IRaceParticipant>} drivers
             * @memberof com.antigravity.Race
             * @instance
             */
            Race.prototype.drivers = $util.emptyArray;

            /**
             * Race heats.
             * @member {Array.<com.antigravity.IHeat>} heats
             * @memberof com.antigravity.Race
             * @instance
             */
            Race.prototype.heats = $util.emptyArray;

            /**
             * Race currentHeat.
             * @member {com.antigravity.IHeat|null|undefined} currentHeat
             * @memberof com.antigravity.Race
             * @instance
             */
            Race.prototype.currentHeat = null;

            /**
             * Creates a new Race instance using the specified properties.
             * @function create
             * @memberof com.antigravity.Race
             * @static
             * @param {com.antigravity.IRace=} [properties] Properties to set
             * @returns {com.antigravity.Race} Race instance
             */
            Race.create = function create(properties) {
                return new Race(properties);
            };

            /**
             * Encodes the specified Race message. Does not implicitly {@link com.antigravity.Race.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.Race
             * @static
             * @param {com.antigravity.IRace} message Race message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Race.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.race != null && Object.hasOwnProperty.call(message, "race"))
                    $root.com.antigravity.RaceModel.encode(message.race, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.drivers != null && message.drivers.length)
                    for (let i = 0; i < message.drivers.length; ++i)
                        $root.com.antigravity.RaceParticipant.encode(message.drivers[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.heats != null && message.heats.length)
                    for (let i = 0; i < message.heats.length; ++i)
                        $root.com.antigravity.Heat.encode(message.heats[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.currentHeat != null && Object.hasOwnProperty.call(message, "currentHeat"))
                    $root.com.antigravity.Heat.encode(message.currentHeat, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Race message, length delimited. Does not implicitly {@link com.antigravity.Race.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.Race
             * @static
             * @param {com.antigravity.IRace} message Race message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Race.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Race message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.Race
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.Race} Race
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Race.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.Race();
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
                            message.drivers.push($root.com.antigravity.RaceParticipant.decode(reader, reader.uint32()));
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
             * Decodes a Race message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.Race
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.Race} Race
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Race.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Race message.
             * @function verify
             * @memberof com.antigravity.Race
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Race.verify = function verify(message) {
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
                        let error = $root.com.antigravity.RaceParticipant.verify(message.drivers[i]);
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
             * Creates a Race message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.Race
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.Race} Race
             */
            Race.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.Race)
                    return object;
                let message = new $root.com.antigravity.Race();
                if (object.race != null) {
                    if (typeof object.race !== "object")
                        throw TypeError(".com.antigravity.Race.race: object expected");
                    message.race = $root.com.antigravity.RaceModel.fromObject(object.race);
                }
                if (object.drivers) {
                    if (!Array.isArray(object.drivers))
                        throw TypeError(".com.antigravity.Race.drivers: array expected");
                    message.drivers = [];
                    for (let i = 0; i < object.drivers.length; ++i) {
                        if (typeof object.drivers[i] !== "object")
                            throw TypeError(".com.antigravity.Race.drivers: object expected");
                        message.drivers[i] = $root.com.antigravity.RaceParticipant.fromObject(object.drivers[i]);
                    }
                }
                if (object.heats) {
                    if (!Array.isArray(object.heats))
                        throw TypeError(".com.antigravity.Race.heats: array expected");
                    message.heats = [];
                    for (let i = 0; i < object.heats.length; ++i) {
                        if (typeof object.heats[i] !== "object")
                            throw TypeError(".com.antigravity.Race.heats: object expected");
                        message.heats[i] = $root.com.antigravity.Heat.fromObject(object.heats[i]);
                    }
                }
                if (object.currentHeat != null) {
                    if (typeof object.currentHeat !== "object")
                        throw TypeError(".com.antigravity.Race.currentHeat: object expected");
                    message.currentHeat = $root.com.antigravity.Heat.fromObject(object.currentHeat);
                }
                return message;
            };

            /**
             * Creates a plain object from a Race message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.Race
             * @static
             * @param {com.antigravity.Race} message Race
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Race.toObject = function toObject(message, options) {
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
                        object.drivers[j] = $root.com.antigravity.RaceParticipant.toObject(message.drivers[j], options);
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
             * Converts this Race to JSON.
             * @function toJSON
             * @memberof com.antigravity.Race
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Race.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Race
             * @function getTypeUrl
             * @memberof com.antigravity.Race
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Race.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.Race";
            };

            return Race;
        })();

        antigravity.Heat = (function() {

            /**
             * Properties of a Heat.
             * @memberof com.antigravity
             * @interface IHeat
             * @property {Array.<com.antigravity.IDriverHeatData>|null} [heatDrivers] Heat heatDrivers
             * @property {number|null} [heatNumber] Heat heatNumber
             * @property {string|null} [objectId] Heat objectId
             * @property {Array.<string>|null} [standings] Heat standings
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
                this.standings = [];
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
             * Heat objectId.
             * @member {string} objectId
             * @memberof com.antigravity.Heat
             * @instance
             */
            Heat.prototype.objectId = "";

            /**
             * Heat standings.
             * @member {Array.<string>} standings
             * @memberof com.antigravity.Heat
             * @instance
             */
            Heat.prototype.standings = $util.emptyArray;

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
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.objectId);
                if (message.standings != null && message.standings.length)
                    for (let i = 0; i < message.standings.length; ++i)
                        writer.uint32(/* id 4, wireType 2 =*/34).string(message.standings[i]);
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
                    case 3: {
                            message.objectId = reader.string();
                            break;
                        }
                    case 4: {
                            if (!(message.standings && message.standings.length))
                                message.standings = [];
                            message.standings.push(reader.string());
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
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
                if (message.standings != null && message.hasOwnProperty("standings")) {
                    if (!Array.isArray(message.standings))
                        return "standings: array expected";
                    for (let i = 0; i < message.standings.length; ++i)
                        if (!$util.isString(message.standings[i]))
                            return "standings: string[] expected";
                }
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
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
                if (object.standings) {
                    if (!Array.isArray(object.standings))
                        throw TypeError(".com.antigravity.Heat.standings: array expected");
                    message.standings = [];
                    for (let i = 0; i < object.standings.length; ++i)
                        message.standings[i] = String(object.standings[i]);
                }
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
                if (options.arrays || options.defaults) {
                    object.heatDrivers = [];
                    object.standings = [];
                }
                if (options.defaults) {
                    object.heatNumber = 0;
                    object.objectId = "";
                }
                if (message.heatDrivers && message.heatDrivers.length) {
                    object.heatDrivers = [];
                    for (let j = 0; j < message.heatDrivers.length; ++j)
                        object.heatDrivers[j] = $root.com.antigravity.DriverHeatData.toObject(message.heatDrivers[j], options);
                }
                if (message.heatNumber != null && message.hasOwnProperty("heatNumber"))
                    object.heatNumber = message.heatNumber;
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
                if (message.standings && message.standings.length) {
                    object.standings = [];
                    for (let j = 0; j < message.standings.length; ++j)
                        object.standings[j] = message.standings[j];
                }
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
             * @property {string|null} [objectId] DriverHeatData objectId
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
             * DriverHeatData objectId.
             * @member {string} objectId
             * @memberof com.antigravity.DriverHeatData
             * @instance
             */
            DriverHeatData.prototype.objectId = "";

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
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.objectId);
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
                    case 2: {
                            message.objectId = reader.string();
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
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
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
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
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
                if (options.defaults) {
                    object.driver = null;
                    object.objectId = "";
                }
                if (message.driver != null && message.hasOwnProperty("driver"))
                    object.driver = $root.com.antigravity.RaceParticipant.toObject(message.driver, options);
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
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
             * @property {string|null} [objectId] RaceParticipant objectId
             * @property {com.antigravity.IDriverModel|null} [driver] RaceParticipant driver
             * @property {number|null} [rank] RaceParticipant rank
             * @property {number|null} [totalLaps] RaceParticipant totalLaps
             * @property {number|null} [totalTime] RaceParticipant totalTime
             * @property {number|null} [bestLapTime] RaceParticipant bestLapTime
             * @property {number|null} [averageLapTime] RaceParticipant averageLapTime
             * @property {number|null} [medianLapTime] RaceParticipant medianLapTime
             * @property {number|null} [rankValue] RaceParticipant rankValue
             * @property {number|null} [seed] RaceParticipant seed
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
             * RaceParticipant objectId.
             * @member {string} objectId
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.objectId = "";

            /**
             * RaceParticipant driver.
             * @member {com.antigravity.IDriverModel|null|undefined} driver
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.driver = null;

            /**
             * RaceParticipant rank.
             * @member {number} rank
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.rank = 0;

            /**
             * RaceParticipant totalLaps.
             * @member {number} totalLaps
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.totalLaps = 0;

            /**
             * RaceParticipant totalTime.
             * @member {number} totalTime
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.totalTime = 0;

            /**
             * RaceParticipant bestLapTime.
             * @member {number} bestLapTime
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.bestLapTime = 0;

            /**
             * RaceParticipant averageLapTime.
             * @member {number} averageLapTime
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.averageLapTime = 0;

            /**
             * RaceParticipant medianLapTime.
             * @member {number} medianLapTime
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.medianLapTime = 0;

            /**
             * RaceParticipant rankValue.
             * @member {number} rankValue
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.rankValue = 0;

            /**
             * RaceParticipant seed.
             * @member {number} seed
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.seed = 0;

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
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.objectId);
                if (message.driver != null && Object.hasOwnProperty.call(message, "driver"))
                    $root.com.antigravity.DriverModel.encode(message.driver, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.rank != null && Object.hasOwnProperty.call(message, "rank"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.rank);
                if (message.totalLaps != null && Object.hasOwnProperty.call(message, "totalLaps"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.totalLaps);
                if (message.totalTime != null && Object.hasOwnProperty.call(message, "totalTime"))
                    writer.uint32(/* id 5, wireType 1 =*/41).double(message.totalTime);
                if (message.bestLapTime != null && Object.hasOwnProperty.call(message, "bestLapTime"))
                    writer.uint32(/* id 6, wireType 1 =*/49).double(message.bestLapTime);
                if (message.averageLapTime != null && Object.hasOwnProperty.call(message, "averageLapTime"))
                    writer.uint32(/* id 7, wireType 1 =*/57).double(message.averageLapTime);
                if (message.medianLapTime != null && Object.hasOwnProperty.call(message, "medianLapTime"))
                    writer.uint32(/* id 8, wireType 1 =*/65).double(message.medianLapTime);
                if (message.rankValue != null && Object.hasOwnProperty.call(message, "rankValue"))
                    writer.uint32(/* id 9, wireType 1 =*/73).double(message.rankValue);
                if (message.seed != null && Object.hasOwnProperty.call(message, "seed"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int32(message.seed);
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
                            message.objectId = reader.string();
                            break;
                        }
                    case 2: {
                            message.driver = $root.com.antigravity.DriverModel.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.rank = reader.int32();
                            break;
                        }
                    case 4: {
                            message.totalLaps = reader.int32();
                            break;
                        }
                    case 5: {
                            message.totalTime = reader.double();
                            break;
                        }
                    case 6: {
                            message.bestLapTime = reader.double();
                            break;
                        }
                    case 7: {
                            message.averageLapTime = reader.double();
                            break;
                        }
                    case 8: {
                            message.medianLapTime = reader.double();
                            break;
                        }
                    case 9: {
                            message.rankValue = reader.double();
                            break;
                        }
                    case 10: {
                            message.seed = reader.int32();
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
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
                if (message.driver != null && message.hasOwnProperty("driver")) {
                    let error = $root.com.antigravity.DriverModel.verify(message.driver);
                    if (error)
                        return "driver." + error;
                }
                if (message.rank != null && message.hasOwnProperty("rank"))
                    if (!$util.isInteger(message.rank))
                        return "rank: integer expected";
                if (message.totalLaps != null && message.hasOwnProperty("totalLaps"))
                    if (!$util.isInteger(message.totalLaps))
                        return "totalLaps: integer expected";
                if (message.totalTime != null && message.hasOwnProperty("totalTime"))
                    if (typeof message.totalTime !== "number")
                        return "totalTime: number expected";
                if (message.bestLapTime != null && message.hasOwnProperty("bestLapTime"))
                    if (typeof message.bestLapTime !== "number")
                        return "bestLapTime: number expected";
                if (message.averageLapTime != null && message.hasOwnProperty("averageLapTime"))
                    if (typeof message.averageLapTime !== "number")
                        return "averageLapTime: number expected";
                if (message.medianLapTime != null && message.hasOwnProperty("medianLapTime"))
                    if (typeof message.medianLapTime !== "number")
                        return "medianLapTime: number expected";
                if (message.rankValue != null && message.hasOwnProperty("rankValue"))
                    if (typeof message.rankValue !== "number")
                        return "rankValue: number expected";
                if (message.seed != null && message.hasOwnProperty("seed"))
                    if (!$util.isInteger(message.seed))
                        return "seed: integer expected";
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
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
                if (object.driver != null) {
                    if (typeof object.driver !== "object")
                        throw TypeError(".com.antigravity.RaceParticipant.driver: object expected");
                    message.driver = $root.com.antigravity.DriverModel.fromObject(object.driver);
                }
                if (object.rank != null)
                    message.rank = object.rank | 0;
                if (object.totalLaps != null)
                    message.totalLaps = object.totalLaps | 0;
                if (object.totalTime != null)
                    message.totalTime = Number(object.totalTime);
                if (object.bestLapTime != null)
                    message.bestLapTime = Number(object.bestLapTime);
                if (object.averageLapTime != null)
                    message.averageLapTime = Number(object.averageLapTime);
                if (object.medianLapTime != null)
                    message.medianLapTime = Number(object.medianLapTime);
                if (object.rankValue != null)
                    message.rankValue = Number(object.rankValue);
                if (object.seed != null)
                    message.seed = object.seed | 0;
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
                if (options.defaults) {
                    object.objectId = "";
                    object.driver = null;
                    object.rank = 0;
                    object.totalLaps = 0;
                    object.totalTime = 0;
                    object.bestLapTime = 0;
                    object.averageLapTime = 0;
                    object.medianLapTime = 0;
                    object.rankValue = 0;
                    object.seed = 0;
                }
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
                if (message.driver != null && message.hasOwnProperty("driver"))
                    object.driver = $root.com.antigravity.DriverModel.toObject(message.driver, options);
                if (message.rank != null && message.hasOwnProperty("rank"))
                    object.rank = message.rank;
                if (message.totalLaps != null && message.hasOwnProperty("totalLaps"))
                    object.totalLaps = message.totalLaps;
                if (message.totalTime != null && message.hasOwnProperty("totalTime"))
                    object.totalTime = options.json && !isFinite(message.totalTime) ? String(message.totalTime) : message.totalTime;
                if (message.bestLapTime != null && message.hasOwnProperty("bestLapTime"))
                    object.bestLapTime = options.json && !isFinite(message.bestLapTime) ? String(message.bestLapTime) : message.bestLapTime;
                if (message.averageLapTime != null && message.hasOwnProperty("averageLapTime"))
                    object.averageLapTime = options.json && !isFinite(message.averageLapTime) ? String(message.averageLapTime) : message.averageLapTime;
                if (message.medianLapTime != null && message.hasOwnProperty("medianLapTime"))
                    object.medianLapTime = options.json && !isFinite(message.medianLapTime) ? String(message.medianLapTime) : message.medianLapTime;
                if (message.rankValue != null && message.hasOwnProperty("rankValue"))
                    object.rankValue = options.json && !isFinite(message.rankValue) ? String(message.rankValue) : message.rankValue;
                if (message.seed != null && message.hasOwnProperty("seed"))
                    object.seed = message.seed;
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

        antigravity.ReactionTime = (function() {

            /**
             * Properties of a ReactionTime.
             * @memberof com.antigravity
             * @interface IReactionTime
             * @property {string|null} [objectId] ReactionTime objectId
             * @property {number|null} [reactionTime] ReactionTime reactionTime
             */

            /**
             * Constructs a new ReactionTime.
             * @memberof com.antigravity
             * @classdesc Represents a ReactionTime.
             * @implements IReactionTime
             * @constructor
             * @param {com.antigravity.IReactionTime=} [properties] Properties to set
             */
            function ReactionTime(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ReactionTime objectId.
             * @member {string} objectId
             * @memberof com.antigravity.ReactionTime
             * @instance
             */
            ReactionTime.prototype.objectId = "";

            /**
             * ReactionTime reactionTime.
             * @member {number} reactionTime
             * @memberof com.antigravity.ReactionTime
             * @instance
             */
            ReactionTime.prototype.reactionTime = 0;

            /**
             * Creates a new ReactionTime instance using the specified properties.
             * @function create
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {com.antigravity.IReactionTime=} [properties] Properties to set
             * @returns {com.antigravity.ReactionTime} ReactionTime instance
             */
            ReactionTime.create = function create(properties) {
                return new ReactionTime(properties);
            };

            /**
             * Encodes the specified ReactionTime message. Does not implicitly {@link com.antigravity.ReactionTime.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {com.antigravity.IReactionTime} message ReactionTime message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ReactionTime.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.objectId);
                if (message.reactionTime != null && Object.hasOwnProperty.call(message, "reactionTime"))
                    writer.uint32(/* id 2, wireType 1 =*/17).double(message.reactionTime);
                return writer;
            };

            /**
             * Encodes the specified ReactionTime message, length delimited. Does not implicitly {@link com.antigravity.ReactionTime.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {com.antigravity.IReactionTime} message ReactionTime message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ReactionTime.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ReactionTime message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.ReactionTime} ReactionTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ReactionTime.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.ReactionTime();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.objectId = reader.string();
                            break;
                        }
                    case 2: {
                            message.reactionTime = reader.double();
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
             * Decodes a ReactionTime message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.ReactionTime} ReactionTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ReactionTime.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ReactionTime message.
             * @function verify
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ReactionTime.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
                if (message.reactionTime != null && message.hasOwnProperty("reactionTime"))
                    if (typeof message.reactionTime !== "number")
                        return "reactionTime: number expected";
                return null;
            };

            /**
             * Creates a ReactionTime message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.ReactionTime} ReactionTime
             */
            ReactionTime.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.ReactionTime)
                    return object;
                let message = new $root.com.antigravity.ReactionTime();
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
                if (object.reactionTime != null)
                    message.reactionTime = Number(object.reactionTime);
                return message;
            };

            /**
             * Creates a plain object from a ReactionTime message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {com.antigravity.ReactionTime} message ReactionTime
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ReactionTime.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.objectId = "";
                    object.reactionTime = 0;
                }
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
                if (message.reactionTime != null && message.hasOwnProperty("reactionTime"))
                    object.reactionTime = options.json && !isFinite(message.reactionTime) ? String(message.reactionTime) : message.reactionTime;
                return object;
            };

            /**
             * Converts this ReactionTime to JSON.
             * @function toJSON
             * @memberof com.antigravity.ReactionTime
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ReactionTime.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ReactionTime
             * @function getTypeUrl
             * @memberof com.antigravity.ReactionTime
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ReactionTime.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.ReactionTime";
            };

            return ReactionTime;
        })();

        antigravity.HeatPositionUpdate = (function() {

            /**
             * Properties of a HeatPositionUpdate.
             * @memberof com.antigravity
             * @interface IHeatPositionUpdate
             * @property {string|null} [objectId] HeatPositionUpdate objectId
             * @property {number|null} [rank] HeatPositionUpdate rank
             */

            /**
             * Constructs a new HeatPositionUpdate.
             * @memberof com.antigravity
             * @classdesc Represents a HeatPositionUpdate.
             * @implements IHeatPositionUpdate
             * @constructor
             * @param {com.antigravity.IHeatPositionUpdate=} [properties] Properties to set
             */
            function HeatPositionUpdate(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HeatPositionUpdate objectId.
             * @member {string} objectId
             * @memberof com.antigravity.HeatPositionUpdate
             * @instance
             */
            HeatPositionUpdate.prototype.objectId = "";

            /**
             * HeatPositionUpdate rank.
             * @member {number} rank
             * @memberof com.antigravity.HeatPositionUpdate
             * @instance
             */
            HeatPositionUpdate.prototype.rank = 0;

            /**
             * Creates a new HeatPositionUpdate instance using the specified properties.
             * @function create
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {com.antigravity.IHeatPositionUpdate=} [properties] Properties to set
             * @returns {com.antigravity.HeatPositionUpdate} HeatPositionUpdate instance
             */
            HeatPositionUpdate.create = function create(properties) {
                return new HeatPositionUpdate(properties);
            };

            /**
             * Encodes the specified HeatPositionUpdate message. Does not implicitly {@link com.antigravity.HeatPositionUpdate.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {com.antigravity.IHeatPositionUpdate} message HeatPositionUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HeatPositionUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.objectId);
                if (message.rank != null && Object.hasOwnProperty.call(message, "rank"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.rank);
                return writer;
            };

            /**
             * Encodes the specified HeatPositionUpdate message, length delimited. Does not implicitly {@link com.antigravity.HeatPositionUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {com.antigravity.IHeatPositionUpdate} message HeatPositionUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HeatPositionUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HeatPositionUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.HeatPositionUpdate} HeatPositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HeatPositionUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.HeatPositionUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.objectId = reader.string();
                            break;
                        }
                    case 2: {
                            message.rank = reader.int32();
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
             * Decodes a HeatPositionUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.HeatPositionUpdate} HeatPositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HeatPositionUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HeatPositionUpdate message.
             * @function verify
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HeatPositionUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    if (!$util.isString(message.objectId))
                        return "objectId: string expected";
                if (message.rank != null && message.hasOwnProperty("rank"))
                    if (!$util.isInteger(message.rank))
                        return "rank: integer expected";
                return null;
            };

            /**
             * Creates a HeatPositionUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.HeatPositionUpdate} HeatPositionUpdate
             */
            HeatPositionUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.HeatPositionUpdate)
                    return object;
                let message = new $root.com.antigravity.HeatPositionUpdate();
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
                if (object.rank != null)
                    message.rank = object.rank | 0;
                return message;
            };

            /**
             * Creates a plain object from a HeatPositionUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {com.antigravity.HeatPositionUpdate} message HeatPositionUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HeatPositionUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.objectId = "";
                    object.rank = 0;
                }
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
                if (message.rank != null && message.hasOwnProperty("rank"))
                    object.rank = message.rank;
                return object;
            };

            /**
             * Converts this HeatPositionUpdate to JSON.
             * @function toJSON
             * @memberof com.antigravity.HeatPositionUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HeatPositionUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for HeatPositionUpdate
             * @function getTypeUrl
             * @memberof com.antigravity.HeatPositionUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            HeatPositionUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.HeatPositionUpdate";
            };

            return HeatPositionUpdate;
        })();

        antigravity.StandingsUpdate = (function() {

            /**
             * Properties of a StandingsUpdate.
             * @memberof com.antigravity
             * @interface IStandingsUpdate
             * @property {Array.<com.antigravity.IHeatPositionUpdate>|null} [updates] StandingsUpdate updates
             */

            /**
             * Constructs a new StandingsUpdate.
             * @memberof com.antigravity
             * @classdesc Represents a StandingsUpdate.
             * @implements IStandingsUpdate
             * @constructor
             * @param {com.antigravity.IStandingsUpdate=} [properties] Properties to set
             */
            function StandingsUpdate(properties) {
                this.updates = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * StandingsUpdate updates.
             * @member {Array.<com.antigravity.IHeatPositionUpdate>} updates
             * @memberof com.antigravity.StandingsUpdate
             * @instance
             */
            StandingsUpdate.prototype.updates = $util.emptyArray;

            /**
             * Creates a new StandingsUpdate instance using the specified properties.
             * @function create
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {com.antigravity.IStandingsUpdate=} [properties] Properties to set
             * @returns {com.antigravity.StandingsUpdate} StandingsUpdate instance
             */
            StandingsUpdate.create = function create(properties) {
                return new StandingsUpdate(properties);
            };

            /**
             * Encodes the specified StandingsUpdate message. Does not implicitly {@link com.antigravity.StandingsUpdate.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {com.antigravity.IStandingsUpdate} message StandingsUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StandingsUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.updates != null && message.updates.length)
                    for (let i = 0; i < message.updates.length; ++i)
                        $root.com.antigravity.HeatPositionUpdate.encode(message.updates[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified StandingsUpdate message, length delimited. Does not implicitly {@link com.antigravity.StandingsUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {com.antigravity.IStandingsUpdate} message StandingsUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StandingsUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a StandingsUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.StandingsUpdate} StandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StandingsUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.StandingsUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.updates && message.updates.length))
                                message.updates = [];
                            message.updates.push($root.com.antigravity.HeatPositionUpdate.decode(reader, reader.uint32()));
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
             * Decodes a StandingsUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.StandingsUpdate} StandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StandingsUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a StandingsUpdate message.
             * @function verify
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            StandingsUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.updates != null && message.hasOwnProperty("updates")) {
                    if (!Array.isArray(message.updates))
                        return "updates: array expected";
                    for (let i = 0; i < message.updates.length; ++i) {
                        let error = $root.com.antigravity.HeatPositionUpdate.verify(message.updates[i]);
                        if (error)
                            return "updates." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a StandingsUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.StandingsUpdate} StandingsUpdate
             */
            StandingsUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.StandingsUpdate)
                    return object;
                let message = new $root.com.antigravity.StandingsUpdate();
                if (object.updates) {
                    if (!Array.isArray(object.updates))
                        throw TypeError(".com.antigravity.StandingsUpdate.updates: array expected");
                    message.updates = [];
                    for (let i = 0; i < object.updates.length; ++i) {
                        if (typeof object.updates[i] !== "object")
                            throw TypeError(".com.antigravity.StandingsUpdate.updates: object expected");
                        message.updates[i] = $root.com.antigravity.HeatPositionUpdate.fromObject(object.updates[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a StandingsUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {com.antigravity.StandingsUpdate} message StandingsUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            StandingsUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.updates = [];
                if (message.updates && message.updates.length) {
                    object.updates = [];
                    for (let j = 0; j < message.updates.length; ++j)
                        object.updates[j] = $root.com.antigravity.HeatPositionUpdate.toObject(message.updates[j], options);
                }
                return object;
            };

            /**
             * Converts this StandingsUpdate to JSON.
             * @function toJSON
             * @memberof com.antigravity.StandingsUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            StandingsUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for StandingsUpdate
             * @function getTypeUrl
             * @memberof com.antigravity.StandingsUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            StandingsUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.StandingsUpdate";
            };

            return StandingsUpdate;
        })();

        antigravity.OverallStandingsUpdate = (function() {

            /**
             * Properties of an OverallStandingsUpdate.
             * @memberof com.antigravity
             * @interface IOverallStandingsUpdate
             * @property {Array.<com.antigravity.IRaceParticipant>|null} [participants] OverallStandingsUpdate participants
             */

            /**
             * Constructs a new OverallStandingsUpdate.
             * @memberof com.antigravity
             * @classdesc Represents an OverallStandingsUpdate.
             * @implements IOverallStandingsUpdate
             * @constructor
             * @param {com.antigravity.IOverallStandingsUpdate=} [properties] Properties to set
             */
            function OverallStandingsUpdate(properties) {
                this.participants = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * OverallStandingsUpdate participants.
             * @member {Array.<com.antigravity.IRaceParticipant>} participants
             * @memberof com.antigravity.OverallStandingsUpdate
             * @instance
             */
            OverallStandingsUpdate.prototype.participants = $util.emptyArray;

            /**
             * Creates a new OverallStandingsUpdate instance using the specified properties.
             * @function create
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {com.antigravity.IOverallStandingsUpdate=} [properties] Properties to set
             * @returns {com.antigravity.OverallStandingsUpdate} OverallStandingsUpdate instance
             */
            OverallStandingsUpdate.create = function create(properties) {
                return new OverallStandingsUpdate(properties);
            };

            /**
             * Encodes the specified OverallStandingsUpdate message. Does not implicitly {@link com.antigravity.OverallStandingsUpdate.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {com.antigravity.IOverallStandingsUpdate} message OverallStandingsUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OverallStandingsUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.participants != null && message.participants.length)
                    for (let i = 0; i < message.participants.length; ++i)
                        $root.com.antigravity.RaceParticipant.encode(message.participants[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified OverallStandingsUpdate message, length delimited. Does not implicitly {@link com.antigravity.OverallStandingsUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {com.antigravity.IOverallStandingsUpdate} message OverallStandingsUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OverallStandingsUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an OverallStandingsUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.OverallStandingsUpdate} OverallStandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OverallStandingsUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.OverallStandingsUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.participants && message.participants.length))
                                message.participants = [];
                            message.participants.push($root.com.antigravity.RaceParticipant.decode(reader, reader.uint32()));
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
             * Decodes an OverallStandingsUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.OverallStandingsUpdate} OverallStandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OverallStandingsUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an OverallStandingsUpdate message.
             * @function verify
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            OverallStandingsUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.participants != null && message.hasOwnProperty("participants")) {
                    if (!Array.isArray(message.participants))
                        return "participants: array expected";
                    for (let i = 0; i < message.participants.length; ++i) {
                        let error = $root.com.antigravity.RaceParticipant.verify(message.participants[i]);
                        if (error)
                            return "participants." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an OverallStandingsUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.OverallStandingsUpdate} OverallStandingsUpdate
             */
            OverallStandingsUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.OverallStandingsUpdate)
                    return object;
                let message = new $root.com.antigravity.OverallStandingsUpdate();
                if (object.participants) {
                    if (!Array.isArray(object.participants))
                        throw TypeError(".com.antigravity.OverallStandingsUpdate.participants: array expected");
                    message.participants = [];
                    for (let i = 0; i < object.participants.length; ++i) {
                        if (typeof object.participants[i] !== "object")
                            throw TypeError(".com.antigravity.OverallStandingsUpdate.participants: object expected");
                        message.participants[i] = $root.com.antigravity.RaceParticipant.fromObject(object.participants[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from an OverallStandingsUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {com.antigravity.OverallStandingsUpdate} message OverallStandingsUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OverallStandingsUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.participants = [];
                if (message.participants && message.participants.length) {
                    object.participants = [];
                    for (let j = 0; j < message.participants.length; ++j)
                        object.participants[j] = $root.com.antigravity.RaceParticipant.toObject(message.participants[j], options);
                }
                return object;
            };

            /**
             * Converts this OverallStandingsUpdate to JSON.
             * @function toJSON
             * @memberof com.antigravity.OverallStandingsUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OverallStandingsUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for OverallStandingsUpdate
             * @function getTypeUrl
             * @memberof com.antigravity.OverallStandingsUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            OverallStandingsUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.OverallStandingsUpdate";
            };

            return OverallStandingsUpdate;
        })();

        return antigravity;
    })();

    return com;
})();

export { $root as default };
