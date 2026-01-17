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

        antigravity.HelloRequest = (function() {

            /**
             * Properties of a HelloRequest.
             * @memberof com.antigravity
             * @interface IHelloRequest
             * @property {string|null} [name] HelloRequest name
             */

            /**
             * Constructs a new HelloRequest.
             * @memberof com.antigravity
             * @classdesc Represents a HelloRequest.
             * @implements IHelloRequest
             * @constructor
             * @param {com.antigravity.IHelloRequest=} [properties] Properties to set
             */
            function HelloRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HelloRequest name.
             * @member {string} name
             * @memberof com.antigravity.HelloRequest
             * @instance
             */
            HelloRequest.prototype.name = "";

            /**
             * Creates a new HelloRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {com.antigravity.IHelloRequest=} [properties] Properties to set
             * @returns {com.antigravity.HelloRequest} HelloRequest instance
             */
            HelloRequest.create = function create(properties) {
                return new HelloRequest(properties);
            };

            /**
             * Encodes the specified HelloRequest message. Does not implicitly {@link com.antigravity.HelloRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {com.antigravity.IHelloRequest} message HelloRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HelloRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                return writer;
            };

            /**
             * Encodes the specified HelloRequest message, length delimited. Does not implicitly {@link com.antigravity.HelloRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {com.antigravity.IHelloRequest} message HelloRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HelloRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HelloRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.HelloRequest} HelloRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HelloRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.HelloRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.name = reader.string();
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
             * Decodes a HelloRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.HelloRequest} HelloRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HelloRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HelloRequest message.
             * @function verify
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HelloRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                return null;
            };

            /**
             * Creates a HelloRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.HelloRequest} HelloRequest
             */
            HelloRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.HelloRequest)
                    return object;
                let message = new $root.com.antigravity.HelloRequest();
                if (object.name != null)
                    message.name = String(object.name);
                return message;
            };

            /**
             * Creates a plain object from a HelloRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {com.antigravity.HelloRequest} message HelloRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HelloRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.name = "";
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                return object;
            };

            /**
             * Converts this HelloRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.HelloRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HelloRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for HelloRequest
             * @function getTypeUrl
             * @memberof com.antigravity.HelloRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            HelloRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.HelloRequest";
            };

            return HelloRequest;
        })();

        antigravity.HelloResponse = (function() {

            /**
             * Properties of a HelloResponse.
             * @memberof com.antigravity
             * @interface IHelloResponse
             * @property {string|null} [greeting] HelloResponse greeting
             */

            /**
             * Constructs a new HelloResponse.
             * @memberof com.antigravity
             * @classdesc Represents a HelloResponse.
             * @implements IHelloResponse
             * @constructor
             * @param {com.antigravity.IHelloResponse=} [properties] Properties to set
             */
            function HelloResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HelloResponse greeting.
             * @member {string} greeting
             * @memberof com.antigravity.HelloResponse
             * @instance
             */
            HelloResponse.prototype.greeting = "";

            /**
             * Creates a new HelloResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {com.antigravity.IHelloResponse=} [properties] Properties to set
             * @returns {com.antigravity.HelloResponse} HelloResponse instance
             */
            HelloResponse.create = function create(properties) {
                return new HelloResponse(properties);
            };

            /**
             * Encodes the specified HelloResponse message. Does not implicitly {@link com.antigravity.HelloResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {com.antigravity.IHelloResponse} message HelloResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HelloResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.greeting != null && Object.hasOwnProperty.call(message, "greeting"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.greeting);
                return writer;
            };

            /**
             * Encodes the specified HelloResponse message, length delimited. Does not implicitly {@link com.antigravity.HelloResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {com.antigravity.IHelloResponse} message HelloResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HelloResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HelloResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.HelloResponse} HelloResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HelloResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.HelloResponse();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.greeting = reader.string();
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
             * Decodes a HelloResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.HelloResponse} HelloResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HelloResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HelloResponse message.
             * @function verify
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HelloResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.greeting != null && message.hasOwnProperty("greeting"))
                    if (!$util.isString(message.greeting))
                        return "greeting: string expected";
                return null;
            };

            /**
             * Creates a HelloResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.HelloResponse} HelloResponse
             */
            HelloResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.HelloResponse)
                    return object;
                let message = new $root.com.antigravity.HelloResponse();
                if (object.greeting != null)
                    message.greeting = String(object.greeting);
                return message;
            };

            /**
             * Creates a plain object from a HelloResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {com.antigravity.HelloResponse} message HelloResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HelloResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.greeting = "";
                if (message.greeting != null && message.hasOwnProperty("greeting"))
                    object.greeting = message.greeting;
                return object;
            };

            /**
             * Converts this HelloResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.HelloResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HelloResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for HelloResponse
             * @function getTypeUrl
             * @memberof com.antigravity.HelloResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            HelloResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.HelloResponse";
            };

            return HelloResponse;
        })();

        antigravity.InitializeRaceRequest = (function() {

            /**
             * Properties of an InitializeRaceRequest.
             * @memberof com.antigravity
             * @interface IInitializeRaceRequest
             * @property {string|null} [raceId] InitializeRaceRequest raceId
             * @property {Array.<string>|null} [driverIds] InitializeRaceRequest driverIds
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
                if (options.defaults)
                    object.raceId = "";
                if (message.raceId != null && message.hasOwnProperty("raceId"))
                    object.raceId = message.raceId;
                if (message.driverIds && message.driverIds.length) {
                    object.driverIds = [];
                    for (let j = 0; j < message.driverIds.length; ++j)
                        object.driverIds[j] = message.driverIds[j];
                }
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

        return antigravity;
    })();

    return com;
})();

export { $root as default };
