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

        return antigravity;
    })();

    return com;
})();

export { $root as default };
