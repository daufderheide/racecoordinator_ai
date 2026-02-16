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
             * @property {string|null} [avatarUrl] DriverModel avatarUrl
             * @property {com.antigravity.IAudioConfig|null} [lapAudio] DriverModel lapAudio
             * @property {com.antigravity.IAudioConfig|null} [bestLapAudio] DriverModel bestLapAudio
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
             * DriverModel avatarUrl.
             * @member {string} avatarUrl
             * @memberof com.antigravity.DriverModel
             * @instance
             */
            DriverModel.prototype.avatarUrl = "";

            /**
             * DriverModel lapAudio.
             * @member {com.antigravity.IAudioConfig|null|undefined} lapAudio
             * @memberof com.antigravity.DriverModel
             * @instance
             */
            DriverModel.prototype.lapAudio = null;

            /**
             * DriverModel bestLapAudio.
             * @member {com.antigravity.IAudioConfig|null|undefined} bestLapAudio
             * @memberof com.antigravity.DriverModel
             * @instance
             */
            DriverModel.prototype.bestLapAudio = null;

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
                if (message.avatarUrl != null && Object.hasOwnProperty.call(message, "avatarUrl"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.avatarUrl);
                if (message.lapAudio != null && Object.hasOwnProperty.call(message, "lapAudio"))
                    $root.com.antigravity.AudioConfig.encode(message.lapAudio, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.bestLapAudio != null && Object.hasOwnProperty.call(message, "bestLapAudio"))
                    $root.com.antigravity.AudioConfig.encode(message.bestLapAudio, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
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
                    case 4: {
                            message.avatarUrl = reader.string();
                            break;
                        }
                    case 5: {
                            message.lapAudio = $root.com.antigravity.AudioConfig.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.bestLapAudio = $root.com.antigravity.AudioConfig.decode(reader, reader.uint32());
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
                if (message.avatarUrl != null && message.hasOwnProperty("avatarUrl"))
                    if (!$util.isString(message.avatarUrl))
                        return "avatarUrl: string expected";
                if (message.lapAudio != null && message.hasOwnProperty("lapAudio")) {
                    let error = $root.com.antigravity.AudioConfig.verify(message.lapAudio);
                    if (error)
                        return "lapAudio." + error;
                }
                if (message.bestLapAudio != null && message.hasOwnProperty("bestLapAudio")) {
                    let error = $root.com.antigravity.AudioConfig.verify(message.bestLapAudio);
                    if (error)
                        return "bestLapAudio." + error;
                }
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
                if (object.avatarUrl != null)
                    message.avatarUrl = String(object.avatarUrl);
                if (object.lapAudio != null) {
                    if (typeof object.lapAudio !== "object")
                        throw TypeError(".com.antigravity.DriverModel.lapAudio: object expected");
                    message.lapAudio = $root.com.antigravity.AudioConfig.fromObject(object.lapAudio);
                }
                if (object.bestLapAudio != null) {
                    if (typeof object.bestLapAudio !== "object")
                        throw TypeError(".com.antigravity.DriverModel.bestLapAudio: object expected");
                    message.bestLapAudio = $root.com.antigravity.AudioConfig.fromObject(object.bestLapAudio);
                }
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
                    object.avatarUrl = "";
                    object.lapAudio = null;
                    object.bestLapAudio = null;
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.nickname != null && message.hasOwnProperty("nickname"))
                    object.nickname = message.nickname;
                if (message.avatarUrl != null && message.hasOwnProperty("avatarUrl"))
                    object.avatarUrl = message.avatarUrl;
                if (message.lapAudio != null && message.hasOwnProperty("lapAudio"))
                    object.lapAudio = $root.com.antigravity.AudioConfig.toObject(message.lapAudio, options);
                if (message.bestLapAudio != null && message.hasOwnProperty("bestLapAudio"))
                    object.bestLapAudio = $root.com.antigravity.AudioConfig.toObject(message.bestLapAudio, options);
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

        antigravity.AudioConfig = (function() {

            /**
             * Properties of an AudioConfig.
             * @memberof com.antigravity
             * @interface IAudioConfig
             * @property {string|null} [type] AudioConfig type
             * @property {string|null} [url] AudioConfig url
             * @property {string|null} [text] AudioConfig text
             */

            /**
             * Constructs a new AudioConfig.
             * @memberof com.antigravity
             * @classdesc Represents an AudioConfig.
             * @implements IAudioConfig
             * @constructor
             * @param {com.antigravity.IAudioConfig=} [properties] Properties to set
             */
            function AudioConfig(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * AudioConfig type.
             * @member {string} type
             * @memberof com.antigravity.AudioConfig
             * @instance
             */
            AudioConfig.prototype.type = "";

            /**
             * AudioConfig url.
             * @member {string} url
             * @memberof com.antigravity.AudioConfig
             * @instance
             */
            AudioConfig.prototype.url = "";

            /**
             * AudioConfig text.
             * @member {string} text
             * @memberof com.antigravity.AudioConfig
             * @instance
             */
            AudioConfig.prototype.text = "";

            /**
             * Creates a new AudioConfig instance using the specified properties.
             * @function create
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {com.antigravity.IAudioConfig=} [properties] Properties to set
             * @returns {com.antigravity.AudioConfig} AudioConfig instance
             */
            AudioConfig.create = function create(properties) {
                return new AudioConfig(properties);
            };

            /**
             * Encodes the specified AudioConfig message. Does not implicitly {@link com.antigravity.AudioConfig.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {com.antigravity.IAudioConfig} message AudioConfig message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AudioConfig.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.type);
                if (message.url != null && Object.hasOwnProperty.call(message, "url"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.url);
                if (message.text != null && Object.hasOwnProperty.call(message, "text"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.text);
                return writer;
            };

            /**
             * Encodes the specified AudioConfig message, length delimited. Does not implicitly {@link com.antigravity.AudioConfig.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {com.antigravity.IAudioConfig} message AudioConfig message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AudioConfig.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an AudioConfig message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.AudioConfig} AudioConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AudioConfig.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.AudioConfig();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.type = reader.string();
                            break;
                        }
                    case 2: {
                            message.url = reader.string();
                            break;
                        }
                    case 3: {
                            message.text = reader.string();
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
             * Decodes an AudioConfig message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.AudioConfig} AudioConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AudioConfig.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an AudioConfig message.
             * @function verify
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            AudioConfig.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.type != null && message.hasOwnProperty("type"))
                    if (!$util.isString(message.type))
                        return "type: string expected";
                if (message.url != null && message.hasOwnProperty("url"))
                    if (!$util.isString(message.url))
                        return "url: string expected";
                if (message.text != null && message.hasOwnProperty("text"))
                    if (!$util.isString(message.text))
                        return "text: string expected";
                return null;
            };

            /**
             * Creates an AudioConfig message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.AudioConfig} AudioConfig
             */
            AudioConfig.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.AudioConfig)
                    return object;
                let message = new $root.com.antigravity.AudioConfig();
                if (object.type != null)
                    message.type = String(object.type);
                if (object.url != null)
                    message.url = String(object.url);
                if (object.text != null)
                    message.text = String(object.text);
                return message;
            };

            /**
             * Creates a plain object from an AudioConfig message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {com.antigravity.AudioConfig} message AudioConfig
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AudioConfig.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.type = "";
                    object.url = "";
                    object.text = "";
                }
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = message.type;
                if (message.url != null && message.hasOwnProperty("url"))
                    object.url = message.url;
                if (message.text != null && message.hasOwnProperty("text"))
                    object.text = message.text;
                return object;
            };

            /**
             * Converts this AudioConfig to JSON.
             * @function toJSON
             * @memberof com.antigravity.AudioConfig
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AudioConfig.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AudioConfig
             * @function getTypeUrl
             * @memberof com.antigravity.AudioConfig
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AudioConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.AudioConfig";
            };

            return AudioConfig;
        })();

        antigravity.AssetMessage = (function() {

            /**
             * Properties of an AssetMessage.
             * @memberof com.antigravity
             * @interface IAssetMessage
             * @property {com.antigravity.IModel|null} [model] AssetMessage model
             * @property {string|null} [name] AssetMessage name
             * @property {string|null} [type] AssetMessage type
             * @property {string|null} [size] AssetMessage size
             * @property {string|null} [url] AssetMessage url
             */

            /**
             * Constructs a new AssetMessage.
             * @memberof com.antigravity
             * @classdesc Represents an AssetMessage.
             * @implements IAssetMessage
             * @constructor
             * @param {com.antigravity.IAssetMessage=} [properties] Properties to set
             */
            function AssetMessage(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * AssetMessage model.
             * @member {com.antigravity.IModel|null|undefined} model
             * @memberof com.antigravity.AssetMessage
             * @instance
             */
            AssetMessage.prototype.model = null;

            /**
             * AssetMessage name.
             * @member {string} name
             * @memberof com.antigravity.AssetMessage
             * @instance
             */
            AssetMessage.prototype.name = "";

            /**
             * AssetMessage type.
             * @member {string} type
             * @memberof com.antigravity.AssetMessage
             * @instance
             */
            AssetMessage.prototype.type = "";

            /**
             * AssetMessage size.
             * @member {string} size
             * @memberof com.antigravity.AssetMessage
             * @instance
             */
            AssetMessage.prototype.size = "";

            /**
             * AssetMessage url.
             * @member {string} url
             * @memberof com.antigravity.AssetMessage
             * @instance
             */
            AssetMessage.prototype.url = "";

            /**
             * Creates a new AssetMessage instance using the specified properties.
             * @function create
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {com.antigravity.IAssetMessage=} [properties] Properties to set
             * @returns {com.antigravity.AssetMessage} AssetMessage instance
             */
            AssetMessage.create = function create(properties) {
                return new AssetMessage(properties);
            };

            /**
             * Encodes the specified AssetMessage message. Does not implicitly {@link com.antigravity.AssetMessage.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {com.antigravity.IAssetMessage} message AssetMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AssetMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                    $root.com.antigravity.Model.encode(message.model, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.type);
                if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.size);
                if (message.url != null && Object.hasOwnProperty.call(message, "url"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.url);
                return writer;
            };

            /**
             * Encodes the specified AssetMessage message, length delimited. Does not implicitly {@link com.antigravity.AssetMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {com.antigravity.IAssetMessage} message AssetMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AssetMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an AssetMessage message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.AssetMessage} AssetMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AssetMessage.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.AssetMessage();
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
                            message.type = reader.string();
                            break;
                        }
                    case 4: {
                            message.size = reader.string();
                            break;
                        }
                    case 5: {
                            message.url = reader.string();
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
             * Decodes an AssetMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.AssetMessage} AssetMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AssetMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an AssetMessage message.
             * @function verify
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            AssetMessage.verify = function verify(message) {
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
                if (message.type != null && message.hasOwnProperty("type"))
                    if (!$util.isString(message.type))
                        return "type: string expected";
                if (message.size != null && message.hasOwnProperty("size"))
                    if (!$util.isString(message.size))
                        return "size: string expected";
                if (message.url != null && message.hasOwnProperty("url"))
                    if (!$util.isString(message.url))
                        return "url: string expected";
                return null;
            };

            /**
             * Creates an AssetMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.AssetMessage} AssetMessage
             */
            AssetMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.AssetMessage)
                    return object;
                let message = new $root.com.antigravity.AssetMessage();
                if (object.model != null) {
                    if (typeof object.model !== "object")
                        throw TypeError(".com.antigravity.AssetMessage.model: object expected");
                    message.model = $root.com.antigravity.Model.fromObject(object.model);
                }
                if (object.name != null)
                    message.name = String(object.name);
                if (object.type != null)
                    message.type = String(object.type);
                if (object.size != null)
                    message.size = String(object.size);
                if (object.url != null)
                    message.url = String(object.url);
                return message;
            };

            /**
             * Creates a plain object from an AssetMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {com.antigravity.AssetMessage} message AssetMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AssetMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.model = null;
                    object.name = "";
                    object.type = "";
                    object.size = "";
                    object.url = "";
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = message.type;
                if (message.size != null && message.hasOwnProperty("size"))
                    object.size = message.size;
                if (message.url != null && message.hasOwnProperty("url"))
                    object.url = message.url;
                return object;
            };

            /**
             * Converts this AssetMessage to JSON.
             * @function toJSON
             * @memberof com.antigravity.AssetMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AssetMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AssetMessage
             * @function getTypeUrl
             * @memberof com.antigravity.AssetMessage
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AssetMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.AssetMessage";
            };

            return AssetMessage;
        })();

        antigravity.ListAssetsRequest = (function() {

            /**
             * Properties of a ListAssetsRequest.
             * @memberof com.antigravity
             * @interface IListAssetsRequest
             */

            /**
             * Constructs a new ListAssetsRequest.
             * @memberof com.antigravity
             * @classdesc Represents a ListAssetsRequest.
             * @implements IListAssetsRequest
             * @constructor
             * @param {com.antigravity.IListAssetsRequest=} [properties] Properties to set
             */
            function ListAssetsRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new ListAssetsRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {com.antigravity.IListAssetsRequest=} [properties] Properties to set
             * @returns {com.antigravity.ListAssetsRequest} ListAssetsRequest instance
             */
            ListAssetsRequest.create = function create(properties) {
                return new ListAssetsRequest(properties);
            };

            /**
             * Encodes the specified ListAssetsRequest message. Does not implicitly {@link com.antigravity.ListAssetsRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {com.antigravity.IListAssetsRequest} message ListAssetsRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ListAssetsRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified ListAssetsRequest message, length delimited. Does not implicitly {@link com.antigravity.ListAssetsRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {com.antigravity.IListAssetsRequest} message ListAssetsRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ListAssetsRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ListAssetsRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.ListAssetsRequest} ListAssetsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ListAssetsRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.ListAssetsRequest();
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
             * Decodes a ListAssetsRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.ListAssetsRequest} ListAssetsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ListAssetsRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ListAssetsRequest message.
             * @function verify
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ListAssetsRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a ListAssetsRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.ListAssetsRequest} ListAssetsRequest
             */
            ListAssetsRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.ListAssetsRequest)
                    return object;
                return new $root.com.antigravity.ListAssetsRequest();
            };

            /**
             * Creates a plain object from a ListAssetsRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {com.antigravity.ListAssetsRequest} message ListAssetsRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ListAssetsRequest.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this ListAssetsRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.ListAssetsRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ListAssetsRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ListAssetsRequest
             * @function getTypeUrl
             * @memberof com.antigravity.ListAssetsRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ListAssetsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.ListAssetsRequest";
            };

            return ListAssetsRequest;
        })();

        antigravity.UploadAssetRequest = (function() {

            /**
             * Properties of an UploadAssetRequest.
             * @memberof com.antigravity
             * @interface IUploadAssetRequest
             * @property {string|null} [name] UploadAssetRequest name
             * @property {string|null} [type] UploadAssetRequest type
             * @property {Uint8Array|null} [data] UploadAssetRequest data
             */

            /**
             * Constructs a new UploadAssetRequest.
             * @memberof com.antigravity
             * @classdesc Represents an UploadAssetRequest.
             * @implements IUploadAssetRequest
             * @constructor
             * @param {com.antigravity.IUploadAssetRequest=} [properties] Properties to set
             */
            function UploadAssetRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * UploadAssetRequest name.
             * @member {string} name
             * @memberof com.antigravity.UploadAssetRequest
             * @instance
             */
            UploadAssetRequest.prototype.name = "";

            /**
             * UploadAssetRequest type.
             * @member {string} type
             * @memberof com.antigravity.UploadAssetRequest
             * @instance
             */
            UploadAssetRequest.prototype.type = "";

            /**
             * UploadAssetRequest data.
             * @member {Uint8Array} data
             * @memberof com.antigravity.UploadAssetRequest
             * @instance
             */
            UploadAssetRequest.prototype.data = $util.newBuffer([]);

            /**
             * Creates a new UploadAssetRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {com.antigravity.IUploadAssetRequest=} [properties] Properties to set
             * @returns {com.antigravity.UploadAssetRequest} UploadAssetRequest instance
             */
            UploadAssetRequest.create = function create(properties) {
                return new UploadAssetRequest(properties);
            };

            /**
             * Encodes the specified UploadAssetRequest message. Does not implicitly {@link com.antigravity.UploadAssetRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {com.antigravity.IUploadAssetRequest} message UploadAssetRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UploadAssetRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.type);
                if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                    writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.data);
                return writer;
            };

            /**
             * Encodes the specified UploadAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.UploadAssetRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {com.antigravity.IUploadAssetRequest} message UploadAssetRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UploadAssetRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an UploadAssetRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.UploadAssetRequest} UploadAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UploadAssetRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.UploadAssetRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.name = reader.string();
                            break;
                        }
                    case 2: {
                            message.type = reader.string();
                            break;
                        }
                    case 3: {
                            message.data = reader.bytes();
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
             * Decodes an UploadAssetRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.UploadAssetRequest} UploadAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UploadAssetRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an UploadAssetRequest message.
             * @function verify
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            UploadAssetRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.type != null && message.hasOwnProperty("type"))
                    if (!$util.isString(message.type))
                        return "type: string expected";
                if (message.data != null && message.hasOwnProperty("data"))
                    if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                        return "data: buffer expected";
                return null;
            };

            /**
             * Creates an UploadAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.UploadAssetRequest} UploadAssetRequest
             */
            UploadAssetRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.UploadAssetRequest)
                    return object;
                let message = new $root.com.antigravity.UploadAssetRequest();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.type != null)
                    message.type = String(object.type);
                if (object.data != null)
                    if (typeof object.data === "string")
                        $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                    else if (object.data.length >= 0)
                        message.data = object.data;
                return message;
            };

            /**
             * Creates a plain object from an UploadAssetRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {com.antigravity.UploadAssetRequest} message UploadAssetRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            UploadAssetRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.name = "";
                    object.type = "";
                    if (options.bytes === String)
                        object.data = "";
                    else {
                        object.data = [];
                        if (options.bytes !== Array)
                            object.data = $util.newBuffer(object.data);
                    }
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = message.type;
                if (message.data != null && message.hasOwnProperty("data"))
                    object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
                return object;
            };

            /**
             * Converts this UploadAssetRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.UploadAssetRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            UploadAssetRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for UploadAssetRequest
             * @function getTypeUrl
             * @memberof com.antigravity.UploadAssetRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UploadAssetRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.UploadAssetRequest";
            };

            return UploadAssetRequest;
        })();

        antigravity.DeleteAssetRequest = (function() {

            /**
             * Properties of a DeleteAssetRequest.
             * @memberof com.antigravity
             * @interface IDeleteAssetRequest
             * @property {string|null} [id] DeleteAssetRequest id
             */

            /**
             * Constructs a new DeleteAssetRequest.
             * @memberof com.antigravity
             * @classdesc Represents a DeleteAssetRequest.
             * @implements IDeleteAssetRequest
             * @constructor
             * @param {com.antigravity.IDeleteAssetRequest=} [properties] Properties to set
             */
            function DeleteAssetRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DeleteAssetRequest id.
             * @member {string} id
             * @memberof com.antigravity.DeleteAssetRequest
             * @instance
             */
            DeleteAssetRequest.prototype.id = "";

            /**
             * Creates a new DeleteAssetRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {com.antigravity.IDeleteAssetRequest=} [properties] Properties to set
             * @returns {com.antigravity.DeleteAssetRequest} DeleteAssetRequest instance
             */
            DeleteAssetRequest.create = function create(properties) {
                return new DeleteAssetRequest(properties);
            };

            /**
             * Encodes the specified DeleteAssetRequest message. Does not implicitly {@link com.antigravity.DeleteAssetRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {com.antigravity.IDeleteAssetRequest} message DeleteAssetRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeleteAssetRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified DeleteAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.DeleteAssetRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {com.antigravity.IDeleteAssetRequest} message DeleteAssetRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeleteAssetRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DeleteAssetRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.DeleteAssetRequest} DeleteAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeleteAssetRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.DeleteAssetRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.id = reader.string();
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
             * Decodes a DeleteAssetRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.DeleteAssetRequest} DeleteAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeleteAssetRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DeleteAssetRequest message.
             * @function verify
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DeleteAssetRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates a DeleteAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.DeleteAssetRequest} DeleteAssetRequest
             */
            DeleteAssetRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.DeleteAssetRequest)
                    return object;
                let message = new $root.com.antigravity.DeleteAssetRequest();
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from a DeleteAssetRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {com.antigravity.DeleteAssetRequest} message DeleteAssetRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DeleteAssetRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.id = "";
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this DeleteAssetRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.DeleteAssetRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DeleteAssetRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DeleteAssetRequest
             * @function getTypeUrl
             * @memberof com.antigravity.DeleteAssetRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DeleteAssetRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.DeleteAssetRequest";
            };

            return DeleteAssetRequest;
        })();

        antigravity.RenameAssetRequest = (function() {

            /**
             * Properties of a RenameAssetRequest.
             * @memberof com.antigravity
             * @interface IRenameAssetRequest
             * @property {string|null} [id] RenameAssetRequest id
             * @property {string|null} [newName] RenameAssetRequest newName
             */

            /**
             * Constructs a new RenameAssetRequest.
             * @memberof com.antigravity
             * @classdesc Represents a RenameAssetRequest.
             * @implements IRenameAssetRequest
             * @constructor
             * @param {com.antigravity.IRenameAssetRequest=} [properties] Properties to set
             */
            function RenameAssetRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RenameAssetRequest id.
             * @member {string} id
             * @memberof com.antigravity.RenameAssetRequest
             * @instance
             */
            RenameAssetRequest.prototype.id = "";

            /**
             * RenameAssetRequest newName.
             * @member {string} newName
             * @memberof com.antigravity.RenameAssetRequest
             * @instance
             */
            RenameAssetRequest.prototype.newName = "";

            /**
             * Creates a new RenameAssetRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {com.antigravity.IRenameAssetRequest=} [properties] Properties to set
             * @returns {com.antigravity.RenameAssetRequest} RenameAssetRequest instance
             */
            RenameAssetRequest.create = function create(properties) {
                return new RenameAssetRequest(properties);
            };

            /**
             * Encodes the specified RenameAssetRequest message. Does not implicitly {@link com.antigravity.RenameAssetRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {com.antigravity.IRenameAssetRequest} message RenameAssetRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RenameAssetRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
                if (message.newName != null && Object.hasOwnProperty.call(message, "newName"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.newName);
                return writer;
            };

            /**
             * Encodes the specified RenameAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.RenameAssetRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {com.antigravity.IRenameAssetRequest} message RenameAssetRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RenameAssetRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RenameAssetRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RenameAssetRequest} RenameAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RenameAssetRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RenameAssetRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.id = reader.string();
                            break;
                        }
                    case 2: {
                            message.newName = reader.string();
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
             * Decodes a RenameAssetRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RenameAssetRequest} RenameAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RenameAssetRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RenameAssetRequest message.
             * @function verify
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RenameAssetRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                if (message.newName != null && message.hasOwnProperty("newName"))
                    if (!$util.isString(message.newName))
                        return "newName: string expected";
                return null;
            };

            /**
             * Creates a RenameAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RenameAssetRequest} RenameAssetRequest
             */
            RenameAssetRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RenameAssetRequest)
                    return object;
                let message = new $root.com.antigravity.RenameAssetRequest();
                if (object.id != null)
                    message.id = String(object.id);
                if (object.newName != null)
                    message.newName = String(object.newName);
                return message;
            };

            /**
             * Creates a plain object from a RenameAssetRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {com.antigravity.RenameAssetRequest} message RenameAssetRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RenameAssetRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.id = "";
                    object.newName = "";
                }
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                if (message.newName != null && message.hasOwnProperty("newName"))
                    object.newName = message.newName;
                return object;
            };

            /**
             * Converts this RenameAssetRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.RenameAssetRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RenameAssetRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RenameAssetRequest
             * @function getTypeUrl
             * @memberof com.antigravity.RenameAssetRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RenameAssetRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RenameAssetRequest";
            };

            return RenameAssetRequest;
        })();

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

        antigravity.InitializeInterfaceRequest = (function() {

            /**
             * Properties of an InitializeInterfaceRequest.
             * @memberof com.antigravity
             * @interface IInitializeInterfaceRequest
             * @property {com.antigravity.IArduinoConfig|null} [config] InitializeInterfaceRequest config
             * @property {number|null} [laneCount] InitializeInterfaceRequest laneCount
             */

            /**
             * Constructs a new InitializeInterfaceRequest.
             * @memberof com.antigravity
             * @classdesc Represents an InitializeInterfaceRequest.
             * @implements IInitializeInterfaceRequest
             * @constructor
             * @param {com.antigravity.IInitializeInterfaceRequest=} [properties] Properties to set
             */
            function InitializeInterfaceRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InitializeInterfaceRequest config.
             * @member {com.antigravity.IArduinoConfig|null|undefined} config
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @instance
             */
            InitializeInterfaceRequest.prototype.config = null;

            /**
             * InitializeInterfaceRequest laneCount.
             * @member {number} laneCount
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @instance
             */
            InitializeInterfaceRequest.prototype.laneCount = 0;

            /**
             * Creates a new InitializeInterfaceRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {com.antigravity.IInitializeInterfaceRequest=} [properties] Properties to set
             * @returns {com.antigravity.InitializeInterfaceRequest} InitializeInterfaceRequest instance
             */
            InitializeInterfaceRequest.create = function create(properties) {
                return new InitializeInterfaceRequest(properties);
            };

            /**
             * Encodes the specified InitializeInterfaceRequest message. Does not implicitly {@link com.antigravity.InitializeInterfaceRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {com.antigravity.IInitializeInterfaceRequest} message InitializeInterfaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeInterfaceRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.config != null && Object.hasOwnProperty.call(message, "config"))
                    $root.com.antigravity.ArduinoConfig.encode(message.config, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.laneCount != null && Object.hasOwnProperty.call(message, "laneCount"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.laneCount);
                return writer;
            };

            /**
             * Encodes the specified InitializeInterfaceRequest message, length delimited. Does not implicitly {@link com.antigravity.InitializeInterfaceRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {com.antigravity.IInitializeInterfaceRequest} message InitializeInterfaceRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeInterfaceRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InitializeInterfaceRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeInterfaceRequest} InitializeInterfaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeInterfaceRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.InitializeInterfaceRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.config = $root.com.antigravity.ArduinoConfig.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.laneCount = reader.int32();
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
             * Decodes an InitializeInterfaceRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeInterfaceRequest} InitializeInterfaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeInterfaceRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InitializeInterfaceRequest message.
             * @function verify
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InitializeInterfaceRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.config != null && message.hasOwnProperty("config")) {
                    let error = $root.com.antigravity.ArduinoConfig.verify(message.config);
                    if (error)
                        return "config." + error;
                }
                if (message.laneCount != null && message.hasOwnProperty("laneCount"))
                    if (!$util.isInteger(message.laneCount))
                        return "laneCount: integer expected";
                return null;
            };

            /**
             * Creates an InitializeInterfaceRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.InitializeInterfaceRequest} InitializeInterfaceRequest
             */
            InitializeInterfaceRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.InitializeInterfaceRequest)
                    return object;
                let message = new $root.com.antigravity.InitializeInterfaceRequest();
                if (object.config != null) {
                    if (typeof object.config !== "object")
                        throw TypeError(".com.antigravity.InitializeInterfaceRequest.config: object expected");
                    message.config = $root.com.antigravity.ArduinoConfig.fromObject(object.config);
                }
                if (object.laneCount != null)
                    message.laneCount = object.laneCount | 0;
                return message;
            };

            /**
             * Creates a plain object from an InitializeInterfaceRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {com.antigravity.InitializeInterfaceRequest} message InitializeInterfaceRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InitializeInterfaceRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.config = null;
                    object.laneCount = 0;
                }
                if (message.config != null && message.hasOwnProperty("config"))
                    object.config = $root.com.antigravity.ArduinoConfig.toObject(message.config, options);
                if (message.laneCount != null && message.hasOwnProperty("laneCount"))
                    object.laneCount = message.laneCount;
                return object;
            };

            /**
             * Converts this InitializeInterfaceRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InitializeInterfaceRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InitializeInterfaceRequest
             * @function getTypeUrl
             * @memberof com.antigravity.InitializeInterfaceRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InitializeInterfaceRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.InitializeInterfaceRequest";
            };

            return InitializeInterfaceRequest;
        })();

        antigravity.InitializeInterfaceResponse = (function() {

            /**
             * Properties of an InitializeInterfaceResponse.
             * @memberof com.antigravity
             * @interface IInitializeInterfaceResponse
             * @property {boolean|null} [success] InitializeInterfaceResponse success
             * @property {string|null} [message] InitializeInterfaceResponse message
             */

            /**
             * Constructs a new InitializeInterfaceResponse.
             * @memberof com.antigravity
             * @classdesc Represents an InitializeInterfaceResponse.
             * @implements IInitializeInterfaceResponse
             * @constructor
             * @param {com.antigravity.IInitializeInterfaceResponse=} [properties] Properties to set
             */
            function InitializeInterfaceResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InitializeInterfaceResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @instance
             */
            InitializeInterfaceResponse.prototype.success = false;

            /**
             * InitializeInterfaceResponse message.
             * @member {string} message
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @instance
             */
            InitializeInterfaceResponse.prototype.message = "";

            /**
             * Creates a new InitializeInterfaceResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {com.antigravity.IInitializeInterfaceResponse=} [properties] Properties to set
             * @returns {com.antigravity.InitializeInterfaceResponse} InitializeInterfaceResponse instance
             */
            InitializeInterfaceResponse.create = function create(properties) {
                return new InitializeInterfaceResponse(properties);
            };

            /**
             * Encodes the specified InitializeInterfaceResponse message. Does not implicitly {@link com.antigravity.InitializeInterfaceResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {com.antigravity.IInitializeInterfaceResponse} message InitializeInterfaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeInterfaceResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified InitializeInterfaceResponse message, length delimited. Does not implicitly {@link com.antigravity.InitializeInterfaceResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {com.antigravity.IInitializeInterfaceResponse} message InitializeInterfaceResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InitializeInterfaceResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InitializeInterfaceResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeInterfaceResponse} InitializeInterfaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeInterfaceResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.InitializeInterfaceResponse();
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
             * Decodes an InitializeInterfaceResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeInterfaceResponse} InitializeInterfaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InitializeInterfaceResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InitializeInterfaceResponse message.
             * @function verify
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InitializeInterfaceResponse.verify = function verify(message) {
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
             * Creates an InitializeInterfaceResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.InitializeInterfaceResponse} InitializeInterfaceResponse
             */
            InitializeInterfaceResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.InitializeInterfaceResponse)
                    return object;
                let message = new $root.com.antigravity.InitializeInterfaceResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from an InitializeInterfaceResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {com.antigravity.InitializeInterfaceResponse} message InitializeInterfaceResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InitializeInterfaceResponse.toObject = function toObject(message, options) {
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
             * Converts this InitializeInterfaceResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InitializeInterfaceResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InitializeInterfaceResponse
             * @function getTypeUrl
             * @memberof com.antigravity.InitializeInterfaceResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InitializeInterfaceResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.InitializeInterfaceResponse";
            };

            return InitializeInterfaceResponse;
        })();

        /**
         * PinBehavior enum.
         * @name com.antigravity.PinBehavior
         * @enum {number}
         * @property {number} BEHAVIOR_UNUSED=0 BEHAVIOR_UNUSED value
         * @property {number} BEHAVIOR_RESERVED=1 BEHAVIOR_RESERVED value
         * @property {number} BEHAVIOR_CALL_BUTTON=2 BEHAVIOR_CALL_BUTTON value
         * @property {number} BEHAVIOR_RELAY=3 BEHAVIOR_RELAY value
         * @property {number} BEHAVIOR_LAP_BASE=1000 BEHAVIOR_LAP_BASE value
         * @property {number} BEHAVIOR_SEGMENT_BASE=2000 BEHAVIOR_SEGMENT_BASE value
         * @property {number} BEHAVIOR_CALL_BUTTON_BASE=3000 BEHAVIOR_CALL_BUTTON_BASE value
         * @property {number} BEHAVIOR_RELAY_BASE=4000 BEHAVIOR_RELAY_BASE value
         */
        antigravity.PinBehavior = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "BEHAVIOR_UNUSED"] = 0;
            values[valuesById[1] = "BEHAVIOR_RESERVED"] = 1;
            values[valuesById[2] = "BEHAVIOR_CALL_BUTTON"] = 2;
            values[valuesById[3] = "BEHAVIOR_RELAY"] = 3;
            values[valuesById[1000] = "BEHAVIOR_LAP_BASE"] = 1000;
            values[valuesById[2000] = "BEHAVIOR_SEGMENT_BASE"] = 2000;
            values[valuesById[3000] = "BEHAVIOR_CALL_BUTTON_BASE"] = 3000;
            values[valuesById[4000] = "BEHAVIOR_RELAY_BASE"] = 4000;
            return values;
        })();

        /**
         * PinId enum.
         * @name com.antigravity.PinId
         * @enum {number}
         * @property {number} PIN_ID_UNKNOWN=0 PIN_ID_UNKNOWN value
         * @property {number} PIN_ID_DIGITAL_BASE=0 PIN_ID_DIGITAL_BASE value
         * @property {number} PIN_ID_ANALOG_BASE=1000 PIN_ID_ANALOG_BASE value
         */
        antigravity.PinId = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "PIN_ID_UNKNOWN"] = 0;
            values["PIN_ID_DIGITAL_BASE"] = 0;
            values[valuesById[1000] = "PIN_ID_ANALOG_BASE"] = 1000;
            return values;
        })();

        antigravity.ArduinoConfig = (function() {

            /**
             * Properties of an ArduinoConfig.
             * @memberof com.antigravity
             * @interface IArduinoConfig
             * @property {string|null} [name] ArduinoConfig name
             * @property {string|null} [commPort] ArduinoConfig commPort
             * @property {number|null} [baudRate] ArduinoConfig baudRate
             * @property {number|null} [debounceUs] ArduinoConfig debounceUs
             * @property {number|null} [globalInvertLanes] ArduinoConfig globalInvertLanes
             * @property {boolean|null} [normallyClosedRelays] ArduinoConfig normallyClosedRelays
             * @property {number|null} [globalInvertLights] ArduinoConfig globalInvertLights
             * @property {number|null} [useLapsForPits] ArduinoConfig useLapsForPits
             * @property {number|null} [useLapsForPitEnd] ArduinoConfig useLapsForPitEnd
             * @property {number|null} [usePitsAsLaps] ArduinoConfig usePitsAsLaps
             * @property {number|null} [useLapsForSegments] ArduinoConfig useLapsForSegments
             * @property {number|null} [hardwareType] ArduinoConfig hardwareType
             * @property {Array.<number>|null} [digitalIds] ArduinoConfig digitalIds
             * @property {Array.<number>|null} [analogIds] ArduinoConfig analogIds
             * @property {Array.<string>|null} [ledLaneColorOverrides] ArduinoConfig ledLaneColorOverrides
             */

            /**
             * Constructs a new ArduinoConfig.
             * @memberof com.antigravity
             * @classdesc Represents an ArduinoConfig.
             * @implements IArduinoConfig
             * @constructor
             * @param {com.antigravity.IArduinoConfig=} [properties] Properties to set
             */
            function ArduinoConfig(properties) {
                this.digitalIds = [];
                this.analogIds = [];
                this.ledLaneColorOverrides = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ArduinoConfig name.
             * @member {string} name
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.name = "";

            /**
             * ArduinoConfig commPort.
             * @member {string} commPort
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.commPort = "";

            /**
             * ArduinoConfig baudRate.
             * @member {number} baudRate
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.baudRate = 0;

            /**
             * ArduinoConfig debounceUs.
             * @member {number} debounceUs
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.debounceUs = 0;

            /**
             * ArduinoConfig globalInvertLanes.
             * @member {number} globalInvertLanes
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.globalInvertLanes = 0;

            /**
             * ArduinoConfig normallyClosedRelays.
             * @member {boolean} normallyClosedRelays
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.normallyClosedRelays = false;

            /**
             * ArduinoConfig globalInvertLights.
             * @member {number} globalInvertLights
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.globalInvertLights = 0;

            /**
             * ArduinoConfig useLapsForPits.
             * @member {number} useLapsForPits
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.useLapsForPits = 0;

            /**
             * ArduinoConfig useLapsForPitEnd.
             * @member {number} useLapsForPitEnd
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.useLapsForPitEnd = 0;

            /**
             * ArduinoConfig usePitsAsLaps.
             * @member {number} usePitsAsLaps
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.usePitsAsLaps = 0;

            /**
             * ArduinoConfig useLapsForSegments.
             * @member {number} useLapsForSegments
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.useLapsForSegments = 0;

            /**
             * ArduinoConfig hardwareType.
             * @member {number} hardwareType
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.hardwareType = 0;

            /**
             * ArduinoConfig digitalIds.
             * @member {Array.<number>} digitalIds
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.digitalIds = $util.emptyArray;

            /**
             * ArduinoConfig analogIds.
             * @member {Array.<number>} analogIds
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.analogIds = $util.emptyArray;

            /**
             * ArduinoConfig ledLaneColorOverrides.
             * @member {Array.<string>} ledLaneColorOverrides
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             */
            ArduinoConfig.prototype.ledLaneColorOverrides = $util.emptyArray;

            /**
             * Creates a new ArduinoConfig instance using the specified properties.
             * @function create
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {com.antigravity.IArduinoConfig=} [properties] Properties to set
             * @returns {com.antigravity.ArduinoConfig} ArduinoConfig instance
             */
            ArduinoConfig.create = function create(properties) {
                return new ArduinoConfig(properties);
            };

            /**
             * Encodes the specified ArduinoConfig message. Does not implicitly {@link com.antigravity.ArduinoConfig.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {com.antigravity.IArduinoConfig} message ArduinoConfig message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ArduinoConfig.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.commPort != null && Object.hasOwnProperty.call(message, "commPort"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.commPort);
                if (message.baudRate != null && Object.hasOwnProperty.call(message, "baudRate"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.baudRate);
                if (message.debounceUs != null && Object.hasOwnProperty.call(message, "debounceUs"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.debounceUs);
                if (message.globalInvertLanes != null && Object.hasOwnProperty.call(message, "globalInvertLanes"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.globalInvertLanes);
                if (message.normallyClosedRelays != null && Object.hasOwnProperty.call(message, "normallyClosedRelays"))
                    writer.uint32(/* id 6, wireType 0 =*/48).bool(message.normallyClosedRelays);
                if (message.globalInvertLights != null && Object.hasOwnProperty.call(message, "globalInvertLights"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int32(message.globalInvertLights);
                if (message.useLapsForPits != null && Object.hasOwnProperty.call(message, "useLapsForPits"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int32(message.useLapsForPits);
                if (message.useLapsForPitEnd != null && Object.hasOwnProperty.call(message, "useLapsForPitEnd"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int32(message.useLapsForPitEnd);
                if (message.usePitsAsLaps != null && Object.hasOwnProperty.call(message, "usePitsAsLaps"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int32(message.usePitsAsLaps);
                if (message.useLapsForSegments != null && Object.hasOwnProperty.call(message, "useLapsForSegments"))
                    writer.uint32(/* id 11, wireType 0 =*/88).int32(message.useLapsForSegments);
                if (message.hardwareType != null && Object.hasOwnProperty.call(message, "hardwareType"))
                    writer.uint32(/* id 12, wireType 0 =*/96).int32(message.hardwareType);
                if (message.digitalIds != null && message.digitalIds.length) {
                    writer.uint32(/* id 13, wireType 2 =*/106).fork();
                    for (let i = 0; i < message.digitalIds.length; ++i)
                        writer.int32(message.digitalIds[i]);
                    writer.ldelim();
                }
                if (message.analogIds != null && message.analogIds.length) {
                    writer.uint32(/* id 14, wireType 2 =*/114).fork();
                    for (let i = 0; i < message.analogIds.length; ++i)
                        writer.int32(message.analogIds[i]);
                    writer.ldelim();
                }
                if (message.ledLaneColorOverrides != null && message.ledLaneColorOverrides.length)
                    for (let i = 0; i < message.ledLaneColorOverrides.length; ++i)
                        writer.uint32(/* id 15, wireType 2 =*/122).string(message.ledLaneColorOverrides[i]);
                return writer;
            };

            /**
             * Encodes the specified ArduinoConfig message, length delimited. Does not implicitly {@link com.antigravity.ArduinoConfig.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {com.antigravity.IArduinoConfig} message ArduinoConfig message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ArduinoConfig.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an ArduinoConfig message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.ArduinoConfig} ArduinoConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ArduinoConfig.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.ArduinoConfig();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.name = reader.string();
                            break;
                        }
                    case 2: {
                            message.commPort = reader.string();
                            break;
                        }
                    case 3: {
                            message.baudRate = reader.int32();
                            break;
                        }
                    case 4: {
                            message.debounceUs = reader.int32();
                            break;
                        }
                    case 5: {
                            message.globalInvertLanes = reader.int32();
                            break;
                        }
                    case 6: {
                            message.normallyClosedRelays = reader.bool();
                            break;
                        }
                    case 7: {
                            message.globalInvertLights = reader.int32();
                            break;
                        }
                    case 8: {
                            message.useLapsForPits = reader.int32();
                            break;
                        }
                    case 9: {
                            message.useLapsForPitEnd = reader.int32();
                            break;
                        }
                    case 10: {
                            message.usePitsAsLaps = reader.int32();
                            break;
                        }
                    case 11: {
                            message.useLapsForSegments = reader.int32();
                            break;
                        }
                    case 12: {
                            message.hardwareType = reader.int32();
                            break;
                        }
                    case 13: {
                            if (!(message.digitalIds && message.digitalIds.length))
                                message.digitalIds = [];
                            if ((tag & 7) === 2) {
                                let end2 = reader.uint32() + reader.pos;
                                while (reader.pos < end2)
                                    message.digitalIds.push(reader.int32());
                            } else
                                message.digitalIds.push(reader.int32());
                            break;
                        }
                    case 14: {
                            if (!(message.analogIds && message.analogIds.length))
                                message.analogIds = [];
                            if ((tag & 7) === 2) {
                                let end2 = reader.uint32() + reader.pos;
                                while (reader.pos < end2)
                                    message.analogIds.push(reader.int32());
                            } else
                                message.analogIds.push(reader.int32());
                            break;
                        }
                    case 15: {
                            if (!(message.ledLaneColorOverrides && message.ledLaneColorOverrides.length))
                                message.ledLaneColorOverrides = [];
                            message.ledLaneColorOverrides.push(reader.string());
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
             * Decodes an ArduinoConfig message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.ArduinoConfig} ArduinoConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ArduinoConfig.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an ArduinoConfig message.
             * @function verify
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ArduinoConfig.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.commPort != null && message.hasOwnProperty("commPort"))
                    if (!$util.isString(message.commPort))
                        return "commPort: string expected";
                if (message.baudRate != null && message.hasOwnProperty("baudRate"))
                    if (!$util.isInteger(message.baudRate))
                        return "baudRate: integer expected";
                if (message.debounceUs != null && message.hasOwnProperty("debounceUs"))
                    if (!$util.isInteger(message.debounceUs))
                        return "debounceUs: integer expected";
                if (message.globalInvertLanes != null && message.hasOwnProperty("globalInvertLanes"))
                    if (!$util.isInteger(message.globalInvertLanes))
                        return "globalInvertLanes: integer expected";
                if (message.normallyClosedRelays != null && message.hasOwnProperty("normallyClosedRelays"))
                    if (typeof message.normallyClosedRelays !== "boolean")
                        return "normallyClosedRelays: boolean expected";
                if (message.globalInvertLights != null && message.hasOwnProperty("globalInvertLights"))
                    if (!$util.isInteger(message.globalInvertLights))
                        return "globalInvertLights: integer expected";
                if (message.useLapsForPits != null && message.hasOwnProperty("useLapsForPits"))
                    if (!$util.isInteger(message.useLapsForPits))
                        return "useLapsForPits: integer expected";
                if (message.useLapsForPitEnd != null && message.hasOwnProperty("useLapsForPitEnd"))
                    if (!$util.isInteger(message.useLapsForPitEnd))
                        return "useLapsForPitEnd: integer expected";
                if (message.usePitsAsLaps != null && message.hasOwnProperty("usePitsAsLaps"))
                    if (!$util.isInteger(message.usePitsAsLaps))
                        return "usePitsAsLaps: integer expected";
                if (message.useLapsForSegments != null && message.hasOwnProperty("useLapsForSegments"))
                    if (!$util.isInteger(message.useLapsForSegments))
                        return "useLapsForSegments: integer expected";
                if (message.hardwareType != null && message.hasOwnProperty("hardwareType"))
                    if (!$util.isInteger(message.hardwareType))
                        return "hardwareType: integer expected";
                if (message.digitalIds != null && message.hasOwnProperty("digitalIds")) {
                    if (!Array.isArray(message.digitalIds))
                        return "digitalIds: array expected";
                    for (let i = 0; i < message.digitalIds.length; ++i)
                        if (!$util.isInteger(message.digitalIds[i]))
                            return "digitalIds: integer[] expected";
                }
                if (message.analogIds != null && message.hasOwnProperty("analogIds")) {
                    if (!Array.isArray(message.analogIds))
                        return "analogIds: array expected";
                    for (let i = 0; i < message.analogIds.length; ++i)
                        if (!$util.isInteger(message.analogIds[i]))
                            return "analogIds: integer[] expected";
                }
                if (message.ledLaneColorOverrides != null && message.hasOwnProperty("ledLaneColorOverrides")) {
                    if (!Array.isArray(message.ledLaneColorOverrides))
                        return "ledLaneColorOverrides: array expected";
                    for (let i = 0; i < message.ledLaneColorOverrides.length; ++i)
                        if (!$util.isString(message.ledLaneColorOverrides[i]))
                            return "ledLaneColorOverrides: string[] expected";
                }
                return null;
            };

            /**
             * Creates an ArduinoConfig message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.ArduinoConfig} ArduinoConfig
             */
            ArduinoConfig.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.ArduinoConfig)
                    return object;
                let message = new $root.com.antigravity.ArduinoConfig();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.commPort != null)
                    message.commPort = String(object.commPort);
                if (object.baudRate != null)
                    message.baudRate = object.baudRate | 0;
                if (object.debounceUs != null)
                    message.debounceUs = object.debounceUs | 0;
                if (object.globalInvertLanes != null)
                    message.globalInvertLanes = object.globalInvertLanes | 0;
                if (object.normallyClosedRelays != null)
                    message.normallyClosedRelays = Boolean(object.normallyClosedRelays);
                if (object.globalInvertLights != null)
                    message.globalInvertLights = object.globalInvertLights | 0;
                if (object.useLapsForPits != null)
                    message.useLapsForPits = object.useLapsForPits | 0;
                if (object.useLapsForPitEnd != null)
                    message.useLapsForPitEnd = object.useLapsForPitEnd | 0;
                if (object.usePitsAsLaps != null)
                    message.usePitsAsLaps = object.usePitsAsLaps | 0;
                if (object.useLapsForSegments != null)
                    message.useLapsForSegments = object.useLapsForSegments | 0;
                if (object.hardwareType != null)
                    message.hardwareType = object.hardwareType | 0;
                if (object.digitalIds) {
                    if (!Array.isArray(object.digitalIds))
                        throw TypeError(".com.antigravity.ArduinoConfig.digitalIds: array expected");
                    message.digitalIds = [];
                    for (let i = 0; i < object.digitalIds.length; ++i)
                        message.digitalIds[i] = object.digitalIds[i] | 0;
                }
                if (object.analogIds) {
                    if (!Array.isArray(object.analogIds))
                        throw TypeError(".com.antigravity.ArduinoConfig.analogIds: array expected");
                    message.analogIds = [];
                    for (let i = 0; i < object.analogIds.length; ++i)
                        message.analogIds[i] = object.analogIds[i] | 0;
                }
                if (object.ledLaneColorOverrides) {
                    if (!Array.isArray(object.ledLaneColorOverrides))
                        throw TypeError(".com.antigravity.ArduinoConfig.ledLaneColorOverrides: array expected");
                    message.ledLaneColorOverrides = [];
                    for (let i = 0; i < object.ledLaneColorOverrides.length; ++i)
                        message.ledLaneColorOverrides[i] = String(object.ledLaneColorOverrides[i]);
                }
                return message;
            };

            /**
             * Creates a plain object from an ArduinoConfig message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {com.antigravity.ArduinoConfig} message ArduinoConfig
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ArduinoConfig.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.digitalIds = [];
                    object.analogIds = [];
                    object.ledLaneColorOverrides = [];
                }
                if (options.defaults) {
                    object.name = "";
                    object.commPort = "";
                    object.baudRate = 0;
                    object.debounceUs = 0;
                    object.globalInvertLanes = 0;
                    object.normallyClosedRelays = false;
                    object.globalInvertLights = 0;
                    object.useLapsForPits = 0;
                    object.useLapsForPitEnd = 0;
                    object.usePitsAsLaps = 0;
                    object.useLapsForSegments = 0;
                    object.hardwareType = 0;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.commPort != null && message.hasOwnProperty("commPort"))
                    object.commPort = message.commPort;
                if (message.baudRate != null && message.hasOwnProperty("baudRate"))
                    object.baudRate = message.baudRate;
                if (message.debounceUs != null && message.hasOwnProperty("debounceUs"))
                    object.debounceUs = message.debounceUs;
                if (message.globalInvertLanes != null && message.hasOwnProperty("globalInvertLanes"))
                    object.globalInvertLanes = message.globalInvertLanes;
                if (message.normallyClosedRelays != null && message.hasOwnProperty("normallyClosedRelays"))
                    object.normallyClosedRelays = message.normallyClosedRelays;
                if (message.globalInvertLights != null && message.hasOwnProperty("globalInvertLights"))
                    object.globalInvertLights = message.globalInvertLights;
                if (message.useLapsForPits != null && message.hasOwnProperty("useLapsForPits"))
                    object.useLapsForPits = message.useLapsForPits;
                if (message.useLapsForPitEnd != null && message.hasOwnProperty("useLapsForPitEnd"))
                    object.useLapsForPitEnd = message.useLapsForPitEnd;
                if (message.usePitsAsLaps != null && message.hasOwnProperty("usePitsAsLaps"))
                    object.usePitsAsLaps = message.usePitsAsLaps;
                if (message.useLapsForSegments != null && message.hasOwnProperty("useLapsForSegments"))
                    object.useLapsForSegments = message.useLapsForSegments;
                if (message.hardwareType != null && message.hasOwnProperty("hardwareType"))
                    object.hardwareType = message.hardwareType;
                if (message.digitalIds && message.digitalIds.length) {
                    object.digitalIds = [];
                    for (let j = 0; j < message.digitalIds.length; ++j)
                        object.digitalIds[j] = message.digitalIds[j];
                }
                if (message.analogIds && message.analogIds.length) {
                    object.analogIds = [];
                    for (let j = 0; j < message.analogIds.length; ++j)
                        object.analogIds[j] = message.analogIds[j];
                }
                if (message.ledLaneColorOverrides && message.ledLaneColorOverrides.length) {
                    object.ledLaneColorOverrides = [];
                    for (let j = 0; j < message.ledLaneColorOverrides.length; ++j)
                        object.ledLaneColorOverrides[j] = message.ledLaneColorOverrides[j];
                }
                return object;
            };

            /**
             * Converts this ArduinoConfig to JSON.
             * @function toJSON
             * @memberof com.antigravity.ArduinoConfig
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ArduinoConfig.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ArduinoConfig
             * @function getTypeUrl
             * @memberof com.antigravity.ArduinoConfig
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ArduinoConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.ArduinoConfig";
            };

            return ArduinoConfig;
        })();

        antigravity.UpdateInterfaceConfigRequest = (function() {

            /**
             * Properties of an UpdateInterfaceConfigRequest.
             * @memberof com.antigravity
             * @interface IUpdateInterfaceConfigRequest
             * @property {com.antigravity.IArduinoConfig|null} [config] UpdateInterfaceConfigRequest config
             */

            /**
             * Constructs a new UpdateInterfaceConfigRequest.
             * @memberof com.antigravity
             * @classdesc Represents an UpdateInterfaceConfigRequest.
             * @implements IUpdateInterfaceConfigRequest
             * @constructor
             * @param {com.antigravity.IUpdateInterfaceConfigRequest=} [properties] Properties to set
             */
            function UpdateInterfaceConfigRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * UpdateInterfaceConfigRequest config.
             * @member {com.antigravity.IArduinoConfig|null|undefined} config
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @instance
             */
            UpdateInterfaceConfigRequest.prototype.config = null;

            /**
             * Creates a new UpdateInterfaceConfigRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {com.antigravity.IUpdateInterfaceConfigRequest=} [properties] Properties to set
             * @returns {com.antigravity.UpdateInterfaceConfigRequest} UpdateInterfaceConfigRequest instance
             */
            UpdateInterfaceConfigRequest.create = function create(properties) {
                return new UpdateInterfaceConfigRequest(properties);
            };

            /**
             * Encodes the specified UpdateInterfaceConfigRequest message. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {com.antigravity.IUpdateInterfaceConfigRequest} message UpdateInterfaceConfigRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UpdateInterfaceConfigRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.config != null && Object.hasOwnProperty.call(message, "config"))
                    $root.com.antigravity.ArduinoConfig.encode(message.config, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified UpdateInterfaceConfigRequest message, length delimited. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {com.antigravity.IUpdateInterfaceConfigRequest} message UpdateInterfaceConfigRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UpdateInterfaceConfigRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an UpdateInterfaceConfigRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.UpdateInterfaceConfigRequest} UpdateInterfaceConfigRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UpdateInterfaceConfigRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.UpdateInterfaceConfigRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.config = $root.com.antigravity.ArduinoConfig.decode(reader, reader.uint32());
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
             * Decodes an UpdateInterfaceConfigRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.UpdateInterfaceConfigRequest} UpdateInterfaceConfigRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UpdateInterfaceConfigRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an UpdateInterfaceConfigRequest message.
             * @function verify
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            UpdateInterfaceConfigRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.config != null && message.hasOwnProperty("config")) {
                    let error = $root.com.antigravity.ArduinoConfig.verify(message.config);
                    if (error)
                        return "config." + error;
                }
                return null;
            };

            /**
             * Creates an UpdateInterfaceConfigRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.UpdateInterfaceConfigRequest} UpdateInterfaceConfigRequest
             */
            UpdateInterfaceConfigRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.UpdateInterfaceConfigRequest)
                    return object;
                let message = new $root.com.antigravity.UpdateInterfaceConfigRequest();
                if (object.config != null) {
                    if (typeof object.config !== "object")
                        throw TypeError(".com.antigravity.UpdateInterfaceConfigRequest.config: object expected");
                    message.config = $root.com.antigravity.ArduinoConfig.fromObject(object.config);
                }
                return message;
            };

            /**
             * Creates a plain object from an UpdateInterfaceConfigRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {com.antigravity.UpdateInterfaceConfigRequest} message UpdateInterfaceConfigRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            UpdateInterfaceConfigRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.config = null;
                if (message.config != null && message.hasOwnProperty("config"))
                    object.config = $root.com.antigravity.ArduinoConfig.toObject(message.config, options);
                return object;
            };

            /**
             * Converts this UpdateInterfaceConfigRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            UpdateInterfaceConfigRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for UpdateInterfaceConfigRequest
             * @function getTypeUrl
             * @memberof com.antigravity.UpdateInterfaceConfigRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UpdateInterfaceConfigRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.UpdateInterfaceConfigRequest";
            };

            return UpdateInterfaceConfigRequest;
        })();

        antigravity.UpdateInterfaceConfigResponse = (function() {

            /**
             * Properties of an UpdateInterfaceConfigResponse.
             * @memberof com.antigravity
             * @interface IUpdateInterfaceConfigResponse
             * @property {boolean|null} [success] UpdateInterfaceConfigResponse success
             * @property {string|null} [message] UpdateInterfaceConfigResponse message
             */

            /**
             * Constructs a new UpdateInterfaceConfigResponse.
             * @memberof com.antigravity
             * @classdesc Represents an UpdateInterfaceConfigResponse.
             * @implements IUpdateInterfaceConfigResponse
             * @constructor
             * @param {com.antigravity.IUpdateInterfaceConfigResponse=} [properties] Properties to set
             */
            function UpdateInterfaceConfigResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * UpdateInterfaceConfigResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @instance
             */
            UpdateInterfaceConfigResponse.prototype.success = false;

            /**
             * UpdateInterfaceConfigResponse message.
             * @member {string} message
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @instance
             */
            UpdateInterfaceConfigResponse.prototype.message = "";

            /**
             * Creates a new UpdateInterfaceConfigResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {com.antigravity.IUpdateInterfaceConfigResponse=} [properties] Properties to set
             * @returns {com.antigravity.UpdateInterfaceConfigResponse} UpdateInterfaceConfigResponse instance
             */
            UpdateInterfaceConfigResponse.create = function create(properties) {
                return new UpdateInterfaceConfigResponse(properties);
            };

            /**
             * Encodes the specified UpdateInterfaceConfigResponse message. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {com.antigravity.IUpdateInterfaceConfigResponse} message UpdateInterfaceConfigResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UpdateInterfaceConfigResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified UpdateInterfaceConfigResponse message, length delimited. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {com.antigravity.IUpdateInterfaceConfigResponse} message UpdateInterfaceConfigResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UpdateInterfaceConfigResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an UpdateInterfaceConfigResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.UpdateInterfaceConfigResponse} UpdateInterfaceConfigResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UpdateInterfaceConfigResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.UpdateInterfaceConfigResponse();
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
             * Decodes an UpdateInterfaceConfigResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.UpdateInterfaceConfigResponse} UpdateInterfaceConfigResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UpdateInterfaceConfigResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an UpdateInterfaceConfigResponse message.
             * @function verify
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            UpdateInterfaceConfigResponse.verify = function verify(message) {
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
             * Creates an UpdateInterfaceConfigResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.UpdateInterfaceConfigResponse} UpdateInterfaceConfigResponse
             */
            UpdateInterfaceConfigResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.UpdateInterfaceConfigResponse)
                    return object;
                let message = new $root.com.antigravity.UpdateInterfaceConfigResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from an UpdateInterfaceConfigResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {com.antigravity.UpdateInterfaceConfigResponse} message UpdateInterfaceConfigResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            UpdateInterfaceConfigResponse.toObject = function toObject(message, options) {
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
             * Converts this UpdateInterfaceConfigResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            UpdateInterfaceConfigResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for UpdateInterfaceConfigResponse
             * @function getTypeUrl
             * @memberof com.antigravity.UpdateInterfaceConfigResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UpdateInterfaceConfigResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.UpdateInterfaceConfigResponse";
            };

            return UpdateInterfaceConfigResponse;
        })();

        antigravity.SetInterfacePinStateRequest = (function() {

            /**
             * Properties of a SetInterfacePinStateRequest.
             * @memberof com.antigravity
             * @interface ISetInterfacePinStateRequest
             * @property {number|null} [pin] SetInterfacePinStateRequest pin
             * @property {boolean|null} [isDigital] SetInterfacePinStateRequest isDigital
             * @property {boolean|null} [isHigh] SetInterfacePinStateRequest isHigh
             */

            /**
             * Constructs a new SetInterfacePinStateRequest.
             * @memberof com.antigravity
             * @classdesc Represents a SetInterfacePinStateRequest.
             * @implements ISetInterfacePinStateRequest
             * @constructor
             * @param {com.antigravity.ISetInterfacePinStateRequest=} [properties] Properties to set
             */
            function SetInterfacePinStateRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SetInterfacePinStateRequest pin.
             * @member {number} pin
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @instance
             */
            SetInterfacePinStateRequest.prototype.pin = 0;

            /**
             * SetInterfacePinStateRequest isDigital.
             * @member {boolean} isDigital
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @instance
             */
            SetInterfacePinStateRequest.prototype.isDigital = false;

            /**
             * SetInterfacePinStateRequest isHigh.
             * @member {boolean} isHigh
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @instance
             */
            SetInterfacePinStateRequest.prototype.isHigh = false;

            /**
             * Creates a new SetInterfacePinStateRequest instance using the specified properties.
             * @function create
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {com.antigravity.ISetInterfacePinStateRequest=} [properties] Properties to set
             * @returns {com.antigravity.SetInterfacePinStateRequest} SetInterfacePinStateRequest instance
             */
            SetInterfacePinStateRequest.create = function create(properties) {
                return new SetInterfacePinStateRequest(properties);
            };

            /**
             * Encodes the specified SetInterfacePinStateRequest message. Does not implicitly {@link com.antigravity.SetInterfacePinStateRequest.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {com.antigravity.ISetInterfacePinStateRequest} message SetInterfacePinStateRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetInterfacePinStateRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.pin != null && Object.hasOwnProperty.call(message, "pin"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.pin);
                if (message.isDigital != null && Object.hasOwnProperty.call(message, "isDigital"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isDigital);
                if (message.isHigh != null && Object.hasOwnProperty.call(message, "isHigh"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.isHigh);
                return writer;
            };

            /**
             * Encodes the specified SetInterfacePinStateRequest message, length delimited. Does not implicitly {@link com.antigravity.SetInterfacePinStateRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {com.antigravity.ISetInterfacePinStateRequest} message SetInterfacePinStateRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetInterfacePinStateRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SetInterfacePinStateRequest message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.SetInterfacePinStateRequest} SetInterfacePinStateRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetInterfacePinStateRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.SetInterfacePinStateRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.pin = reader.int32();
                            break;
                        }
                    case 2: {
                            message.isDigital = reader.bool();
                            break;
                        }
                    case 3: {
                            message.isHigh = reader.bool();
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
             * Decodes a SetInterfacePinStateRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.SetInterfacePinStateRequest} SetInterfacePinStateRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetInterfacePinStateRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SetInterfacePinStateRequest message.
             * @function verify
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SetInterfacePinStateRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.pin != null && message.hasOwnProperty("pin"))
                    if (!$util.isInteger(message.pin))
                        return "pin: integer expected";
                if (message.isDigital != null && message.hasOwnProperty("isDigital"))
                    if (typeof message.isDigital !== "boolean")
                        return "isDigital: boolean expected";
                if (message.isHigh != null && message.hasOwnProperty("isHigh"))
                    if (typeof message.isHigh !== "boolean")
                        return "isHigh: boolean expected";
                return null;
            };

            /**
             * Creates a SetInterfacePinStateRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.SetInterfacePinStateRequest} SetInterfacePinStateRequest
             */
            SetInterfacePinStateRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.SetInterfacePinStateRequest)
                    return object;
                let message = new $root.com.antigravity.SetInterfacePinStateRequest();
                if (object.pin != null)
                    message.pin = object.pin | 0;
                if (object.isDigital != null)
                    message.isDigital = Boolean(object.isDigital);
                if (object.isHigh != null)
                    message.isHigh = Boolean(object.isHigh);
                return message;
            };

            /**
             * Creates a plain object from a SetInterfacePinStateRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {com.antigravity.SetInterfacePinStateRequest} message SetInterfacePinStateRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SetInterfacePinStateRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.pin = 0;
                    object.isDigital = false;
                    object.isHigh = false;
                }
                if (message.pin != null && message.hasOwnProperty("pin"))
                    object.pin = message.pin;
                if (message.isDigital != null && message.hasOwnProperty("isDigital"))
                    object.isDigital = message.isDigital;
                if (message.isHigh != null && message.hasOwnProperty("isHigh"))
                    object.isHigh = message.isHigh;
                return object;
            };

            /**
             * Converts this SetInterfacePinStateRequest to JSON.
             * @function toJSON
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SetInterfacePinStateRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SetInterfacePinStateRequest
             * @function getTypeUrl
             * @memberof com.antigravity.SetInterfacePinStateRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SetInterfacePinStateRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.SetInterfacePinStateRequest";
            };

            return SetInterfacePinStateRequest;
        })();

        antigravity.SetInterfacePinStateResponse = (function() {

            /**
             * Properties of a SetInterfacePinStateResponse.
             * @memberof com.antigravity
             * @interface ISetInterfacePinStateResponse
             * @property {boolean|null} [success] SetInterfacePinStateResponse success
             * @property {string|null} [message] SetInterfacePinStateResponse message
             */

            /**
             * Constructs a new SetInterfacePinStateResponse.
             * @memberof com.antigravity
             * @classdesc Represents a SetInterfacePinStateResponse.
             * @implements ISetInterfacePinStateResponse
             * @constructor
             * @param {com.antigravity.ISetInterfacePinStateResponse=} [properties] Properties to set
             */
            function SetInterfacePinStateResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SetInterfacePinStateResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @instance
             */
            SetInterfacePinStateResponse.prototype.success = false;

            /**
             * SetInterfacePinStateResponse message.
             * @member {string} message
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @instance
             */
            SetInterfacePinStateResponse.prototype.message = "";

            /**
             * Creates a new SetInterfacePinStateResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {com.antigravity.ISetInterfacePinStateResponse=} [properties] Properties to set
             * @returns {com.antigravity.SetInterfacePinStateResponse} SetInterfacePinStateResponse instance
             */
            SetInterfacePinStateResponse.create = function create(properties) {
                return new SetInterfacePinStateResponse(properties);
            };

            /**
             * Encodes the specified SetInterfacePinStateResponse message. Does not implicitly {@link com.antigravity.SetInterfacePinStateResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {com.antigravity.ISetInterfacePinStateResponse} message SetInterfacePinStateResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetInterfacePinStateResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified SetInterfacePinStateResponse message, length delimited. Does not implicitly {@link com.antigravity.SetInterfacePinStateResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {com.antigravity.ISetInterfacePinStateResponse} message SetInterfacePinStateResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetInterfacePinStateResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SetInterfacePinStateResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.SetInterfacePinStateResponse} SetInterfacePinStateResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetInterfacePinStateResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.SetInterfacePinStateResponse();
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
             * Decodes a SetInterfacePinStateResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.SetInterfacePinStateResponse} SetInterfacePinStateResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetInterfacePinStateResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SetInterfacePinStateResponse message.
             * @function verify
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SetInterfacePinStateResponse.verify = function verify(message) {
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
             * Creates a SetInterfacePinStateResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.SetInterfacePinStateResponse} SetInterfacePinStateResponse
             */
            SetInterfacePinStateResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.SetInterfacePinStateResponse)
                    return object;
                let message = new $root.com.antigravity.SetInterfacePinStateResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a SetInterfacePinStateResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {com.antigravity.SetInterfacePinStateResponse} message SetInterfacePinStateResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SetInterfacePinStateResponse.toObject = function toObject(message, options) {
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
             * Converts this SetInterfacePinStateResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SetInterfacePinStateResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SetInterfacePinStateResponse
             * @function getTypeUrl
             * @memberof com.antigravity.SetInterfacePinStateResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SetInterfacePinStateResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.SetInterfacePinStateResponse";
            };

            return SetInterfacePinStateResponse;
        })();

        /**
         * InterfaceStatus enum.
         * @name com.antigravity.InterfaceStatus
         * @enum {number}
         * @property {number} CONNECTED=0 CONNECTED value
         * @property {number} DISCONNECTED=1 DISCONNECTED value
         * @property {number} NO_DATA=2 NO_DATA value
         */
        antigravity.InterfaceStatus = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "CONNECTED"] = 0;
            values[valuesById[1] = "DISCONNECTED"] = 1;
            values[valuesById[2] = "NO_DATA"] = 2;
            return values;
        })();

        antigravity.InterfaceEvent = (function() {

            /**
             * Properties of an InterfaceEvent.
             * @memberof com.antigravity
             * @interface IInterfaceEvent
             * @property {com.antigravity.ILapEvent|null} [lap] InterfaceEvent lap
             * @property {com.antigravity.ISegmentEvent|null} [segment] InterfaceEvent segment
             * @property {com.antigravity.IInterfaceStatusEvent|null} [status] InterfaceEvent status
             */

            /**
             * Constructs a new InterfaceEvent.
             * @memberof com.antigravity
             * @classdesc Represents an InterfaceEvent.
             * @implements IInterfaceEvent
             * @constructor
             * @param {com.antigravity.IInterfaceEvent=} [properties] Properties to set
             */
            function InterfaceEvent(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InterfaceEvent lap.
             * @member {com.antigravity.ILapEvent|null|undefined} lap
             * @memberof com.antigravity.InterfaceEvent
             * @instance
             */
            InterfaceEvent.prototype.lap = null;

            /**
             * InterfaceEvent segment.
             * @member {com.antigravity.ISegmentEvent|null|undefined} segment
             * @memberof com.antigravity.InterfaceEvent
             * @instance
             */
            InterfaceEvent.prototype.segment = null;

            /**
             * InterfaceEvent status.
             * @member {com.antigravity.IInterfaceStatusEvent|null|undefined} status
             * @memberof com.antigravity.InterfaceEvent
             * @instance
             */
            InterfaceEvent.prototype.status = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * InterfaceEvent event.
             * @member {"lap"|"segment"|"status"|undefined} event
             * @memberof com.antigravity.InterfaceEvent
             * @instance
             */
            Object.defineProperty(InterfaceEvent.prototype, "event", {
                get: $util.oneOfGetter($oneOfFields = ["lap", "segment", "status"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new InterfaceEvent instance using the specified properties.
             * @function create
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {com.antigravity.IInterfaceEvent=} [properties] Properties to set
             * @returns {com.antigravity.InterfaceEvent} InterfaceEvent instance
             */
            InterfaceEvent.create = function create(properties) {
                return new InterfaceEvent(properties);
            };

            /**
             * Encodes the specified InterfaceEvent message. Does not implicitly {@link com.antigravity.InterfaceEvent.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {com.antigravity.IInterfaceEvent} message InterfaceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InterfaceEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.lap != null && Object.hasOwnProperty.call(message, "lap"))
                    $root.com.antigravity.LapEvent.encode(message.lap, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.segment != null && Object.hasOwnProperty.call(message, "segment"))
                    $root.com.antigravity.SegmentEvent.encode(message.segment, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                    $root.com.antigravity.InterfaceStatusEvent.encode(message.status, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified InterfaceEvent message, length delimited. Does not implicitly {@link com.antigravity.InterfaceEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {com.antigravity.IInterfaceEvent} message InterfaceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InterfaceEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InterfaceEvent message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.InterfaceEvent} InterfaceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InterfaceEvent.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.InterfaceEvent();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.lap = $root.com.antigravity.LapEvent.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.segment = $root.com.antigravity.SegmentEvent.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.status = $root.com.antigravity.InterfaceStatusEvent.decode(reader, reader.uint32());
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
             * Decodes an InterfaceEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.InterfaceEvent} InterfaceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InterfaceEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InterfaceEvent message.
             * @function verify
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InterfaceEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.lap != null && message.hasOwnProperty("lap")) {
                    properties.event = 1;
                    {
                        let error = $root.com.antigravity.LapEvent.verify(message.lap);
                        if (error)
                            return "lap." + error;
                    }
                }
                if (message.segment != null && message.hasOwnProperty("segment")) {
                    if (properties.event === 1)
                        return "event: multiple values";
                    properties.event = 1;
                    {
                        let error = $root.com.antigravity.SegmentEvent.verify(message.segment);
                        if (error)
                            return "segment." + error;
                    }
                }
                if (message.status != null && message.hasOwnProperty("status")) {
                    if (properties.event === 1)
                        return "event: multiple values";
                    properties.event = 1;
                    {
                        let error = $root.com.antigravity.InterfaceStatusEvent.verify(message.status);
                        if (error)
                            return "status." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an InterfaceEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.InterfaceEvent} InterfaceEvent
             */
            InterfaceEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.InterfaceEvent)
                    return object;
                let message = new $root.com.antigravity.InterfaceEvent();
                if (object.lap != null) {
                    if (typeof object.lap !== "object")
                        throw TypeError(".com.antigravity.InterfaceEvent.lap: object expected");
                    message.lap = $root.com.antigravity.LapEvent.fromObject(object.lap);
                }
                if (object.segment != null) {
                    if (typeof object.segment !== "object")
                        throw TypeError(".com.antigravity.InterfaceEvent.segment: object expected");
                    message.segment = $root.com.antigravity.SegmentEvent.fromObject(object.segment);
                }
                if (object.status != null) {
                    if (typeof object.status !== "object")
                        throw TypeError(".com.antigravity.InterfaceEvent.status: object expected");
                    message.status = $root.com.antigravity.InterfaceStatusEvent.fromObject(object.status);
                }
                return message;
            };

            /**
             * Creates a plain object from an InterfaceEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {com.antigravity.InterfaceEvent} message InterfaceEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InterfaceEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (message.lap != null && message.hasOwnProperty("lap")) {
                    object.lap = $root.com.antigravity.LapEvent.toObject(message.lap, options);
                    if (options.oneofs)
                        object.event = "lap";
                }
                if (message.segment != null && message.hasOwnProperty("segment")) {
                    object.segment = $root.com.antigravity.SegmentEvent.toObject(message.segment, options);
                    if (options.oneofs)
                        object.event = "segment";
                }
                if (message.status != null && message.hasOwnProperty("status")) {
                    object.status = $root.com.antigravity.InterfaceStatusEvent.toObject(message.status, options);
                    if (options.oneofs)
                        object.event = "status";
                }
                return object;
            };

            /**
             * Converts this InterfaceEvent to JSON.
             * @function toJSON
             * @memberof com.antigravity.InterfaceEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InterfaceEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InterfaceEvent
             * @function getTypeUrl
             * @memberof com.antigravity.InterfaceEvent
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InterfaceEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.InterfaceEvent";
            };

            return InterfaceEvent;
        })();

        antigravity.InterfaceStatusEvent = (function() {

            /**
             * Properties of an InterfaceStatusEvent.
             * @memberof com.antigravity
             * @interface IInterfaceStatusEvent
             * @property {com.antigravity.InterfaceStatus|null} [status] InterfaceStatusEvent status
             */

            /**
             * Constructs a new InterfaceStatusEvent.
             * @memberof com.antigravity
             * @classdesc Represents an InterfaceStatusEvent.
             * @implements IInterfaceStatusEvent
             * @constructor
             * @param {com.antigravity.IInterfaceStatusEvent=} [properties] Properties to set
             */
            function InterfaceStatusEvent(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InterfaceStatusEvent status.
             * @member {com.antigravity.InterfaceStatus} status
             * @memberof com.antigravity.InterfaceStatusEvent
             * @instance
             */
            InterfaceStatusEvent.prototype.status = 0;

            /**
             * Creates a new InterfaceStatusEvent instance using the specified properties.
             * @function create
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {com.antigravity.IInterfaceStatusEvent=} [properties] Properties to set
             * @returns {com.antigravity.InterfaceStatusEvent} InterfaceStatusEvent instance
             */
            InterfaceStatusEvent.create = function create(properties) {
                return new InterfaceStatusEvent(properties);
            };

            /**
             * Encodes the specified InterfaceStatusEvent message. Does not implicitly {@link com.antigravity.InterfaceStatusEvent.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {com.antigravity.IInterfaceStatusEvent} message InterfaceStatusEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InterfaceStatusEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.status);
                return writer;
            };

            /**
             * Encodes the specified InterfaceStatusEvent message, length delimited. Does not implicitly {@link com.antigravity.InterfaceStatusEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {com.antigravity.IInterfaceStatusEvent} message InterfaceStatusEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InterfaceStatusEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InterfaceStatusEvent message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.InterfaceStatusEvent} InterfaceStatusEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InterfaceStatusEvent.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.InterfaceStatusEvent();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.status = reader.int32();
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
             * Decodes an InterfaceStatusEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.InterfaceStatusEvent} InterfaceStatusEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InterfaceStatusEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InterfaceStatusEvent message.
             * @function verify
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InterfaceStatusEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.status != null && message.hasOwnProperty("status"))
                    switch (message.status) {
                    default:
                        return "status: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates an InterfaceStatusEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.InterfaceStatusEvent} InterfaceStatusEvent
             */
            InterfaceStatusEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.InterfaceStatusEvent)
                    return object;
                let message = new $root.com.antigravity.InterfaceStatusEvent();
                switch (object.status) {
                default:
                    if (typeof object.status === "number") {
                        message.status = object.status;
                        break;
                    }
                    break;
                case "CONNECTED":
                case 0:
                    message.status = 0;
                    break;
                case "DISCONNECTED":
                case 1:
                    message.status = 1;
                    break;
                case "NO_DATA":
                case 2:
                    message.status = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from an InterfaceStatusEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {com.antigravity.InterfaceStatusEvent} message InterfaceStatusEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InterfaceStatusEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.status = options.enums === String ? "CONNECTED" : 0;
                if (message.status != null && message.hasOwnProperty("status"))
                    object.status = options.enums === String ? $root.com.antigravity.InterfaceStatus[message.status] === undefined ? message.status : $root.com.antigravity.InterfaceStatus[message.status] : message.status;
                return object;
            };

            /**
             * Converts this InterfaceStatusEvent to JSON.
             * @function toJSON
             * @memberof com.antigravity.InterfaceStatusEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InterfaceStatusEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InterfaceStatusEvent
             * @function getTypeUrl
             * @memberof com.antigravity.InterfaceStatusEvent
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InterfaceStatusEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.InterfaceStatusEvent";
            };

            return InterfaceStatusEvent;
        })();

        antigravity.LapEvent = (function() {

            /**
             * Properties of a LapEvent.
             * @memberof com.antigravity
             * @interface ILapEvent
             * @property {number|null} [lane] LapEvent lane
             * @property {number|null} [lapTime] LapEvent lapTime
             * @property {number|null} [interfaceId] LapEvent interfaceId
             */

            /**
             * Constructs a new LapEvent.
             * @memberof com.antigravity
             * @classdesc Represents a LapEvent.
             * @implements ILapEvent
             * @constructor
             * @param {com.antigravity.ILapEvent=} [properties] Properties to set
             */
            function LapEvent(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * LapEvent lane.
             * @member {number} lane
             * @memberof com.antigravity.LapEvent
             * @instance
             */
            LapEvent.prototype.lane = 0;

            /**
             * LapEvent lapTime.
             * @member {number} lapTime
             * @memberof com.antigravity.LapEvent
             * @instance
             */
            LapEvent.prototype.lapTime = 0;

            /**
             * LapEvent interfaceId.
             * @member {number} interfaceId
             * @memberof com.antigravity.LapEvent
             * @instance
             */
            LapEvent.prototype.interfaceId = 0;

            /**
             * Creates a new LapEvent instance using the specified properties.
             * @function create
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {com.antigravity.ILapEvent=} [properties] Properties to set
             * @returns {com.antigravity.LapEvent} LapEvent instance
             */
            LapEvent.create = function create(properties) {
                return new LapEvent(properties);
            };

            /**
             * Encodes the specified LapEvent message. Does not implicitly {@link com.antigravity.LapEvent.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {com.antigravity.ILapEvent} message LapEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            LapEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.lane != null && Object.hasOwnProperty.call(message, "lane"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.lane);
                if (message.lapTime != null && Object.hasOwnProperty.call(message, "lapTime"))
                    writer.uint32(/* id 2, wireType 1 =*/17).double(message.lapTime);
                if (message.interfaceId != null && Object.hasOwnProperty.call(message, "interfaceId"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.interfaceId);
                return writer;
            };

            /**
             * Encodes the specified LapEvent message, length delimited. Does not implicitly {@link com.antigravity.LapEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {com.antigravity.ILapEvent} message LapEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            LapEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a LapEvent message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.LapEvent} LapEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            LapEvent.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.LapEvent();
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
                            message.lapTime = reader.double();
                            break;
                        }
                    case 3: {
                            message.interfaceId = reader.int32();
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
             * Decodes a LapEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.LapEvent} LapEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            LapEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a LapEvent message.
             * @function verify
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            LapEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.lane != null && message.hasOwnProperty("lane"))
                    if (!$util.isInteger(message.lane))
                        return "lane: integer expected";
                if (message.lapTime != null && message.hasOwnProperty("lapTime"))
                    if (typeof message.lapTime !== "number")
                        return "lapTime: number expected";
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    if (!$util.isInteger(message.interfaceId))
                        return "interfaceId: integer expected";
                return null;
            };

            /**
             * Creates a LapEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.LapEvent} LapEvent
             */
            LapEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.LapEvent)
                    return object;
                let message = new $root.com.antigravity.LapEvent();
                if (object.lane != null)
                    message.lane = object.lane | 0;
                if (object.lapTime != null)
                    message.lapTime = Number(object.lapTime);
                if (object.interfaceId != null)
                    message.interfaceId = object.interfaceId | 0;
                return message;
            };

            /**
             * Creates a plain object from a LapEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {com.antigravity.LapEvent} message LapEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            LapEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.lane = 0;
                    object.lapTime = 0;
                    object.interfaceId = 0;
                }
                if (message.lane != null && message.hasOwnProperty("lane"))
                    object.lane = message.lane;
                if (message.lapTime != null && message.hasOwnProperty("lapTime"))
                    object.lapTime = options.json && !isFinite(message.lapTime) ? String(message.lapTime) : message.lapTime;
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    object.interfaceId = message.interfaceId;
                return object;
            };

            /**
             * Converts this LapEvent to JSON.
             * @function toJSON
             * @memberof com.antigravity.LapEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            LapEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for LapEvent
             * @function getTypeUrl
             * @memberof com.antigravity.LapEvent
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            LapEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.LapEvent";
            };

            return LapEvent;
        })();

        antigravity.SegmentEvent = (function() {

            /**
             * Properties of a SegmentEvent.
             * @memberof com.antigravity
             * @interface ISegmentEvent
             * @property {number|null} [lane] SegmentEvent lane
             * @property {number|null} [segmentTime] SegmentEvent segmentTime
             * @property {number|null} [interfaceId] SegmentEvent interfaceId
             */

            /**
             * Constructs a new SegmentEvent.
             * @memberof com.antigravity
             * @classdesc Represents a SegmentEvent.
             * @implements ISegmentEvent
             * @constructor
             * @param {com.antigravity.ISegmentEvent=} [properties] Properties to set
             */
            function SegmentEvent(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SegmentEvent lane.
             * @member {number} lane
             * @memberof com.antigravity.SegmentEvent
             * @instance
             */
            SegmentEvent.prototype.lane = 0;

            /**
             * SegmentEvent segmentTime.
             * @member {number} segmentTime
             * @memberof com.antigravity.SegmentEvent
             * @instance
             */
            SegmentEvent.prototype.segmentTime = 0;

            /**
             * SegmentEvent interfaceId.
             * @member {number} interfaceId
             * @memberof com.antigravity.SegmentEvent
             * @instance
             */
            SegmentEvent.prototype.interfaceId = 0;

            /**
             * Creates a new SegmentEvent instance using the specified properties.
             * @function create
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {com.antigravity.ISegmentEvent=} [properties] Properties to set
             * @returns {com.antigravity.SegmentEvent} SegmentEvent instance
             */
            SegmentEvent.create = function create(properties) {
                return new SegmentEvent(properties);
            };

            /**
             * Encodes the specified SegmentEvent message. Does not implicitly {@link com.antigravity.SegmentEvent.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {com.antigravity.ISegmentEvent} message SegmentEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SegmentEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.lane != null && Object.hasOwnProperty.call(message, "lane"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.lane);
                if (message.segmentTime != null && Object.hasOwnProperty.call(message, "segmentTime"))
                    writer.uint32(/* id 2, wireType 1 =*/17).double(message.segmentTime);
                if (message.interfaceId != null && Object.hasOwnProperty.call(message, "interfaceId"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.interfaceId);
                return writer;
            };

            /**
             * Encodes the specified SegmentEvent message, length delimited. Does not implicitly {@link com.antigravity.SegmentEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {com.antigravity.ISegmentEvent} message SegmentEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SegmentEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SegmentEvent message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.SegmentEvent} SegmentEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SegmentEvent.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.SegmentEvent();
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
                            message.segmentTime = reader.double();
                            break;
                        }
                    case 3: {
                            message.interfaceId = reader.int32();
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
             * Decodes a SegmentEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.SegmentEvent} SegmentEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SegmentEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SegmentEvent message.
             * @function verify
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SegmentEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.lane != null && message.hasOwnProperty("lane"))
                    if (!$util.isInteger(message.lane))
                        return "lane: integer expected";
                if (message.segmentTime != null && message.hasOwnProperty("segmentTime"))
                    if (typeof message.segmentTime !== "number")
                        return "segmentTime: number expected";
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    if (!$util.isInteger(message.interfaceId))
                        return "interfaceId: integer expected";
                return null;
            };

            /**
             * Creates a SegmentEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.SegmentEvent} SegmentEvent
             */
            SegmentEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.SegmentEvent)
                    return object;
                let message = new $root.com.antigravity.SegmentEvent();
                if (object.lane != null)
                    message.lane = object.lane | 0;
                if (object.segmentTime != null)
                    message.segmentTime = Number(object.segmentTime);
                if (object.interfaceId != null)
                    message.interfaceId = object.interfaceId | 0;
                return message;
            };

            /**
             * Creates a plain object from a SegmentEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {com.antigravity.SegmentEvent} message SegmentEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SegmentEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.lane = 0;
                    object.segmentTime = 0;
                    object.interfaceId = 0;
                }
                if (message.lane != null && message.hasOwnProperty("lane"))
                    object.lane = message.lane;
                if (message.segmentTime != null && message.hasOwnProperty("segmentTime"))
                    object.segmentTime = options.json && !isFinite(message.segmentTime) ? String(message.segmentTime) : message.segmentTime;
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    object.interfaceId = message.interfaceId;
                return object;
            };

            /**
             * Converts this SegmentEvent to JSON.
             * @function toJSON
             * @memberof com.antigravity.SegmentEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SegmentEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SegmentEvent
             * @function getTypeUrl
             * @memberof com.antigravity.SegmentEvent
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SegmentEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.SegmentEvent";
            };

            return SegmentEvent;
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

        /**
         * RaceState enum.
         * @name com.antigravity.RaceState
         * @enum {number}
         * @property {number} UNKNOWN_STATE=0 UNKNOWN_STATE value
         * @property {number} NOT_STARTED=1 NOT_STARTED value
         * @property {number} STARTING=2 STARTING value
         * @property {number} RACING=3 RACING value
         * @property {number} PAUSED=4 PAUSED value
         * @property {number} HEAT_OVER=5 HEAT_OVER value
         * @property {number} RACE_OVER=6 RACE_OVER value
         */
        antigravity.RaceState = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "UNKNOWN_STATE"] = 0;
            values[valuesById[1] = "NOT_STARTED"] = 1;
            values[valuesById[2] = "STARTING"] = 2;
            values[valuesById[3] = "RACING"] = 3;
            values[valuesById[4] = "PAUSED"] = 4;
            values[valuesById[5] = "HEAT_OVER"] = 5;
            values[valuesById[6] = "RACE_OVER"] = 6;
            return values;
        })();

        antigravity.ListAssetsResponse = (function() {

            /**
             * Properties of a ListAssetsResponse.
             * @memberof com.antigravity
             * @interface IListAssetsResponse
             * @property {Array.<com.antigravity.IAssetMessage>|null} [assets] ListAssetsResponse assets
             */

            /**
             * Constructs a new ListAssetsResponse.
             * @memberof com.antigravity
             * @classdesc Represents a ListAssetsResponse.
             * @implements IListAssetsResponse
             * @constructor
             * @param {com.antigravity.IListAssetsResponse=} [properties] Properties to set
             */
            function ListAssetsResponse(properties) {
                this.assets = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ListAssetsResponse assets.
             * @member {Array.<com.antigravity.IAssetMessage>} assets
             * @memberof com.antigravity.ListAssetsResponse
             * @instance
             */
            ListAssetsResponse.prototype.assets = $util.emptyArray;

            /**
             * Creates a new ListAssetsResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {com.antigravity.IListAssetsResponse=} [properties] Properties to set
             * @returns {com.antigravity.ListAssetsResponse} ListAssetsResponse instance
             */
            ListAssetsResponse.create = function create(properties) {
                return new ListAssetsResponse(properties);
            };

            /**
             * Encodes the specified ListAssetsResponse message. Does not implicitly {@link com.antigravity.ListAssetsResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {com.antigravity.IListAssetsResponse} message ListAssetsResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ListAssetsResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.assets != null && message.assets.length)
                    for (let i = 0; i < message.assets.length; ++i)
                        $root.com.antigravity.AssetMessage.encode(message.assets[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ListAssetsResponse message, length delimited. Does not implicitly {@link com.antigravity.ListAssetsResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {com.antigravity.IListAssetsResponse} message ListAssetsResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ListAssetsResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ListAssetsResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.ListAssetsResponse} ListAssetsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ListAssetsResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.ListAssetsResponse();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.assets && message.assets.length))
                                message.assets = [];
                            message.assets.push($root.com.antigravity.AssetMessage.decode(reader, reader.uint32()));
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
             * Decodes a ListAssetsResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.ListAssetsResponse} ListAssetsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ListAssetsResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ListAssetsResponse message.
             * @function verify
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ListAssetsResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.assets != null && message.hasOwnProperty("assets")) {
                    if (!Array.isArray(message.assets))
                        return "assets: array expected";
                    for (let i = 0; i < message.assets.length; ++i) {
                        let error = $root.com.antigravity.AssetMessage.verify(message.assets[i]);
                        if (error)
                            return "assets." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ListAssetsResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.ListAssetsResponse} ListAssetsResponse
             */
            ListAssetsResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.ListAssetsResponse)
                    return object;
                let message = new $root.com.antigravity.ListAssetsResponse();
                if (object.assets) {
                    if (!Array.isArray(object.assets))
                        throw TypeError(".com.antigravity.ListAssetsResponse.assets: array expected");
                    message.assets = [];
                    for (let i = 0; i < object.assets.length; ++i) {
                        if (typeof object.assets[i] !== "object")
                            throw TypeError(".com.antigravity.ListAssetsResponse.assets: object expected");
                        message.assets[i] = $root.com.antigravity.AssetMessage.fromObject(object.assets[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ListAssetsResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {com.antigravity.ListAssetsResponse} message ListAssetsResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ListAssetsResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.assets = [];
                if (message.assets && message.assets.length) {
                    object.assets = [];
                    for (let j = 0; j < message.assets.length; ++j)
                        object.assets[j] = $root.com.antigravity.AssetMessage.toObject(message.assets[j], options);
                }
                return object;
            };

            /**
             * Converts this ListAssetsResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.ListAssetsResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ListAssetsResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ListAssetsResponse
             * @function getTypeUrl
             * @memberof com.antigravity.ListAssetsResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ListAssetsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.ListAssetsResponse";
            };

            return ListAssetsResponse;
        })();

        antigravity.UploadAssetResponse = (function() {

            /**
             * Properties of an UploadAssetResponse.
             * @memberof com.antigravity
             * @interface IUploadAssetResponse
             * @property {boolean|null} [success] UploadAssetResponse success
             * @property {string|null} [message] UploadAssetResponse message
             * @property {com.antigravity.IAssetMessage|null} [asset] UploadAssetResponse asset
             */

            /**
             * Constructs a new UploadAssetResponse.
             * @memberof com.antigravity
             * @classdesc Represents an UploadAssetResponse.
             * @implements IUploadAssetResponse
             * @constructor
             * @param {com.antigravity.IUploadAssetResponse=} [properties] Properties to set
             */
            function UploadAssetResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * UploadAssetResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.UploadAssetResponse
             * @instance
             */
            UploadAssetResponse.prototype.success = false;

            /**
             * UploadAssetResponse message.
             * @member {string} message
             * @memberof com.antigravity.UploadAssetResponse
             * @instance
             */
            UploadAssetResponse.prototype.message = "";

            /**
             * UploadAssetResponse asset.
             * @member {com.antigravity.IAssetMessage|null|undefined} asset
             * @memberof com.antigravity.UploadAssetResponse
             * @instance
             */
            UploadAssetResponse.prototype.asset = null;

            /**
             * Creates a new UploadAssetResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {com.antigravity.IUploadAssetResponse=} [properties] Properties to set
             * @returns {com.antigravity.UploadAssetResponse} UploadAssetResponse instance
             */
            UploadAssetResponse.create = function create(properties) {
                return new UploadAssetResponse(properties);
            };

            /**
             * Encodes the specified UploadAssetResponse message. Does not implicitly {@link com.antigravity.UploadAssetResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {com.antigravity.IUploadAssetResponse} message UploadAssetResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UploadAssetResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                if (message.asset != null && Object.hasOwnProperty.call(message, "asset"))
                    $root.com.antigravity.AssetMessage.encode(message.asset, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified UploadAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.UploadAssetResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {com.antigravity.IUploadAssetResponse} message UploadAssetResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UploadAssetResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an UploadAssetResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.UploadAssetResponse} UploadAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UploadAssetResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.UploadAssetResponse();
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
                    case 3: {
                            message.asset = $root.com.antigravity.AssetMessage.decode(reader, reader.uint32());
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
             * Decodes an UploadAssetResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.UploadAssetResponse} UploadAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UploadAssetResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an UploadAssetResponse message.
             * @function verify
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            UploadAssetResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.success != null && message.hasOwnProperty("success"))
                    if (typeof message.success !== "boolean")
                        return "success: boolean expected";
                if (message.message != null && message.hasOwnProperty("message"))
                    if (!$util.isString(message.message))
                        return "message: string expected";
                if (message.asset != null && message.hasOwnProperty("asset")) {
                    let error = $root.com.antigravity.AssetMessage.verify(message.asset);
                    if (error)
                        return "asset." + error;
                }
                return null;
            };

            /**
             * Creates an UploadAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.UploadAssetResponse} UploadAssetResponse
             */
            UploadAssetResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.UploadAssetResponse)
                    return object;
                let message = new $root.com.antigravity.UploadAssetResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                if (object.asset != null) {
                    if (typeof object.asset !== "object")
                        throw TypeError(".com.antigravity.UploadAssetResponse.asset: object expected");
                    message.asset = $root.com.antigravity.AssetMessage.fromObject(object.asset);
                }
                return message;
            };

            /**
             * Creates a plain object from an UploadAssetResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {com.antigravity.UploadAssetResponse} message UploadAssetResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            UploadAssetResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.success = false;
                    object.message = "";
                    object.asset = null;
                }
                if (message.success != null && message.hasOwnProperty("success"))
                    object.success = message.success;
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                if (message.asset != null && message.hasOwnProperty("asset"))
                    object.asset = $root.com.antigravity.AssetMessage.toObject(message.asset, options);
                return object;
            };

            /**
             * Converts this UploadAssetResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.UploadAssetResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            UploadAssetResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for UploadAssetResponse
             * @function getTypeUrl
             * @memberof com.antigravity.UploadAssetResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UploadAssetResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.UploadAssetResponse";
            };

            return UploadAssetResponse;
        })();

        antigravity.DeleteAssetResponse = (function() {

            /**
             * Properties of a DeleteAssetResponse.
             * @memberof com.antigravity
             * @interface IDeleteAssetResponse
             * @property {boolean|null} [success] DeleteAssetResponse success
             * @property {string|null} [message] DeleteAssetResponse message
             */

            /**
             * Constructs a new DeleteAssetResponse.
             * @memberof com.antigravity
             * @classdesc Represents a DeleteAssetResponse.
             * @implements IDeleteAssetResponse
             * @constructor
             * @param {com.antigravity.IDeleteAssetResponse=} [properties] Properties to set
             */
            function DeleteAssetResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DeleteAssetResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.DeleteAssetResponse
             * @instance
             */
            DeleteAssetResponse.prototype.success = false;

            /**
             * DeleteAssetResponse message.
             * @member {string} message
             * @memberof com.antigravity.DeleteAssetResponse
             * @instance
             */
            DeleteAssetResponse.prototype.message = "";

            /**
             * Creates a new DeleteAssetResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {com.antigravity.IDeleteAssetResponse=} [properties] Properties to set
             * @returns {com.antigravity.DeleteAssetResponse} DeleteAssetResponse instance
             */
            DeleteAssetResponse.create = function create(properties) {
                return new DeleteAssetResponse(properties);
            };

            /**
             * Encodes the specified DeleteAssetResponse message. Does not implicitly {@link com.antigravity.DeleteAssetResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {com.antigravity.IDeleteAssetResponse} message DeleteAssetResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeleteAssetResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified DeleteAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.DeleteAssetResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {com.antigravity.IDeleteAssetResponse} message DeleteAssetResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DeleteAssetResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DeleteAssetResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.DeleteAssetResponse} DeleteAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeleteAssetResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.DeleteAssetResponse();
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
             * Decodes a DeleteAssetResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.DeleteAssetResponse} DeleteAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DeleteAssetResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DeleteAssetResponse message.
             * @function verify
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DeleteAssetResponse.verify = function verify(message) {
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
             * Creates a DeleteAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.DeleteAssetResponse} DeleteAssetResponse
             */
            DeleteAssetResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.DeleteAssetResponse)
                    return object;
                let message = new $root.com.antigravity.DeleteAssetResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a DeleteAssetResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {com.antigravity.DeleteAssetResponse} message DeleteAssetResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DeleteAssetResponse.toObject = function toObject(message, options) {
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
             * Converts this DeleteAssetResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.DeleteAssetResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DeleteAssetResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DeleteAssetResponse
             * @function getTypeUrl
             * @memberof com.antigravity.DeleteAssetResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DeleteAssetResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.DeleteAssetResponse";
            };

            return DeleteAssetResponse;
        })();

        antigravity.RenameAssetResponse = (function() {

            /**
             * Properties of a RenameAssetResponse.
             * @memberof com.antigravity
             * @interface IRenameAssetResponse
             * @property {boolean|null} [success] RenameAssetResponse success
             * @property {string|null} [message] RenameAssetResponse message
             */

            /**
             * Constructs a new RenameAssetResponse.
             * @memberof com.antigravity
             * @classdesc Represents a RenameAssetResponse.
             * @implements IRenameAssetResponse
             * @constructor
             * @param {com.antigravity.IRenameAssetResponse=} [properties] Properties to set
             */
            function RenameAssetResponse(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * RenameAssetResponse success.
             * @member {boolean} success
             * @memberof com.antigravity.RenameAssetResponse
             * @instance
             */
            RenameAssetResponse.prototype.success = false;

            /**
             * RenameAssetResponse message.
             * @member {string} message
             * @memberof com.antigravity.RenameAssetResponse
             * @instance
             */
            RenameAssetResponse.prototype.message = "";

            /**
             * Creates a new RenameAssetResponse instance using the specified properties.
             * @function create
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {com.antigravity.IRenameAssetResponse=} [properties] Properties to set
             * @returns {com.antigravity.RenameAssetResponse} RenameAssetResponse instance
             */
            RenameAssetResponse.create = function create(properties) {
                return new RenameAssetResponse(properties);
            };

            /**
             * Encodes the specified RenameAssetResponse message. Does not implicitly {@link com.antigravity.RenameAssetResponse.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {com.antigravity.IRenameAssetResponse} message RenameAssetResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RenameAssetResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Encodes the specified RenameAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.RenameAssetResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {com.antigravity.IRenameAssetResponse} message RenameAssetResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RenameAssetResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a RenameAssetResponse message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.RenameAssetResponse} RenameAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RenameAssetResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.RenameAssetResponse();
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
             * Decodes a RenameAssetResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.RenameAssetResponse} RenameAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RenameAssetResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a RenameAssetResponse message.
             * @function verify
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RenameAssetResponse.verify = function verify(message) {
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
             * Creates a RenameAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.RenameAssetResponse} RenameAssetResponse
             */
            RenameAssetResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.RenameAssetResponse)
                    return object;
                let message = new $root.com.antigravity.RenameAssetResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };

            /**
             * Creates a plain object from a RenameAssetResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {com.antigravity.RenameAssetResponse} message RenameAssetResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RenameAssetResponse.toObject = function toObject(message, options) {
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
             * Converts this RenameAssetResponse to JSON.
             * @function toJSON
             * @memberof com.antigravity.RenameAssetResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RenameAssetResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RenameAssetResponse
             * @function getTypeUrl
             * @memberof com.antigravity.RenameAssetResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RenameAssetResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.RenameAssetResponse";
            };

            return RenameAssetResponse;
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
             * @property {number|null} [interfaceId] Lap interfaceId
             * @property {string|null} [driverId] Lap driverId
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
             * Lap interfaceId.
             * @member {number} interfaceId
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.interfaceId = 0;

            /**
             * Lap driverId.
             * @member {string} driverId
             * @memberof com.antigravity.Lap
             * @instance
             */
            Lap.prototype.driverId = "";

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
                if (message.interfaceId != null && Object.hasOwnProperty.call(message, "interfaceId"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int32(message.interfaceId);
                if (message.driverId != null && Object.hasOwnProperty.call(message, "driverId"))
                    writer.uint32(/* id 8, wireType 2 =*/66).string(message.driverId);
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
                    case 7: {
                            message.interfaceId = reader.int32();
                            break;
                        }
                    case 8: {
                            message.driverId = reader.string();
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
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    if (!$util.isInteger(message.interfaceId))
                        return "interfaceId: integer expected";
                if (message.driverId != null && message.hasOwnProperty("driverId"))
                    if (!$util.isString(message.driverId))
                        return "driverId: string expected";
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
                if (object.interfaceId != null)
                    message.interfaceId = object.interfaceId | 0;
                if (object.driverId != null)
                    message.driverId = String(object.driverId);
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
                    object.interfaceId = 0;
                    object.driverId = "";
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
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    object.interfaceId = message.interfaceId;
                if (message.driverId != null && message.hasOwnProperty("driverId"))
                    object.driverId = message.driverId;
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
             * @property {com.antigravity.RaceState|null} [raceState] RaceData raceState
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

            /**
             * RaceData raceState.
             * @member {com.antigravity.RaceState|null|undefined} raceState
             * @memberof com.antigravity.RaceData
             * @instance
             */
            RaceData.prototype.raceState = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * RaceData data.
             * @member {"raceTime"|"lap"|"race"|"reactionTime"|"standingsUpdate"|"overallStandingsUpdate"|"raceState"|undefined} data
             * @memberof com.antigravity.RaceData
             * @instance
             */
            Object.defineProperty(RaceData.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["raceTime", "lap", "race", "reactionTime", "standingsUpdate", "overallStandingsUpdate", "raceState"]),
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
                if (message.raceState != null && Object.hasOwnProperty.call(message, "raceState"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int32(message.raceState);
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
                    case 7: {
                            message.raceState = reader.int32();
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
                if (message.raceState != null && message.hasOwnProperty("raceState")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    switch (message.raceState) {
                    default:
                        return "raceState: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        break;
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
                switch (object.raceState) {
                default:
                    if (typeof object.raceState === "number") {
                        message.raceState = object.raceState;
                        break;
                    }
                    break;
                case "UNKNOWN_STATE":
                case 0:
                    message.raceState = 0;
                    break;
                case "NOT_STARTED":
                case 1:
                    message.raceState = 1;
                    break;
                case "STARTING":
                case 2:
                    message.raceState = 2;
                    break;
                case "RACING":
                case 3:
                    message.raceState = 3;
                    break;
                case "PAUSED":
                case 4:
                    message.raceState = 4;
                    break;
                case "HEAT_OVER":
                case 5:
                    message.raceState = 5;
                    break;
                case "RACE_OVER":
                case 6:
                    message.raceState = 6;
                    break;
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
                if (message.raceState != null && message.hasOwnProperty("raceState")) {
                    object.raceState = options.enums === String ? $root.com.antigravity.RaceState[message.raceState] === undefined ? message.raceState : $root.com.antigravity.RaceState[message.raceState] : message.raceState;
                    if (options.oneofs)
                        object.data = "raceState";
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
             * @property {com.antigravity.RaceState|null} [state] Race state
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
             * Race state.
             * @member {com.antigravity.RaceState} state
             * @memberof com.antigravity.Race
             * @instance
             */
            Race.prototype.state = 0;

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
                if (message.state != null && Object.hasOwnProperty.call(message, "state"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.state);
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
                    case 5: {
                            message.state = reader.int32();
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
                if (message.state != null && message.hasOwnProperty("state"))
                    switch (message.state) {
                    default:
                        return "state: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        break;
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
                switch (object.state) {
                default:
                    if (typeof object.state === "number") {
                        message.state = object.state;
                        break;
                    }
                    break;
                case "UNKNOWN_STATE":
                case 0:
                    message.state = 0;
                    break;
                case "NOT_STARTED":
                case 1:
                    message.state = 1;
                    break;
                case "STARTING":
                case 2:
                    message.state = 2;
                    break;
                case "RACING":
                case 3:
                    message.state = 3;
                    break;
                case "PAUSED":
                case 4:
                    message.state = 4;
                    break;
                case "HEAT_OVER":
                case 5:
                    message.state = 5;
                    break;
                case "RACE_OVER":
                case 6:
                    message.state = 6;
                    break;
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
                    object.state = options.enums === String ? "UNKNOWN_STATE" : 0;
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
                if (message.state != null && message.hasOwnProperty("state"))
                    object.state = options.enums === String ? $root.com.antigravity.RaceState[message.state] === undefined ? message.state : $root.com.antigravity.RaceState[message.state] : message.state;
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

        antigravity.HeatScoring = (function() {

            /**
             * Properties of a HeatScoring.
             * @memberof com.antigravity
             * @interface IHeatScoring
             * @property {com.antigravity.HeatScoring.FinishMethod|null} [finishMethod] HeatScoring finishMethod
             * @property {number|Long|null} [finishValue] HeatScoring finishValue
             * @property {com.antigravity.HeatScoring.HeatRanking|null} [heatRanking] HeatScoring heatRanking
             * @property {com.antigravity.HeatScoring.HeatRankingTiebreaker|null} [heatRankingTiebreaker] HeatScoring heatRankingTiebreaker
             * @property {com.antigravity.HeatScoring.AllowFinish|null} [allowFinish] HeatScoring allowFinish
             */

            /**
             * Constructs a new HeatScoring.
             * @memberof com.antigravity
             * @classdesc Represents a HeatScoring.
             * @implements IHeatScoring
             * @constructor
             * @param {com.antigravity.IHeatScoring=} [properties] Properties to set
             */
            function HeatScoring(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HeatScoring finishMethod.
             * @member {com.antigravity.HeatScoring.FinishMethod} finishMethod
             * @memberof com.antigravity.HeatScoring
             * @instance
             */
            HeatScoring.prototype.finishMethod = 0;

            /**
             * HeatScoring finishValue.
             * @member {number|Long} finishValue
             * @memberof com.antigravity.HeatScoring
             * @instance
             */
            HeatScoring.prototype.finishValue = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * HeatScoring heatRanking.
             * @member {com.antigravity.HeatScoring.HeatRanking} heatRanking
             * @memberof com.antigravity.HeatScoring
             * @instance
             */
            HeatScoring.prototype.heatRanking = 0;

            /**
             * HeatScoring heatRankingTiebreaker.
             * @member {com.antigravity.HeatScoring.HeatRankingTiebreaker} heatRankingTiebreaker
             * @memberof com.antigravity.HeatScoring
             * @instance
             */
            HeatScoring.prototype.heatRankingTiebreaker = 0;

            /**
             * HeatScoring allowFinish.
             * @member {com.antigravity.HeatScoring.AllowFinish} allowFinish
             * @memberof com.antigravity.HeatScoring
             * @instance
             */
            HeatScoring.prototype.allowFinish = 0;

            /**
             * Creates a new HeatScoring instance using the specified properties.
             * @function create
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {com.antigravity.IHeatScoring=} [properties] Properties to set
             * @returns {com.antigravity.HeatScoring} HeatScoring instance
             */
            HeatScoring.create = function create(properties) {
                return new HeatScoring(properties);
            };

            /**
             * Encodes the specified HeatScoring message. Does not implicitly {@link com.antigravity.HeatScoring.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {com.antigravity.IHeatScoring} message HeatScoring message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HeatScoring.encode = function encode(message, writer) {
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
                if (message.allowFinish != null && Object.hasOwnProperty.call(message, "allowFinish"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.allowFinish);
                return writer;
            };

            /**
             * Encodes the specified HeatScoring message, length delimited. Does not implicitly {@link com.antigravity.HeatScoring.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {com.antigravity.IHeatScoring} message HeatScoring message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HeatScoring.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HeatScoring message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.HeatScoring} HeatScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HeatScoring.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.HeatScoring();
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
                    case 5: {
                            message.allowFinish = reader.int32();
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
             * Decodes a HeatScoring message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.HeatScoring} HeatScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HeatScoring.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HeatScoring message.
             * @function verify
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HeatScoring.verify = function verify(message) {
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
                if (message.allowFinish != null && message.hasOwnProperty("allowFinish"))
                    switch (message.allowFinish) {
                    default:
                        return "allowFinish: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a HeatScoring message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.HeatScoring} HeatScoring
             */
            HeatScoring.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.HeatScoring)
                    return object;
                let message = new $root.com.antigravity.HeatScoring();
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
                case "HR_LAP_COUNT":
                case 0:
                    message.heatRanking = 0;
                    break;
                case "HR_FASTEST_LAP":
                case 1:
                    message.heatRanking = 1;
                    break;
                case "HR_TOTAL_TIME":
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
                case "HRT_FASTEST_LAP_TIME":
                case 0:
                    message.heatRankingTiebreaker = 0;
                    break;
                case "HRT_MEDIAN_LAP_TIME":
                case 1:
                    message.heatRankingTiebreaker = 1;
                    break;
                case "HRT_AVERAGE_LAP_TIME":
                case 2:
                    message.heatRankingTiebreaker = 2;
                    break;
                }
                switch (object.allowFinish) {
                default:
                    if (typeof object.allowFinish === "number") {
                        message.allowFinish = object.allowFinish;
                        break;
                    }
                    break;
                case "AF_NONE":
                case 0:
                    message.allowFinish = 0;
                    break;
                case "AF_ALLOW":
                case 1:
                    message.allowFinish = 1;
                    break;
                case "AF_SINGLE_LAP":
                case 2:
                    message.allowFinish = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a HeatScoring message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {com.antigravity.HeatScoring} message HeatScoring
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HeatScoring.toObject = function toObject(message, options) {
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
                    object.heatRanking = options.enums === String ? "HR_LAP_COUNT" : 0;
                    object.heatRankingTiebreaker = options.enums === String ? "HRT_FASTEST_LAP_TIME" : 0;
                    object.allowFinish = options.enums === String ? "AF_NONE" : 0;
                }
                if (message.finishMethod != null && message.hasOwnProperty("finishMethod"))
                    object.finishMethod = options.enums === String ? $root.com.antigravity.HeatScoring.FinishMethod[message.finishMethod] === undefined ? message.finishMethod : $root.com.antigravity.HeatScoring.FinishMethod[message.finishMethod] : message.finishMethod;
                if (message.finishValue != null && message.hasOwnProperty("finishValue"))
                    if (typeof message.finishValue === "number")
                        object.finishValue = options.longs === String ? String(message.finishValue) : message.finishValue;
                    else
                        object.finishValue = options.longs === String ? $util.Long.prototype.toString.call(message.finishValue) : options.longs === Number ? new $util.LongBits(message.finishValue.low >>> 0, message.finishValue.high >>> 0).toNumber() : message.finishValue;
                if (message.heatRanking != null && message.hasOwnProperty("heatRanking"))
                    object.heatRanking = options.enums === String ? $root.com.antigravity.HeatScoring.HeatRanking[message.heatRanking] === undefined ? message.heatRanking : $root.com.antigravity.HeatScoring.HeatRanking[message.heatRanking] : message.heatRanking;
                if (message.heatRankingTiebreaker != null && message.hasOwnProperty("heatRankingTiebreaker"))
                    object.heatRankingTiebreaker = options.enums === String ? $root.com.antigravity.HeatScoring.HeatRankingTiebreaker[message.heatRankingTiebreaker] === undefined ? message.heatRankingTiebreaker : $root.com.antigravity.HeatScoring.HeatRankingTiebreaker[message.heatRankingTiebreaker] : message.heatRankingTiebreaker;
                if (message.allowFinish != null && message.hasOwnProperty("allowFinish"))
                    object.allowFinish = options.enums === String ? $root.com.antigravity.HeatScoring.AllowFinish[message.allowFinish] === undefined ? message.allowFinish : $root.com.antigravity.HeatScoring.AllowFinish[message.allowFinish] : message.allowFinish;
                return object;
            };

            /**
             * Converts this HeatScoring to JSON.
             * @function toJSON
             * @memberof com.antigravity.HeatScoring
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HeatScoring.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for HeatScoring
             * @function getTypeUrl
             * @memberof com.antigravity.HeatScoring
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            HeatScoring.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.HeatScoring";
            };

            /**
             * FinishMethod enum.
             * @name com.antigravity.HeatScoring.FinishMethod
             * @enum {number}
             * @property {number} Lap=0 Lap value
             * @property {number} Timed=1 Timed value
             */
            HeatScoring.FinishMethod = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "Lap"] = 0;
                values[valuesById[1] = "Timed"] = 1;
                return values;
            })();

            /**
             * HeatRanking enum.
             * @name com.antigravity.HeatScoring.HeatRanking
             * @enum {number}
             * @property {number} HR_LAP_COUNT=0 HR_LAP_COUNT value
             * @property {number} HR_FASTEST_LAP=1 HR_FASTEST_LAP value
             * @property {number} HR_TOTAL_TIME=2 HR_TOTAL_TIME value
             */
            HeatScoring.HeatRanking = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "HR_LAP_COUNT"] = 0;
                values[valuesById[1] = "HR_FASTEST_LAP"] = 1;
                values[valuesById[2] = "HR_TOTAL_TIME"] = 2;
                return values;
            })();

            /**
             * HeatRankingTiebreaker enum.
             * @name com.antigravity.HeatScoring.HeatRankingTiebreaker
             * @enum {number}
             * @property {number} HRT_FASTEST_LAP_TIME=0 HRT_FASTEST_LAP_TIME value
             * @property {number} HRT_MEDIAN_LAP_TIME=1 HRT_MEDIAN_LAP_TIME value
             * @property {number} HRT_AVERAGE_LAP_TIME=2 HRT_AVERAGE_LAP_TIME value
             */
            HeatScoring.HeatRankingTiebreaker = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "HRT_FASTEST_LAP_TIME"] = 0;
                values[valuesById[1] = "HRT_MEDIAN_LAP_TIME"] = 1;
                values[valuesById[2] = "HRT_AVERAGE_LAP_TIME"] = 2;
                return values;
            })();

            /**
             * AllowFinish enum.
             * @name com.antigravity.HeatScoring.AllowFinish
             * @enum {number}
             * @property {number} AF_NONE=0 AF_NONE value
             * @property {number} AF_ALLOW=1 AF_ALLOW value
             * @property {number} AF_SINGLE_LAP=2 AF_SINGLE_LAP value
             */
            HeatScoring.AllowFinish = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "AF_NONE"] = 0;
                values[valuesById[1] = "AF_ALLOW"] = 1;
                values[valuesById[2] = "AF_SINGLE_LAP"] = 2;
                return values;
            })();

            return HeatScoring;
        })();

        antigravity.OverallScoring = (function() {

            /**
             * Properties of an OverallScoring.
             * @memberof com.antigravity
             * @interface IOverallScoring
             * @property {number|null} [droppedHeats] OverallScoring droppedHeats
             * @property {com.antigravity.OverallScoring.OverallRanking|null} [rankingMethod] OverallScoring rankingMethod
             * @property {com.antigravity.OverallScoring.OverallRankingTiebreaker|null} [tiebreaker] OverallScoring tiebreaker
             */

            /**
             * Constructs a new OverallScoring.
             * @memberof com.antigravity
             * @classdesc Represents an OverallScoring.
             * @implements IOverallScoring
             * @constructor
             * @param {com.antigravity.IOverallScoring=} [properties] Properties to set
             */
            function OverallScoring(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * OverallScoring droppedHeats.
             * @member {number} droppedHeats
             * @memberof com.antigravity.OverallScoring
             * @instance
             */
            OverallScoring.prototype.droppedHeats = 0;

            /**
             * OverallScoring rankingMethod.
             * @member {com.antigravity.OverallScoring.OverallRanking} rankingMethod
             * @memberof com.antigravity.OverallScoring
             * @instance
             */
            OverallScoring.prototype.rankingMethod = 0;

            /**
             * OverallScoring tiebreaker.
             * @member {com.antigravity.OverallScoring.OverallRankingTiebreaker} tiebreaker
             * @memberof com.antigravity.OverallScoring
             * @instance
             */
            OverallScoring.prototype.tiebreaker = 0;

            /**
             * Creates a new OverallScoring instance using the specified properties.
             * @function create
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {com.antigravity.IOverallScoring=} [properties] Properties to set
             * @returns {com.antigravity.OverallScoring} OverallScoring instance
             */
            OverallScoring.create = function create(properties) {
                return new OverallScoring(properties);
            };

            /**
             * Encodes the specified OverallScoring message. Does not implicitly {@link com.antigravity.OverallScoring.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {com.antigravity.IOverallScoring} message OverallScoring message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OverallScoring.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.droppedHeats != null && Object.hasOwnProperty.call(message, "droppedHeats"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.droppedHeats);
                if (message.rankingMethod != null && Object.hasOwnProperty.call(message, "rankingMethod"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.rankingMethod);
                if (message.tiebreaker != null && Object.hasOwnProperty.call(message, "tiebreaker"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.tiebreaker);
                return writer;
            };

            /**
             * Encodes the specified OverallScoring message, length delimited. Does not implicitly {@link com.antigravity.OverallScoring.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {com.antigravity.IOverallScoring} message OverallScoring message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OverallScoring.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an OverallScoring message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.OverallScoring} OverallScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OverallScoring.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.OverallScoring();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.droppedHeats = reader.int32();
                            break;
                        }
                    case 2: {
                            message.rankingMethod = reader.int32();
                            break;
                        }
                    case 3: {
                            message.tiebreaker = reader.int32();
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
             * Decodes an OverallScoring message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.OverallScoring} OverallScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OverallScoring.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an OverallScoring message.
             * @function verify
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            OverallScoring.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.droppedHeats != null && message.hasOwnProperty("droppedHeats"))
                    if (!$util.isInteger(message.droppedHeats))
                        return "droppedHeats: integer expected";
                if (message.rankingMethod != null && message.hasOwnProperty("rankingMethod"))
                    switch (message.rankingMethod) {
                    default:
                        return "rankingMethod: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                if (message.tiebreaker != null && message.hasOwnProperty("tiebreaker"))
                    switch (message.tiebreaker) {
                    default:
                        return "tiebreaker: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                return null;
            };

            /**
             * Creates an OverallScoring message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.OverallScoring} OverallScoring
             */
            OverallScoring.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.OverallScoring)
                    return object;
                let message = new $root.com.antigravity.OverallScoring();
                if (object.droppedHeats != null)
                    message.droppedHeats = object.droppedHeats | 0;
                switch (object.rankingMethod) {
                default:
                    if (typeof object.rankingMethod === "number") {
                        message.rankingMethod = object.rankingMethod;
                        break;
                    }
                    break;
                case "OR_LAP_COUNT":
                case 0:
                    message.rankingMethod = 0;
                    break;
                case "OR_FASTEST_LAP":
                case 1:
                    message.rankingMethod = 1;
                    break;
                case "OR_TOTAL_TIME":
                case 2:
                    message.rankingMethod = 2;
                    break;
                case "OR_AVERAGE_LAP":
                case 3:
                    message.rankingMethod = 3;
                    break;
                }
                switch (object.tiebreaker) {
                default:
                    if (typeof object.tiebreaker === "number") {
                        message.tiebreaker = object.tiebreaker;
                        break;
                    }
                    break;
                case "ORT_FASTEST_LAP_TIME":
                case 0:
                    message.tiebreaker = 0;
                    break;
                case "ORT_MEDIAN_LAP_TIME":
                case 1:
                    message.tiebreaker = 1;
                    break;
                case "ORT_AVERAGE_LAP_TIME":
                case 2:
                    message.tiebreaker = 2;
                    break;
                case "ORT_TOTAL_TIME":
                case 3:
                    message.tiebreaker = 3;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from an OverallScoring message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {com.antigravity.OverallScoring} message OverallScoring
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OverallScoring.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.droppedHeats = 0;
                    object.rankingMethod = options.enums === String ? "OR_LAP_COUNT" : 0;
                    object.tiebreaker = options.enums === String ? "ORT_FASTEST_LAP_TIME" : 0;
                }
                if (message.droppedHeats != null && message.hasOwnProperty("droppedHeats"))
                    object.droppedHeats = message.droppedHeats;
                if (message.rankingMethod != null && message.hasOwnProperty("rankingMethod"))
                    object.rankingMethod = options.enums === String ? $root.com.antigravity.OverallScoring.OverallRanking[message.rankingMethod] === undefined ? message.rankingMethod : $root.com.antigravity.OverallScoring.OverallRanking[message.rankingMethod] : message.rankingMethod;
                if (message.tiebreaker != null && message.hasOwnProperty("tiebreaker"))
                    object.tiebreaker = options.enums === String ? $root.com.antigravity.OverallScoring.OverallRankingTiebreaker[message.tiebreaker] === undefined ? message.tiebreaker : $root.com.antigravity.OverallScoring.OverallRankingTiebreaker[message.tiebreaker] : message.tiebreaker;
                return object;
            };

            /**
             * Converts this OverallScoring to JSON.
             * @function toJSON
             * @memberof com.antigravity.OverallScoring
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OverallScoring.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for OverallScoring
             * @function getTypeUrl
             * @memberof com.antigravity.OverallScoring
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            OverallScoring.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.OverallScoring";
            };

            /**
             * OverallRanking enum.
             * @name com.antigravity.OverallScoring.OverallRanking
             * @enum {number}
             * @property {number} OR_LAP_COUNT=0 OR_LAP_COUNT value
             * @property {number} OR_FASTEST_LAP=1 OR_FASTEST_LAP value
             * @property {number} OR_TOTAL_TIME=2 OR_TOTAL_TIME value
             * @property {number} OR_AVERAGE_LAP=3 OR_AVERAGE_LAP value
             */
            OverallScoring.OverallRanking = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "OR_LAP_COUNT"] = 0;
                values[valuesById[1] = "OR_FASTEST_LAP"] = 1;
                values[valuesById[2] = "OR_TOTAL_TIME"] = 2;
                values[valuesById[3] = "OR_AVERAGE_LAP"] = 3;
                return values;
            })();

            /**
             * OverallRankingTiebreaker enum.
             * @name com.antigravity.OverallScoring.OverallRankingTiebreaker
             * @enum {number}
             * @property {number} ORT_FASTEST_LAP_TIME=0 ORT_FASTEST_LAP_TIME value
             * @property {number} ORT_MEDIAN_LAP_TIME=1 ORT_MEDIAN_LAP_TIME value
             * @property {number} ORT_AVERAGE_LAP_TIME=2 ORT_AVERAGE_LAP_TIME value
             * @property {number} ORT_TOTAL_TIME=3 ORT_TOTAL_TIME value
             */
            OverallScoring.OverallRankingTiebreaker = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "ORT_FASTEST_LAP_TIME"] = 0;
                values[valuesById[1] = "ORT_MEDIAN_LAP_TIME"] = 1;
                values[valuesById[2] = "ORT_AVERAGE_LAP_TIME"] = 2;
                values[valuesById[3] = "ORT_TOTAL_TIME"] = 3;
                return values;
            })();

            return OverallScoring;
        })();

        antigravity.RaceModel = (function() {

            /**
             * Properties of a RaceModel.
             * @memberof com.antigravity
             * @interface IRaceModel
             * @property {com.antigravity.IModel|null} [model] RaceModel model
             * @property {string|null} [name] RaceModel name
             * @property {com.antigravity.ITrackModel|null} [track] RaceModel track
             * @property {com.antigravity.IHeatScoring|null} [heatScoring] RaceModel heatScoring
             * @property {com.antigravity.IOverallScoring|null} [overallScoring] RaceModel overallScoring
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
             * RaceModel heatScoring.
             * @member {com.antigravity.IHeatScoring|null|undefined} heatScoring
             * @memberof com.antigravity.RaceModel
             * @instance
             */
            RaceModel.prototype.heatScoring = null;

            /**
             * RaceModel overallScoring.
             * @member {com.antigravity.IOverallScoring|null|undefined} overallScoring
             * @memberof com.antigravity.RaceModel
             * @instance
             */
            RaceModel.prototype.overallScoring = null;

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
                if (message.heatScoring != null && Object.hasOwnProperty.call(message, "heatScoring"))
                    $root.com.antigravity.HeatScoring.encode(message.heatScoring, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.overallScoring != null && Object.hasOwnProperty.call(message, "overallScoring"))
                    $root.com.antigravity.OverallScoring.encode(message.overallScoring, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
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
                            message.heatScoring = $root.com.antigravity.HeatScoring.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.overallScoring = $root.com.antigravity.OverallScoring.decode(reader, reader.uint32());
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
                if (message.heatScoring != null && message.hasOwnProperty("heatScoring")) {
                    let error = $root.com.antigravity.HeatScoring.verify(message.heatScoring);
                    if (error)
                        return "heatScoring." + error;
                }
                if (message.overallScoring != null && message.hasOwnProperty("overallScoring")) {
                    let error = $root.com.antigravity.OverallScoring.verify(message.overallScoring);
                    if (error)
                        return "overallScoring." + error;
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
                if (object.heatScoring != null) {
                    if (typeof object.heatScoring !== "object")
                        throw TypeError(".com.antigravity.RaceModel.heatScoring: object expected");
                    message.heatScoring = $root.com.antigravity.HeatScoring.fromObject(object.heatScoring);
                }
                if (object.overallScoring != null) {
                    if (typeof object.overallScoring !== "object")
                        throw TypeError(".com.antigravity.RaceModel.overallScoring: object expected");
                    message.overallScoring = $root.com.antigravity.OverallScoring.fromObject(object.overallScoring);
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
                    object.heatScoring = null;
                    object.overallScoring = null;
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.track != null && message.hasOwnProperty("track"))
                    object.track = $root.com.antigravity.TrackModel.toObject(message.track, options);
                if (message.heatScoring != null && message.hasOwnProperty("heatScoring"))
                    object.heatScoring = $root.com.antigravity.HeatScoring.toObject(message.heatScoring, options);
                if (message.overallScoring != null && message.hasOwnProperty("overallScoring"))
                    object.overallScoring = $root.com.antigravity.OverallScoring.toObject(message.overallScoring, options);
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
             * @property {string|null} [driverId] DriverHeatData driverId
             * @property {com.antigravity.IDriverModel|null} [actualDriver] DriverHeatData actualDriver
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
             * DriverHeatData driverId.
             * @member {string} driverId
             * @memberof com.antigravity.DriverHeatData
             * @instance
             */
            DriverHeatData.prototype.driverId = "";

            /**
             * DriverHeatData actualDriver.
             * @member {com.antigravity.IDriverModel|null|undefined} actualDriver
             * @memberof com.antigravity.DriverHeatData
             * @instance
             */
            DriverHeatData.prototype.actualDriver = null;

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
                if (message.driverId != null && Object.hasOwnProperty.call(message, "driverId"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.driverId);
                if (message.actualDriver != null && Object.hasOwnProperty.call(message, "actualDriver"))
                    $root.com.antigravity.DriverModel.encode(message.actualDriver, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
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
                    case 3: {
                            message.driverId = reader.string();
                            break;
                        }
                    case 4: {
                            message.actualDriver = $root.com.antigravity.DriverModel.decode(reader, reader.uint32());
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
                if (message.driverId != null && message.hasOwnProperty("driverId"))
                    if (!$util.isString(message.driverId))
                        return "driverId: string expected";
                if (message.actualDriver != null && message.hasOwnProperty("actualDriver")) {
                    let error = $root.com.antigravity.DriverModel.verify(message.actualDriver);
                    if (error)
                        return "actualDriver." + error;
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
                if (object.objectId != null)
                    message.objectId = String(object.objectId);
                if (object.driverId != null)
                    message.driverId = String(object.driverId);
                if (object.actualDriver != null) {
                    if (typeof object.actualDriver !== "object")
                        throw TypeError(".com.antigravity.DriverHeatData.actualDriver: object expected");
                    message.actualDriver = $root.com.antigravity.DriverModel.fromObject(object.actualDriver);
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
                if (options.defaults) {
                    object.driver = null;
                    object.objectId = "";
                    object.driverId = "";
                    object.actualDriver = null;
                }
                if (message.driver != null && message.hasOwnProperty("driver"))
                    object.driver = $root.com.antigravity.RaceParticipant.toObject(message.driver, options);
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
                if (message.driverId != null && message.hasOwnProperty("driverId"))
                    object.driverId = message.driverId;
                if (message.actualDriver != null && message.hasOwnProperty("actualDriver"))
                    object.actualDriver = $root.com.antigravity.DriverModel.toObject(message.actualDriver, options);
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
             * @property {com.antigravity.ITeamModel|null} [team] RaceParticipant team
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
             * RaceParticipant team.
             * @member {com.antigravity.ITeamModel|null|undefined} team
             * @memberof com.antigravity.RaceParticipant
             * @instance
             */
            RaceParticipant.prototype.team = null;

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
                if (message.team != null && Object.hasOwnProperty.call(message, "team"))
                    $root.com.antigravity.TeamModel.encode(message.team, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
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
                    case 11: {
                            message.team = $root.com.antigravity.TeamModel.decode(reader, reader.uint32());
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
                if (message.team != null && message.hasOwnProperty("team")) {
                    let error = $root.com.antigravity.TeamModel.verify(message.team);
                    if (error)
                        return "team." + error;
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
                if (object.team != null) {
                    if (typeof object.team !== "object")
                        throw TypeError(".com.antigravity.RaceParticipant.team: object expected");
                    message.team = $root.com.antigravity.TeamModel.fromObject(object.team);
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
                    object.team = null;
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
                if (message.team != null && message.hasOwnProperty("team"))
                    object.team = $root.com.antigravity.TeamModel.toObject(message.team, options);
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

        antigravity.TeamModel = (function() {

            /**
             * Properties of a TeamModel.
             * @memberof com.antigravity
             * @interface ITeamModel
             * @property {com.antigravity.IModel|null} [model] TeamModel model
             * @property {string|null} [name] TeamModel name
             * @property {string|null} [avatarUrl] TeamModel avatarUrl
             * @property {Array.<string>|null} [driverIds] TeamModel driverIds
             */

            /**
             * Constructs a new TeamModel.
             * @memberof com.antigravity
             * @classdesc Represents a TeamModel.
             * @implements ITeamModel
             * @constructor
             * @param {com.antigravity.ITeamModel=} [properties] Properties to set
             */
            function TeamModel(properties) {
                this.driverIds = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TeamModel model.
             * @member {com.antigravity.IModel|null|undefined} model
             * @memberof com.antigravity.TeamModel
             * @instance
             */
            TeamModel.prototype.model = null;

            /**
             * TeamModel name.
             * @member {string} name
             * @memberof com.antigravity.TeamModel
             * @instance
             */
            TeamModel.prototype.name = "";

            /**
             * TeamModel avatarUrl.
             * @member {string} avatarUrl
             * @memberof com.antigravity.TeamModel
             * @instance
             */
            TeamModel.prototype.avatarUrl = "";

            /**
             * TeamModel driverIds.
             * @member {Array.<string>} driverIds
             * @memberof com.antigravity.TeamModel
             * @instance
             */
            TeamModel.prototype.driverIds = $util.emptyArray;

            /**
             * Creates a new TeamModel instance using the specified properties.
             * @function create
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {com.antigravity.ITeamModel=} [properties] Properties to set
             * @returns {com.antigravity.TeamModel} TeamModel instance
             */
            TeamModel.create = function create(properties) {
                return new TeamModel(properties);
            };

            /**
             * Encodes the specified TeamModel message. Does not implicitly {@link com.antigravity.TeamModel.verify|verify} messages.
             * @function encode
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {com.antigravity.ITeamModel} message TeamModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TeamModel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                    $root.com.antigravity.Model.encode(message.model, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                if (message.avatarUrl != null && Object.hasOwnProperty.call(message, "avatarUrl"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.avatarUrl);
                if (message.driverIds != null && message.driverIds.length)
                    for (let i = 0; i < message.driverIds.length; ++i)
                        writer.uint32(/* id 4, wireType 2 =*/34).string(message.driverIds[i]);
                return writer;
            };

            /**
             * Encodes the specified TeamModel message, length delimited. Does not implicitly {@link com.antigravity.TeamModel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {com.antigravity.ITeamModel} message TeamModel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TeamModel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TeamModel message from the specified reader or buffer.
             * @function decode
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {com.antigravity.TeamModel} TeamModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TeamModel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.com.antigravity.TeamModel();
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
                            message.avatarUrl = reader.string();
                            break;
                        }
                    case 4: {
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
             * Decodes a TeamModel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {com.antigravity.TeamModel} TeamModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TeamModel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TeamModel message.
             * @function verify
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TeamModel.verify = function verify(message) {
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
                if (message.avatarUrl != null && message.hasOwnProperty("avatarUrl"))
                    if (!$util.isString(message.avatarUrl))
                        return "avatarUrl: string expected";
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
             * Creates a TeamModel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {com.antigravity.TeamModel} TeamModel
             */
            TeamModel.fromObject = function fromObject(object) {
                if (object instanceof $root.com.antigravity.TeamModel)
                    return object;
                let message = new $root.com.antigravity.TeamModel();
                if (object.model != null) {
                    if (typeof object.model !== "object")
                        throw TypeError(".com.antigravity.TeamModel.model: object expected");
                    message.model = $root.com.antigravity.Model.fromObject(object.model);
                }
                if (object.name != null)
                    message.name = String(object.name);
                if (object.avatarUrl != null)
                    message.avatarUrl = String(object.avatarUrl);
                if (object.driverIds) {
                    if (!Array.isArray(object.driverIds))
                        throw TypeError(".com.antigravity.TeamModel.driverIds: array expected");
                    message.driverIds = [];
                    for (let i = 0; i < object.driverIds.length; ++i)
                        message.driverIds[i] = String(object.driverIds[i]);
                }
                return message;
            };

            /**
             * Creates a plain object from a TeamModel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {com.antigravity.TeamModel} message TeamModel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TeamModel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.driverIds = [];
                if (options.defaults) {
                    object.model = null;
                    object.name = "";
                    object.avatarUrl = "";
                }
                if (message.model != null && message.hasOwnProperty("model"))
                    object.model = $root.com.antigravity.Model.toObject(message.model, options);
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.avatarUrl != null && message.hasOwnProperty("avatarUrl"))
                    object.avatarUrl = message.avatarUrl;
                if (message.driverIds && message.driverIds.length) {
                    object.driverIds = [];
                    for (let j = 0; j < message.driverIds.length; ++j)
                        object.driverIds[j] = message.driverIds[j];
                }
                return object;
            };

            /**
             * Converts this TeamModel to JSON.
             * @function toJSON
             * @memberof com.antigravity.TeamModel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TeamModel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for TeamModel
             * @function getTypeUrl
             * @memberof com.antigravity.TeamModel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            TeamModel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/com.antigravity.TeamModel";
            };

            return TeamModel;
        })();

        antigravity.ReactionTime = (function() {

            /**
             * Properties of a ReactionTime.
             * @memberof com.antigravity
             * @interface IReactionTime
             * @property {string|null} [objectId] ReactionTime objectId
             * @property {number|null} [reactionTime] ReactionTime reactionTime
             * @property {number|null} [interfaceId] ReactionTime interfaceId
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
             * ReactionTime interfaceId.
             * @member {number} interfaceId
             * @memberof com.antigravity.ReactionTime
             * @instance
             */
            ReactionTime.prototype.interfaceId = 0;

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
                if (message.interfaceId != null && Object.hasOwnProperty.call(message, "interfaceId"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.interfaceId);
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
                    case 3: {
                            message.interfaceId = reader.int32();
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
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    if (!$util.isInteger(message.interfaceId))
                        return "interfaceId: integer expected";
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
                if (object.interfaceId != null)
                    message.interfaceId = object.interfaceId | 0;
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
                    object.interfaceId = 0;
                }
                if (message.objectId != null && message.hasOwnProperty("objectId"))
                    object.objectId = message.objectId;
                if (message.reactionTime != null && message.hasOwnProperty("reactionTime"))
                    object.reactionTime = options.json && !isFinite(message.reactionTime) ? String(message.reactionTime) : message.reactionTime;
                if (message.interfaceId != null && message.hasOwnProperty("interfaceId"))
                    object.interfaceId = message.interfaceId;
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
