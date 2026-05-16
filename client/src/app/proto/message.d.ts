import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace com. */
export namespace com {

    /** Namespace antigravity. */
    namespace antigravity {

        /** PinBehavior enum. */
        enum PinBehavior {

            /** BEHAVIOR_UNUSED value */
            BEHAVIOR_UNUSED = 0,

            /** BEHAVIOR_RESERVED value */
            BEHAVIOR_RESERVED = 1,

            /** BEHAVIOR_CALL_BUTTON value */
            BEHAVIOR_CALL_BUTTON = 2,

            /** BEHAVIOR_RELAY value */
            BEHAVIOR_RELAY = 3,

            /** BEHAVIOR_LED_RGB_STRING value */
            BEHAVIOR_LED_RGB_STRING = 4,

            /** BEHAVIOR_LAP_BASE value */
            BEHAVIOR_LAP_BASE = 1000,

            /** BEHAVIOR_SEGMENT_BASE value */
            BEHAVIOR_SEGMENT_BASE = 2000,

            /** BEHAVIOR_CALL_BUTTON_BASE value */
            BEHAVIOR_CALL_BUTTON_BASE = 3000,

            /** BEHAVIOR_RELAY_BASE value */
            BEHAVIOR_RELAY_BASE = 4000,

            /** BEHAVIOR_PIT_IN_BASE value */
            BEHAVIOR_PIT_IN_BASE = 5000,

            /** BEHAVIOR_PIT_OUT_BASE value */
            BEHAVIOR_PIT_OUT_BASE = 6000,

            /** BEHAVIOR_VOLTAGE_LEVEL_BASE value */
            BEHAVIOR_VOLTAGE_LEVEL_BASE = 7000,

            /** BEHAVIOR_PIT_IN_OUT_BASE value */
            BEHAVIOR_PIT_IN_OUT_BASE = 8000
        }

        /** LapPinPitBehavior enum. */
        enum LapPinPitBehavior {

            /** LAP_PIN_PIT_NONE value */
            LAP_PIN_PIT_NONE = 0,

            /** LAP_PIN_PIT_IN value */
            LAP_PIN_PIT_IN = 1,

            /** LAP_PIN_PIT_OUT value */
            LAP_PIN_PIT_OUT = 2,

            /** LAP_PIN_PIT_IN_OUT value */
            LAP_PIN_PIT_IN_OUT = 3
        }

        /** LedType enum. */
        enum LedType {

            /** LED_TYPE_NEOPIXEL value */
            LED_TYPE_NEOPIXEL = 0,

            /** LED_TYPE_WS2811 value */
            LED_TYPE_WS2811 = 1,

            /** LED_TYPE_WS2812 value */
            LED_TYPE_WS2812 = 2,

            /** LED_TYPE_WS2812B value */
            LED_TYPE_WS2812B = 3,

            /** LED_TYPE_OTHER value */
            LED_TYPE_OTHER = 12
        }

        /** ColorOrder enum. */
        enum ColorOrder {

            /** COLOR_ORDER_RGB value */
            COLOR_ORDER_RGB = 0,

            /** COLOR_ORDER_GRB value */
            COLOR_ORDER_GRB = 1,

            /** COLOR_ORDER_BGR value */
            COLOR_ORDER_BGR = 2,

            /** COLOR_ORDER_RBG value */
            COLOR_ORDER_RBG = 3,

            /** COLOR_ORDER_GBR value */
            COLOR_ORDER_GBR = 4,

            /** COLOR_ORDER_BRG value */
            COLOR_ORDER_BRG = 5
        }

        /** PinId enum. */
        enum PinId {

            /** PIN_ID_UNKNOWN value */
            PIN_ID_UNKNOWN = 0,

            /** PIN_ID_DIGITAL_BASE value */
            PIN_ID_DIGITAL_BASE = 0,

            /** PIN_ID_ANALOG_BASE value */
            PIN_ID_ANALOG_BASE = 1000
        }

        /** RgbLedBehavior enum. */
        enum RgbLedBehavior {

            /** RGB_LED_BEHAVIOR_UNUSED value */
            RGB_LED_BEHAVIOR_UNUSED = 0,

            /** RGB_LED_BEHAVIOR_HEAT_LEADER value */
            RGB_LED_BEHAVIOR_HEAT_LEADER = 1,

            /** RGB_LED_BEHAVIOR_HEAT_PROGRESS value */
            RGB_LED_BEHAVIOR_HEAT_PROGRESS = 2,

            /** RGB_LED_BEHAVIOR_RACE_STATE_BASE value */
            RGB_LED_BEHAVIOR_RACE_STATE_BASE = 1000,

            /** RGB_LED_BEHAVIOR_HEAT_LEADER_BASE value */
            RGB_LED_BEHAVIOR_HEAT_LEADER_BASE = 2000,

            /** RGB_LED_BEHAVIOR_COUNTDOWN_BASE value */
            RGB_LED_BEHAVIOR_COUNTDOWN_BASE = 3000,

            /** RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE value */
            RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE = 4000,

            /** RGB_LED_BEHAVIOR_REFUELING_BASE value */
            RGB_LED_BEHAVIOR_REFUELING_BASE = 5000,

            /** RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE value */
            RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE = 6000,

            /** RGB_LED_BEHAVIOR_LAP_SENSOR_BASE value */
            RGB_LED_BEHAVIOR_LAP_SENSOR_BASE = 7000
        }

        /**
         * Properties of an ArduinoConfig.
         * @deprecated Use com.antigravity.ArduinoConfig.$Properties instead.
         */
        interface IArduinoConfig extends com.antigravity.ArduinoConfig.$Properties {
        }

        /** Represents an ArduinoConfig. */
        class ArduinoConfig {

            /**
             * Constructs a new ArduinoConfig.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ArduinoConfig.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** ArduinoConfig name. */
            name: string;

            /** ArduinoConfig commPort. */
            commPort: string;

            /** ArduinoConfig baudRate. */
            baudRate: number;

            /** ArduinoConfig debounceUs. */
            debounceUs: number;

            /** ArduinoConfig normallyClosedLaneSensors. */
            normallyClosedLaneSensors: boolean;

            /** ArduinoConfig normallyClosedRelays. */
            normallyClosedRelays: boolean;

            /** ArduinoConfig globalInvertLights. */
            globalInvertLights: number;

            /** ArduinoConfig usePitsAsLaps. */
            usePitsAsLaps: boolean;

            /** ArduinoConfig useLapsForSegments. */
            useLapsForSegments: boolean;

            /** ArduinoConfig hardwareType. */
            hardwareType: number;

            /** ArduinoConfig digitalIds. */
            digitalIds: number[];

            /** ArduinoConfig analogIds. */
            analogIds: number[];

            /** ArduinoConfig lapPinPitBehavior. */
            lapPinPitBehavior: com.antigravity.LapPinPitBehavior;

            /** ArduinoConfig voltageConfigs. */
            voltageConfigs: com.antigravity.VoltageConfig.$Properties[];

            /** ArduinoConfig ledStrings. */
            ledStrings: com.antigravity.LedString.$Properties[];

            /**
             * Creates a new ArduinoConfig instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ArduinoConfig instance
             */
            static create(properties: com.antigravity.ArduinoConfig.$Shape): com.antigravity.ArduinoConfig & com.antigravity.ArduinoConfig.$Shape;
            static create(properties?: com.antigravity.ArduinoConfig.$Properties): com.antigravity.ArduinoConfig;

            /**
             * Encodes the specified ArduinoConfig message. Does not implicitly {@link com.antigravity.ArduinoConfig.verify|verify} messages.
             * @param message ArduinoConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.ArduinoConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ArduinoConfig message, length delimited. Does not implicitly {@link com.antigravity.ArduinoConfig.verify|verify} messages.
             * @param message ArduinoConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.ArduinoConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ArduinoConfig message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.ArduinoConfig & com.antigravity.ArduinoConfig.$Shape} ArduinoConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ArduinoConfig & com.antigravity.ArduinoConfig.$Shape;

            /**
             * Decodes an ArduinoConfig message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.ArduinoConfig & com.antigravity.ArduinoConfig.$Shape} ArduinoConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ArduinoConfig & com.antigravity.ArduinoConfig.$Shape;

            /**
             * Verifies an ArduinoConfig message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ArduinoConfig message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ArduinoConfig
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.ArduinoConfig;

            /**
             * Creates a plain object from an ArduinoConfig message. Also converts values to other types if specified.
             * @param message ArduinoConfig
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.ArduinoConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ArduinoConfig to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for ArduinoConfig
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace ArduinoConfig {

            /** Properties of an ArduinoConfig. */
            interface $Properties {

                /** ArduinoConfig name */
                name?: (string|null);

                /** ArduinoConfig commPort */
                commPort?: (string|null);

                /** ArduinoConfig baudRate */
                baudRate?: (number|null);

                /** ArduinoConfig debounceUs */
                debounceUs?: (number|null);

                /** ArduinoConfig normallyClosedLaneSensors */
                normallyClosedLaneSensors?: (boolean|null);

                /** ArduinoConfig normallyClosedRelays */
                normallyClosedRelays?: (boolean|null);

                /** ArduinoConfig globalInvertLights */
                globalInvertLights?: (number|null);

                /** ArduinoConfig usePitsAsLaps */
                usePitsAsLaps?: (boolean|null);

                /** ArduinoConfig useLapsForSegments */
                useLapsForSegments?: (boolean|null);

                /** ArduinoConfig hardwareType */
                hardwareType?: (number|null);

                /** ArduinoConfig digitalIds */
                digitalIds?: (number[]|null);

                /** ArduinoConfig analogIds */
                analogIds?: (number[]|null);

                /** ArduinoConfig lapPinPitBehavior */
                lapPinPitBehavior?: (com.antigravity.LapPinPitBehavior|null);

                /** ArduinoConfig voltageConfigs */
                voltageConfigs?: (com.antigravity.VoltageConfig.$Properties[]|null);

                /** ArduinoConfig ledStrings */
                ledStrings?: (com.antigravity.LedString.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an ArduinoConfig. */
            type $Shape = com.antigravity.ArduinoConfig.$Properties;
        }

        /**
         * Properties of a LedString.
         * @deprecated Use com.antigravity.LedString.$Properties instead.
         */
        interface ILedString extends com.antigravity.LedString.$Properties {
        }

        /** Represents a LedString. */
        class LedString {

            /**
             * Constructs a new LedString.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.LedString.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** LedString leds. */
            leds: number[];

            /** LedString numUsedLeds. */
            numUsedLeds: number;

            /** LedString addressableLeds. */
            addressableLeds: number;

            /** LedString brightness. */
            brightness: number;

            /** LedString flagFlashRate. */
            flagFlashRate: number;

            /** LedString ledLaneColorOverrides. */
            ledLaneColorOverrides: string[];

            /** LedString pin. */
            pin: number;

            /** LedString ledType. */
            ledType: com.antigravity.LedType;

            /** LedString colorOrder. */
            colorOrder: com.antigravity.ColorOrder;

            /**
             * Creates a new LedString instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LedString instance
             */
            static create(properties: com.antigravity.LedString.$Shape): com.antigravity.LedString & com.antigravity.LedString.$Shape;
            static create(properties?: com.antigravity.LedString.$Properties): com.antigravity.LedString;

            /**
             * Encodes the specified LedString message. Does not implicitly {@link com.antigravity.LedString.verify|verify} messages.
             * @param message LedString message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.LedString.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LedString message, length delimited. Does not implicitly {@link com.antigravity.LedString.verify|verify} messages.
             * @param message LedString message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.LedString.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LedString message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.LedString & com.antigravity.LedString.$Shape} LedString
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.LedString & com.antigravity.LedString.$Shape;

            /**
             * Decodes a LedString message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.LedString & com.antigravity.LedString.$Shape} LedString
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.LedString & com.antigravity.LedString.$Shape;

            /**
             * Verifies a LedString message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LedString message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LedString
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.LedString;

            /**
             * Creates a plain object from a LedString message. Also converts values to other types if specified.
             * @param message LedString
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.LedString, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LedString to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for LedString
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace LedString {

            /** Properties of a LedString. */
            interface $Properties {

                /** LedString leds */
                leds?: (number[]|null);

                /** LedString numUsedLeds */
                numUsedLeds?: (number|null);

                /** LedString addressableLeds */
                addressableLeds?: (number|null);

                /** LedString brightness */
                brightness?: (number|null);

                /** LedString flagFlashRate */
                flagFlashRate?: (number|null);

                /** LedString ledLaneColorOverrides */
                ledLaneColorOverrides?: (string[]|null);

                /** LedString pin */
                pin?: (number|null);

                /** LedString ledType */
                ledType?: (com.antigravity.LedType|null);

                /** LedString colorOrder */
                colorOrder?: (com.antigravity.ColorOrder|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a LedString. */
            type $Shape = com.antigravity.LedString.$Properties;
        }

        /**
         * Properties of a VoltageConfig.
         * @deprecated Use com.antigravity.VoltageConfig.$Properties instead.
         */
        interface IVoltageConfig extends com.antigravity.VoltageConfig.$Properties {
        }

        /** Represents a VoltageConfig. */
        class VoltageConfig {

            /**
             * Constructs a new VoltageConfig.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.VoltageConfig.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** VoltageConfig lane. */
            lane: number;

            /** VoltageConfig maxVoltage. */
            maxVoltage: number;

            /**
             * Creates a new VoltageConfig instance using the specified properties.
             * @param [properties] Properties to set
             * @returns VoltageConfig instance
             */
            static create(properties: com.antigravity.VoltageConfig.$Shape): com.antigravity.VoltageConfig & com.antigravity.VoltageConfig.$Shape;
            static create(properties?: com.antigravity.VoltageConfig.$Properties): com.antigravity.VoltageConfig;

            /**
             * Encodes the specified VoltageConfig message. Does not implicitly {@link com.antigravity.VoltageConfig.verify|verify} messages.
             * @param message VoltageConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.VoltageConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified VoltageConfig message, length delimited. Does not implicitly {@link com.antigravity.VoltageConfig.verify|verify} messages.
             * @param message VoltageConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.VoltageConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a VoltageConfig message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.VoltageConfig & com.antigravity.VoltageConfig.$Shape} VoltageConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.VoltageConfig & com.antigravity.VoltageConfig.$Shape;

            /**
             * Decodes a VoltageConfig message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.VoltageConfig & com.antigravity.VoltageConfig.$Shape} VoltageConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.VoltageConfig & com.antigravity.VoltageConfig.$Shape;

            /**
             * Verifies a VoltageConfig message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a VoltageConfig message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VoltageConfig
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.VoltageConfig;

            /**
             * Creates a plain object from a VoltageConfig message. Also converts values to other types if specified.
             * @param message VoltageConfig
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.VoltageConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this VoltageConfig to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for VoltageConfig
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace VoltageConfig {

            /** Properties of a VoltageConfig. */
            interface $Properties {

                /** VoltageConfig lane */
                lane?: (number|null);

                /** VoltageConfig maxVoltage */
                maxVoltage?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a VoltageConfig. */
            type $Shape = com.antigravity.VoltageConfig.$Properties;
        }

        /**
         * Properties of a ListAssetsRequest.
         * @deprecated Use com.antigravity.ListAssetsRequest.$Properties instead.
         */
        interface IListAssetsRequest extends com.antigravity.ListAssetsRequest.$Properties {
        }

        /** Represents a ListAssetsRequest. */
        class ListAssetsRequest {

            /**
             * Constructs a new ListAssetsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ListAssetsRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new ListAssetsRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListAssetsRequest instance
             */
            static create(properties: com.antigravity.ListAssetsRequest.$Shape): com.antigravity.ListAssetsRequest & com.antigravity.ListAssetsRequest.$Shape;
            static create(properties?: com.antigravity.ListAssetsRequest.$Properties): com.antigravity.ListAssetsRequest;

            /**
             * Encodes the specified ListAssetsRequest message. Does not implicitly {@link com.antigravity.ListAssetsRequest.verify|verify} messages.
             * @param message ListAssetsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.ListAssetsRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListAssetsRequest message, length delimited. Does not implicitly {@link com.antigravity.ListAssetsRequest.verify|verify} messages.
             * @param message ListAssetsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.ListAssetsRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListAssetsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.ListAssetsRequest & com.antigravity.ListAssetsRequest.$Shape} ListAssetsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ListAssetsRequest & com.antigravity.ListAssetsRequest.$Shape;

            /**
             * Decodes a ListAssetsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.ListAssetsRequest & com.antigravity.ListAssetsRequest.$Shape} ListAssetsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ListAssetsRequest & com.antigravity.ListAssetsRequest.$Shape;

            /**
             * Verifies a ListAssetsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListAssetsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListAssetsRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.ListAssetsRequest;

            /**
             * Creates a plain object from a ListAssetsRequest message. Also converts values to other types if specified.
             * @param message ListAssetsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.ListAssetsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListAssetsRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for ListAssetsRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace ListAssetsRequest {

            /** Properties of a ListAssetsRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a ListAssetsRequest. */
            type $Shape = com.antigravity.ListAssetsRequest.$Properties;
        }

        /**
         * Properties of an UploadAssetRequest.
         * @deprecated Use com.antigravity.UploadAssetRequest.$Properties instead.
         */
        interface IUploadAssetRequest extends com.antigravity.UploadAssetRequest.$Properties {
        }

        /** Represents an UploadAssetRequest. */
        class UploadAssetRequest {

            /**
             * Constructs a new UploadAssetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.UploadAssetRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** UploadAssetRequest name. */
            name: string;

            /** UploadAssetRequest type. */
            type: string;

            /** UploadAssetRequest data. */
            data: Uint8Array;

            /**
             * Creates a new UploadAssetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UploadAssetRequest instance
             */
            static create(properties: com.antigravity.UploadAssetRequest.$Shape): com.antigravity.UploadAssetRequest & com.antigravity.UploadAssetRequest.$Shape;
            static create(properties?: com.antigravity.UploadAssetRequest.$Properties): com.antigravity.UploadAssetRequest;

            /**
             * Encodes the specified UploadAssetRequest message. Does not implicitly {@link com.antigravity.UploadAssetRequest.verify|verify} messages.
             * @param message UploadAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.UploadAssetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UploadAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.UploadAssetRequest.verify|verify} messages.
             * @param message UploadAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.UploadAssetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UploadAssetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.UploadAssetRequest & com.antigravity.UploadAssetRequest.$Shape} UploadAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.UploadAssetRequest & com.antigravity.UploadAssetRequest.$Shape;

            /**
             * Decodes an UploadAssetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.UploadAssetRequest & com.antigravity.UploadAssetRequest.$Shape} UploadAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.UploadAssetRequest & com.antigravity.UploadAssetRequest.$Shape;

            /**
             * Verifies an UploadAssetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UploadAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UploadAssetRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.UploadAssetRequest;

            /**
             * Creates a plain object from an UploadAssetRequest message. Also converts values to other types if specified.
             * @param message UploadAssetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.UploadAssetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UploadAssetRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for UploadAssetRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace UploadAssetRequest {

            /** Properties of an UploadAssetRequest. */
            interface $Properties {

                /** UploadAssetRequest name */
                name?: (string|null);

                /** UploadAssetRequest type */
                type?: (string|null);

                /** UploadAssetRequest data */
                data?: (Uint8Array|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an UploadAssetRequest. */
            type $Shape = com.antigravity.UploadAssetRequest.$Properties;
        }

        /**
         * Properties of a DeleteAssetRequest.
         * @deprecated Use com.antigravity.DeleteAssetRequest.$Properties instead.
         */
        interface IDeleteAssetRequest extends com.antigravity.DeleteAssetRequest.$Properties {
        }

        /** Represents a DeleteAssetRequest. */
        class DeleteAssetRequest {

            /**
             * Constructs a new DeleteAssetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DeleteAssetRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DeleteAssetRequest id. */
            id: string;

            /**
             * Creates a new DeleteAssetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeleteAssetRequest instance
             */
            static create(properties: com.antigravity.DeleteAssetRequest.$Shape): com.antigravity.DeleteAssetRequest & com.antigravity.DeleteAssetRequest.$Shape;
            static create(properties?: com.antigravity.DeleteAssetRequest.$Properties): com.antigravity.DeleteAssetRequest;

            /**
             * Encodes the specified DeleteAssetRequest message. Does not implicitly {@link com.antigravity.DeleteAssetRequest.verify|verify} messages.
             * @param message DeleteAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DeleteAssetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeleteAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.DeleteAssetRequest.verify|verify} messages.
             * @param message DeleteAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DeleteAssetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeleteAssetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DeleteAssetRequest & com.antigravity.DeleteAssetRequest.$Shape} DeleteAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeleteAssetRequest & com.antigravity.DeleteAssetRequest.$Shape;

            /**
             * Decodes a DeleteAssetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DeleteAssetRequest & com.antigravity.DeleteAssetRequest.$Shape} DeleteAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeleteAssetRequest & com.antigravity.DeleteAssetRequest.$Shape;

            /**
             * Verifies a DeleteAssetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeleteAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeleteAssetRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DeleteAssetRequest;

            /**
             * Creates a plain object from a DeleteAssetRequest message. Also converts values to other types if specified.
             * @param message DeleteAssetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DeleteAssetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeleteAssetRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DeleteAssetRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DeleteAssetRequest {

            /** Properties of a DeleteAssetRequest. */
            interface $Properties {

                /** DeleteAssetRequest id */
                id?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DeleteAssetRequest. */
            type $Shape = com.antigravity.DeleteAssetRequest.$Properties;
        }

        /**
         * Properties of a RenameAssetRequest.
         * @deprecated Use com.antigravity.RenameAssetRequest.$Properties instead.
         */
        interface IRenameAssetRequest extends com.antigravity.RenameAssetRequest.$Properties {
        }

        /** Represents a RenameAssetRequest. */
        class RenameAssetRequest {

            /**
             * Constructs a new RenameAssetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RenameAssetRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RenameAssetRequest id. */
            id: string;

            /** RenameAssetRequest newName. */
            newName: string;

            /**
             * Creates a new RenameAssetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RenameAssetRequest instance
             */
            static create(properties: com.antigravity.RenameAssetRequest.$Shape): com.antigravity.RenameAssetRequest & com.antigravity.RenameAssetRequest.$Shape;
            static create(properties?: com.antigravity.RenameAssetRequest.$Properties): com.antigravity.RenameAssetRequest;

            /**
             * Encodes the specified RenameAssetRequest message. Does not implicitly {@link com.antigravity.RenameAssetRequest.verify|verify} messages.
             * @param message RenameAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RenameAssetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RenameAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.RenameAssetRequest.verify|verify} messages.
             * @param message RenameAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RenameAssetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RenameAssetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RenameAssetRequest & com.antigravity.RenameAssetRequest.$Shape} RenameAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RenameAssetRequest & com.antigravity.RenameAssetRequest.$Shape;

            /**
             * Decodes a RenameAssetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RenameAssetRequest & com.antigravity.RenameAssetRequest.$Shape} RenameAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RenameAssetRequest & com.antigravity.RenameAssetRequest.$Shape;

            /**
             * Verifies a RenameAssetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RenameAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RenameAssetRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RenameAssetRequest;

            /**
             * Creates a plain object from a RenameAssetRequest message. Also converts values to other types if specified.
             * @param message RenameAssetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RenameAssetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RenameAssetRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RenameAssetRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RenameAssetRequest {

            /** Properties of a RenameAssetRequest. */
            interface $Properties {

                /** RenameAssetRequest id */
                id?: (string|null);

                /** RenameAssetRequest newName */
                newName?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RenameAssetRequest. */
            type $Shape = com.antigravity.RenameAssetRequest.$Properties;
        }

        /**
         * Properties of a SaveImageSetRequest.
         * @deprecated Use com.antigravity.SaveImageSetRequest.$Properties instead.
         */
        interface ISaveImageSetRequest extends com.antigravity.SaveImageSetRequest.$Properties {
        }

        /** Represents a SaveImageSetRequest. */
        class SaveImageSetRequest {

            /**
             * Constructs a new SaveImageSetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveImageSetRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveImageSetRequest id. */
            id: string;

            /** SaveImageSetRequest name. */
            name: string;

            /** SaveImageSetRequest entries. */
            entries: com.antigravity.SaveImageSetEntry.$Properties[];

            /**
             * Creates a new SaveImageSetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveImageSetRequest instance
             */
            static create(properties: com.antigravity.SaveImageSetRequest.$Shape): com.antigravity.SaveImageSetRequest & com.antigravity.SaveImageSetRequest.$Shape;
            static create(properties?: com.antigravity.SaveImageSetRequest.$Properties): com.antigravity.SaveImageSetRequest;

            /**
             * Encodes the specified SaveImageSetRequest message. Does not implicitly {@link com.antigravity.SaveImageSetRequest.verify|verify} messages.
             * @param message SaveImageSetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveImageSetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveImageSetRequest message, length delimited. Does not implicitly {@link com.antigravity.SaveImageSetRequest.verify|verify} messages.
             * @param message SaveImageSetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveImageSetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveImageSetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveImageSetRequest & com.antigravity.SaveImageSetRequest.$Shape} SaveImageSetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveImageSetRequest & com.antigravity.SaveImageSetRequest.$Shape;

            /**
             * Decodes a SaveImageSetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveImageSetRequest & com.antigravity.SaveImageSetRequest.$Shape} SaveImageSetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveImageSetRequest & com.antigravity.SaveImageSetRequest.$Shape;

            /**
             * Verifies a SaveImageSetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveImageSetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveImageSetRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveImageSetRequest;

            /**
             * Creates a plain object from a SaveImageSetRequest message. Also converts values to other types if specified.
             * @param message SaveImageSetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveImageSetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveImageSetRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveImageSetRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveImageSetRequest {

            /** Properties of a SaveImageSetRequest. */
            interface $Properties {

                /** SaveImageSetRequest id */
                id?: (string|null);

                /** SaveImageSetRequest name */
                name?: (string|null);

                /** SaveImageSetRequest entries */
                entries?: (com.antigravity.SaveImageSetEntry.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveImageSetRequest. */
            type $Shape = com.antigravity.SaveImageSetRequest.$Properties;
        }

        /**
         * Properties of a SaveImageSetEntry.
         * @deprecated Use com.antigravity.SaveImageSetEntry.$Properties instead.
         */
        interface ISaveImageSetEntry extends com.antigravity.SaveImageSetEntry.$Properties {
        }

        /** Represents a SaveImageSetEntry. */
        class SaveImageSetEntry {

            /**
             * Constructs a new SaveImageSetEntry.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveImageSetEntry.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveImageSetEntry name. */
            name: string;

            /** SaveImageSetEntry percentage. */
            percentage: number;

            /** SaveImageSetEntry url. */
            url: string;

            /** SaveImageSetEntry data. */
            data: Uint8Array;

            /**
             * Creates a new SaveImageSetEntry instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveImageSetEntry instance
             */
            static create(properties: com.antigravity.SaveImageSetEntry.$Shape): com.antigravity.SaveImageSetEntry & com.antigravity.SaveImageSetEntry.$Shape;
            static create(properties?: com.antigravity.SaveImageSetEntry.$Properties): com.antigravity.SaveImageSetEntry;

            /**
             * Encodes the specified SaveImageSetEntry message. Does not implicitly {@link com.antigravity.SaveImageSetEntry.verify|verify} messages.
             * @param message SaveImageSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveImageSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveImageSetEntry message, length delimited. Does not implicitly {@link com.antigravity.SaveImageSetEntry.verify|verify} messages.
             * @param message SaveImageSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveImageSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveImageSetEntry message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveImageSetEntry & com.antigravity.SaveImageSetEntry.$Shape} SaveImageSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveImageSetEntry & com.antigravity.SaveImageSetEntry.$Shape;

            /**
             * Decodes a SaveImageSetEntry message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveImageSetEntry & com.antigravity.SaveImageSetEntry.$Shape} SaveImageSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveImageSetEntry & com.antigravity.SaveImageSetEntry.$Shape;

            /**
             * Verifies a SaveImageSetEntry message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveImageSetEntry message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveImageSetEntry
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveImageSetEntry;

            /**
             * Creates a plain object from a SaveImageSetEntry message. Also converts values to other types if specified.
             * @param message SaveImageSetEntry
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveImageSetEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveImageSetEntry to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveImageSetEntry
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveImageSetEntry {

            /** Properties of a SaveImageSetEntry. */
            interface $Properties {

                /** SaveImageSetEntry name */
                name?: (string|null);

                /** SaveImageSetEntry percentage */
                percentage?: (number|null);

                /** SaveImageSetEntry url */
                url?: (string|null);

                /** SaveImageSetEntry data */
                data?: (Uint8Array|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveImageSetEntry. */
            type $Shape = com.antigravity.SaveImageSetEntry.$Properties;
        }

        /**
         * Properties of a SaveAudioSetRequest.
         * @deprecated Use com.antigravity.SaveAudioSetRequest.$Properties instead.
         */
        interface ISaveAudioSetRequest extends com.antigravity.SaveAudioSetRequest.$Properties {
        }

        /** Represents a SaveAudioSetRequest. */
        class SaveAudioSetRequest {

            /**
             * Constructs a new SaveAudioSetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveAudioSetRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveAudioSetRequest id. */
            id: string;

            /** SaveAudioSetRequest name. */
            name: string;

            /** SaveAudioSetRequest entries. */
            entries: com.antigravity.SaveAudioSetEntry.$Properties[];

            /**
             * Creates a new SaveAudioSetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveAudioSetRequest instance
             */
            static create(properties: com.antigravity.SaveAudioSetRequest.$Shape): com.antigravity.SaveAudioSetRequest & com.antigravity.SaveAudioSetRequest.$Shape;
            static create(properties?: com.antigravity.SaveAudioSetRequest.$Properties): com.antigravity.SaveAudioSetRequest;

            /**
             * Encodes the specified SaveAudioSetRequest message. Does not implicitly {@link com.antigravity.SaveAudioSetRequest.verify|verify} messages.
             * @param message SaveAudioSetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveAudioSetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveAudioSetRequest message, length delimited. Does not implicitly {@link com.antigravity.SaveAudioSetRequest.verify|verify} messages.
             * @param message SaveAudioSetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveAudioSetRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveAudioSetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveAudioSetRequest & com.antigravity.SaveAudioSetRequest.$Shape} SaveAudioSetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveAudioSetRequest & com.antigravity.SaveAudioSetRequest.$Shape;

            /**
             * Decodes a SaveAudioSetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveAudioSetRequest & com.antigravity.SaveAudioSetRequest.$Shape} SaveAudioSetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveAudioSetRequest & com.antigravity.SaveAudioSetRequest.$Shape;

            /**
             * Verifies a SaveAudioSetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveAudioSetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveAudioSetRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveAudioSetRequest;

            /**
             * Creates a plain object from a SaveAudioSetRequest message. Also converts values to other types if specified.
             * @param message SaveAudioSetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveAudioSetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveAudioSetRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveAudioSetRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveAudioSetRequest {

            /** Properties of a SaveAudioSetRequest. */
            interface $Properties {

                /** SaveAudioSetRequest id */
                id?: (string|null);

                /** SaveAudioSetRequest name */
                name?: (string|null);

                /** SaveAudioSetRequest entries */
                entries?: (com.antigravity.SaveAudioSetEntry.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveAudioSetRequest. */
            type $Shape = com.antigravity.SaveAudioSetRequest.$Properties;
        }

        /**
         * Properties of a SaveAudioSetEntry.
         * @deprecated Use com.antigravity.SaveAudioSetEntry.$Properties instead.
         */
        interface ISaveAudioSetEntry extends com.antigravity.SaveAudioSetEntry.$Properties {
        }

        /** Represents a SaveAudioSetEntry. */
        class SaveAudioSetEntry {

            /**
             * Constructs a new SaveAudioSetEntry.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveAudioSetEntry.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveAudioSetEntry name. */
            name: string;

            /** SaveAudioSetEntry timeSeconds. */
            timeSeconds: number;

            /** SaveAudioSetEntry url. */
            url: string;

            /** SaveAudioSetEntry data. */
            data: Uint8Array;

            /**
             * Creates a new SaveAudioSetEntry instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveAudioSetEntry instance
             */
            static create(properties: com.antigravity.SaveAudioSetEntry.$Shape): com.antigravity.SaveAudioSetEntry & com.antigravity.SaveAudioSetEntry.$Shape;
            static create(properties?: com.antigravity.SaveAudioSetEntry.$Properties): com.antigravity.SaveAudioSetEntry;

            /**
             * Encodes the specified SaveAudioSetEntry message. Does not implicitly {@link com.antigravity.SaveAudioSetEntry.verify|verify} messages.
             * @param message SaveAudioSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveAudioSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveAudioSetEntry message, length delimited. Does not implicitly {@link com.antigravity.SaveAudioSetEntry.verify|verify} messages.
             * @param message SaveAudioSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveAudioSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveAudioSetEntry message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveAudioSetEntry & com.antigravity.SaveAudioSetEntry.$Shape} SaveAudioSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveAudioSetEntry & com.antigravity.SaveAudioSetEntry.$Shape;

            /**
             * Decodes a SaveAudioSetEntry message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveAudioSetEntry & com.antigravity.SaveAudioSetEntry.$Shape} SaveAudioSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveAudioSetEntry & com.antigravity.SaveAudioSetEntry.$Shape;

            /**
             * Verifies a SaveAudioSetEntry message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveAudioSetEntry message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveAudioSetEntry
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveAudioSetEntry;

            /**
             * Creates a plain object from a SaveAudioSetEntry message. Also converts values to other types if specified.
             * @param message SaveAudioSetEntry
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveAudioSetEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveAudioSetEntry to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveAudioSetEntry
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveAudioSetEntry {

            /** Properties of a SaveAudioSetEntry. */
            interface $Properties {

                /** SaveAudioSetEntry name */
                name?: (string|null);

                /** SaveAudioSetEntry timeSeconds */
                timeSeconds?: (number|null);

                /** SaveAudioSetEntry url */
                url?: (string|null);

                /** SaveAudioSetEntry data */
                data?: (Uint8Array|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveAudioSetEntry. */
            type $Shape = com.antigravity.SaveAudioSetEntry.$Properties;
        }

        /**
         * Properties of a SaveCustomRotationRequest.
         * @deprecated Use com.antigravity.SaveCustomRotationRequest.$Properties instead.
         */
        interface ISaveCustomRotationRequest extends com.antigravity.SaveCustomRotationRequest.$Properties {
        }

        /** Represents a SaveCustomRotationRequest. */
        class SaveCustomRotationRequest {

            /**
             * Constructs a new SaveCustomRotationRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveCustomRotationRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveCustomRotationRequest id. */
            id: string;

            /** SaveCustomRotationRequest name. */
            name: string;

            /** SaveCustomRotationRequest numLanes. */
            numLanes: number;

            /** SaveCustomRotationRequest rotations. */
            rotations: com.antigravity.CustomRotation.$Properties[];

            /**
             * Creates a new SaveCustomRotationRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveCustomRotationRequest instance
             */
            static create(properties: com.antigravity.SaveCustomRotationRequest.$Shape): com.antigravity.SaveCustomRotationRequest & com.antigravity.SaveCustomRotationRequest.$Shape;
            static create(properties?: com.antigravity.SaveCustomRotationRequest.$Properties): com.antigravity.SaveCustomRotationRequest;

            /**
             * Encodes the specified SaveCustomRotationRequest message. Does not implicitly {@link com.antigravity.SaveCustomRotationRequest.verify|verify} messages.
             * @param message SaveCustomRotationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveCustomRotationRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveCustomRotationRequest message, length delimited. Does not implicitly {@link com.antigravity.SaveCustomRotationRequest.verify|verify} messages.
             * @param message SaveCustomRotationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveCustomRotationRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveCustomRotationRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveCustomRotationRequest & com.antigravity.SaveCustomRotationRequest.$Shape} SaveCustomRotationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveCustomRotationRequest & com.antigravity.SaveCustomRotationRequest.$Shape;

            /**
             * Decodes a SaveCustomRotationRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveCustomRotationRequest & com.antigravity.SaveCustomRotationRequest.$Shape} SaveCustomRotationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveCustomRotationRequest & com.antigravity.SaveCustomRotationRequest.$Shape;

            /**
             * Verifies a SaveCustomRotationRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveCustomRotationRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveCustomRotationRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveCustomRotationRequest;

            /**
             * Creates a plain object from a SaveCustomRotationRequest message. Also converts values to other types if specified.
             * @param message SaveCustomRotationRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveCustomRotationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveCustomRotationRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveCustomRotationRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveCustomRotationRequest {

            /** Properties of a SaveCustomRotationRequest. */
            interface $Properties {

                /** SaveCustomRotationRequest id */
                id?: (string|null);

                /** SaveCustomRotationRequest name */
                name?: (string|null);

                /** SaveCustomRotationRequest numLanes */
                numLanes?: (number|null);

                /** SaveCustomRotationRequest rotations */
                rotations?: (com.antigravity.CustomRotation.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveCustomRotationRequest. */
            type $Shape = com.antigravity.SaveCustomRotationRequest.$Properties;
        }

        /**
         * Properties of a SaveCustomRotationResponse.
         * @deprecated Use com.antigravity.SaveCustomRotationResponse.$Properties instead.
         */
        interface ISaveCustomRotationResponse extends com.antigravity.SaveCustomRotationResponse.$Properties {
        }

        /** Represents a SaveCustomRotationResponse. */
        class SaveCustomRotationResponse {

            /**
             * Constructs a new SaveCustomRotationResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveCustomRotationResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveCustomRotationResponse success. */
            success: boolean;

            /** SaveCustomRotationResponse message. */
            message: string;

            /** SaveCustomRotationResponse asset. */
            asset?: (com.antigravity.AssetMessage.$Properties|null);

            /**
             * Creates a new SaveCustomRotationResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveCustomRotationResponse instance
             */
            static create(properties: com.antigravity.SaveCustomRotationResponse.$Shape): com.antigravity.SaveCustomRotationResponse & com.antigravity.SaveCustomRotationResponse.$Shape;
            static create(properties?: com.antigravity.SaveCustomRotationResponse.$Properties): com.antigravity.SaveCustomRotationResponse;

            /**
             * Encodes the specified SaveCustomRotationResponse message. Does not implicitly {@link com.antigravity.SaveCustomRotationResponse.verify|verify} messages.
             * @param message SaveCustomRotationResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveCustomRotationResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveCustomRotationResponse message, length delimited. Does not implicitly {@link com.antigravity.SaveCustomRotationResponse.verify|verify} messages.
             * @param message SaveCustomRotationResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveCustomRotationResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveCustomRotationResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveCustomRotationResponse & com.antigravity.SaveCustomRotationResponse.$Shape} SaveCustomRotationResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveCustomRotationResponse & com.antigravity.SaveCustomRotationResponse.$Shape;

            /**
             * Decodes a SaveCustomRotationResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveCustomRotationResponse & com.antigravity.SaveCustomRotationResponse.$Shape} SaveCustomRotationResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveCustomRotationResponse & com.antigravity.SaveCustomRotationResponse.$Shape;

            /**
             * Verifies a SaveCustomRotationResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveCustomRotationResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveCustomRotationResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveCustomRotationResponse;

            /**
             * Creates a plain object from a SaveCustomRotationResponse message. Also converts values to other types if specified.
             * @param message SaveCustomRotationResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveCustomRotationResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveCustomRotationResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveCustomRotationResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveCustomRotationResponse {

            /** Properties of a SaveCustomRotationResponse. */
            interface $Properties {

                /** SaveCustomRotationResponse success */
                success?: (boolean|null);

                /** SaveCustomRotationResponse message */
                message?: (string|null);

                /** SaveCustomRotationResponse asset */
                asset?: (com.antigravity.AssetMessage.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveCustomRotationResponse. */
            type $Shape = com.antigravity.SaveCustomRotationResponse.$Properties;
        }

        /**
         * Properties of a CustomRotation.
         * @deprecated Use com.antigravity.CustomRotation.$Properties instead.
         */
        interface ICustomRotation extends com.antigravity.CustomRotation.$Properties {
        }

        /** Represents a CustomRotation. */
        class CustomRotation {

            /**
             * Constructs a new CustomRotation.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.CustomRotation.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** CustomRotation numDrivers. */
            numDrivers: number;

            /** CustomRotation heats. */
            heats: com.antigravity.CustomHeat.$Properties[];

            /**
             * Creates a new CustomRotation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomRotation instance
             */
            static create(properties: com.antigravity.CustomRotation.$Shape): com.antigravity.CustomRotation & com.antigravity.CustomRotation.$Shape;
            static create(properties?: com.antigravity.CustomRotation.$Properties): com.antigravity.CustomRotation;

            /**
             * Encodes the specified CustomRotation message. Does not implicitly {@link com.antigravity.CustomRotation.verify|verify} messages.
             * @param message CustomRotation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.CustomRotation.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CustomRotation message, length delimited. Does not implicitly {@link com.antigravity.CustomRotation.verify|verify} messages.
             * @param message CustomRotation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.CustomRotation.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomRotation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.CustomRotation & com.antigravity.CustomRotation.$Shape} CustomRotation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.CustomRotation & com.antigravity.CustomRotation.$Shape;

            /**
             * Decodes a CustomRotation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.CustomRotation & com.antigravity.CustomRotation.$Shape} CustomRotation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.CustomRotation & com.antigravity.CustomRotation.$Shape;

            /**
             * Verifies a CustomRotation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CustomRotation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CustomRotation
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.CustomRotation;

            /**
             * Creates a plain object from a CustomRotation message. Also converts values to other types if specified.
             * @param message CustomRotation
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.CustomRotation, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CustomRotation to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CustomRotation
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CustomRotation {

            /** Properties of a CustomRotation. */
            interface $Properties {

                /** CustomRotation numDrivers */
                numDrivers?: (number|null);

                /** CustomRotation heats */
                heats?: (com.antigravity.CustomHeat.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CustomRotation. */
            type $Shape = com.antigravity.CustomRotation.$Properties;
        }

        /**
         * Properties of a CustomHeat.
         * @deprecated Use com.antigravity.CustomHeat.$Properties instead.
         */
        interface ICustomHeat extends com.antigravity.CustomHeat.$Properties {
        }

        /** Represents a CustomHeat. */
        class CustomHeat {

            /**
             * Constructs a new CustomHeat.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.CustomHeat.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** CustomHeat driverIndices. */
            driverIndices: number[];

            /**
             * Creates a new CustomHeat instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomHeat instance
             */
            static create(properties: com.antigravity.CustomHeat.$Shape): com.antigravity.CustomHeat & com.antigravity.CustomHeat.$Shape;
            static create(properties?: com.antigravity.CustomHeat.$Properties): com.antigravity.CustomHeat;

            /**
             * Encodes the specified CustomHeat message. Does not implicitly {@link com.antigravity.CustomHeat.verify|verify} messages.
             * @param message CustomHeat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.CustomHeat.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CustomHeat message, length delimited. Does not implicitly {@link com.antigravity.CustomHeat.verify|verify} messages.
             * @param message CustomHeat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.CustomHeat.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomHeat message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.CustomHeat & com.antigravity.CustomHeat.$Shape} CustomHeat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.CustomHeat & com.antigravity.CustomHeat.$Shape;

            /**
             * Decodes a CustomHeat message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.CustomHeat & com.antigravity.CustomHeat.$Shape} CustomHeat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.CustomHeat & com.antigravity.CustomHeat.$Shape;

            /**
             * Verifies a CustomHeat message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CustomHeat message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CustomHeat
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.CustomHeat;

            /**
             * Creates a plain object from a CustomHeat message. Also converts values to other types if specified.
             * @param message CustomHeat
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.CustomHeat, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CustomHeat to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CustomHeat
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CustomHeat {

            /** Properties of a CustomHeat. */
            interface $Properties {

                /** CustomHeat driverIndices */
                driverIndices?: (number[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CustomHeat. */
            type $Shape = com.antigravity.CustomHeat.$Properties;
        }

        /**
         * Properties of an ImageSetEntry.
         * @deprecated Use com.antigravity.ImageSetEntry.$Properties instead.
         */
        interface IImageSetEntry extends com.antigravity.ImageSetEntry.$Properties {
        }

        /** Represents an ImageSetEntry. */
        class ImageSetEntry {

            /**
             * Constructs a new ImageSetEntry.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ImageSetEntry.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** ImageSetEntry url. */
            url: string;

            /** ImageSetEntry percentage. */
            percentage: number;

            /** ImageSetEntry name. */
            name: string;

            /** ImageSetEntry size. */
            size: string;

            /**
             * Creates a new ImageSetEntry instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ImageSetEntry instance
             */
            static create(properties: com.antigravity.ImageSetEntry.$Shape): com.antigravity.ImageSetEntry & com.antigravity.ImageSetEntry.$Shape;
            static create(properties?: com.antigravity.ImageSetEntry.$Properties): com.antigravity.ImageSetEntry;

            /**
             * Encodes the specified ImageSetEntry message. Does not implicitly {@link com.antigravity.ImageSetEntry.verify|verify} messages.
             * @param message ImageSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.ImageSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ImageSetEntry message, length delimited. Does not implicitly {@link com.antigravity.ImageSetEntry.verify|verify} messages.
             * @param message ImageSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.ImageSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ImageSetEntry message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.ImageSetEntry & com.antigravity.ImageSetEntry.$Shape} ImageSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ImageSetEntry & com.antigravity.ImageSetEntry.$Shape;

            /**
             * Decodes an ImageSetEntry message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.ImageSetEntry & com.antigravity.ImageSetEntry.$Shape} ImageSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ImageSetEntry & com.antigravity.ImageSetEntry.$Shape;

            /**
             * Verifies an ImageSetEntry message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ImageSetEntry message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ImageSetEntry
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.ImageSetEntry;

            /**
             * Creates a plain object from an ImageSetEntry message. Also converts values to other types if specified.
             * @param message ImageSetEntry
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.ImageSetEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ImageSetEntry to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for ImageSetEntry
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace ImageSetEntry {

            /** Properties of an ImageSetEntry. */
            interface $Properties {

                /** ImageSetEntry url */
                url?: (string|null);

                /** ImageSetEntry percentage */
                percentage?: (number|null);

                /** ImageSetEntry name */
                name?: (string|null);

                /** ImageSetEntry size */
                size?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an ImageSetEntry. */
            type $Shape = com.antigravity.ImageSetEntry.$Properties;
        }

        /**
         * Properties of an AudioSetEntry.
         * @deprecated Use com.antigravity.AudioSetEntry.$Properties instead.
         */
        interface IAudioSetEntry extends com.antigravity.AudioSetEntry.$Properties {
        }

        /** Represents an AudioSetEntry. */
        class AudioSetEntry {

            /**
             * Constructs a new AudioSetEntry.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.AudioSetEntry.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** AudioSetEntry url. */
            url: string;

            /** AudioSetEntry timeSeconds. */
            timeSeconds: number;

            /** AudioSetEntry name. */
            name: string;

            /** AudioSetEntry size. */
            size: string;

            /**
             * Creates a new AudioSetEntry instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AudioSetEntry instance
             */
            static create(properties: com.antigravity.AudioSetEntry.$Shape): com.antigravity.AudioSetEntry & com.antigravity.AudioSetEntry.$Shape;
            static create(properties?: com.antigravity.AudioSetEntry.$Properties): com.antigravity.AudioSetEntry;

            /**
             * Encodes the specified AudioSetEntry message. Does not implicitly {@link com.antigravity.AudioSetEntry.verify|verify} messages.
             * @param message AudioSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.AudioSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AudioSetEntry message, length delimited. Does not implicitly {@link com.antigravity.AudioSetEntry.verify|verify} messages.
             * @param message AudioSetEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.AudioSetEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AudioSetEntry message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.AudioSetEntry & com.antigravity.AudioSetEntry.$Shape} AudioSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.AudioSetEntry & com.antigravity.AudioSetEntry.$Shape;

            /**
             * Decodes an AudioSetEntry message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.AudioSetEntry & com.antigravity.AudioSetEntry.$Shape} AudioSetEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.AudioSetEntry & com.antigravity.AudioSetEntry.$Shape;

            /**
             * Verifies an AudioSetEntry message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AudioSetEntry message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AudioSetEntry
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.AudioSetEntry;

            /**
             * Creates a plain object from an AudioSetEntry message. Also converts values to other types if specified.
             * @param message AudioSetEntry
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.AudioSetEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AudioSetEntry to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AudioSetEntry
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AudioSetEntry {

            /** Properties of an AudioSetEntry. */
            interface $Properties {

                /** AudioSetEntry url */
                url?: (string|null);

                /** AudioSetEntry timeSeconds */
                timeSeconds?: (number|null);

                /** AudioSetEntry name */
                name?: (string|null);

                /** AudioSetEntry size */
                size?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AudioSetEntry. */
            type $Shape = com.antigravity.AudioSetEntry.$Properties;
        }

        /**
         * Properties of an AssetMessage.
         * @deprecated Use com.antigravity.AssetMessage.$Properties instead.
         */
        interface IAssetMessage extends com.antigravity.AssetMessage.$Properties {
        }

        /** Represents an AssetMessage. */
        class AssetMessage {

            /**
             * Constructs a new AssetMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.AssetMessage.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** AssetMessage model. */
            model?: (com.antigravity.Model.$Properties|null);

            /** AssetMessage name. */
            name: string;

            /** AssetMessage type. */
            type: string;

            /** AssetMessage size. */
            size: string;

            /** AssetMessage url. */
            url: string;

            /** AssetMessage images. */
            images: com.antigravity.ImageSetEntry.$Properties[];

            /** AssetMessage audioEntries. */
            audioEntries: com.antigravity.AudioSetEntry.$Properties[];

            /** AssetMessage numLanes. */
            numLanes: number;

            /** AssetMessage customRotations. */
            customRotations: com.antigravity.CustomRotation.$Properties[];

            /**
             * Creates a new AssetMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AssetMessage instance
             */
            static create(properties: com.antigravity.AssetMessage.$Shape): com.antigravity.AssetMessage & com.antigravity.AssetMessage.$Shape;
            static create(properties?: com.antigravity.AssetMessage.$Properties): com.antigravity.AssetMessage;

            /**
             * Encodes the specified AssetMessage message. Does not implicitly {@link com.antigravity.AssetMessage.verify|verify} messages.
             * @param message AssetMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.AssetMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AssetMessage message, length delimited. Does not implicitly {@link com.antigravity.AssetMessage.verify|verify} messages.
             * @param message AssetMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.AssetMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AssetMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.AssetMessage & com.antigravity.AssetMessage.$Shape} AssetMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.AssetMessage & com.antigravity.AssetMessage.$Shape;

            /**
             * Decodes an AssetMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.AssetMessage & com.antigravity.AssetMessage.$Shape} AssetMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.AssetMessage & com.antigravity.AssetMessage.$Shape;

            /**
             * Verifies an AssetMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AssetMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AssetMessage
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.AssetMessage;

            /**
             * Creates a plain object from an AssetMessage message. Also converts values to other types if specified.
             * @param message AssetMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.AssetMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AssetMessage to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AssetMessage
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AssetMessage {

            /** Properties of an AssetMessage. */
            interface $Properties {

                /** AssetMessage model */
                model?: (com.antigravity.Model.$Properties|null);

                /** AssetMessage name */
                name?: (string|null);

                /** AssetMessage type */
                type?: (string|null);

                /** AssetMessage size */
                size?: (string|null);

                /** AssetMessage url */
                url?: (string|null);

                /** AssetMessage images */
                images?: (com.antigravity.ImageSetEntry.$Properties[]|null);

                /** AssetMessage audioEntries */
                audioEntries?: (com.antigravity.AudioSetEntry.$Properties[]|null);

                /** AssetMessage numLanes */
                numLanes?: (number|null);

                /** AssetMessage customRotations */
                customRotations?: (com.antigravity.CustomRotation.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AssetMessage. */
            type $Shape = com.antigravity.AssetMessage.$Properties;
        }

        /**
         * Properties of a Model.
         * @deprecated Use com.antigravity.Model.$Properties instead.
         */
        interface IModel extends com.antigravity.Model.$Properties {
        }

        /** Represents a Model. */
        class Model {

            /**
             * Constructs a new Model.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.Model.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** Model entityId. */
            entityId: string;

            /**
             * Creates a new Model instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Model instance
             */
            static create(properties: com.antigravity.Model.$Shape): com.antigravity.Model & com.antigravity.Model.$Shape;
            static create(properties?: com.antigravity.Model.$Properties): com.antigravity.Model;

            /**
             * Encodes the specified Model message. Does not implicitly {@link com.antigravity.Model.verify|verify} messages.
             * @param message Model message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.Model.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Model message, length delimited. Does not implicitly {@link com.antigravity.Model.verify|verify} messages.
             * @param message Model message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.Model.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Model message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.Model & com.antigravity.Model.$Shape} Model
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Model & com.antigravity.Model.$Shape;

            /**
             * Decodes a Model message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.Model & com.antigravity.Model.$Shape} Model
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Model & com.antigravity.Model.$Shape;

            /**
             * Verifies a Model message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Model message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Model
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.Model;

            /**
             * Creates a plain object from a Model message. Also converts values to other types if specified.
             * @param message Model
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.Model, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Model to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Model
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Model {

            /** Properties of a Model. */
            interface $Properties {

                /** Model entityId */
                entityId?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Model. */
            type $Shape = com.antigravity.Model.$Properties;
        }

        /**
         * Properties of an AudioConfig.
         * @deprecated Use com.antigravity.AudioConfig.$Properties instead.
         */
        interface IAudioConfig extends com.antigravity.AudioConfig.$Properties {
        }

        /** Represents an AudioConfig. */
        class AudioConfig {

            /**
             * Constructs a new AudioConfig.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.AudioConfig.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** AudioConfig type. */
            type: string;

            /** AudioConfig url. */
            url: string;

            /** AudioConfig text. */
            text: string;

            /**
             * Creates a new AudioConfig instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AudioConfig instance
             */
            static create(properties: com.antigravity.AudioConfig.$Shape): com.antigravity.AudioConfig & com.antigravity.AudioConfig.$Shape;
            static create(properties?: com.antigravity.AudioConfig.$Properties): com.antigravity.AudioConfig;

            /**
             * Encodes the specified AudioConfig message. Does not implicitly {@link com.antigravity.AudioConfig.verify|verify} messages.
             * @param message AudioConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.AudioConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AudioConfig message, length delimited. Does not implicitly {@link com.antigravity.AudioConfig.verify|verify} messages.
             * @param message AudioConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.AudioConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AudioConfig message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.AudioConfig & com.antigravity.AudioConfig.$Shape} AudioConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.AudioConfig & com.antigravity.AudioConfig.$Shape;

            /**
             * Decodes an AudioConfig message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.AudioConfig & com.antigravity.AudioConfig.$Shape} AudioConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.AudioConfig & com.antigravity.AudioConfig.$Shape;

            /**
             * Verifies an AudioConfig message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AudioConfig message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AudioConfig
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.AudioConfig;

            /**
             * Creates a plain object from an AudioConfig message. Also converts values to other types if specified.
             * @param message AudioConfig
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.AudioConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AudioConfig to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AudioConfig
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AudioConfig {

            /** Properties of an AudioConfig. */
            interface $Properties {

                /** AudioConfig type */
                type?: (string|null);

                /** AudioConfig url */
                url?: (string|null);

                /** AudioConfig text */
                text?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AudioConfig. */
            type $Shape = com.antigravity.AudioConfig.$Properties;
        }

        /**
         * Properties of a DeferHeatRequest.
         * @deprecated Use com.antigravity.DeferHeatRequest.$Properties instead.
         */
        interface IDeferHeatRequest extends com.antigravity.DeferHeatRequest.$Properties {
        }

        /** Represents a DeferHeatRequest. */
        class DeferHeatRequest {

            /**
             * Constructs a new DeferHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DeferHeatRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new DeferHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeferHeatRequest instance
             */
            static create(properties: com.antigravity.DeferHeatRequest.$Shape): com.antigravity.DeferHeatRequest & com.antigravity.DeferHeatRequest.$Shape;
            static create(properties?: com.antigravity.DeferHeatRequest.$Properties): com.antigravity.DeferHeatRequest;

            /**
             * Encodes the specified DeferHeatRequest message. Does not implicitly {@link com.antigravity.DeferHeatRequest.verify|verify} messages.
             * @param message DeferHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DeferHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeferHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.DeferHeatRequest.verify|verify} messages.
             * @param message DeferHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DeferHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeferHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DeferHeatRequest & com.antigravity.DeferHeatRequest.$Shape} DeferHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeferHeatRequest & com.antigravity.DeferHeatRequest.$Shape;

            /**
             * Decodes a DeferHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DeferHeatRequest & com.antigravity.DeferHeatRequest.$Shape} DeferHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeferHeatRequest & com.antigravity.DeferHeatRequest.$Shape;

            /**
             * Verifies a DeferHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeferHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeferHeatRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DeferHeatRequest;

            /**
             * Creates a plain object from a DeferHeatRequest message. Also converts values to other types if specified.
             * @param message DeferHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DeferHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeferHeatRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DeferHeatRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DeferHeatRequest {

            /** Properties of a DeferHeatRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DeferHeatRequest. */
            type $Shape = com.antigravity.DeferHeatRequest.$Properties;
        }

        /**
         * Properties of a DeferHeatResponse.
         * @deprecated Use com.antigravity.DeferHeatResponse.$Properties instead.
         */
        interface IDeferHeatResponse extends com.antigravity.DeferHeatResponse.$Properties {
        }

        /** Represents a DeferHeatResponse. */
        class DeferHeatResponse {

            /**
             * Constructs a new DeferHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DeferHeatResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DeferHeatResponse success. */
            success: boolean;

            /**
             * Creates a new DeferHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeferHeatResponse instance
             */
            static create(properties: com.antigravity.DeferHeatResponse.$Shape): com.antigravity.DeferHeatResponse & com.antigravity.DeferHeatResponse.$Shape;
            static create(properties?: com.antigravity.DeferHeatResponse.$Properties): com.antigravity.DeferHeatResponse;

            /**
             * Encodes the specified DeferHeatResponse message. Does not implicitly {@link com.antigravity.DeferHeatResponse.verify|verify} messages.
             * @param message DeferHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DeferHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeferHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.DeferHeatResponse.verify|verify} messages.
             * @param message DeferHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DeferHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeferHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DeferHeatResponse & com.antigravity.DeferHeatResponse.$Shape} DeferHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeferHeatResponse & com.antigravity.DeferHeatResponse.$Shape;

            /**
             * Decodes a DeferHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DeferHeatResponse & com.antigravity.DeferHeatResponse.$Shape} DeferHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeferHeatResponse & com.antigravity.DeferHeatResponse.$Shape;

            /**
             * Verifies a DeferHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeferHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeferHeatResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DeferHeatResponse;

            /**
             * Creates a plain object from a DeferHeatResponse message. Also converts values to other types if specified.
             * @param message DeferHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DeferHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeferHeatResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DeferHeatResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DeferHeatResponse {

            /** Properties of a DeferHeatResponse. */
            interface $Properties {

                /** DeferHeatResponse success */
                success?: (boolean|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DeferHeatResponse. */
            type $Shape = com.antigravity.DeferHeatResponse.$Properties;
        }

        /**
         * Properties of a DemoConfig.
         * @deprecated Use com.antigravity.DemoConfig.$Properties instead.
         */
        interface IDemoConfig extends com.antigravity.DemoConfig.$Properties {
        }

        /** Represents a DemoConfig. */
        class DemoConfig {

            /**
             * Constructs a new DemoConfig.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DemoConfig.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DemoConfig minLapTimeMs. */
            minLapTimeMs: number;

            /** DemoConfig maxLapTimeMs. */
            maxLapTimeMs: number;

            /** DemoConfig minRefuelTimeMs. */
            minRefuelTimeMs: number;

            /** DemoConfig maxRefuelTimeMs. */
            maxRefuelTimeMs: number;

            /** DemoConfig numSegments. */
            numSegments: number;

            /** DemoConfig minLapsBetweenPits. */
            minLapsBetweenPits: number;

            /** DemoConfig maxLapsBetweenPits. */
            maxLapsBetweenPits: number;

            /** DemoConfig minReactionTimeMs. */
            minReactionTimeMs: number;

            /** DemoConfig maxReactionTimeMs. */
            maxReactionTimeMs: number;

            /** DemoConfig minPitEntryOffsetMs. */
            minPitEntryOffsetMs: number;

            /** DemoConfig maxPitEntryOffsetMs. */
            maxPitEntryOffsetMs: number;

            /**
             * Creates a new DemoConfig instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DemoConfig instance
             */
            static create(properties: com.antigravity.DemoConfig.$Shape): com.antigravity.DemoConfig & com.antigravity.DemoConfig.$Shape;
            static create(properties?: com.antigravity.DemoConfig.$Properties): com.antigravity.DemoConfig;

            /**
             * Encodes the specified DemoConfig message. Does not implicitly {@link com.antigravity.DemoConfig.verify|verify} messages.
             * @param message DemoConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DemoConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DemoConfig message, length delimited. Does not implicitly {@link com.antigravity.DemoConfig.verify|verify} messages.
             * @param message DemoConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DemoConfig.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DemoConfig message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DemoConfig & com.antigravity.DemoConfig.$Shape} DemoConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DemoConfig & com.antigravity.DemoConfig.$Shape;

            /**
             * Decodes a DemoConfig message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DemoConfig & com.antigravity.DemoConfig.$Shape} DemoConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DemoConfig & com.antigravity.DemoConfig.$Shape;

            /**
             * Verifies a DemoConfig message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DemoConfig message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DemoConfig
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DemoConfig;

            /**
             * Creates a plain object from a DemoConfig message. Also converts values to other types if specified.
             * @param message DemoConfig
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DemoConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DemoConfig to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DemoConfig
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DemoConfig {

            /** Properties of a DemoConfig. */
            interface $Properties {

                /** DemoConfig minLapTimeMs */
                minLapTimeMs?: (number|null);

                /** DemoConfig maxLapTimeMs */
                maxLapTimeMs?: (number|null);

                /** DemoConfig minRefuelTimeMs */
                minRefuelTimeMs?: (number|null);

                /** DemoConfig maxRefuelTimeMs */
                maxRefuelTimeMs?: (number|null);

                /** DemoConfig numSegments */
                numSegments?: (number|null);

                /** DemoConfig minLapsBetweenPits */
                minLapsBetweenPits?: (number|null);

                /** DemoConfig maxLapsBetweenPits */
                maxLapsBetweenPits?: (number|null);

                /** DemoConfig minReactionTimeMs */
                minReactionTimeMs?: (number|null);

                /** DemoConfig maxReactionTimeMs */
                maxReactionTimeMs?: (number|null);

                /** DemoConfig minPitEntryOffsetMs */
                minPitEntryOffsetMs?: (number|null);

                /** DemoConfig maxPitEntryOffsetMs */
                maxPitEntryOffsetMs?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DemoConfig. */
            type $Shape = com.antigravity.DemoConfig.$Properties;
        }

        /**
         * Properties of a DriverModel.
         * @deprecated Use com.antigravity.DriverModel.$Properties instead.
         */
        interface IDriverModel extends com.antigravity.DriverModel.$Properties {
        }

        /** Represents a DriverModel. */
        class DriverModel {

            /**
             * Constructs a new DriverModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DriverModel.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DriverModel model. */
            model?: (com.antigravity.Model.$Properties|null);

            /** DriverModel name. */
            name: string;

            /** DriverModel nickname. */
            nickname: string;

            /** DriverModel avatarUrl. */
            avatarUrl: string;

            /** DriverModel lapAudio. */
            lapAudio?: (com.antigravity.AudioConfig.$Properties|null);

            /** DriverModel bestLapAudio. */
            bestLapAudio?: (com.antigravity.AudioConfig.$Properties|null);

            /** DriverModel penaltyAudio. */
            penaltyAudio?: (com.antigravity.AudioConfig.$Properties|null);

            /**
             * Creates a new DriverModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DriverModel instance
             */
            static create(properties: com.antigravity.DriverModel.$Shape): com.antigravity.DriverModel & com.antigravity.DriverModel.$Shape;
            static create(properties?: com.antigravity.DriverModel.$Properties): com.antigravity.DriverModel;

            /**
             * Encodes the specified DriverModel message. Does not implicitly {@link com.antigravity.DriverModel.verify|verify} messages.
             * @param message DriverModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DriverModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DriverModel message, length delimited. Does not implicitly {@link com.antigravity.DriverModel.verify|verify} messages.
             * @param message DriverModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DriverModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DriverModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DriverModel & com.antigravity.DriverModel.$Shape} DriverModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DriverModel & com.antigravity.DriverModel.$Shape;

            /**
             * Decodes a DriverModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DriverModel & com.antigravity.DriverModel.$Shape} DriverModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DriverModel & com.antigravity.DriverModel.$Shape;

            /**
             * Verifies a DriverModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DriverModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DriverModel
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DriverModel;

            /**
             * Creates a plain object from a DriverModel message. Also converts values to other types if specified.
             * @param message DriverModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DriverModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DriverModel to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DriverModel
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DriverModel {

            /** Properties of a DriverModel. */
            interface $Properties {

                /** DriverModel model */
                model?: (com.antigravity.Model.$Properties|null);

                /** DriverModel name */
                name?: (string|null);

                /** DriverModel nickname */
                nickname?: (string|null);

                /** DriverModel avatarUrl */
                avatarUrl?: (string|null);

                /** DriverModel lapAudio */
                lapAudio?: (com.antigravity.AudioConfig.$Properties|null);

                /** DriverModel bestLapAudio */
                bestLapAudio?: (com.antigravity.AudioConfig.$Properties|null);

                /** DriverModel penaltyAudio */
                penaltyAudio?: (com.antigravity.AudioConfig.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DriverModel. */
            type $Shape = com.antigravity.DriverModel.$Properties;
        }

        /**
         * Properties of an InitializeInterfaceRequest.
         * @deprecated Use com.antigravity.InitializeInterfaceRequest.$Properties instead.
         */
        interface IInitializeInterfaceRequest extends com.antigravity.InitializeInterfaceRequest.$Properties {
        }

        /** Represents an InitializeInterfaceRequest. */
        class InitializeInterfaceRequest {

            /**
             * Constructs a new InitializeInterfaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InitializeInterfaceRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InitializeInterfaceRequest configs. */
            configs: com.antigravity.ArduinoConfig.$Properties[];

            /** InitializeInterfaceRequest laneCount. */
            laneCount: number;

            /**
             * Creates a new InitializeInterfaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InitializeInterfaceRequest instance
             */
            static create(properties: com.antigravity.InitializeInterfaceRequest.$Shape): com.antigravity.InitializeInterfaceRequest & com.antigravity.InitializeInterfaceRequest.$Shape;
            static create(properties?: com.antigravity.InitializeInterfaceRequest.$Properties): com.antigravity.InitializeInterfaceRequest;

            /**
             * Encodes the specified InitializeInterfaceRequest message. Does not implicitly {@link com.antigravity.InitializeInterfaceRequest.verify|verify} messages.
             * @param message InitializeInterfaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InitializeInterfaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InitializeInterfaceRequest message, length delimited. Does not implicitly {@link com.antigravity.InitializeInterfaceRequest.verify|verify} messages.
             * @param message InitializeInterfaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InitializeInterfaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InitializeInterfaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeInterfaceRequest & com.antigravity.InitializeInterfaceRequest.$Shape} InitializeInterfaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InitializeInterfaceRequest & com.antigravity.InitializeInterfaceRequest.$Shape;

            /**
             * Decodes an InitializeInterfaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeInterfaceRequest & com.antigravity.InitializeInterfaceRequest.$Shape} InitializeInterfaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InitializeInterfaceRequest & com.antigravity.InitializeInterfaceRequest.$Shape;

            /**
             * Verifies an InitializeInterfaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InitializeInterfaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InitializeInterfaceRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InitializeInterfaceRequest;

            /**
             * Creates a plain object from an InitializeInterfaceRequest message. Also converts values to other types if specified.
             * @param message InitializeInterfaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InitializeInterfaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InitializeInterfaceRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InitializeInterfaceRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InitializeInterfaceRequest {

            /** Properties of an InitializeInterfaceRequest. */
            interface $Properties {

                /** InitializeInterfaceRequest configs */
                configs?: (com.antigravity.ArduinoConfig.$Properties[]|null);

                /** InitializeInterfaceRequest laneCount */
                laneCount?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InitializeInterfaceRequest. */
            type $Shape = com.antigravity.InitializeInterfaceRequest.$Properties;
        }

        /**
         * Properties of an InitializeInterfaceResponse.
         * @deprecated Use com.antigravity.InitializeInterfaceResponse.$Properties instead.
         */
        interface IInitializeInterfaceResponse extends com.antigravity.InitializeInterfaceResponse.$Properties {
        }

        /** Represents an InitializeInterfaceResponse. */
        class InitializeInterfaceResponse {

            /**
             * Constructs a new InitializeInterfaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InitializeInterfaceResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InitializeInterfaceResponse success. */
            success: boolean;

            /** InitializeInterfaceResponse message. */
            message: string;

            /**
             * Creates a new InitializeInterfaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InitializeInterfaceResponse instance
             */
            static create(properties: com.antigravity.InitializeInterfaceResponse.$Shape): com.antigravity.InitializeInterfaceResponse & com.antigravity.InitializeInterfaceResponse.$Shape;
            static create(properties?: com.antigravity.InitializeInterfaceResponse.$Properties): com.antigravity.InitializeInterfaceResponse;

            /**
             * Encodes the specified InitializeInterfaceResponse message. Does not implicitly {@link com.antigravity.InitializeInterfaceResponse.verify|verify} messages.
             * @param message InitializeInterfaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InitializeInterfaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InitializeInterfaceResponse message, length delimited. Does not implicitly {@link com.antigravity.InitializeInterfaceResponse.verify|verify} messages.
             * @param message InitializeInterfaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InitializeInterfaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InitializeInterfaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeInterfaceResponse & com.antigravity.InitializeInterfaceResponse.$Shape} InitializeInterfaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InitializeInterfaceResponse & com.antigravity.InitializeInterfaceResponse.$Shape;

            /**
             * Decodes an InitializeInterfaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeInterfaceResponse & com.antigravity.InitializeInterfaceResponse.$Shape} InitializeInterfaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InitializeInterfaceResponse & com.antigravity.InitializeInterfaceResponse.$Shape;

            /**
             * Verifies an InitializeInterfaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InitializeInterfaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InitializeInterfaceResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InitializeInterfaceResponse;

            /**
             * Creates a plain object from an InitializeInterfaceResponse message. Also converts values to other types if specified.
             * @param message InitializeInterfaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InitializeInterfaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InitializeInterfaceResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InitializeInterfaceResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InitializeInterfaceResponse {

            /** Properties of an InitializeInterfaceResponse. */
            interface $Properties {

                /** InitializeInterfaceResponse success */
                success?: (boolean|null);

                /** InitializeInterfaceResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InitializeInterfaceResponse. */
            type $Shape = com.antigravity.InitializeInterfaceResponse.$Properties;
        }

        /**
         * Properties of an InitializeRaceRequest.
         * @deprecated Use com.antigravity.InitializeRaceRequest.$Properties instead.
         */
        interface IInitializeRaceRequest extends com.antigravity.InitializeRaceRequest.$Properties {
        }

        /** Represents an InitializeRaceRequest. */
        class InitializeRaceRequest {

            /**
             * Constructs a new InitializeRaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InitializeRaceRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InitializeRaceRequest raceId. */
            raceId: string;

            /** InitializeRaceRequest driverIds. */
            driverIds: string[];

            /** InitializeRaceRequest isDemoMode. */
            isDemoMode: boolean;

            /** InitializeRaceRequest demoConfig. */
            demoConfig?: (com.antigravity.DemoConfig.$Properties|null);

            /**
             * Creates a new InitializeRaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InitializeRaceRequest instance
             */
            static create(properties: com.antigravity.InitializeRaceRequest.$Shape): com.antigravity.InitializeRaceRequest & com.antigravity.InitializeRaceRequest.$Shape;
            static create(properties?: com.antigravity.InitializeRaceRequest.$Properties): com.antigravity.InitializeRaceRequest;

            /**
             * Encodes the specified InitializeRaceRequest message. Does not implicitly {@link com.antigravity.InitializeRaceRequest.verify|verify} messages.
             * @param message InitializeRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InitializeRaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InitializeRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.InitializeRaceRequest.verify|verify} messages.
             * @param message InitializeRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InitializeRaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeRaceRequest & com.antigravity.InitializeRaceRequest.$Shape} InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InitializeRaceRequest & com.antigravity.InitializeRaceRequest.$Shape;

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeRaceRequest & com.antigravity.InitializeRaceRequest.$Shape} InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InitializeRaceRequest & com.antigravity.InitializeRaceRequest.$Shape;

            /**
             * Verifies an InitializeRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InitializeRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InitializeRaceRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InitializeRaceRequest;

            /**
             * Creates a plain object from an InitializeRaceRequest message. Also converts values to other types if specified.
             * @param message InitializeRaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InitializeRaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InitializeRaceRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InitializeRaceRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InitializeRaceRequest {

            /** Properties of an InitializeRaceRequest. */
            interface $Properties {

                /** InitializeRaceRequest raceId */
                raceId?: (string|null);

                /** InitializeRaceRequest driverIds */
                driverIds?: (string[]|null);

                /** InitializeRaceRequest isDemoMode */
                isDemoMode?: (boolean|null);

                /** InitializeRaceRequest demoConfig */
                demoConfig?: (com.antigravity.DemoConfig.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InitializeRaceRequest. */
            type $Shape = com.antigravity.InitializeRaceRequest.$Properties;
        }

        /**
         * Properties of an InitializeRaceResponse.
         * @deprecated Use com.antigravity.InitializeRaceResponse.$Properties instead.
         */
        interface IInitializeRaceResponse extends com.antigravity.InitializeRaceResponse.$Properties {
        }

        /** Represents an InitializeRaceResponse. */
        class InitializeRaceResponse {

            /**
             * Constructs a new InitializeRaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InitializeRaceResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InitializeRaceResponse success. */
            success: boolean;

            /** InitializeRaceResponse errorCode. */
            errorCode: string;

            /** InitializeRaceResponse driverName. */
            driverName: string;

            /** InitializeRaceResponse teamNames. */
            teamNames: string[];

            /**
             * Creates a new InitializeRaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InitializeRaceResponse instance
             */
            static create(properties: com.antigravity.InitializeRaceResponse.$Shape): com.antigravity.InitializeRaceResponse & com.antigravity.InitializeRaceResponse.$Shape;
            static create(properties?: com.antigravity.InitializeRaceResponse.$Properties): com.antigravity.InitializeRaceResponse;

            /**
             * Encodes the specified InitializeRaceResponse message. Does not implicitly {@link com.antigravity.InitializeRaceResponse.verify|verify} messages.
             * @param message InitializeRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InitializeRaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InitializeRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.InitializeRaceResponse.verify|verify} messages.
             * @param message InitializeRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InitializeRaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InitializeRaceResponse & com.antigravity.InitializeRaceResponse.$Shape} InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InitializeRaceResponse & com.antigravity.InitializeRaceResponse.$Shape;

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InitializeRaceResponse & com.antigravity.InitializeRaceResponse.$Shape} InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InitializeRaceResponse & com.antigravity.InitializeRaceResponse.$Shape;

            /**
             * Verifies an InitializeRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InitializeRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InitializeRaceResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InitializeRaceResponse;

            /**
             * Creates a plain object from an InitializeRaceResponse message. Also converts values to other types if specified.
             * @param message InitializeRaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InitializeRaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InitializeRaceResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InitializeRaceResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InitializeRaceResponse {

            /** Properties of an InitializeRaceResponse. */
            interface $Properties {

                /** InitializeRaceResponse success */
                success?: (boolean|null);

                /** InitializeRaceResponse errorCode */
                errorCode?: (string|null);

                /** InitializeRaceResponse driverName */
                driverName?: (string|null);

                /** InitializeRaceResponse teamNames */
                teamNames?: (string[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InitializeRaceResponse. */
            type $Shape = com.antigravity.InitializeRaceResponse.$Properties;
        }

        /** InterfaceStatus enum. */
        enum InterfaceStatus {

            /** CONNECTED value */
            CONNECTED = 0,

            /** DISCONNECTED value */
            DISCONNECTED = 1,

            /** NO_DATA value */
            NO_DATA = 2
        }

        /**
         * Properties of an InterfaceEvent.
         * @deprecated Use com.antigravity.InterfaceEvent.$Properties instead.
         */
        interface IInterfaceEvent extends com.antigravity.InterfaceEvent.$Properties {
        }

        /** Represents an InterfaceEvent. */
        class InterfaceEvent {

            /**
             * Constructs a new InterfaceEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InterfaceEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InterfaceEvent lap. */
            lap?: (com.antigravity.LapEvent.$Properties|null);

            /** InterfaceEvent segment. */
            segment?: (com.antigravity.SegmentEvent.$Properties|null);

            /** InterfaceEvent status. */
            status?: (com.antigravity.InterfaceStatusEvent.$Properties|null);

            /** InterfaceEvent callbutton. */
            callbutton?: (com.antigravity.CallbuttonEvent.$Properties|null);

            /** InterfaceEvent analogData. */
            analogData?: (com.antigravity.InterfaceAnalogDataEvent.$Properties|null);

            /** InterfaceEvent digitalPin. */
            digitalPin?: (com.antigravity.InterfaceDigitalPinEvent.$Properties|null);

            /** InterfaceEvent event. */
            event?: ("lap"|"segment"|"status"|"callbutton"|"analogData"|"digitalPin");

            /**
             * Creates a new InterfaceEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InterfaceEvent instance
             */
            static create(properties: com.antigravity.InterfaceEvent.$Shape): com.antigravity.InterfaceEvent & com.antigravity.InterfaceEvent.$Shape;
            static create(properties?: com.antigravity.InterfaceEvent.$Properties): com.antigravity.InterfaceEvent;

            /**
             * Encodes the specified InterfaceEvent message. Does not implicitly {@link com.antigravity.InterfaceEvent.verify|verify} messages.
             * @param message InterfaceEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InterfaceEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InterfaceEvent message, length delimited. Does not implicitly {@link com.antigravity.InterfaceEvent.verify|verify} messages.
             * @param message InterfaceEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InterfaceEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InterfaceEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InterfaceEvent & com.antigravity.InterfaceEvent.$Shape} InterfaceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InterfaceEvent & com.antigravity.InterfaceEvent.$Shape;

            /**
             * Decodes an InterfaceEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InterfaceEvent & com.antigravity.InterfaceEvent.$Shape} InterfaceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InterfaceEvent & com.antigravity.InterfaceEvent.$Shape;

            /**
             * Verifies an InterfaceEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InterfaceEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InterfaceEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InterfaceEvent;

            /**
             * Creates a plain object from an InterfaceEvent message. Also converts values to other types if specified.
             * @param message InterfaceEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InterfaceEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InterfaceEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InterfaceEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InterfaceEvent {

            /** Properties of an InterfaceEvent. */
            interface $Properties {

                /** InterfaceEvent lap */
                lap?: (com.antigravity.LapEvent.$Properties|null);

                /** InterfaceEvent segment */
                segment?: (com.antigravity.SegmentEvent.$Properties|null);

                /** InterfaceEvent status */
                status?: (com.antigravity.InterfaceStatusEvent.$Properties|null);

                /** InterfaceEvent callbutton */
                callbutton?: (com.antigravity.CallbuttonEvent.$Properties|null);

                /** InterfaceEvent analogData */
                analogData?: (com.antigravity.InterfaceAnalogDataEvent.$Properties|null);

                /** InterfaceEvent digitalPin */
                digitalPin?: (com.antigravity.InterfaceDigitalPinEvent.$Properties|null);

                /** InterfaceEvent event */
                event?: ("lap"|"segment"|"status"|"callbutton"|"analogData"|"digitalPin");

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Narrowed shape of an InterfaceEvent. */
            type $Shape = {
  lap?: com.antigravity.LapEvent.$Shape|null;
  segment?: com.antigravity.SegmentEvent.$Shape|null;
  status?: com.antigravity.InterfaceStatusEvent.$Shape|null;
  callbutton?: com.antigravity.CallbuttonEvent.$Shape|null;
  analogData?: com.antigravity.InterfaceAnalogDataEvent.$Shape|null;
  digitalPin?: com.antigravity.InterfaceDigitalPinEvent.$Shape|null;
  $unknowns?: Uint8Array[];
} & (
  ({ event?: undefined; lap?: null; segment?: null; status?: null; callbutton?: null; analogData?: null; digitalPin?: null }|{ event?: "lap"; lap: com.antigravity.LapEvent.$Shape; segment?: null; status?: null; callbutton?: null; analogData?: null; digitalPin?: null }|{ event?: "segment"; lap?: null; segment: com.antigravity.SegmentEvent.$Shape; status?: null; callbutton?: null; analogData?: null; digitalPin?: null }|{ event?: "status"; lap?: null; segment?: null; status: com.antigravity.InterfaceStatusEvent.$Shape; callbutton?: null; analogData?: null; digitalPin?: null }|{ event?: "callbutton"; lap?: null; segment?: null; status?: null; callbutton: com.antigravity.CallbuttonEvent.$Shape; analogData?: null; digitalPin?: null }|{ event?: "analogData"; lap?: null; segment?: null; status?: null; callbutton?: null; analogData: com.antigravity.InterfaceAnalogDataEvent.$Shape; digitalPin?: null }|{ event?: "digitalPin"; lap?: null; segment?: null; status?: null; callbutton?: null; analogData?: null; digitalPin: com.antigravity.InterfaceDigitalPinEvent.$Shape })
);
        }

        /**
         * Properties of an InterfaceDigitalPinEvent.
         * @deprecated Use com.antigravity.InterfaceDigitalPinEvent.$Properties instead.
         */
        interface IInterfaceDigitalPinEvent extends com.antigravity.InterfaceDigitalPinEvent.$Properties {
        }

        /** Represents an InterfaceDigitalPinEvent. */
        class InterfaceDigitalPinEvent {

            /**
             * Constructs a new InterfaceDigitalPinEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InterfaceDigitalPinEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InterfaceDigitalPinEvent pin. */
            pin: number;

            /** InterfaceDigitalPinEvent state. */
            state: number;

            /** InterfaceDigitalPinEvent isDigital. */
            isDigital: boolean;

            /** InterfaceDigitalPinEvent interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new InterfaceDigitalPinEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InterfaceDigitalPinEvent instance
             */
            static create(properties: com.antigravity.InterfaceDigitalPinEvent.$Shape): com.antigravity.InterfaceDigitalPinEvent & com.antigravity.InterfaceDigitalPinEvent.$Shape;
            static create(properties?: com.antigravity.InterfaceDigitalPinEvent.$Properties): com.antigravity.InterfaceDigitalPinEvent;

            /**
             * Encodes the specified InterfaceDigitalPinEvent message. Does not implicitly {@link com.antigravity.InterfaceDigitalPinEvent.verify|verify} messages.
             * @param message InterfaceDigitalPinEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InterfaceDigitalPinEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InterfaceDigitalPinEvent message, length delimited. Does not implicitly {@link com.antigravity.InterfaceDigitalPinEvent.verify|verify} messages.
             * @param message InterfaceDigitalPinEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InterfaceDigitalPinEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InterfaceDigitalPinEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InterfaceDigitalPinEvent & com.antigravity.InterfaceDigitalPinEvent.$Shape} InterfaceDigitalPinEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InterfaceDigitalPinEvent & com.antigravity.InterfaceDigitalPinEvent.$Shape;

            /**
             * Decodes an InterfaceDigitalPinEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InterfaceDigitalPinEvent & com.antigravity.InterfaceDigitalPinEvent.$Shape} InterfaceDigitalPinEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InterfaceDigitalPinEvent & com.antigravity.InterfaceDigitalPinEvent.$Shape;

            /**
             * Verifies an InterfaceDigitalPinEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InterfaceDigitalPinEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InterfaceDigitalPinEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InterfaceDigitalPinEvent;

            /**
             * Creates a plain object from an InterfaceDigitalPinEvent message. Also converts values to other types if specified.
             * @param message InterfaceDigitalPinEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InterfaceDigitalPinEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InterfaceDigitalPinEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InterfaceDigitalPinEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InterfaceDigitalPinEvent {

            /** Properties of an InterfaceDigitalPinEvent. */
            interface $Properties {

                /** InterfaceDigitalPinEvent pin */
                pin?: (number|null);

                /** InterfaceDigitalPinEvent state */
                state?: (number|null);

                /** InterfaceDigitalPinEvent isDigital */
                isDigital?: (boolean|null);

                /** InterfaceDigitalPinEvent interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InterfaceDigitalPinEvent. */
            type $Shape = com.antigravity.InterfaceDigitalPinEvent.$Properties;
        }

        /**
         * Properties of an InterfaceStatusEvent.
         * @deprecated Use com.antigravity.InterfaceStatusEvent.$Properties instead.
         */
        interface IInterfaceStatusEvent extends com.antigravity.InterfaceStatusEvent.$Properties {
        }

        /** Represents an InterfaceStatusEvent. */
        class InterfaceStatusEvent {

            /**
             * Constructs a new InterfaceStatusEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InterfaceStatusEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InterfaceStatusEvent status. */
            status: com.antigravity.InterfaceStatus;

            /** InterfaceStatusEvent interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new InterfaceStatusEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InterfaceStatusEvent instance
             */
            static create(properties: com.antigravity.InterfaceStatusEvent.$Shape): com.antigravity.InterfaceStatusEvent & com.antigravity.InterfaceStatusEvent.$Shape;
            static create(properties?: com.antigravity.InterfaceStatusEvent.$Properties): com.antigravity.InterfaceStatusEvent;

            /**
             * Encodes the specified InterfaceStatusEvent message. Does not implicitly {@link com.antigravity.InterfaceStatusEvent.verify|verify} messages.
             * @param message InterfaceStatusEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InterfaceStatusEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InterfaceStatusEvent message, length delimited. Does not implicitly {@link com.antigravity.InterfaceStatusEvent.verify|verify} messages.
             * @param message InterfaceStatusEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InterfaceStatusEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InterfaceStatusEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InterfaceStatusEvent & com.antigravity.InterfaceStatusEvent.$Shape} InterfaceStatusEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InterfaceStatusEvent & com.antigravity.InterfaceStatusEvent.$Shape;

            /**
             * Decodes an InterfaceStatusEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InterfaceStatusEvent & com.antigravity.InterfaceStatusEvent.$Shape} InterfaceStatusEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InterfaceStatusEvent & com.antigravity.InterfaceStatusEvent.$Shape;

            /**
             * Verifies an InterfaceStatusEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InterfaceStatusEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InterfaceStatusEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InterfaceStatusEvent;

            /**
             * Creates a plain object from an InterfaceStatusEvent message. Also converts values to other types if specified.
             * @param message InterfaceStatusEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InterfaceStatusEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InterfaceStatusEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InterfaceStatusEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InterfaceStatusEvent {

            /** Properties of an InterfaceStatusEvent. */
            interface $Properties {

                /** InterfaceStatusEvent status */
                status?: (com.antigravity.InterfaceStatus|null);

                /** InterfaceStatusEvent interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InterfaceStatusEvent. */
            type $Shape = com.antigravity.InterfaceStatusEvent.$Properties;
        }

        /**
         * Properties of a LapEvent.
         * @deprecated Use com.antigravity.LapEvent.$Properties instead.
         */
        interface ILapEvent extends com.antigravity.LapEvent.$Properties {
        }

        /** Represents a LapEvent. */
        class LapEvent {

            /**
             * Constructs a new LapEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.LapEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** LapEvent lane. */
            lane: number;

            /** LapEvent lapTime. */
            lapTime: number;

            /** LapEvent interfaceId. */
            interfaceId: number;

            /** LapEvent interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new LapEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LapEvent instance
             */
            static create(properties: com.antigravity.LapEvent.$Shape): com.antigravity.LapEvent & com.antigravity.LapEvent.$Shape;
            static create(properties?: com.antigravity.LapEvent.$Properties): com.antigravity.LapEvent;

            /**
             * Encodes the specified LapEvent message. Does not implicitly {@link com.antigravity.LapEvent.verify|verify} messages.
             * @param message LapEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.LapEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LapEvent message, length delimited. Does not implicitly {@link com.antigravity.LapEvent.verify|verify} messages.
             * @param message LapEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.LapEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LapEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.LapEvent & com.antigravity.LapEvent.$Shape} LapEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.LapEvent & com.antigravity.LapEvent.$Shape;

            /**
             * Decodes a LapEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.LapEvent & com.antigravity.LapEvent.$Shape} LapEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.LapEvent & com.antigravity.LapEvent.$Shape;

            /**
             * Verifies a LapEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LapEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LapEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.LapEvent;

            /**
             * Creates a plain object from a LapEvent message. Also converts values to other types if specified.
             * @param message LapEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.LapEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LapEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for LapEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace LapEvent {

            /** Properties of a LapEvent. */
            interface $Properties {

                /** LapEvent lane */
                lane?: (number|null);

                /** LapEvent lapTime */
                lapTime?: (number|null);

                /** LapEvent interfaceId */
                interfaceId?: (number|null);

                /** LapEvent interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a LapEvent. */
            type $Shape = com.antigravity.LapEvent.$Properties;
        }

        /**
         * Properties of a SegmentEvent.
         * @deprecated Use com.antigravity.SegmentEvent.$Properties instead.
         */
        interface ISegmentEvent extends com.antigravity.SegmentEvent.$Properties {
        }

        /** Represents a SegmentEvent. */
        class SegmentEvent {

            /**
             * Constructs a new SegmentEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SegmentEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SegmentEvent lane. */
            lane: number;

            /** SegmentEvent segmentTime. */
            segmentTime: number;

            /** SegmentEvent interfaceId. */
            interfaceId: number;

            /** SegmentEvent interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new SegmentEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SegmentEvent instance
             */
            static create(properties: com.antigravity.SegmentEvent.$Shape): com.antigravity.SegmentEvent & com.antigravity.SegmentEvent.$Shape;
            static create(properties?: com.antigravity.SegmentEvent.$Properties): com.antigravity.SegmentEvent;

            /**
             * Encodes the specified SegmentEvent message. Does not implicitly {@link com.antigravity.SegmentEvent.verify|verify} messages.
             * @param message SegmentEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SegmentEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SegmentEvent message, length delimited. Does not implicitly {@link com.antigravity.SegmentEvent.verify|verify} messages.
             * @param message SegmentEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SegmentEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SegmentEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SegmentEvent & com.antigravity.SegmentEvent.$Shape} SegmentEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SegmentEvent & com.antigravity.SegmentEvent.$Shape;

            /**
             * Decodes a SegmentEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SegmentEvent & com.antigravity.SegmentEvent.$Shape} SegmentEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SegmentEvent & com.antigravity.SegmentEvent.$Shape;

            /**
             * Verifies a SegmentEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SegmentEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SegmentEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SegmentEvent;

            /**
             * Creates a plain object from a SegmentEvent message. Also converts values to other types if specified.
             * @param message SegmentEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SegmentEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SegmentEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SegmentEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SegmentEvent {

            /** Properties of a SegmentEvent. */
            interface $Properties {

                /** SegmentEvent lane */
                lane?: (number|null);

                /** SegmentEvent segmentTime */
                segmentTime?: (number|null);

                /** SegmentEvent interfaceId */
                interfaceId?: (number|null);

                /** SegmentEvent interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SegmentEvent. */
            type $Shape = com.antigravity.SegmentEvent.$Properties;
        }

        /**
         * Properties of a CallbuttonEvent.
         * @deprecated Use com.antigravity.CallbuttonEvent.$Properties instead.
         */
        interface ICallbuttonEvent extends com.antigravity.CallbuttonEvent.$Properties {
        }

        /** Represents a CallbuttonEvent. */
        class CallbuttonEvent {

            /**
             * Constructs a new CallbuttonEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.CallbuttonEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** CallbuttonEvent lane. */
            lane: number;

            /** CallbuttonEvent interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new CallbuttonEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallbuttonEvent instance
             */
            static create(properties: com.antigravity.CallbuttonEvent.$Shape): com.antigravity.CallbuttonEvent & com.antigravity.CallbuttonEvent.$Shape;
            static create(properties?: com.antigravity.CallbuttonEvent.$Properties): com.antigravity.CallbuttonEvent;

            /**
             * Encodes the specified CallbuttonEvent message. Does not implicitly {@link com.antigravity.CallbuttonEvent.verify|verify} messages.
             * @param message CallbuttonEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.CallbuttonEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallbuttonEvent message, length delimited. Does not implicitly {@link com.antigravity.CallbuttonEvent.verify|verify} messages.
             * @param message CallbuttonEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.CallbuttonEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallbuttonEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.CallbuttonEvent & com.antigravity.CallbuttonEvent.$Shape} CallbuttonEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.CallbuttonEvent & com.antigravity.CallbuttonEvent.$Shape;

            /**
             * Decodes a CallbuttonEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.CallbuttonEvent & com.antigravity.CallbuttonEvent.$Shape} CallbuttonEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.CallbuttonEvent & com.antigravity.CallbuttonEvent.$Shape;

            /**
             * Verifies a CallbuttonEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallbuttonEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallbuttonEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.CallbuttonEvent;

            /**
             * Creates a plain object from a CallbuttonEvent message. Also converts values to other types if specified.
             * @param message CallbuttonEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.CallbuttonEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallbuttonEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallbuttonEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallbuttonEvent {

            /** Properties of a CallbuttonEvent. */
            interface $Properties {

                /** CallbuttonEvent lane */
                lane?: (number|null);

                /** CallbuttonEvent interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallbuttonEvent. */
            type $Shape = com.antigravity.CallbuttonEvent.$Properties;
        }

        /**
         * Properties of an InterfaceAnalogDataEvent.
         * @deprecated Use com.antigravity.InterfaceAnalogDataEvent.$Properties instead.
         */
        interface IInterfaceAnalogDataEvent extends com.antigravity.InterfaceAnalogDataEvent.$Properties {
        }

        /** Represents an InterfaceAnalogDataEvent. */
        class InterfaceAnalogDataEvent {

            /**
             * Constructs a new InterfaceAnalogDataEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.InterfaceAnalogDataEvent.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** InterfaceAnalogDataEvent pin. */
            pin: number;

            /** InterfaceAnalogDataEvent value. */
            value: number;

            /** InterfaceAnalogDataEvent interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new InterfaceAnalogDataEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InterfaceAnalogDataEvent instance
             */
            static create(properties: com.antigravity.InterfaceAnalogDataEvent.$Shape): com.antigravity.InterfaceAnalogDataEvent & com.antigravity.InterfaceAnalogDataEvent.$Shape;
            static create(properties?: com.antigravity.InterfaceAnalogDataEvent.$Properties): com.antigravity.InterfaceAnalogDataEvent;

            /**
             * Encodes the specified InterfaceAnalogDataEvent message. Does not implicitly {@link com.antigravity.InterfaceAnalogDataEvent.verify|verify} messages.
             * @param message InterfaceAnalogDataEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.InterfaceAnalogDataEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InterfaceAnalogDataEvent message, length delimited. Does not implicitly {@link com.antigravity.InterfaceAnalogDataEvent.verify|verify} messages.
             * @param message InterfaceAnalogDataEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.InterfaceAnalogDataEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InterfaceAnalogDataEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.InterfaceAnalogDataEvent & com.antigravity.InterfaceAnalogDataEvent.$Shape} InterfaceAnalogDataEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InterfaceAnalogDataEvent & com.antigravity.InterfaceAnalogDataEvent.$Shape;

            /**
             * Decodes an InterfaceAnalogDataEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.InterfaceAnalogDataEvent & com.antigravity.InterfaceAnalogDataEvent.$Shape} InterfaceAnalogDataEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InterfaceAnalogDataEvent & com.antigravity.InterfaceAnalogDataEvent.$Shape;

            /**
             * Verifies an InterfaceAnalogDataEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InterfaceAnalogDataEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InterfaceAnalogDataEvent
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.InterfaceAnalogDataEvent;

            /**
             * Creates a plain object from an InterfaceAnalogDataEvent message. Also converts values to other types if specified.
             * @param message InterfaceAnalogDataEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.InterfaceAnalogDataEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InterfaceAnalogDataEvent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InterfaceAnalogDataEvent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InterfaceAnalogDataEvent {

            /** Properties of an InterfaceAnalogDataEvent. */
            interface $Properties {

                /** InterfaceAnalogDataEvent pin */
                pin?: (number|null);

                /** InterfaceAnalogDataEvent value */
                value?: (number|null);

                /** InterfaceAnalogDataEvent interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InterfaceAnalogDataEvent. */
            type $Shape = com.antigravity.InterfaceAnalogDataEvent.$Properties;
        }

        /**
         * Properties of a LaneModel.
         * @deprecated Use com.antigravity.LaneModel.$Properties instead.
         */
        interface ILaneModel extends com.antigravity.LaneModel.$Properties {
        }

        /** Represents a LaneModel. */
        class LaneModel {

            /**
             * Constructs a new LaneModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.LaneModel.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** LaneModel backgroundColor. */
            backgroundColor: string;

            /** LaneModel foregroundColor. */
            foregroundColor: string;

            /** LaneModel length. */
            length: number;

            /** LaneModel objectId. */
            objectId: string;

            /**
             * Creates a new LaneModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LaneModel instance
             */
            static create(properties: com.antigravity.LaneModel.$Shape): com.antigravity.LaneModel & com.antigravity.LaneModel.$Shape;
            static create(properties?: com.antigravity.LaneModel.$Properties): com.antigravity.LaneModel;

            /**
             * Encodes the specified LaneModel message. Does not implicitly {@link com.antigravity.LaneModel.verify|verify} messages.
             * @param message LaneModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.LaneModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LaneModel message, length delimited. Does not implicitly {@link com.antigravity.LaneModel.verify|verify} messages.
             * @param message LaneModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.LaneModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LaneModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.LaneModel & com.antigravity.LaneModel.$Shape} LaneModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.LaneModel & com.antigravity.LaneModel.$Shape;

            /**
             * Decodes a LaneModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.LaneModel & com.antigravity.LaneModel.$Shape} LaneModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.LaneModel & com.antigravity.LaneModel.$Shape;

            /**
             * Verifies a LaneModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LaneModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LaneModel
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.LaneModel;

            /**
             * Creates a plain object from a LaneModel message. Also converts values to other types if specified.
             * @param message LaneModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.LaneModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LaneModel to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for LaneModel
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace LaneModel {

            /** Properties of a LaneModel. */
            interface $Properties {

                /** LaneModel backgroundColor */
                backgroundColor?: (string|null);

                /** LaneModel foregroundColor */
                foregroundColor?: (string|null);

                /** LaneModel length */
                length?: (number|null);

                /** LaneModel objectId */
                objectId?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a LaneModel. */
            type $Shape = com.antigravity.LaneModel.$Properties;
        }

        /**
         * Properties of a NextHeatRequest.
         * @deprecated Use com.antigravity.NextHeatRequest.$Properties instead.
         */
        interface INextHeatRequest extends com.antigravity.NextHeatRequest.$Properties {
        }

        /** Represents a NextHeatRequest. */
        class NextHeatRequest {

            /**
             * Constructs a new NextHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.NextHeatRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new NextHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NextHeatRequest instance
             */
            static create(properties: com.antigravity.NextHeatRequest.$Shape): com.antigravity.NextHeatRequest & com.antigravity.NextHeatRequest.$Shape;
            static create(properties?: com.antigravity.NextHeatRequest.$Properties): com.antigravity.NextHeatRequest;

            /**
             * Encodes the specified NextHeatRequest message. Does not implicitly {@link com.antigravity.NextHeatRequest.verify|verify} messages.
             * @param message NextHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.NextHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NextHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.NextHeatRequest.verify|verify} messages.
             * @param message NextHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.NextHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NextHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.NextHeatRequest & com.antigravity.NextHeatRequest.$Shape} NextHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.NextHeatRequest & com.antigravity.NextHeatRequest.$Shape;

            /**
             * Decodes a NextHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.NextHeatRequest & com.antigravity.NextHeatRequest.$Shape} NextHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.NextHeatRequest & com.antigravity.NextHeatRequest.$Shape;

            /**
             * Verifies a NextHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NextHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NextHeatRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.NextHeatRequest;

            /**
             * Creates a plain object from a NextHeatRequest message. Also converts values to other types if specified.
             * @param message NextHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.NextHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NextHeatRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for NextHeatRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace NextHeatRequest {

            /** Properties of a NextHeatRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a NextHeatRequest. */
            type $Shape = com.antigravity.NextHeatRequest.$Properties;
        }

        /**
         * Properties of a NextHeatResponse.
         * @deprecated Use com.antigravity.NextHeatResponse.$Properties instead.
         */
        interface INextHeatResponse extends com.antigravity.NextHeatResponse.$Properties {
        }

        /** Represents a NextHeatResponse. */
        class NextHeatResponse {

            /**
             * Constructs a new NextHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.NextHeatResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** NextHeatResponse success. */
            success: boolean;

            /** NextHeatResponse message. */
            message: string;

            /**
             * Creates a new NextHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NextHeatResponse instance
             */
            static create(properties: com.antigravity.NextHeatResponse.$Shape): com.antigravity.NextHeatResponse & com.antigravity.NextHeatResponse.$Shape;
            static create(properties?: com.antigravity.NextHeatResponse.$Properties): com.antigravity.NextHeatResponse;

            /**
             * Encodes the specified NextHeatResponse message. Does not implicitly {@link com.antigravity.NextHeatResponse.verify|verify} messages.
             * @param message NextHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.NextHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NextHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.NextHeatResponse.verify|verify} messages.
             * @param message NextHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.NextHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NextHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.NextHeatResponse & com.antigravity.NextHeatResponse.$Shape} NextHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.NextHeatResponse & com.antigravity.NextHeatResponse.$Shape;

            /**
             * Decodes a NextHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.NextHeatResponse & com.antigravity.NextHeatResponse.$Shape} NextHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.NextHeatResponse & com.antigravity.NextHeatResponse.$Shape;

            /**
             * Verifies a NextHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NextHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NextHeatResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.NextHeatResponse;

            /**
             * Creates a plain object from a NextHeatResponse message. Also converts values to other types if specified.
             * @param message NextHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.NextHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NextHeatResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for NextHeatResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace NextHeatResponse {

            /** Properties of a NextHeatResponse. */
            interface $Properties {

                /** NextHeatResponse success */
                success?: (boolean|null);

                /** NextHeatResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a NextHeatResponse. */
            type $Shape = com.antigravity.NextHeatResponse.$Properties;
        }

        /**
         * Properties of a PauseRaceRequest.
         * @deprecated Use com.antigravity.PauseRaceRequest.$Properties instead.
         */
        interface IPauseRaceRequest extends com.antigravity.PauseRaceRequest.$Properties {
        }

        /** Represents a PauseRaceRequest. */
        class PauseRaceRequest {

            /**
             * Constructs a new PauseRaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.PauseRaceRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new PauseRaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PauseRaceRequest instance
             */
            static create(properties: com.antigravity.PauseRaceRequest.$Shape): com.antigravity.PauseRaceRequest & com.antigravity.PauseRaceRequest.$Shape;
            static create(properties?: com.antigravity.PauseRaceRequest.$Properties): com.antigravity.PauseRaceRequest;

            /**
             * Encodes the specified PauseRaceRequest message. Does not implicitly {@link com.antigravity.PauseRaceRequest.verify|verify} messages.
             * @param message PauseRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.PauseRaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PauseRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.PauseRaceRequest.verify|verify} messages.
             * @param message PauseRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.PauseRaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PauseRaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.PauseRaceRequest & com.antigravity.PauseRaceRequest.$Shape} PauseRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.PauseRaceRequest & com.antigravity.PauseRaceRequest.$Shape;

            /**
             * Decodes a PauseRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.PauseRaceRequest & com.antigravity.PauseRaceRequest.$Shape} PauseRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.PauseRaceRequest & com.antigravity.PauseRaceRequest.$Shape;

            /**
             * Verifies a PauseRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PauseRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PauseRaceRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.PauseRaceRequest;

            /**
             * Creates a plain object from a PauseRaceRequest message. Also converts values to other types if specified.
             * @param message PauseRaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.PauseRaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PauseRaceRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for PauseRaceRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace PauseRaceRequest {

            /** Properties of a PauseRaceRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a PauseRaceRequest. */
            type $Shape = com.antigravity.PauseRaceRequest.$Properties;
        }

        /**
         * Properties of a PauseRaceResponse.
         * @deprecated Use com.antigravity.PauseRaceResponse.$Properties instead.
         */
        interface IPauseRaceResponse extends com.antigravity.PauseRaceResponse.$Properties {
        }

        /** Represents a PauseRaceResponse. */
        class PauseRaceResponse {

            /**
             * Constructs a new PauseRaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.PauseRaceResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** PauseRaceResponse success. */
            success: boolean;

            /** PauseRaceResponse message. */
            message: string;

            /**
             * Creates a new PauseRaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PauseRaceResponse instance
             */
            static create(properties: com.antigravity.PauseRaceResponse.$Shape): com.antigravity.PauseRaceResponse & com.antigravity.PauseRaceResponse.$Shape;
            static create(properties?: com.antigravity.PauseRaceResponse.$Properties): com.antigravity.PauseRaceResponse;

            /**
             * Encodes the specified PauseRaceResponse message. Does not implicitly {@link com.antigravity.PauseRaceResponse.verify|verify} messages.
             * @param message PauseRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.PauseRaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PauseRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.PauseRaceResponse.verify|verify} messages.
             * @param message PauseRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.PauseRaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PauseRaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.PauseRaceResponse & com.antigravity.PauseRaceResponse.$Shape} PauseRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.PauseRaceResponse & com.antigravity.PauseRaceResponse.$Shape;

            /**
             * Decodes a PauseRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.PauseRaceResponse & com.antigravity.PauseRaceResponse.$Shape} PauseRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.PauseRaceResponse & com.antigravity.PauseRaceResponse.$Shape;

            /**
             * Verifies a PauseRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PauseRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PauseRaceResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.PauseRaceResponse;

            /**
             * Creates a plain object from a PauseRaceResponse message. Also converts values to other types if specified.
             * @param message PauseRaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.PauseRaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PauseRaceResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for PauseRaceResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace PauseRaceResponse {

            /** Properties of a PauseRaceResponse. */
            interface $Properties {

                /** PauseRaceResponse success */
                success?: (boolean|null);

                /** PauseRaceResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a PauseRaceResponse. */
            type $Shape = com.antigravity.PauseRaceResponse.$Properties;
        }

        /**
         * Properties of a HeatScoring.
         * @deprecated Use com.antigravity.HeatScoring.$Properties instead.
         */
        interface IHeatScoring extends com.antigravity.HeatScoring.$Properties {
        }

        /** Represents a HeatScoring. */
        class HeatScoring {

            /**
             * Constructs a new HeatScoring.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.HeatScoring.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** HeatScoring finishMethod. */
            finishMethod: com.antigravity.HeatScoring.FinishMethod;

            /** HeatScoring finishValue. */
            finishValue: (number|Long);

            /** HeatScoring heatRanking. */
            heatRanking: com.antigravity.HeatScoring.HeatRanking;

            /** HeatScoring heatRankingTiebreaker. */
            heatRankingTiebreaker: com.antigravity.HeatScoring.HeatRankingTiebreaker;

            /** HeatScoring allowFinish. */
            allowFinish: com.antigravity.HeatScoring.AllowFinish;

            /**
             * Creates a new HeatScoring instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HeatScoring instance
             */
            static create(properties: com.antigravity.HeatScoring.$Shape): com.antigravity.HeatScoring & com.antigravity.HeatScoring.$Shape;
            static create(properties?: com.antigravity.HeatScoring.$Properties): com.antigravity.HeatScoring;

            /**
             * Encodes the specified HeatScoring message. Does not implicitly {@link com.antigravity.HeatScoring.verify|verify} messages.
             * @param message HeatScoring message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.HeatScoring.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HeatScoring message, length delimited. Does not implicitly {@link com.antigravity.HeatScoring.verify|verify} messages.
             * @param message HeatScoring message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.HeatScoring.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HeatScoring message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.HeatScoring & com.antigravity.HeatScoring.$Shape} HeatScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.HeatScoring & com.antigravity.HeatScoring.$Shape;

            /**
             * Decodes a HeatScoring message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.HeatScoring & com.antigravity.HeatScoring.$Shape} HeatScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.HeatScoring & com.antigravity.HeatScoring.$Shape;

            /**
             * Verifies a HeatScoring message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HeatScoring message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HeatScoring
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.HeatScoring;

            /**
             * Creates a plain object from a HeatScoring message. Also converts values to other types if specified.
             * @param message HeatScoring
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.HeatScoring, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HeatScoring to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for HeatScoring
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace HeatScoring {

            /** Properties of a HeatScoring. */
            interface $Properties {

                /** HeatScoring finishMethod */
                finishMethod?: (com.antigravity.HeatScoring.FinishMethod|null);

                /** HeatScoring finishValue */
                finishValue?: (number|Long|null);

                /** HeatScoring heatRanking */
                heatRanking?: (com.antigravity.HeatScoring.HeatRanking|null);

                /** HeatScoring heatRankingTiebreaker */
                heatRankingTiebreaker?: (com.antigravity.HeatScoring.HeatRankingTiebreaker|null);

                /** HeatScoring allowFinish */
                allowFinish?: (com.antigravity.HeatScoring.AllowFinish|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a HeatScoring. */
            type $Shape = com.antigravity.HeatScoring.$Properties;

            /** FinishMethod enum. */
            enum FinishMethod {

                /** Lap value */
                Lap = 0,

                /** Timed value */
                Timed = 1
            }

            /** HeatRanking enum. */
            enum HeatRanking {

                /** HR_LAP_COUNT value */
                HR_LAP_COUNT = 0,

                /** HR_FASTEST_LAP value */
                HR_FASTEST_LAP = 1,

                /** HR_TOTAL_TIME value */
                HR_TOTAL_TIME = 2
            }

            /** HeatRankingTiebreaker enum. */
            enum HeatRankingTiebreaker {

                /** HRT_FASTEST_LAP_TIME value */
                HRT_FASTEST_LAP_TIME = 0,

                /** HRT_MEDIAN_LAP_TIME value */
                HRT_MEDIAN_LAP_TIME = 1,

                /** HRT_AVERAGE_LAP_TIME value */
                HRT_AVERAGE_LAP_TIME = 2
            }

            /** AllowFinish enum. */
            enum AllowFinish {

                /** AF_NONE value */
                AF_NONE = 0,

                /** AF_ALLOW value */
                AF_ALLOW = 1,

                /** AF_SINGLE_LAP value */
                AF_SINGLE_LAP = 2,

                /** AF_NONE_AUTO_SEGMENTS value */
                AF_NONE_AUTO_SEGMENTS = 3
            }
        }

        /**
         * Properties of an OverallScoring.
         * @deprecated Use com.antigravity.OverallScoring.$Properties instead.
         */
        interface IOverallScoring extends com.antigravity.OverallScoring.$Properties {
        }

        /** Represents an OverallScoring. */
        class OverallScoring {

            /**
             * Constructs a new OverallScoring.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.OverallScoring.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** OverallScoring droppedHeats. */
            droppedHeats: number;

            /** OverallScoring rankingMethod. */
            rankingMethod: com.antigravity.OverallScoring.OverallRanking;

            /** OverallScoring tiebreaker. */
            tiebreaker: com.antigravity.OverallScoring.OverallRankingTiebreaker;

            /**
             * Creates a new OverallScoring instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OverallScoring instance
             */
            static create(properties: com.antigravity.OverallScoring.$Shape): com.antigravity.OverallScoring & com.antigravity.OverallScoring.$Shape;
            static create(properties?: com.antigravity.OverallScoring.$Properties): com.antigravity.OverallScoring;

            /**
             * Encodes the specified OverallScoring message. Does not implicitly {@link com.antigravity.OverallScoring.verify|verify} messages.
             * @param message OverallScoring message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.OverallScoring.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OverallScoring message, length delimited. Does not implicitly {@link com.antigravity.OverallScoring.verify|verify} messages.
             * @param message OverallScoring message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.OverallScoring.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OverallScoring message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.OverallScoring & com.antigravity.OverallScoring.$Shape} OverallScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.OverallScoring & com.antigravity.OverallScoring.$Shape;

            /**
             * Decodes an OverallScoring message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.OverallScoring & com.antigravity.OverallScoring.$Shape} OverallScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.OverallScoring & com.antigravity.OverallScoring.$Shape;

            /**
             * Verifies an OverallScoring message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OverallScoring message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OverallScoring
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.OverallScoring;

            /**
             * Creates a plain object from an OverallScoring message. Also converts values to other types if specified.
             * @param message OverallScoring
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.OverallScoring, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OverallScoring to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for OverallScoring
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace OverallScoring {

            /** Properties of an OverallScoring. */
            interface $Properties {

                /** OverallScoring droppedHeats */
                droppedHeats?: (number|null);

                /** OverallScoring rankingMethod */
                rankingMethod?: (com.antigravity.OverallScoring.OverallRanking|null);

                /** OverallScoring tiebreaker */
                tiebreaker?: (com.antigravity.OverallScoring.OverallRankingTiebreaker|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an OverallScoring. */
            type $Shape = com.antigravity.OverallScoring.$Properties;

            /** OverallRanking enum. */
            enum OverallRanking {

                /** OR_LAP_COUNT value */
                OR_LAP_COUNT = 0,

                /** OR_FASTEST_LAP value */
                OR_FASTEST_LAP = 1,

                /** OR_TOTAL_TIME value */
                OR_TOTAL_TIME = 2,

                /** OR_AVERAGE_LAP value */
                OR_AVERAGE_LAP = 3
            }

            /** OverallRankingTiebreaker enum. */
            enum OverallRankingTiebreaker {

                /** ORT_FASTEST_LAP_TIME value */
                ORT_FASTEST_LAP_TIME = 0,

                /** ORT_MEDIAN_LAP_TIME value */
                ORT_MEDIAN_LAP_TIME = 1,

                /** ORT_AVERAGE_LAP_TIME value */
                ORT_AVERAGE_LAP_TIME = 2,

                /** ORT_TOTAL_TIME value */
                ORT_TOTAL_TIME = 3
            }
        }

        /**
         * Properties of a TeamOptions.
         * @deprecated Use com.antigravity.TeamOptions.$Properties instead.
         */
        interface ITeamOptions extends com.antigravity.TeamOptions.$Properties {
        }

        /** Represents a TeamOptions. */
        class TeamOptions {

            /**
             * Constructs a new TeamOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.TeamOptions.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** TeamOptions heatLapLimit. */
            heatLapLimit: number;

            /** TeamOptions heatTimeLimit. */
            heatTimeLimit: number;

            /** TeamOptions overallLapLimit. */
            overallLapLimit: number;

            /** TeamOptions overallTimeLimit. */
            overallTimeLimit: number;

            /** TeamOptions requirePitStopChangeDriver. */
            requirePitStopChangeDriver: boolean;

            /**
             * Creates a new TeamOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TeamOptions instance
             */
            static create(properties: com.antigravity.TeamOptions.$Shape): com.antigravity.TeamOptions & com.antigravity.TeamOptions.$Shape;
            static create(properties?: com.antigravity.TeamOptions.$Properties): com.antigravity.TeamOptions;

            /**
             * Encodes the specified TeamOptions message. Does not implicitly {@link com.antigravity.TeamOptions.verify|verify} messages.
             * @param message TeamOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.TeamOptions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TeamOptions message, length delimited. Does not implicitly {@link com.antigravity.TeamOptions.verify|verify} messages.
             * @param message TeamOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.TeamOptions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TeamOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.TeamOptions & com.antigravity.TeamOptions.$Shape} TeamOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.TeamOptions & com.antigravity.TeamOptions.$Shape;

            /**
             * Decodes a TeamOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.TeamOptions & com.antigravity.TeamOptions.$Shape} TeamOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.TeamOptions & com.antigravity.TeamOptions.$Shape;

            /**
             * Verifies a TeamOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TeamOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TeamOptions
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.TeamOptions;

            /**
             * Creates a plain object from a TeamOptions message. Also converts values to other types if specified.
             * @param message TeamOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.TeamOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TeamOptions to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for TeamOptions
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace TeamOptions {

            /** Properties of a TeamOptions. */
            interface $Properties {

                /** TeamOptions heatLapLimit */
                heatLapLimit?: (number|null);

                /** TeamOptions heatTimeLimit */
                heatTimeLimit?: (number|null);

                /** TeamOptions overallLapLimit */
                overallLapLimit?: (number|null);

                /** TeamOptions overallTimeLimit */
                overallTimeLimit?: (number|null);

                /** TeamOptions requirePitStopChangeDriver */
                requirePitStopChangeDriver?: (boolean|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a TeamOptions. */
            type $Shape = com.antigravity.TeamOptions.$Properties;
        }

        /** HeatRotationType enum. */
        enum HeatRotationType {

            /** ROUND_ROBIN value */
            ROUND_ROBIN = 0,

            /** FRIENDLY_ROUND_ROBIN value */
            FRIENDLY_ROUND_ROBIN = 1,

            /** EUROPEAN_ROUND_ROBIN value */
            EUROPEAN_ROUND_ROBIN = 2,

            /** SINGLE_HEAT value */
            SINGLE_HEAT = 3,

            /** SINGLE_HEAT_SOLO value */
            SINGLE_HEAT_SOLO = 4,

            /** CUSTOM_ROUND_ROBIN value */
            CUSTOM_ROUND_ROBIN = 5,

            /** CUSTOM value */
            CUSTOM = 6
        }

        /**
         * Properties of a RaceModel.
         * @deprecated Use com.antigravity.RaceModel.$Properties instead.
         */
        interface IRaceModel extends com.antigravity.RaceModel.$Properties {
        }

        /** Represents a RaceModel. */
        class RaceModel {

            /**
             * Constructs a new RaceModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RaceModel.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RaceModel model. */
            model?: (com.antigravity.Model.$Properties|null);

            /** RaceModel name. */
            name: string;

            /** RaceModel track. */
            track?: (com.antigravity.TrackModel.$Properties|null);

            /** RaceModel heatScoring. */
            heatScoring?: (com.antigravity.HeatScoring.$Properties|null);

            /** RaceModel overallScoring. */
            overallScoring?: (com.antigravity.OverallScoring.$Properties|null);

            /** RaceModel minLapTime. */
            minLapTime: number;

            /** RaceModel fuelOptions. */
            fuelOptions?: (com.antigravity.AnalogFuelOptions.$Properties|null);

            /** RaceModel digitalFuelOptions. */
            digitalFuelOptions?: (com.antigravity.DigitalFuelOptions.$Properties|null);

            /** RaceModel teamOptions. */
            teamOptions?: (com.antigravity.TeamOptions.$Properties|null);

            /** RaceModel autoAdvanceTime. */
            autoAdvanceTime: number;

            /** RaceModel autoStartTime. */
            autoStartTime: number;

            /** RaceModel autoAdvanceWarmupTime. */
            autoAdvanceWarmupTime: number;

            /** RaceModel autoStartWarmupTime. */
            autoStartWarmupTime: number;

            /** RaceModel driftTime. */
            driftTime: number;

            /** RaceModel startTime. */
            startTime: number;

            /** RaceModel restartTime. */
            restartTime: number;

            /** RaceModel startDelay. */
            startDelay: number;

            /** RaceModel restartDelay. */
            restartDelay: number;

            /** RaceModel heatRotationType. */
            heatRotationType: com.antigravity.HeatRotationType;

            /** RaceModel soloLaneIndex. */
            soloLaneIndex: number;

            /** RaceModel customRotationSequence. */
            customRotationSequence: number[];

            /** RaceModel customRotations. */
            customRotations: com.antigravity.CustomRotation.$Properties[];

            /** RaceModel customRotationAssetId. */
            customRotationAssetId: string;

            /** RaceModel heatTimesThrough. */
            heatTimesThrough: number;

            /** RaceModel reverseHeats. */
            reverseHeats: boolean;

            /** RaceModel hotStart. */
            hotStart: boolean;

            /** RaceModel restartOnFalseStart. */
            restartOnFalseStart: boolean;

            /** RaceModel falseStartLapPenalty. */
            falseStartLapPenalty: number;

            /** RaceModel falseStartTimePenalty. */
            falseStartTimePenalty: number;

            /**
             * Creates a new RaceModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceModel instance
             */
            static create(properties: com.antigravity.RaceModel.$Shape): com.antigravity.RaceModel & com.antigravity.RaceModel.$Shape;
            static create(properties?: com.antigravity.RaceModel.$Properties): com.antigravity.RaceModel;

            /**
             * Encodes the specified RaceModel message. Does not implicitly {@link com.antigravity.RaceModel.verify|verify} messages.
             * @param message RaceModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RaceModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceModel message, length delimited. Does not implicitly {@link com.antigravity.RaceModel.verify|verify} messages.
             * @param message RaceModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RaceModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RaceModel & com.antigravity.RaceModel.$Shape} RaceModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceModel & com.antigravity.RaceModel.$Shape;

            /**
             * Decodes a RaceModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceModel & com.antigravity.RaceModel.$Shape} RaceModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceModel & com.antigravity.RaceModel.$Shape;

            /**
             * Verifies a RaceModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceModel
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RaceModel;

            /**
             * Creates a plain object from a RaceModel message. Also converts values to other types if specified.
             * @param message RaceModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RaceModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceModel to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RaceModel
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RaceModel {

            /** Properties of a RaceModel. */
            interface $Properties {

                /** RaceModel model */
                model?: (com.antigravity.Model.$Properties|null);

                /** RaceModel name */
                name?: (string|null);

                /** RaceModel track */
                track?: (com.antigravity.TrackModel.$Properties|null);

                /** RaceModel heatScoring */
                heatScoring?: (com.antigravity.HeatScoring.$Properties|null);

                /** RaceModel overallScoring */
                overallScoring?: (com.antigravity.OverallScoring.$Properties|null);

                /** RaceModel minLapTime */
                minLapTime?: (number|null);

                /** RaceModel fuelOptions */
                fuelOptions?: (com.antigravity.AnalogFuelOptions.$Properties|null);

                /** RaceModel digitalFuelOptions */
                digitalFuelOptions?: (com.antigravity.DigitalFuelOptions.$Properties|null);

                /** RaceModel teamOptions */
                teamOptions?: (com.antigravity.TeamOptions.$Properties|null);

                /** RaceModel autoAdvanceTime */
                autoAdvanceTime?: (number|null);

                /** RaceModel autoStartTime */
                autoStartTime?: (number|null);

                /** RaceModel autoAdvanceWarmupTime */
                autoAdvanceWarmupTime?: (number|null);

                /** RaceModel autoStartWarmupTime */
                autoStartWarmupTime?: (number|null);

                /** RaceModel driftTime */
                driftTime?: (number|null);

                /** RaceModel startTime */
                startTime?: (number|null);

                /** RaceModel restartTime */
                restartTime?: (number|null);

                /** RaceModel startDelay */
                startDelay?: (number|null);

                /** RaceModel restartDelay */
                restartDelay?: (number|null);

                /** RaceModel heatRotationType */
                heatRotationType?: (com.antigravity.HeatRotationType|null);

                /** RaceModel soloLaneIndex */
                soloLaneIndex?: (number|null);

                /** RaceModel customRotationSequence */
                customRotationSequence?: (number[]|null);

                /** RaceModel customRotations */
                customRotations?: (com.antigravity.CustomRotation.$Properties[]|null);

                /** RaceModel customRotationAssetId */
                customRotationAssetId?: (string|null);

                /** RaceModel heatTimesThrough */
                heatTimesThrough?: (number|null);

                /** RaceModel reverseHeats */
                reverseHeats?: (boolean|null);

                /** RaceModel hotStart */
                hotStart?: (boolean|null);

                /** RaceModel restartOnFalseStart */
                restartOnFalseStart?: (boolean|null);

                /** RaceModel falseStartLapPenalty */
                falseStartLapPenalty?: (number|null);

                /** RaceModel falseStartTimePenalty */
                falseStartTimePenalty?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RaceModel. */
            type $Shape = com.antigravity.RaceModel.$Properties;
        }

        /** FuelUsageType enum. */
        enum FuelUsageType {

            /** LINEAR value */
            LINEAR = 0,

            /** QUADRATIC value */
            QUADRATIC = 1,

            /** CUBIC value */
            CUBIC = 2
        }

        /**
         * Properties of an AnalogFuelOptions.
         * @deprecated Use com.antigravity.AnalogFuelOptions.$Properties instead.
         */
        interface IAnalogFuelOptions extends com.antigravity.AnalogFuelOptions.$Properties {
        }

        /** Represents an AnalogFuelOptions. */
        class AnalogFuelOptions {

            /**
             * Constructs a new AnalogFuelOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.AnalogFuelOptions.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** AnalogFuelOptions enabled. */
            enabled: boolean;

            /** AnalogFuelOptions resetFuelAtHeatStart. */
            resetFuelAtHeatStart: boolean;

            /** AnalogFuelOptions endHeatOnOutOfFuel. */
            endHeatOnOutOfFuel: boolean;

            /** AnalogFuelOptions capacity. */
            capacity: number;

            /** AnalogFuelOptions usageType. */
            usageType: com.antigravity.FuelUsageType;

            /** AnalogFuelOptions usageRate. */
            usageRate: number;

            /** AnalogFuelOptions startLevel. */
            startLevel: number;

            /** AnalogFuelOptions refuelRate. */
            refuelRate: number;

            /** AnalogFuelOptions pitStopDelay. */
            pitStopDelay: number;

            /** AnalogFuelOptions referenceTime. */
            referenceTime: number;

            /**
             * Creates a new AnalogFuelOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AnalogFuelOptions instance
             */
            static create(properties: com.antigravity.AnalogFuelOptions.$Shape): com.antigravity.AnalogFuelOptions & com.antigravity.AnalogFuelOptions.$Shape;
            static create(properties?: com.antigravity.AnalogFuelOptions.$Properties): com.antigravity.AnalogFuelOptions;

            /**
             * Encodes the specified AnalogFuelOptions message. Does not implicitly {@link com.antigravity.AnalogFuelOptions.verify|verify} messages.
             * @param message AnalogFuelOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.AnalogFuelOptions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AnalogFuelOptions message, length delimited. Does not implicitly {@link com.antigravity.AnalogFuelOptions.verify|verify} messages.
             * @param message AnalogFuelOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.AnalogFuelOptions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AnalogFuelOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.AnalogFuelOptions & com.antigravity.AnalogFuelOptions.$Shape} AnalogFuelOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.AnalogFuelOptions & com.antigravity.AnalogFuelOptions.$Shape;

            /**
             * Decodes an AnalogFuelOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.AnalogFuelOptions & com.antigravity.AnalogFuelOptions.$Shape} AnalogFuelOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.AnalogFuelOptions & com.antigravity.AnalogFuelOptions.$Shape;

            /**
             * Verifies an AnalogFuelOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AnalogFuelOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AnalogFuelOptions
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.AnalogFuelOptions;

            /**
             * Creates a plain object from an AnalogFuelOptions message. Also converts values to other types if specified.
             * @param message AnalogFuelOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.AnalogFuelOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AnalogFuelOptions to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AnalogFuelOptions
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AnalogFuelOptions {

            /** Properties of an AnalogFuelOptions. */
            interface $Properties {

                /** AnalogFuelOptions enabled */
                enabled?: (boolean|null);

                /** AnalogFuelOptions resetFuelAtHeatStart */
                resetFuelAtHeatStart?: (boolean|null);

                /** AnalogFuelOptions endHeatOnOutOfFuel */
                endHeatOnOutOfFuel?: (boolean|null);

                /** AnalogFuelOptions capacity */
                capacity?: (number|null);

                /** AnalogFuelOptions usageType */
                usageType?: (com.antigravity.FuelUsageType|null);

                /** AnalogFuelOptions usageRate */
                usageRate?: (number|null);

                /** AnalogFuelOptions startLevel */
                startLevel?: (number|null);

                /** AnalogFuelOptions refuelRate */
                refuelRate?: (number|null);

                /** AnalogFuelOptions pitStopDelay */
                pitStopDelay?: (number|null);

                /** AnalogFuelOptions referenceTime */
                referenceTime?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AnalogFuelOptions. */
            type $Shape = com.antigravity.AnalogFuelOptions.$Properties;
        }

        /**
         * Properties of a DigitalFuelOptions.
         * @deprecated Use com.antigravity.DigitalFuelOptions.$Properties instead.
         */
        interface IDigitalFuelOptions extends com.antigravity.DigitalFuelOptions.$Properties {
        }

        /** Represents a DigitalFuelOptions. */
        class DigitalFuelOptions {

            /**
             * Constructs a new DigitalFuelOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DigitalFuelOptions.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DigitalFuelOptions enabled. */
            enabled: boolean;

            /** DigitalFuelOptions resetFuelAtHeatStart. */
            resetFuelAtHeatStart: boolean;

            /** DigitalFuelOptions endHeatOnOutOfFuel. */
            endHeatOnOutOfFuel: boolean;

            /** DigitalFuelOptions capacity. */
            capacity: number;

            /** DigitalFuelOptions usageType. */
            usageType: com.antigravity.FuelUsageType;

            /** DigitalFuelOptions usageRate. */
            usageRate: number;

            /** DigitalFuelOptions startLevel. */
            startLevel: number;

            /** DigitalFuelOptions refuelRate. */
            refuelRate: number;

            /** DigitalFuelOptions pitStopDelay. */
            pitStopDelay: number;

            /**
             * Creates a new DigitalFuelOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DigitalFuelOptions instance
             */
            static create(properties: com.antigravity.DigitalFuelOptions.$Shape): com.antigravity.DigitalFuelOptions & com.antigravity.DigitalFuelOptions.$Shape;
            static create(properties?: com.antigravity.DigitalFuelOptions.$Properties): com.antigravity.DigitalFuelOptions;

            /**
             * Encodes the specified DigitalFuelOptions message. Does not implicitly {@link com.antigravity.DigitalFuelOptions.verify|verify} messages.
             * @param message DigitalFuelOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DigitalFuelOptions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DigitalFuelOptions message, length delimited. Does not implicitly {@link com.antigravity.DigitalFuelOptions.verify|verify} messages.
             * @param message DigitalFuelOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DigitalFuelOptions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DigitalFuelOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DigitalFuelOptions & com.antigravity.DigitalFuelOptions.$Shape} DigitalFuelOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DigitalFuelOptions & com.antigravity.DigitalFuelOptions.$Shape;

            /**
             * Decodes a DigitalFuelOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DigitalFuelOptions & com.antigravity.DigitalFuelOptions.$Shape} DigitalFuelOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DigitalFuelOptions & com.antigravity.DigitalFuelOptions.$Shape;

            /**
             * Verifies a DigitalFuelOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DigitalFuelOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DigitalFuelOptions
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DigitalFuelOptions;

            /**
             * Creates a plain object from a DigitalFuelOptions message. Also converts values to other types if specified.
             * @param message DigitalFuelOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DigitalFuelOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DigitalFuelOptions to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DigitalFuelOptions
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DigitalFuelOptions {

            /** Properties of a DigitalFuelOptions. */
            interface $Properties {

                /** DigitalFuelOptions enabled */
                enabled?: (boolean|null);

                /** DigitalFuelOptions resetFuelAtHeatStart */
                resetFuelAtHeatStart?: (boolean|null);

                /** DigitalFuelOptions endHeatOnOutOfFuel */
                endHeatOnOutOfFuel?: (boolean|null);

                /** DigitalFuelOptions capacity */
                capacity?: (number|null);

                /** DigitalFuelOptions usageType */
                usageType?: (com.antigravity.FuelUsageType|null);

                /** DigitalFuelOptions usageRate */
                usageRate?: (number|null);

                /** DigitalFuelOptions startLevel */
                startLevel?: (number|null);

                /** DigitalFuelOptions refuelRate */
                refuelRate?: (number|null);

                /** DigitalFuelOptions pitStopDelay */
                pitStopDelay?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DigitalFuelOptions. */
            type $Shape = com.antigravity.DigitalFuelOptions.$Properties;
        }

        /**
         * Properties of a TrackModel.
         * @deprecated Use com.antigravity.TrackModel.$Properties instead.
         */
        interface ITrackModel extends com.antigravity.TrackModel.$Properties {
        }

        /** Represents a TrackModel. */
        class TrackModel {

            /**
             * Constructs a new TrackModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.TrackModel.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** TrackModel model. */
            model?: (com.antigravity.Model.$Properties|null);

            /** TrackModel name. */
            name: string;

            /** TrackModel lanes. */
            lanes: com.antigravity.LaneModel.$Properties[];

            /** TrackModel hasDigitalFuel. */
            hasDigitalFuel: boolean;

            /** TrackModel arduinoConfigs. */
            arduinoConfigs: com.antigravity.ArduinoConfig.$Properties[];

            /** TrackModel numTrackSections. */
            numTrackSections: number;

            /**
             * Creates a new TrackModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TrackModel instance
             */
            static create(properties: com.antigravity.TrackModel.$Shape): com.antigravity.TrackModel & com.antigravity.TrackModel.$Shape;
            static create(properties?: com.antigravity.TrackModel.$Properties): com.antigravity.TrackModel;

            /**
             * Encodes the specified TrackModel message. Does not implicitly {@link com.antigravity.TrackModel.verify|verify} messages.
             * @param message TrackModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.TrackModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TrackModel message, length delimited. Does not implicitly {@link com.antigravity.TrackModel.verify|verify} messages.
             * @param message TrackModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.TrackModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TrackModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.TrackModel & com.antigravity.TrackModel.$Shape} TrackModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.TrackModel & com.antigravity.TrackModel.$Shape;

            /**
             * Decodes a TrackModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.TrackModel & com.antigravity.TrackModel.$Shape} TrackModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.TrackModel & com.antigravity.TrackModel.$Shape;

            /**
             * Verifies a TrackModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TrackModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TrackModel
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.TrackModel;

            /**
             * Creates a plain object from a TrackModel message. Also converts values to other types if specified.
             * @param message TrackModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.TrackModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TrackModel to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for TrackModel
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace TrackModel {

            /** Properties of a TrackModel. */
            interface $Properties {

                /** TrackModel model */
                model?: (com.antigravity.Model.$Properties|null);

                /** TrackModel name */
                name?: (string|null);

                /** TrackModel lanes */
                lanes?: (com.antigravity.LaneModel.$Properties[]|null);

                /** TrackModel hasDigitalFuel */
                hasDigitalFuel?: (boolean|null);

                /** TrackModel arduinoConfigs */
                arduinoConfigs?: (com.antigravity.ArduinoConfig.$Properties[]|null);

                /** TrackModel numTrackSections */
                numTrackSections?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a TrackModel. */
            type $Shape = com.antigravity.TrackModel.$Properties;
        }

        /**
         * Properties of a RaceSubscriptionRequest.
         * @deprecated Use com.antigravity.RaceSubscriptionRequest.$Properties instead.
         */
        interface IRaceSubscriptionRequest extends com.antigravity.RaceSubscriptionRequest.$Properties {
        }

        /** Represents a RaceSubscriptionRequest. */
        class RaceSubscriptionRequest {

            /**
             * Constructs a new RaceSubscriptionRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RaceSubscriptionRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RaceSubscriptionRequest subscribe. */
            subscribe: boolean;

            /**
             * Creates a new RaceSubscriptionRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceSubscriptionRequest instance
             */
            static create(properties: com.antigravity.RaceSubscriptionRequest.$Shape): com.antigravity.RaceSubscriptionRequest & com.antigravity.RaceSubscriptionRequest.$Shape;
            static create(properties?: com.antigravity.RaceSubscriptionRequest.$Properties): com.antigravity.RaceSubscriptionRequest;

            /**
             * Encodes the specified RaceSubscriptionRequest message. Does not implicitly {@link com.antigravity.RaceSubscriptionRequest.verify|verify} messages.
             * @param message RaceSubscriptionRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RaceSubscriptionRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceSubscriptionRequest message, length delimited. Does not implicitly {@link com.antigravity.RaceSubscriptionRequest.verify|verify} messages.
             * @param message RaceSubscriptionRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RaceSubscriptionRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceSubscriptionRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RaceSubscriptionRequest & com.antigravity.RaceSubscriptionRequest.$Shape} RaceSubscriptionRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceSubscriptionRequest & com.antigravity.RaceSubscriptionRequest.$Shape;

            /**
             * Decodes a RaceSubscriptionRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceSubscriptionRequest & com.antigravity.RaceSubscriptionRequest.$Shape} RaceSubscriptionRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceSubscriptionRequest & com.antigravity.RaceSubscriptionRequest.$Shape;

            /**
             * Verifies a RaceSubscriptionRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceSubscriptionRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceSubscriptionRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RaceSubscriptionRequest;

            /**
             * Creates a plain object from a RaceSubscriptionRequest message. Also converts values to other types if specified.
             * @param message RaceSubscriptionRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RaceSubscriptionRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceSubscriptionRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RaceSubscriptionRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RaceSubscriptionRequest {

            /** Properties of a RaceSubscriptionRequest. */
            interface $Properties {

                /** RaceSubscriptionRequest subscribe */
                subscribe?: (boolean|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RaceSubscriptionRequest. */
            type $Shape = com.antigravity.RaceSubscriptionRequest.$Properties;
        }

        /**
         * Properties of a RestartHeatRequest.
         * @deprecated Use com.antigravity.RestartHeatRequest.$Properties instead.
         */
        interface IRestartHeatRequest extends com.antigravity.RestartHeatRequest.$Properties {
        }

        /** Represents a RestartHeatRequest. */
        class RestartHeatRequest {

            /**
             * Constructs a new RestartHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RestartHeatRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new RestartHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RestartHeatRequest instance
             */
            static create(properties: com.antigravity.RestartHeatRequest.$Shape): com.antigravity.RestartHeatRequest & com.antigravity.RestartHeatRequest.$Shape;
            static create(properties?: com.antigravity.RestartHeatRequest.$Properties): com.antigravity.RestartHeatRequest;

            /**
             * Encodes the specified RestartHeatRequest message. Does not implicitly {@link com.antigravity.RestartHeatRequest.verify|verify} messages.
             * @param message RestartHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RestartHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RestartHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.RestartHeatRequest.verify|verify} messages.
             * @param message RestartHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RestartHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RestartHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RestartHeatRequest & com.antigravity.RestartHeatRequest.$Shape} RestartHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RestartHeatRequest & com.antigravity.RestartHeatRequest.$Shape;

            /**
             * Decodes a RestartHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RestartHeatRequest & com.antigravity.RestartHeatRequest.$Shape} RestartHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RestartHeatRequest & com.antigravity.RestartHeatRequest.$Shape;

            /**
             * Verifies a RestartHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RestartHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RestartHeatRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RestartHeatRequest;

            /**
             * Creates a plain object from a RestartHeatRequest message. Also converts values to other types if specified.
             * @param message RestartHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RestartHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RestartHeatRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RestartHeatRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RestartHeatRequest {

            /** Properties of a RestartHeatRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RestartHeatRequest. */
            type $Shape = com.antigravity.RestartHeatRequest.$Properties;
        }

        /**
         * Properties of a RestartHeatResponse.
         * @deprecated Use com.antigravity.RestartHeatResponse.$Properties instead.
         */
        interface IRestartHeatResponse extends com.antigravity.RestartHeatResponse.$Properties {
        }

        /** Represents a RestartHeatResponse. */
        class RestartHeatResponse {

            /**
             * Constructs a new RestartHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RestartHeatResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RestartHeatResponse success. */
            success: boolean;

            /** RestartHeatResponse message. */
            message: string;

            /**
             * Creates a new RestartHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RestartHeatResponse instance
             */
            static create(properties: com.antigravity.RestartHeatResponse.$Shape): com.antigravity.RestartHeatResponse & com.antigravity.RestartHeatResponse.$Shape;
            static create(properties?: com.antigravity.RestartHeatResponse.$Properties): com.antigravity.RestartHeatResponse;

            /**
             * Encodes the specified RestartHeatResponse message. Does not implicitly {@link com.antigravity.RestartHeatResponse.verify|verify} messages.
             * @param message RestartHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RestartHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RestartHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.RestartHeatResponse.verify|verify} messages.
             * @param message RestartHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RestartHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RestartHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RestartHeatResponse & com.antigravity.RestartHeatResponse.$Shape} RestartHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RestartHeatResponse & com.antigravity.RestartHeatResponse.$Shape;

            /**
             * Decodes a RestartHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RestartHeatResponse & com.antigravity.RestartHeatResponse.$Shape} RestartHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RestartHeatResponse & com.antigravity.RestartHeatResponse.$Shape;

            /**
             * Verifies a RestartHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RestartHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RestartHeatResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RestartHeatResponse;

            /**
             * Creates a plain object from a RestartHeatResponse message. Also converts values to other types if specified.
             * @param message RestartHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RestartHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RestartHeatResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RestartHeatResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RestartHeatResponse {

            /** Properties of a RestartHeatResponse. */
            interface $Properties {

                /** RestartHeatResponse success */
                success?: (boolean|null);

                /** RestartHeatResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RestartHeatResponse. */
            type $Shape = com.antigravity.RestartHeatResponse.$Properties;
        }

        /**
         * Properties of a SetInterfacePinStateRequest.
         * @deprecated Use com.antigravity.SetInterfacePinStateRequest.$Properties instead.
         */
        interface ISetInterfacePinStateRequest extends com.antigravity.SetInterfacePinStateRequest.$Properties {
        }

        /** Represents a SetInterfacePinStateRequest. */
        class SetInterfacePinStateRequest {

            /**
             * Constructs a new SetInterfacePinStateRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SetInterfacePinStateRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SetInterfacePinStateRequest pin. */
            pin: number;

            /** SetInterfacePinStateRequest isDigital. */
            isDigital: boolean;

            /** SetInterfacePinStateRequest isHigh. */
            isHigh: boolean;

            /** SetInterfacePinStateRequest interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new SetInterfacePinStateRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetInterfacePinStateRequest instance
             */
            static create(properties: com.antigravity.SetInterfacePinStateRequest.$Shape): com.antigravity.SetInterfacePinStateRequest & com.antigravity.SetInterfacePinStateRequest.$Shape;
            static create(properties?: com.antigravity.SetInterfacePinStateRequest.$Properties): com.antigravity.SetInterfacePinStateRequest;

            /**
             * Encodes the specified SetInterfacePinStateRequest message. Does not implicitly {@link com.antigravity.SetInterfacePinStateRequest.verify|verify} messages.
             * @param message SetInterfacePinStateRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SetInterfacePinStateRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetInterfacePinStateRequest message, length delimited. Does not implicitly {@link com.antigravity.SetInterfacePinStateRequest.verify|verify} messages.
             * @param message SetInterfacePinStateRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SetInterfacePinStateRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetInterfacePinStateRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SetInterfacePinStateRequest & com.antigravity.SetInterfacePinStateRequest.$Shape} SetInterfacePinStateRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SetInterfacePinStateRequest & com.antigravity.SetInterfacePinStateRequest.$Shape;

            /**
             * Decodes a SetInterfacePinStateRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SetInterfacePinStateRequest & com.antigravity.SetInterfacePinStateRequest.$Shape} SetInterfacePinStateRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SetInterfacePinStateRequest & com.antigravity.SetInterfacePinStateRequest.$Shape;

            /**
             * Verifies a SetInterfacePinStateRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetInterfacePinStateRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetInterfacePinStateRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SetInterfacePinStateRequest;

            /**
             * Creates a plain object from a SetInterfacePinStateRequest message. Also converts values to other types if specified.
             * @param message SetInterfacePinStateRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SetInterfacePinStateRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetInterfacePinStateRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SetInterfacePinStateRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SetInterfacePinStateRequest {

            /** Properties of a SetInterfacePinStateRequest. */
            interface $Properties {

                /** SetInterfacePinStateRequest pin */
                pin?: (number|null);

                /** SetInterfacePinStateRequest isDigital */
                isDigital?: (boolean|null);

                /** SetInterfacePinStateRequest isHigh */
                isHigh?: (boolean|null);

                /** SetInterfacePinStateRequest interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SetInterfacePinStateRequest. */
            type $Shape = com.antigravity.SetInterfacePinStateRequest.$Properties;
        }

        /**
         * Properties of a SetInterfacePinStateResponse.
         * @deprecated Use com.antigravity.SetInterfacePinStateResponse.$Properties instead.
         */
        interface ISetInterfacePinStateResponse extends com.antigravity.SetInterfacePinStateResponse.$Properties {
        }

        /** Represents a SetInterfacePinStateResponse. */
        class SetInterfacePinStateResponse {

            /**
             * Constructs a new SetInterfacePinStateResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SetInterfacePinStateResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SetInterfacePinStateResponse success. */
            success: boolean;

            /** SetInterfacePinStateResponse message. */
            message: string;

            /**
             * Creates a new SetInterfacePinStateResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetInterfacePinStateResponse instance
             */
            static create(properties: com.antigravity.SetInterfacePinStateResponse.$Shape): com.antigravity.SetInterfacePinStateResponse & com.antigravity.SetInterfacePinStateResponse.$Shape;
            static create(properties?: com.antigravity.SetInterfacePinStateResponse.$Properties): com.antigravity.SetInterfacePinStateResponse;

            /**
             * Encodes the specified SetInterfacePinStateResponse message. Does not implicitly {@link com.antigravity.SetInterfacePinStateResponse.verify|verify} messages.
             * @param message SetInterfacePinStateResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SetInterfacePinStateResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetInterfacePinStateResponse message, length delimited. Does not implicitly {@link com.antigravity.SetInterfacePinStateResponse.verify|verify} messages.
             * @param message SetInterfacePinStateResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SetInterfacePinStateResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetInterfacePinStateResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SetInterfacePinStateResponse & com.antigravity.SetInterfacePinStateResponse.$Shape} SetInterfacePinStateResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SetInterfacePinStateResponse & com.antigravity.SetInterfacePinStateResponse.$Shape;

            /**
             * Decodes a SetInterfacePinStateResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SetInterfacePinStateResponse & com.antigravity.SetInterfacePinStateResponse.$Shape} SetInterfacePinStateResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SetInterfacePinStateResponse & com.antigravity.SetInterfacePinStateResponse.$Shape;

            /**
             * Verifies a SetInterfacePinStateResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetInterfacePinStateResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetInterfacePinStateResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SetInterfacePinStateResponse;

            /**
             * Creates a plain object from a SetInterfacePinStateResponse message. Also converts values to other types if specified.
             * @param message SetInterfacePinStateResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SetInterfacePinStateResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetInterfacePinStateResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SetInterfacePinStateResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SetInterfacePinStateResponse {

            /** Properties of a SetInterfacePinStateResponse. */
            interface $Properties {

                /** SetInterfacePinStateResponse success */
                success?: (boolean|null);

                /** SetInterfacePinStateResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SetInterfacePinStateResponse. */
            type $Shape = com.antigravity.SetInterfacePinStateResponse.$Properties;
        }

        /**
         * Properties of a RgbLedState.
         * @deprecated Use com.antigravity.RgbLedState.$Properties instead.
         */
        interface IRgbLedState extends com.antigravity.RgbLedState.$Properties {
        }

        /** Represents a RgbLedState. */
        class RgbLedState {

            /**
             * Constructs a new RgbLedState.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RgbLedState.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RgbLedState index. */
            index: number;

            /** RgbLedState r. */
            r: number;

            /** RgbLedState g. */
            g: number;

            /** RgbLedState b. */
            b: number;

            /**
             * Creates a new RgbLedState instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RgbLedState instance
             */
            static create(properties: com.antigravity.RgbLedState.$Shape): com.antigravity.RgbLedState & com.antigravity.RgbLedState.$Shape;
            static create(properties?: com.antigravity.RgbLedState.$Properties): com.antigravity.RgbLedState;

            /**
             * Encodes the specified RgbLedState message. Does not implicitly {@link com.antigravity.RgbLedState.verify|verify} messages.
             * @param message RgbLedState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RgbLedState.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RgbLedState message, length delimited. Does not implicitly {@link com.antigravity.RgbLedState.verify|verify} messages.
             * @param message RgbLedState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RgbLedState.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RgbLedState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RgbLedState & com.antigravity.RgbLedState.$Shape} RgbLedState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RgbLedState & com.antigravity.RgbLedState.$Shape;

            /**
             * Decodes a RgbLedState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RgbLedState & com.antigravity.RgbLedState.$Shape} RgbLedState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RgbLedState & com.antigravity.RgbLedState.$Shape;

            /**
             * Verifies a RgbLedState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RgbLedState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RgbLedState
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RgbLedState;

            /**
             * Creates a plain object from a RgbLedState message. Also converts values to other types if specified.
             * @param message RgbLedState
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RgbLedState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RgbLedState to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RgbLedState
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RgbLedState {

            /** Properties of a RgbLedState. */
            interface $Properties {

                /** RgbLedState index */
                index?: (number|null);

                /** RgbLedState r */
                r?: (number|null);

                /** RgbLedState g */
                g?: (number|null);

                /** RgbLedState b */
                b?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RgbLedState. */
            type $Shape = com.antigravity.RgbLedState.$Properties;
        }

        /**
         * Properties of a SetInterfaceRgbLedStateRequest.
         * @deprecated Use com.antigravity.SetInterfaceRgbLedStateRequest.$Properties instead.
         */
        interface ISetInterfaceRgbLedStateRequest extends com.antigravity.SetInterfaceRgbLedStateRequest.$Properties {
        }

        /** Represents a SetInterfaceRgbLedStateRequest. */
        class SetInterfaceRgbLedStateRequest {

            /**
             * Constructs a new SetInterfaceRgbLedStateRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SetInterfaceRgbLedStateRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SetInterfaceRgbLedStateRequest pin. */
            pin: number;

            /** SetInterfaceRgbLedStateRequest leds. */
            leds: com.antigravity.RgbLedState.$Properties[];

            /** SetInterfaceRgbLedStateRequest interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new SetInterfaceRgbLedStateRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetInterfaceRgbLedStateRequest instance
             */
            static create(properties: com.antigravity.SetInterfaceRgbLedStateRequest.$Shape): com.antigravity.SetInterfaceRgbLedStateRequest & com.antigravity.SetInterfaceRgbLedStateRequest.$Shape;
            static create(properties?: com.antigravity.SetInterfaceRgbLedStateRequest.$Properties): com.antigravity.SetInterfaceRgbLedStateRequest;

            /**
             * Encodes the specified SetInterfaceRgbLedStateRequest message. Does not implicitly {@link com.antigravity.SetInterfaceRgbLedStateRequest.verify|verify} messages.
             * @param message SetInterfaceRgbLedStateRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SetInterfaceRgbLedStateRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetInterfaceRgbLedStateRequest message, length delimited. Does not implicitly {@link com.antigravity.SetInterfaceRgbLedStateRequest.verify|verify} messages.
             * @param message SetInterfaceRgbLedStateRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SetInterfaceRgbLedStateRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetInterfaceRgbLedStateRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SetInterfaceRgbLedStateRequest & com.antigravity.SetInterfaceRgbLedStateRequest.$Shape} SetInterfaceRgbLedStateRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SetInterfaceRgbLedStateRequest & com.antigravity.SetInterfaceRgbLedStateRequest.$Shape;

            /**
             * Decodes a SetInterfaceRgbLedStateRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SetInterfaceRgbLedStateRequest & com.antigravity.SetInterfaceRgbLedStateRequest.$Shape} SetInterfaceRgbLedStateRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SetInterfaceRgbLedStateRequest & com.antigravity.SetInterfaceRgbLedStateRequest.$Shape;

            /**
             * Verifies a SetInterfaceRgbLedStateRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetInterfaceRgbLedStateRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetInterfaceRgbLedStateRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SetInterfaceRgbLedStateRequest;

            /**
             * Creates a plain object from a SetInterfaceRgbLedStateRequest message. Also converts values to other types if specified.
             * @param message SetInterfaceRgbLedStateRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SetInterfaceRgbLedStateRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetInterfaceRgbLedStateRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SetInterfaceRgbLedStateRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SetInterfaceRgbLedStateRequest {

            /** Properties of a SetInterfaceRgbLedStateRequest. */
            interface $Properties {

                /** SetInterfaceRgbLedStateRequest pin */
                pin?: (number|null);

                /** SetInterfaceRgbLedStateRequest leds */
                leds?: (com.antigravity.RgbLedState.$Properties[]|null);

                /** SetInterfaceRgbLedStateRequest interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SetInterfaceRgbLedStateRequest. */
            type $Shape = com.antigravity.SetInterfaceRgbLedStateRequest.$Properties;
        }

        /**
         * Properties of a SetInterfaceRgbLedStateResponse.
         * @deprecated Use com.antigravity.SetInterfaceRgbLedStateResponse.$Properties instead.
         */
        interface ISetInterfaceRgbLedStateResponse extends com.antigravity.SetInterfaceRgbLedStateResponse.$Properties {
        }

        /** Represents a SetInterfaceRgbLedStateResponse. */
        class SetInterfaceRgbLedStateResponse {

            /**
             * Constructs a new SetInterfaceRgbLedStateResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SetInterfaceRgbLedStateResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SetInterfaceRgbLedStateResponse success. */
            success: boolean;

            /** SetInterfaceRgbLedStateResponse message. */
            message: string;

            /**
             * Creates a new SetInterfaceRgbLedStateResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetInterfaceRgbLedStateResponse instance
             */
            static create(properties: com.antigravity.SetInterfaceRgbLedStateResponse.$Shape): com.antigravity.SetInterfaceRgbLedStateResponse & com.antigravity.SetInterfaceRgbLedStateResponse.$Shape;
            static create(properties?: com.antigravity.SetInterfaceRgbLedStateResponse.$Properties): com.antigravity.SetInterfaceRgbLedStateResponse;

            /**
             * Encodes the specified SetInterfaceRgbLedStateResponse message. Does not implicitly {@link com.antigravity.SetInterfaceRgbLedStateResponse.verify|verify} messages.
             * @param message SetInterfaceRgbLedStateResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SetInterfaceRgbLedStateResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetInterfaceRgbLedStateResponse message, length delimited. Does not implicitly {@link com.antigravity.SetInterfaceRgbLedStateResponse.verify|verify} messages.
             * @param message SetInterfaceRgbLedStateResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SetInterfaceRgbLedStateResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetInterfaceRgbLedStateResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SetInterfaceRgbLedStateResponse & com.antigravity.SetInterfaceRgbLedStateResponse.$Shape} SetInterfaceRgbLedStateResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SetInterfaceRgbLedStateResponse & com.antigravity.SetInterfaceRgbLedStateResponse.$Shape;

            /**
             * Decodes a SetInterfaceRgbLedStateResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SetInterfaceRgbLedStateResponse & com.antigravity.SetInterfaceRgbLedStateResponse.$Shape} SetInterfaceRgbLedStateResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SetInterfaceRgbLedStateResponse & com.antigravity.SetInterfaceRgbLedStateResponse.$Shape;

            /**
             * Verifies a SetInterfaceRgbLedStateResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetInterfaceRgbLedStateResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetInterfaceRgbLedStateResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SetInterfaceRgbLedStateResponse;

            /**
             * Creates a plain object from a SetInterfaceRgbLedStateResponse message. Also converts values to other types if specified.
             * @param message SetInterfaceRgbLedStateResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SetInterfaceRgbLedStateResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetInterfaceRgbLedStateResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SetInterfaceRgbLedStateResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SetInterfaceRgbLedStateResponse {

            /** Properties of a SetInterfaceRgbLedStateResponse. */
            interface $Properties {

                /** SetInterfaceRgbLedStateResponse success */
                success?: (boolean|null);

                /** SetInterfaceRgbLedStateResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SetInterfaceRgbLedStateResponse. */
            type $Shape = com.antigravity.SetInterfaceRgbLedStateResponse.$Properties;
        }

        /**
         * Properties of a SkipHeatRequest.
         * @deprecated Use com.antigravity.SkipHeatRequest.$Properties instead.
         */
        interface ISkipHeatRequest extends com.antigravity.SkipHeatRequest.$Properties {
        }

        /** Represents a SkipHeatRequest. */
        class SkipHeatRequest {

            /**
             * Constructs a new SkipHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SkipHeatRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new SkipHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SkipHeatRequest instance
             */
            static create(properties: com.antigravity.SkipHeatRequest.$Shape): com.antigravity.SkipHeatRequest & com.antigravity.SkipHeatRequest.$Shape;
            static create(properties?: com.antigravity.SkipHeatRequest.$Properties): com.antigravity.SkipHeatRequest;

            /**
             * Encodes the specified SkipHeatRequest message. Does not implicitly {@link com.antigravity.SkipHeatRequest.verify|verify} messages.
             * @param message SkipHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SkipHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SkipHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.SkipHeatRequest.verify|verify} messages.
             * @param message SkipHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SkipHeatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SkipHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SkipHeatRequest & com.antigravity.SkipHeatRequest.$Shape} SkipHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SkipHeatRequest & com.antigravity.SkipHeatRequest.$Shape;

            /**
             * Decodes a SkipHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SkipHeatRequest & com.antigravity.SkipHeatRequest.$Shape} SkipHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SkipHeatRequest & com.antigravity.SkipHeatRequest.$Shape;

            /**
             * Verifies a SkipHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SkipHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SkipHeatRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SkipHeatRequest;

            /**
             * Creates a plain object from a SkipHeatRequest message. Also converts values to other types if specified.
             * @param message SkipHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SkipHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SkipHeatRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SkipHeatRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SkipHeatRequest {

            /** Properties of a SkipHeatRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SkipHeatRequest. */
            type $Shape = com.antigravity.SkipHeatRequest.$Properties;
        }

        /**
         * Properties of a SkipHeatResponse.
         * @deprecated Use com.antigravity.SkipHeatResponse.$Properties instead.
         */
        interface ISkipHeatResponse extends com.antigravity.SkipHeatResponse.$Properties {
        }

        /** Represents a SkipHeatResponse. */
        class SkipHeatResponse {

            /**
             * Constructs a new SkipHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SkipHeatResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SkipHeatResponse success. */
            success: boolean;

            /** SkipHeatResponse message. */
            message: string;

            /**
             * Creates a new SkipHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SkipHeatResponse instance
             */
            static create(properties: com.antigravity.SkipHeatResponse.$Shape): com.antigravity.SkipHeatResponse & com.antigravity.SkipHeatResponse.$Shape;
            static create(properties?: com.antigravity.SkipHeatResponse.$Properties): com.antigravity.SkipHeatResponse;

            /**
             * Encodes the specified SkipHeatResponse message. Does not implicitly {@link com.antigravity.SkipHeatResponse.verify|verify} messages.
             * @param message SkipHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SkipHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SkipHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.SkipHeatResponse.verify|verify} messages.
             * @param message SkipHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SkipHeatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SkipHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SkipHeatResponse & com.antigravity.SkipHeatResponse.$Shape} SkipHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SkipHeatResponse & com.antigravity.SkipHeatResponse.$Shape;

            /**
             * Decodes a SkipHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SkipHeatResponse & com.antigravity.SkipHeatResponse.$Shape} SkipHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SkipHeatResponse & com.antigravity.SkipHeatResponse.$Shape;

            /**
             * Verifies a SkipHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SkipHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SkipHeatResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SkipHeatResponse;

            /**
             * Creates a plain object from a SkipHeatResponse message. Also converts values to other types if specified.
             * @param message SkipHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SkipHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SkipHeatResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SkipHeatResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SkipHeatResponse {

            /** Properties of a SkipHeatResponse. */
            interface $Properties {

                /** SkipHeatResponse success */
                success?: (boolean|null);

                /** SkipHeatResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SkipHeatResponse. */
            type $Shape = com.antigravity.SkipHeatResponse.$Properties;
        }

        /**
         * Properties of a StartRaceRequest.
         * @deprecated Use com.antigravity.StartRaceRequest.$Properties instead.
         */
        interface IStartRaceRequest extends com.antigravity.StartRaceRequest.$Properties {
        }

        /** Represents a StartRaceRequest. */
        class StartRaceRequest {

            /**
             * Constructs a new StartRaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.StartRaceRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new StartRaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StartRaceRequest instance
             */
            static create(properties: com.antigravity.StartRaceRequest.$Shape): com.antigravity.StartRaceRequest & com.antigravity.StartRaceRequest.$Shape;
            static create(properties?: com.antigravity.StartRaceRequest.$Properties): com.antigravity.StartRaceRequest;

            /**
             * Encodes the specified StartRaceRequest message. Does not implicitly {@link com.antigravity.StartRaceRequest.verify|verify} messages.
             * @param message StartRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.StartRaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StartRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.StartRaceRequest.verify|verify} messages.
             * @param message StartRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.StartRaceRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StartRaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.StartRaceRequest & com.antigravity.StartRaceRequest.$Shape} StartRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.StartRaceRequest & com.antigravity.StartRaceRequest.$Shape;

            /**
             * Decodes a StartRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.StartRaceRequest & com.antigravity.StartRaceRequest.$Shape} StartRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.StartRaceRequest & com.antigravity.StartRaceRequest.$Shape;

            /**
             * Verifies a StartRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StartRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StartRaceRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.StartRaceRequest;

            /**
             * Creates a plain object from a StartRaceRequest message. Also converts values to other types if specified.
             * @param message StartRaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.StartRaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StartRaceRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for StartRaceRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace StartRaceRequest {

            /** Properties of a StartRaceRequest. */
            interface $Properties {

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a StartRaceRequest. */
            type $Shape = com.antigravity.StartRaceRequest.$Properties;
        }

        /**
         * Properties of a StartRaceResponse.
         * @deprecated Use com.antigravity.StartRaceResponse.$Properties instead.
         */
        interface IStartRaceResponse extends com.antigravity.StartRaceResponse.$Properties {
        }

        /** Represents a StartRaceResponse. */
        class StartRaceResponse {

            /**
             * Constructs a new StartRaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.StartRaceResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** StartRaceResponse success. */
            success: boolean;

            /** StartRaceResponse message. */
            message: string;

            /**
             * Creates a new StartRaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StartRaceResponse instance
             */
            static create(properties: com.antigravity.StartRaceResponse.$Shape): com.antigravity.StartRaceResponse & com.antigravity.StartRaceResponse.$Shape;
            static create(properties?: com.antigravity.StartRaceResponse.$Properties): com.antigravity.StartRaceResponse;

            /**
             * Encodes the specified StartRaceResponse message. Does not implicitly {@link com.antigravity.StartRaceResponse.verify|verify} messages.
             * @param message StartRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.StartRaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StartRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.StartRaceResponse.verify|verify} messages.
             * @param message StartRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.StartRaceResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StartRaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.StartRaceResponse & com.antigravity.StartRaceResponse.$Shape} StartRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.StartRaceResponse & com.antigravity.StartRaceResponse.$Shape;

            /**
             * Decodes a StartRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.StartRaceResponse & com.antigravity.StartRaceResponse.$Shape} StartRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.StartRaceResponse & com.antigravity.StartRaceResponse.$Shape;

            /**
             * Verifies a StartRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StartRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StartRaceResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.StartRaceResponse;

            /**
             * Creates a plain object from a StartRaceResponse message. Also converts values to other types if specified.
             * @param message StartRaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.StartRaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StartRaceResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for StartRaceResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace StartRaceResponse {

            /** Properties of a StartRaceResponse. */
            interface $Properties {

                /** StartRaceResponse success */
                success?: (boolean|null);

                /** StartRaceResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a StartRaceResponse. */
            type $Shape = com.antigravity.StartRaceResponse.$Properties;
        }

        /**
         * Properties of a TeamModel.
         * @deprecated Use com.antigravity.TeamModel.$Properties instead.
         */
        interface ITeamModel extends com.antigravity.TeamModel.$Properties {
        }

        /** Represents a TeamModel. */
        class TeamModel {

            /**
             * Constructs a new TeamModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.TeamModel.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** TeamModel model. */
            model?: (com.antigravity.Model.$Properties|null);

            /** TeamModel name. */
            name: string;

            /** TeamModel avatarUrl. */
            avatarUrl: string;

            /** TeamModel driverIds. */
            driverIds: string[];

            /**
             * Creates a new TeamModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TeamModel instance
             */
            static create(properties: com.antigravity.TeamModel.$Shape): com.antigravity.TeamModel & com.antigravity.TeamModel.$Shape;
            static create(properties?: com.antigravity.TeamModel.$Properties): com.antigravity.TeamModel;

            /**
             * Encodes the specified TeamModel message. Does not implicitly {@link com.antigravity.TeamModel.verify|verify} messages.
             * @param message TeamModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.TeamModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TeamModel message, length delimited. Does not implicitly {@link com.antigravity.TeamModel.verify|verify} messages.
             * @param message TeamModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.TeamModel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TeamModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.TeamModel & com.antigravity.TeamModel.$Shape} TeamModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.TeamModel & com.antigravity.TeamModel.$Shape;

            /**
             * Decodes a TeamModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.TeamModel & com.antigravity.TeamModel.$Shape} TeamModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.TeamModel & com.antigravity.TeamModel.$Shape;

            /**
             * Verifies a TeamModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TeamModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TeamModel
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.TeamModel;

            /**
             * Creates a plain object from a TeamModel message. Also converts values to other types if specified.
             * @param message TeamModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.TeamModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TeamModel to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for TeamModel
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace TeamModel {

            /** Properties of a TeamModel. */
            interface $Properties {

                /** TeamModel model */
                model?: (com.antigravity.Model.$Properties|null);

                /** TeamModel name */
                name?: (string|null);

                /** TeamModel avatarUrl */
                avatarUrl?: (string|null);

                /** TeamModel driverIds */
                driverIds?: (string[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a TeamModel. */
            type $Shape = com.antigravity.TeamModel.$Properties;
        }

        /**
         * Properties of an UpdateInterfaceConfigRequest.
         * @deprecated Use com.antigravity.UpdateInterfaceConfigRequest.$Properties instead.
         */
        interface IUpdateInterfaceConfigRequest extends com.antigravity.UpdateInterfaceConfigRequest.$Properties {
        }

        /** Represents an UpdateInterfaceConfigRequest. */
        class UpdateInterfaceConfigRequest {

            /**
             * Constructs a new UpdateInterfaceConfigRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.UpdateInterfaceConfigRequest.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** UpdateInterfaceConfigRequest config. */
            config?: (com.antigravity.ArduinoConfig.$Properties|null);

            /** UpdateInterfaceConfigRequest interfaceIndex. */
            interfaceIndex: number;

            /**
             * Creates a new UpdateInterfaceConfigRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UpdateInterfaceConfigRequest instance
             */
            static create(properties: com.antigravity.UpdateInterfaceConfigRequest.$Shape): com.antigravity.UpdateInterfaceConfigRequest & com.antigravity.UpdateInterfaceConfigRequest.$Shape;
            static create(properties?: com.antigravity.UpdateInterfaceConfigRequest.$Properties): com.antigravity.UpdateInterfaceConfigRequest;

            /**
             * Encodes the specified UpdateInterfaceConfigRequest message. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigRequest.verify|verify} messages.
             * @param message UpdateInterfaceConfigRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.UpdateInterfaceConfigRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UpdateInterfaceConfigRequest message, length delimited. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigRequest.verify|verify} messages.
             * @param message UpdateInterfaceConfigRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.UpdateInterfaceConfigRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UpdateInterfaceConfigRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.UpdateInterfaceConfigRequest & com.antigravity.UpdateInterfaceConfigRequest.$Shape} UpdateInterfaceConfigRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.UpdateInterfaceConfigRequest & com.antigravity.UpdateInterfaceConfigRequest.$Shape;

            /**
             * Decodes an UpdateInterfaceConfigRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.UpdateInterfaceConfigRequest & com.antigravity.UpdateInterfaceConfigRequest.$Shape} UpdateInterfaceConfigRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.UpdateInterfaceConfigRequest & com.antigravity.UpdateInterfaceConfigRequest.$Shape;

            /**
             * Verifies an UpdateInterfaceConfigRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UpdateInterfaceConfigRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UpdateInterfaceConfigRequest
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.UpdateInterfaceConfigRequest;

            /**
             * Creates a plain object from an UpdateInterfaceConfigRequest message. Also converts values to other types if specified.
             * @param message UpdateInterfaceConfigRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.UpdateInterfaceConfigRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UpdateInterfaceConfigRequest to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for UpdateInterfaceConfigRequest
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace UpdateInterfaceConfigRequest {

            /** Properties of an UpdateInterfaceConfigRequest. */
            interface $Properties {

                /** UpdateInterfaceConfigRequest config */
                config?: (com.antigravity.ArduinoConfig.$Properties|null);

                /** UpdateInterfaceConfigRequest interfaceIndex */
                interfaceIndex?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an UpdateInterfaceConfigRequest. */
            type $Shape = com.antigravity.UpdateInterfaceConfigRequest.$Properties;
        }

        /**
         * Properties of an UpdateInterfaceConfigResponse.
         * @deprecated Use com.antigravity.UpdateInterfaceConfigResponse.$Properties instead.
         */
        interface IUpdateInterfaceConfigResponse extends com.antigravity.UpdateInterfaceConfigResponse.$Properties {
        }

        /** Represents an UpdateInterfaceConfigResponse. */
        class UpdateInterfaceConfigResponse {

            /**
             * Constructs a new UpdateInterfaceConfigResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.UpdateInterfaceConfigResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** UpdateInterfaceConfigResponse success. */
            success: boolean;

            /** UpdateInterfaceConfigResponse message. */
            message: string;

            /**
             * Creates a new UpdateInterfaceConfigResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UpdateInterfaceConfigResponse instance
             */
            static create(properties: com.antigravity.UpdateInterfaceConfigResponse.$Shape): com.antigravity.UpdateInterfaceConfigResponse & com.antigravity.UpdateInterfaceConfigResponse.$Shape;
            static create(properties?: com.antigravity.UpdateInterfaceConfigResponse.$Properties): com.antigravity.UpdateInterfaceConfigResponse;

            /**
             * Encodes the specified UpdateInterfaceConfigResponse message. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigResponse.verify|verify} messages.
             * @param message UpdateInterfaceConfigResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.UpdateInterfaceConfigResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UpdateInterfaceConfigResponse message, length delimited. Does not implicitly {@link com.antigravity.UpdateInterfaceConfigResponse.verify|verify} messages.
             * @param message UpdateInterfaceConfigResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.UpdateInterfaceConfigResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UpdateInterfaceConfigResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.UpdateInterfaceConfigResponse & com.antigravity.UpdateInterfaceConfigResponse.$Shape} UpdateInterfaceConfigResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.UpdateInterfaceConfigResponse & com.antigravity.UpdateInterfaceConfigResponse.$Shape;

            /**
             * Decodes an UpdateInterfaceConfigResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.UpdateInterfaceConfigResponse & com.antigravity.UpdateInterfaceConfigResponse.$Shape} UpdateInterfaceConfigResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.UpdateInterfaceConfigResponse & com.antigravity.UpdateInterfaceConfigResponse.$Shape;

            /**
             * Verifies an UpdateInterfaceConfigResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UpdateInterfaceConfigResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UpdateInterfaceConfigResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.UpdateInterfaceConfigResponse;

            /**
             * Creates a plain object from an UpdateInterfaceConfigResponse message. Also converts values to other types if specified.
             * @param message UpdateInterfaceConfigResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.UpdateInterfaceConfigResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UpdateInterfaceConfigResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for UpdateInterfaceConfigResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace UpdateInterfaceConfigResponse {

            /** Properties of an UpdateInterfaceConfigResponse. */
            interface $Properties {

                /** UpdateInterfaceConfigResponse success */
                success?: (boolean|null);

                /** UpdateInterfaceConfigResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an UpdateInterfaceConfigResponse. */
            type $Shape = com.antigravity.UpdateInterfaceConfigResponse.$Properties;
        }

        /**
         * Properties of a ListAssetsResponse.
         * @deprecated Use com.antigravity.ListAssetsResponse.$Properties instead.
         */
        interface IListAssetsResponse extends com.antigravity.ListAssetsResponse.$Properties {
        }

        /** Represents a ListAssetsResponse. */
        class ListAssetsResponse {

            /**
             * Constructs a new ListAssetsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ListAssetsResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** ListAssetsResponse assets. */
            assets: com.antigravity.AssetMessage.$Properties[];

            /**
             * Creates a new ListAssetsResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListAssetsResponse instance
             */
            static create(properties: com.antigravity.ListAssetsResponse.$Shape): com.antigravity.ListAssetsResponse & com.antigravity.ListAssetsResponse.$Shape;
            static create(properties?: com.antigravity.ListAssetsResponse.$Properties): com.antigravity.ListAssetsResponse;

            /**
             * Encodes the specified ListAssetsResponse message. Does not implicitly {@link com.antigravity.ListAssetsResponse.verify|verify} messages.
             * @param message ListAssetsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.ListAssetsResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListAssetsResponse message, length delimited. Does not implicitly {@link com.antigravity.ListAssetsResponse.verify|verify} messages.
             * @param message ListAssetsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.ListAssetsResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListAssetsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.ListAssetsResponse & com.antigravity.ListAssetsResponse.$Shape} ListAssetsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ListAssetsResponse & com.antigravity.ListAssetsResponse.$Shape;

            /**
             * Decodes a ListAssetsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.ListAssetsResponse & com.antigravity.ListAssetsResponse.$Shape} ListAssetsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ListAssetsResponse & com.antigravity.ListAssetsResponse.$Shape;

            /**
             * Verifies a ListAssetsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListAssetsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListAssetsResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.ListAssetsResponse;

            /**
             * Creates a plain object from a ListAssetsResponse message. Also converts values to other types if specified.
             * @param message ListAssetsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.ListAssetsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListAssetsResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for ListAssetsResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace ListAssetsResponse {

            /** Properties of a ListAssetsResponse. */
            interface $Properties {

                /** ListAssetsResponse assets */
                assets?: (com.antigravity.AssetMessage.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a ListAssetsResponse. */
            type $Shape = com.antigravity.ListAssetsResponse.$Properties;
        }

        /**
         * Properties of an UploadAssetResponse.
         * @deprecated Use com.antigravity.UploadAssetResponse.$Properties instead.
         */
        interface IUploadAssetResponse extends com.antigravity.UploadAssetResponse.$Properties {
        }

        /** Represents an UploadAssetResponse. */
        class UploadAssetResponse {

            /**
             * Constructs a new UploadAssetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.UploadAssetResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** UploadAssetResponse success. */
            success: boolean;

            /** UploadAssetResponse message. */
            message: string;

            /** UploadAssetResponse asset. */
            asset?: (com.antigravity.AssetMessage.$Properties|null);

            /**
             * Creates a new UploadAssetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UploadAssetResponse instance
             */
            static create(properties: com.antigravity.UploadAssetResponse.$Shape): com.antigravity.UploadAssetResponse & com.antigravity.UploadAssetResponse.$Shape;
            static create(properties?: com.antigravity.UploadAssetResponse.$Properties): com.antigravity.UploadAssetResponse;

            /**
             * Encodes the specified UploadAssetResponse message. Does not implicitly {@link com.antigravity.UploadAssetResponse.verify|verify} messages.
             * @param message UploadAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.UploadAssetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UploadAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.UploadAssetResponse.verify|verify} messages.
             * @param message UploadAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.UploadAssetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UploadAssetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.UploadAssetResponse & com.antigravity.UploadAssetResponse.$Shape} UploadAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.UploadAssetResponse & com.antigravity.UploadAssetResponse.$Shape;

            /**
             * Decodes an UploadAssetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.UploadAssetResponse & com.antigravity.UploadAssetResponse.$Shape} UploadAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.UploadAssetResponse & com.antigravity.UploadAssetResponse.$Shape;

            /**
             * Verifies an UploadAssetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UploadAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UploadAssetResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.UploadAssetResponse;

            /**
             * Creates a plain object from an UploadAssetResponse message. Also converts values to other types if specified.
             * @param message UploadAssetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.UploadAssetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UploadAssetResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for UploadAssetResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace UploadAssetResponse {

            /** Properties of an UploadAssetResponse. */
            interface $Properties {

                /** UploadAssetResponse success */
                success?: (boolean|null);

                /** UploadAssetResponse message */
                message?: (string|null);

                /** UploadAssetResponse asset */
                asset?: (com.antigravity.AssetMessage.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an UploadAssetResponse. */
            type $Shape = com.antigravity.UploadAssetResponse.$Properties;
        }

        /**
         * Properties of a DeleteAssetResponse.
         * @deprecated Use com.antigravity.DeleteAssetResponse.$Properties instead.
         */
        interface IDeleteAssetResponse extends com.antigravity.DeleteAssetResponse.$Properties {
        }

        /** Represents a DeleteAssetResponse. */
        class DeleteAssetResponse {

            /**
             * Constructs a new DeleteAssetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DeleteAssetResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DeleteAssetResponse success. */
            success: boolean;

            /** DeleteAssetResponse message. */
            message: string;

            /**
             * Creates a new DeleteAssetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeleteAssetResponse instance
             */
            static create(properties: com.antigravity.DeleteAssetResponse.$Shape): com.antigravity.DeleteAssetResponse & com.antigravity.DeleteAssetResponse.$Shape;
            static create(properties?: com.antigravity.DeleteAssetResponse.$Properties): com.antigravity.DeleteAssetResponse;

            /**
             * Encodes the specified DeleteAssetResponse message. Does not implicitly {@link com.antigravity.DeleteAssetResponse.verify|verify} messages.
             * @param message DeleteAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DeleteAssetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeleteAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.DeleteAssetResponse.verify|verify} messages.
             * @param message DeleteAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DeleteAssetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeleteAssetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DeleteAssetResponse & com.antigravity.DeleteAssetResponse.$Shape} DeleteAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeleteAssetResponse & com.antigravity.DeleteAssetResponse.$Shape;

            /**
             * Decodes a DeleteAssetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DeleteAssetResponse & com.antigravity.DeleteAssetResponse.$Shape} DeleteAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeleteAssetResponse & com.antigravity.DeleteAssetResponse.$Shape;

            /**
             * Verifies a DeleteAssetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeleteAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeleteAssetResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DeleteAssetResponse;

            /**
             * Creates a plain object from a DeleteAssetResponse message. Also converts values to other types if specified.
             * @param message DeleteAssetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DeleteAssetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeleteAssetResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DeleteAssetResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DeleteAssetResponse {

            /** Properties of a DeleteAssetResponse. */
            interface $Properties {

                /** DeleteAssetResponse success */
                success?: (boolean|null);

                /** DeleteAssetResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DeleteAssetResponse. */
            type $Shape = com.antigravity.DeleteAssetResponse.$Properties;
        }

        /**
         * Properties of a RenameAssetResponse.
         * @deprecated Use com.antigravity.RenameAssetResponse.$Properties instead.
         */
        interface IRenameAssetResponse extends com.antigravity.RenameAssetResponse.$Properties {
        }

        /** Represents a RenameAssetResponse. */
        class RenameAssetResponse {

            /**
             * Constructs a new RenameAssetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RenameAssetResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RenameAssetResponse success. */
            success: boolean;

            /** RenameAssetResponse message. */
            message: string;

            /**
             * Creates a new RenameAssetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RenameAssetResponse instance
             */
            static create(properties: com.antigravity.RenameAssetResponse.$Shape): com.antigravity.RenameAssetResponse & com.antigravity.RenameAssetResponse.$Shape;
            static create(properties?: com.antigravity.RenameAssetResponse.$Properties): com.antigravity.RenameAssetResponse;

            /**
             * Encodes the specified RenameAssetResponse message. Does not implicitly {@link com.antigravity.RenameAssetResponse.verify|verify} messages.
             * @param message RenameAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RenameAssetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RenameAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.RenameAssetResponse.verify|verify} messages.
             * @param message RenameAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RenameAssetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RenameAssetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RenameAssetResponse & com.antigravity.RenameAssetResponse.$Shape} RenameAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RenameAssetResponse & com.antigravity.RenameAssetResponse.$Shape;

            /**
             * Decodes a RenameAssetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RenameAssetResponse & com.antigravity.RenameAssetResponse.$Shape} RenameAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RenameAssetResponse & com.antigravity.RenameAssetResponse.$Shape;

            /**
             * Verifies a RenameAssetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RenameAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RenameAssetResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RenameAssetResponse;

            /**
             * Creates a plain object from a RenameAssetResponse message. Also converts values to other types if specified.
             * @param message RenameAssetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RenameAssetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RenameAssetResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RenameAssetResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RenameAssetResponse {

            /** Properties of a RenameAssetResponse. */
            interface $Properties {

                /** RenameAssetResponse success */
                success?: (boolean|null);

                /** RenameAssetResponse message */
                message?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RenameAssetResponse. */
            type $Shape = com.antigravity.RenameAssetResponse.$Properties;
        }

        /**
         * Properties of a SaveImageSetResponse.
         * @deprecated Use com.antigravity.SaveImageSetResponse.$Properties instead.
         */
        interface ISaveImageSetResponse extends com.antigravity.SaveImageSetResponse.$Properties {
        }

        /** Represents a SaveImageSetResponse. */
        class SaveImageSetResponse {

            /**
             * Constructs a new SaveImageSetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveImageSetResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveImageSetResponse success. */
            success: boolean;

            /** SaveImageSetResponse message. */
            message: string;

            /** SaveImageSetResponse asset. */
            asset?: (com.antigravity.AssetMessage.$Properties|null);

            /**
             * Creates a new SaveImageSetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveImageSetResponse instance
             */
            static create(properties: com.antigravity.SaveImageSetResponse.$Shape): com.antigravity.SaveImageSetResponse & com.antigravity.SaveImageSetResponse.$Shape;
            static create(properties?: com.antigravity.SaveImageSetResponse.$Properties): com.antigravity.SaveImageSetResponse;

            /**
             * Encodes the specified SaveImageSetResponse message. Does not implicitly {@link com.antigravity.SaveImageSetResponse.verify|verify} messages.
             * @param message SaveImageSetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveImageSetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveImageSetResponse message, length delimited. Does not implicitly {@link com.antigravity.SaveImageSetResponse.verify|verify} messages.
             * @param message SaveImageSetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveImageSetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveImageSetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveImageSetResponse & com.antigravity.SaveImageSetResponse.$Shape} SaveImageSetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveImageSetResponse & com.antigravity.SaveImageSetResponse.$Shape;

            /**
             * Decodes a SaveImageSetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveImageSetResponse & com.antigravity.SaveImageSetResponse.$Shape} SaveImageSetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveImageSetResponse & com.antigravity.SaveImageSetResponse.$Shape;

            /**
             * Verifies a SaveImageSetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveImageSetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveImageSetResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveImageSetResponse;

            /**
             * Creates a plain object from a SaveImageSetResponse message. Also converts values to other types if specified.
             * @param message SaveImageSetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveImageSetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveImageSetResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveImageSetResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveImageSetResponse {

            /** Properties of a SaveImageSetResponse. */
            interface $Properties {

                /** SaveImageSetResponse success */
                success?: (boolean|null);

                /** SaveImageSetResponse message */
                message?: (string|null);

                /** SaveImageSetResponse asset */
                asset?: (com.antigravity.AssetMessage.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveImageSetResponse. */
            type $Shape = com.antigravity.SaveImageSetResponse.$Properties;
        }

        /**
         * Properties of a SaveAudioSetResponse.
         * @deprecated Use com.antigravity.SaveAudioSetResponse.$Properties instead.
         */
        interface ISaveAudioSetResponse extends com.antigravity.SaveAudioSetResponse.$Properties {
        }

        /** Represents a SaveAudioSetResponse. */
        class SaveAudioSetResponse {

            /**
             * Constructs a new SaveAudioSetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.SaveAudioSetResponse.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** SaveAudioSetResponse success. */
            success: boolean;

            /** SaveAudioSetResponse message. */
            message: string;

            /** SaveAudioSetResponse asset. */
            asset?: (com.antigravity.AssetMessage.$Properties|null);

            /**
             * Creates a new SaveAudioSetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SaveAudioSetResponse instance
             */
            static create(properties: com.antigravity.SaveAudioSetResponse.$Shape): com.antigravity.SaveAudioSetResponse & com.antigravity.SaveAudioSetResponse.$Shape;
            static create(properties?: com.antigravity.SaveAudioSetResponse.$Properties): com.antigravity.SaveAudioSetResponse;

            /**
             * Encodes the specified SaveAudioSetResponse message. Does not implicitly {@link com.antigravity.SaveAudioSetResponse.verify|verify} messages.
             * @param message SaveAudioSetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.SaveAudioSetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SaveAudioSetResponse message, length delimited. Does not implicitly {@link com.antigravity.SaveAudioSetResponse.verify|verify} messages.
             * @param message SaveAudioSetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.SaveAudioSetResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SaveAudioSetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.SaveAudioSetResponse & com.antigravity.SaveAudioSetResponse.$Shape} SaveAudioSetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SaveAudioSetResponse & com.antigravity.SaveAudioSetResponse.$Shape;

            /**
             * Decodes a SaveAudioSetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.SaveAudioSetResponse & com.antigravity.SaveAudioSetResponse.$Shape} SaveAudioSetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SaveAudioSetResponse & com.antigravity.SaveAudioSetResponse.$Shape;

            /**
             * Verifies a SaveAudioSetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SaveAudioSetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SaveAudioSetResponse
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.SaveAudioSetResponse;

            /**
             * Creates a plain object from a SaveAudioSetResponse message. Also converts values to other types if specified.
             * @param message SaveAudioSetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.SaveAudioSetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SaveAudioSetResponse to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SaveAudioSetResponse
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SaveAudioSetResponse {

            /** Properties of a SaveAudioSetResponse. */
            interface $Properties {

                /** SaveAudioSetResponse success */
                success?: (boolean|null);

                /** SaveAudioSetResponse message */
                message?: (string|null);

                /** SaveAudioSetResponse asset */
                asset?: (com.antigravity.AssetMessage.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SaveAudioSetResponse. */
            type $Shape = com.antigravity.SaveAudioSetResponse.$Properties;
        }

        /**
         * Properties of a CarData.
         * @deprecated Use com.antigravity.CarData.$Properties instead.
         */
        interface ICarData extends com.antigravity.CarData.$Properties {
        }

        /** Represents a CarData. */
        class CarData {

            /**
             * Constructs a new CarData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.CarData.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** CarData lane. */
            lane: number;

            /** CarData controllerThrottlePct. */
            controllerThrottlePct: number;

            /** CarData carThrottlePct. */
            carThrottlePct: number;

            /** CarData location. */
            location: number;

            /** CarData locationId. */
            locationId: number;

            /** CarData fuelLevel. */
            fuelLevel?: (number|null);

            /** CarData isRefueling. */
            isRefueling: boolean;

            /** CarData flag. */
            flag?: (com.antigravity.RaceFlag|null);

            /**
             * Creates a new CarData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CarData instance
             */
            static create(properties: com.antigravity.CarData.$Shape): com.antigravity.CarData & com.antigravity.CarData.$Shape;
            static create(properties?: com.antigravity.CarData.$Properties): com.antigravity.CarData;

            /**
             * Encodes the specified CarData message. Does not implicitly {@link com.antigravity.CarData.verify|verify} messages.
             * @param message CarData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.CarData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CarData message, length delimited. Does not implicitly {@link com.antigravity.CarData.verify|verify} messages.
             * @param message CarData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.CarData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CarData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.CarData & com.antigravity.CarData.$Shape} CarData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.CarData & com.antigravity.CarData.$Shape;

            /**
             * Decodes a CarData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.CarData & com.antigravity.CarData.$Shape} CarData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.CarData & com.antigravity.CarData.$Shape;

            /**
             * Verifies a CarData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CarData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CarData
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.CarData;

            /**
             * Creates a plain object from a CarData message. Also converts values to other types if specified.
             * @param message CarData
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.CarData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CarData to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CarData
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CarData {

            /** Properties of a CarData. */
            interface $Properties {

                /** CarData lane */
                lane?: (number|null);

                /** CarData controllerThrottlePct */
                controllerThrottlePct?: (number|null);

                /** CarData carThrottlePct */
                carThrottlePct?: (number|null);

                /** CarData location */
                location?: (number|null);

                /** CarData locationId */
                locationId?: (number|null);

                /** CarData fuelLevel */
                fuelLevel?: (number|null);

                /** CarData isRefueling */
                isRefueling?: (boolean|null);

                /** CarData flag */
                flag?: (com.antigravity.RaceFlag|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CarData. */
            type $Shape = com.antigravity.CarData.$Properties;
        }

        /** RaceState enum. */
        enum RaceState {

            /** UNKNOWN_STATE value */
            UNKNOWN_STATE = 0,

            /** NOT_STARTED value */
            NOT_STARTED = 1,

            /** STARTING value */
            STARTING = 2,

            /** RACING value */
            RACING = 3,

            /** PAUSED value */
            PAUSED = 4,

            /** HEAT_OVER value */
            HEAT_OVER = 5,

            /** RACE_OVER value */
            RACE_OVER = 6
        }

        /** RaceFlag enum. */
        enum RaceFlag {

            /** UNKNOWN_FLAG value */
            UNKNOWN_FLAG = 0,

            /** RED value */
            RED = 1,

            /** GREEN value */
            GREEN = 2,

            /** YELLOW value */
            YELLOW = 3,

            /** WHITE value */
            WHITE = 4,

            /** CHECKERED value */
            CHECKERED = 5,

            /** GREEN_YELLOW value */
            GREEN_YELLOW = 6,

            /** BLACK value */
            BLACK = 7
        }

        /** Namespace proto. */
        namespace proto {

            /** DemoPinId enum. */
            enum DemoPinId {

                /** DEMO_PIN_ID_UNSPECIFIED value */
                DEMO_PIN_ID_UNSPECIFIED = 0,

                /** DEMO_PIN_ID_LANE_BASE_VALUE value */
                DEMO_PIN_ID_LANE_BASE_VALUE = 1
            }
        }

        /**
         * Properties of a FullUpdate.
         * @deprecated Use com.antigravity.FullUpdate.$Properties instead.
         */
        interface IFullUpdate extends com.antigravity.FullUpdate.$Properties {
        }

        /** Represents a FullUpdate. */
        class FullUpdate {

            /**
             * Constructs a new FullUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.FullUpdate.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** FullUpdate race. */
            race?: (com.antigravity.RaceModel.$Properties|null);

            /** FullUpdate drivers. */
            drivers: com.antigravity.DriverModel.$Properties[];

            /** FullUpdate heats. */
            heats: com.antigravity.Heat.$Properties[];

            /** FullUpdate currentHeat. */
            currentHeat?: (com.antigravity.Heat.$Properties|null);

            /**
             * Creates a new FullUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FullUpdate instance
             */
            static create(properties: com.antigravity.FullUpdate.$Shape): com.antigravity.FullUpdate & com.antigravity.FullUpdate.$Shape;
            static create(properties?: com.antigravity.FullUpdate.$Properties): com.antigravity.FullUpdate;

            /**
             * Encodes the specified FullUpdate message. Does not implicitly {@link com.antigravity.FullUpdate.verify|verify} messages.
             * @param message FullUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.FullUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FullUpdate message, length delimited. Does not implicitly {@link com.antigravity.FullUpdate.verify|verify} messages.
             * @param message FullUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.FullUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FullUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.FullUpdate & com.antigravity.FullUpdate.$Shape} FullUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.FullUpdate & com.antigravity.FullUpdate.$Shape;

            /**
             * Decodes a FullUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.FullUpdate & com.antigravity.FullUpdate.$Shape} FullUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.FullUpdate & com.antigravity.FullUpdate.$Shape;

            /**
             * Verifies a FullUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FullUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FullUpdate
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.FullUpdate;

            /**
             * Creates a plain object from a FullUpdate message. Also converts values to other types if specified.
             * @param message FullUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.FullUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FullUpdate to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FullUpdate
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FullUpdate {

            /** Properties of a FullUpdate. */
            interface $Properties {

                /** FullUpdate race */
                race?: (com.antigravity.RaceModel.$Properties|null);

                /** FullUpdate drivers */
                drivers?: (com.antigravity.DriverModel.$Properties[]|null);

                /** FullUpdate heats */
                heats?: (com.antigravity.Heat.$Properties[]|null);

                /** FullUpdate currentHeat */
                currentHeat?: (com.antigravity.Heat.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FullUpdate. */
            type $Shape = com.antigravity.FullUpdate.$Properties;
        }

        /**
         * Properties of a Heat.
         * @deprecated Use com.antigravity.Heat.$Properties instead.
         */
        interface IHeat extends com.antigravity.Heat.$Properties {
        }

        /** Represents a Heat. */
        class Heat {

            /**
             * Constructs a new Heat.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.Heat.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** Heat heatDrivers. */
            heatDrivers: com.antigravity.DriverHeatData.$Properties[];

            /** Heat heatNumber. */
            heatNumber: number;

            /** Heat objectId. */
            objectId: string;

            /** Heat standings. */
            standings: string[];

            /**
             * Creates a new Heat instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Heat instance
             */
            static create(properties: com.antigravity.Heat.$Shape): com.antigravity.Heat & com.antigravity.Heat.$Shape;
            static create(properties?: com.antigravity.Heat.$Properties): com.antigravity.Heat;

            /**
             * Encodes the specified Heat message. Does not implicitly {@link com.antigravity.Heat.verify|verify} messages.
             * @param message Heat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.Heat.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Heat message, length delimited. Does not implicitly {@link com.antigravity.Heat.verify|verify} messages.
             * @param message Heat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.Heat.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Heat message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.Heat & com.antigravity.Heat.$Shape} Heat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Heat & com.antigravity.Heat.$Shape;

            /**
             * Decodes a Heat message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.Heat & com.antigravity.Heat.$Shape} Heat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Heat & com.antigravity.Heat.$Shape;

            /**
             * Verifies a Heat message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Heat message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Heat
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.Heat;

            /**
             * Creates a plain object from a Heat message. Also converts values to other types if specified.
             * @param message Heat
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.Heat, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Heat to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Heat
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Heat {

            /** Properties of a Heat. */
            interface $Properties {

                /** Heat heatDrivers */
                heatDrivers?: (com.antigravity.DriverHeatData.$Properties[]|null);

                /** Heat heatNumber */
                heatNumber?: (number|null);

                /** Heat objectId */
                objectId?: (string|null);

                /** Heat standings */
                standings?: (string[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Heat. */
            type $Shape = com.antigravity.Heat.$Properties;
        }

        /**
         * Properties of a LapData.
         * @deprecated Use com.antigravity.LapData.$Properties instead.
         */
        interface ILapData extends com.antigravity.LapData.$Properties {
        }

        /** Represents a LapData. */
        class LapData {

            /**
             * Constructs a new LapData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.LapData.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** LapData lapTime. */
            lapTime: number;

            /** LapData driverId. */
            driverId: string;

            /** LapData isDrift. */
            isDrift: boolean;

            /**
             * Creates a new LapData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LapData instance
             */
            static create(properties: com.antigravity.LapData.$Shape): com.antigravity.LapData & com.antigravity.LapData.$Shape;
            static create(properties?: com.antigravity.LapData.$Properties): com.antigravity.LapData;

            /**
             * Encodes the specified LapData message. Does not implicitly {@link com.antigravity.LapData.verify|verify} messages.
             * @param message LapData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.LapData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LapData message, length delimited. Does not implicitly {@link com.antigravity.LapData.verify|verify} messages.
             * @param message LapData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.LapData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LapData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.LapData & com.antigravity.LapData.$Shape} LapData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.LapData & com.antigravity.LapData.$Shape;

            /**
             * Decodes a LapData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.LapData & com.antigravity.LapData.$Shape} LapData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.LapData & com.antigravity.LapData.$Shape;

            /**
             * Verifies a LapData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LapData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LapData
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.LapData;

            /**
             * Creates a plain object from a LapData message. Also converts values to other types if specified.
             * @param message LapData
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.LapData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LapData to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for LapData
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace LapData {

            /** Properties of a LapData. */
            interface $Properties {

                /** LapData lapTime */
                lapTime?: (number|null);

                /** LapData driverId */
                driverId?: (string|null);

                /** LapData isDrift */
                isDrift?: (boolean|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a LapData. */
            type $Shape = com.antigravity.LapData.$Properties;
        }

        /**
         * Properties of a DriverHeatData.
         * @deprecated Use com.antigravity.DriverHeatData.$Properties instead.
         */
        interface IDriverHeatData extends com.antigravity.DriverHeatData.$Properties {
        }

        /** Represents a DriverHeatData. */
        class DriverHeatData {

            /**
             * Constructs a new DriverHeatData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.DriverHeatData.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** DriverHeatData driver. */
            driver?: (com.antigravity.RaceParticipant.$Properties|null);

            /** DriverHeatData objectId. */
            objectId: string;

            /** DriverHeatData driverId. */
            driverId: string;

            /** DriverHeatData actualDriver. */
            actualDriver?: (com.antigravity.DriverModel.$Properties|null);

            /** DriverHeatData gapLeader. */
            gapLeader: number;

            /** DriverHeatData gapPosition. */
            gapPosition: number;

            /** DriverHeatData segments. */
            segments: number[];

            /** DriverHeatData laps. */
            laps: com.antigravity.LapData.$Properties[];

            /** DriverHeatData penaltyLaps. */
            penaltyLaps: number;

            /** DriverHeatData userLaps. */
            userLaps: number;

            /** DriverHeatData autoCalculatedLaps. */
            autoCalculatedLaps: number;

            /** DriverHeatData adjustedLapCount. */
            adjustedLapCount: number;

            /** DriverHeatData averageLapTime. */
            averageLapTime: number;

            /** DriverHeatData medianLapTime. */
            medianLapTime: number;

            /** DriverHeatData bestLapTime. */
            bestLapTime: number;

            /** DriverHeatData reactionTime. */
            reactionTime: number;

            /** DriverHeatData isRefueling. */
            isRefueling: boolean;

            /** DriverHeatData currentLocation. */
            currentLocation: number;

            /** DriverHeatData initialFuelLevel. */
            initialFuelLevel: number;

            /** DriverHeatData falseStarts. */
            falseStarts: number;

            /** DriverHeatData flag. */
            flag: com.antigravity.RaceFlag;

            /**
             * Creates a new DriverHeatData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DriverHeatData instance
             */
            static create(properties: com.antigravity.DriverHeatData.$Shape): com.antigravity.DriverHeatData & com.antigravity.DriverHeatData.$Shape;
            static create(properties?: com.antigravity.DriverHeatData.$Properties): com.antigravity.DriverHeatData;

            /**
             * Encodes the specified DriverHeatData message. Does not implicitly {@link com.antigravity.DriverHeatData.verify|verify} messages.
             * @param message DriverHeatData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.DriverHeatData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DriverHeatData message, length delimited. Does not implicitly {@link com.antigravity.DriverHeatData.verify|verify} messages.
             * @param message DriverHeatData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.DriverHeatData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DriverHeatData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.DriverHeatData & com.antigravity.DriverHeatData.$Shape} DriverHeatData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DriverHeatData & com.antigravity.DriverHeatData.$Shape;

            /**
             * Decodes a DriverHeatData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.DriverHeatData & com.antigravity.DriverHeatData.$Shape} DriverHeatData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DriverHeatData & com.antigravity.DriverHeatData.$Shape;

            /**
             * Verifies a DriverHeatData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DriverHeatData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DriverHeatData
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.DriverHeatData;

            /**
             * Creates a plain object from a DriverHeatData message. Also converts values to other types if specified.
             * @param message DriverHeatData
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.DriverHeatData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DriverHeatData to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for DriverHeatData
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace DriverHeatData {

            /** Properties of a DriverHeatData. */
            interface $Properties {

                /** DriverHeatData driver */
                driver?: (com.antigravity.RaceParticipant.$Properties|null);

                /** DriverHeatData objectId */
                objectId?: (string|null);

                /** DriverHeatData driverId */
                driverId?: (string|null);

                /** DriverHeatData actualDriver */
                actualDriver?: (com.antigravity.DriverModel.$Properties|null);

                /** DriverHeatData gapLeader */
                gapLeader?: (number|null);

                /** DriverHeatData gapPosition */
                gapPosition?: (number|null);

                /** DriverHeatData segments */
                segments?: (number[]|null);

                /** DriverHeatData laps */
                laps?: (com.antigravity.LapData.$Properties[]|null);

                /** DriverHeatData penaltyLaps */
                penaltyLaps?: (number|null);

                /** DriverHeatData userLaps */
                userLaps?: (number|null);

                /** DriverHeatData autoCalculatedLaps */
                autoCalculatedLaps?: (number|null);

                /** DriverHeatData adjustedLapCount */
                adjustedLapCount?: (number|null);

                /** DriverHeatData averageLapTime */
                averageLapTime?: (number|null);

                /** DriverHeatData medianLapTime */
                medianLapTime?: (number|null);

                /** DriverHeatData bestLapTime */
                bestLapTime?: (number|null);

                /** DriverHeatData reactionTime */
                reactionTime?: (number|null);

                /** DriverHeatData isRefueling */
                isRefueling?: (boolean|null);

                /** DriverHeatData currentLocation */
                currentLocation?: (number|null);

                /** DriverHeatData initialFuelLevel */
                initialFuelLevel?: (number|null);

                /** DriverHeatData falseStarts */
                falseStarts?: (number|null);

                /** DriverHeatData flag */
                flag?: (com.antigravity.RaceFlag|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a DriverHeatData. */
            type $Shape = com.antigravity.DriverHeatData.$Properties;
        }

        /**
         * Properties of a RaceParticipant.
         * @deprecated Use com.antigravity.RaceParticipant.$Properties instead.
         */
        interface IRaceParticipant extends com.antigravity.RaceParticipant.$Properties {
        }

        /** Represents a RaceParticipant. */
        class RaceParticipant {

            /**
             * Constructs a new RaceParticipant.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RaceParticipant.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RaceParticipant objectId. */
            objectId: string;

            /** RaceParticipant driver. */
            driver?: (com.antigravity.DriverModel.$Properties|null);

            /** RaceParticipant rank. */
            rank: number;

            /** RaceParticipant totalLaps. */
            totalLaps: number;

            /** RaceParticipant totalTime. */
            totalTime: number;

            /** RaceParticipant bestLapTime. */
            bestLapTime: number;

            /** RaceParticipant averageLapTime. */
            averageLapTime: number;

            /** RaceParticipant medianLapTime. */
            medianLapTime: number;

            /** RaceParticipant rankValue. */
            rankValue: number;

            /** RaceParticipant seed. */
            seed: number;

            /** RaceParticipant team. */
            team?: (com.antigravity.TeamModel.$Properties|null);

            /** RaceParticipant fuelLevel. */
            fuelLevel: number;

            /**
             * Creates a new RaceParticipant instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceParticipant instance
             */
            static create(properties: com.antigravity.RaceParticipant.$Shape): com.antigravity.RaceParticipant & com.antigravity.RaceParticipant.$Shape;
            static create(properties?: com.antigravity.RaceParticipant.$Properties): com.antigravity.RaceParticipant;

            /**
             * Encodes the specified RaceParticipant message. Does not implicitly {@link com.antigravity.RaceParticipant.verify|verify} messages.
             * @param message RaceParticipant message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RaceParticipant.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceParticipant message, length delimited. Does not implicitly {@link com.antigravity.RaceParticipant.verify|verify} messages.
             * @param message RaceParticipant message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RaceParticipant.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceParticipant message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RaceParticipant & com.antigravity.RaceParticipant.$Shape} RaceParticipant
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceParticipant & com.antigravity.RaceParticipant.$Shape;

            /**
             * Decodes a RaceParticipant message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceParticipant & com.antigravity.RaceParticipant.$Shape} RaceParticipant
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceParticipant & com.antigravity.RaceParticipant.$Shape;

            /**
             * Verifies a RaceParticipant message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceParticipant message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceParticipant
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RaceParticipant;

            /**
             * Creates a plain object from a RaceParticipant message. Also converts values to other types if specified.
             * @param message RaceParticipant
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RaceParticipant, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceParticipant to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RaceParticipant
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RaceParticipant {

            /** Properties of a RaceParticipant. */
            interface $Properties {

                /** RaceParticipant objectId */
                objectId?: (string|null);

                /** RaceParticipant driver */
                driver?: (com.antigravity.DriverModel.$Properties|null);

                /** RaceParticipant rank */
                rank?: (number|null);

                /** RaceParticipant totalLaps */
                totalLaps?: (number|null);

                /** RaceParticipant totalTime */
                totalTime?: (number|null);

                /** RaceParticipant bestLapTime */
                bestLapTime?: (number|null);

                /** RaceParticipant averageLapTime */
                averageLapTime?: (number|null);

                /** RaceParticipant medianLapTime */
                medianLapTime?: (number|null);

                /** RaceParticipant rankValue */
                rankValue?: (number|null);

                /** RaceParticipant seed */
                seed?: (number|null);

                /** RaceParticipant team */
                team?: (com.antigravity.TeamModel.$Properties|null);

                /** RaceParticipant fuelLevel */
                fuelLevel?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RaceParticipant. */
            type $Shape = com.antigravity.RaceParticipant.$Properties;
        }

        /**
         * Properties of a Lap.
         * @deprecated Use com.antigravity.Lap.$Properties instead.
         */
        interface ILap extends com.antigravity.Lap.$Properties {
        }

        /** Represents a Lap. */
        class Lap {

            /**
             * Constructs a new Lap.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.Lap.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** Lap objectId. */
            objectId: string;

            /** Lap lapTime. */
            lapTime: number;

            /** Lap lapNumber. */
            lapNumber: number;

            /** Lap averageLapTime. */
            averageLapTime: number;

            /** Lap medianLapTime. */
            medianLapTime: number;

            /** Lap bestLapTime. */
            bestLapTime: number;

            /** Lap interfaceId. */
            interfaceId: number;

            /** Lap driverId. */
            driverId: string;

            /** Lap fuelLevel. */
            fuelLevel: number;

            /** Lap isDrift. */
            isDrift: boolean;

            /** Lap adjustedLapCount. */
            adjustedLapCount: number;

            /** Lap type. */
            type: com.antigravity.Lap.LapType;

            /** Lap flag. */
            flag: com.antigravity.RaceFlag;

            /**
             * Creates a new Lap instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Lap instance
             */
            static create(properties: com.antigravity.Lap.$Shape): com.antigravity.Lap & com.antigravity.Lap.$Shape;
            static create(properties?: com.antigravity.Lap.$Properties): com.antigravity.Lap;

            /**
             * Encodes the specified Lap message. Does not implicitly {@link com.antigravity.Lap.verify|verify} messages.
             * @param message Lap message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.Lap.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Lap message, length delimited. Does not implicitly {@link com.antigravity.Lap.verify|verify} messages.
             * @param message Lap message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.Lap.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Lap message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.Lap & com.antigravity.Lap.$Shape} Lap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Lap & com.antigravity.Lap.$Shape;

            /**
             * Decodes a Lap message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.Lap & com.antigravity.Lap.$Shape} Lap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Lap & com.antigravity.Lap.$Shape;

            /**
             * Verifies a Lap message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Lap message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Lap
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.Lap;

            /**
             * Creates a plain object from a Lap message. Also converts values to other types if specified.
             * @param message Lap
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.Lap, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Lap to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Lap
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Lap {

            /** Properties of a Lap. */
            interface $Properties {

                /** Lap objectId */
                objectId?: (string|null);

                /** Lap lapTime */
                lapTime?: (number|null);

                /** Lap lapNumber */
                lapNumber?: (number|null);

                /** Lap averageLapTime */
                averageLapTime?: (number|null);

                /** Lap medianLapTime */
                medianLapTime?: (number|null);

                /** Lap bestLapTime */
                bestLapTime?: (number|null);

                /** Lap interfaceId */
                interfaceId?: (number|null);

                /** Lap driverId */
                driverId?: (string|null);

                /** Lap fuelLevel */
                fuelLevel?: (number|null);

                /** Lap isDrift */
                isDrift?: (boolean|null);

                /** Lap adjustedLapCount */
                adjustedLapCount?: (number|null);

                /** Lap type */
                type?: (com.antigravity.Lap.LapType|null);

                /** Lap flag */
                flag?: (com.antigravity.RaceFlag|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Lap. */
            type $Shape = com.antigravity.Lap.$Properties;

            /** LapType enum. */
            enum LapType {

                /** LAP value */
                LAP = 0,

                /** REACTION_TIME value */
                REACTION_TIME = 1,

                /** FALSE_START value */
                FALSE_START = 2,

                /** MIN_LAP_TIME value */
                MIN_LAP_TIME = 3
            }
        }

        /**
         * Properties of an OverallStandingsUpdate.
         * @deprecated Use com.antigravity.OverallStandingsUpdate.$Properties instead.
         */
        interface IOverallStandingsUpdate extends com.antigravity.OverallStandingsUpdate.$Properties {
        }

        /** Represents an OverallStandingsUpdate. */
        class OverallStandingsUpdate {

            /**
             * Constructs a new OverallStandingsUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.OverallStandingsUpdate.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** OverallStandingsUpdate participants. */
            participants: com.antigravity.RaceParticipant.$Properties[];

            /**
             * Creates a new OverallStandingsUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OverallStandingsUpdate instance
             */
            static create(properties: com.antigravity.OverallStandingsUpdate.$Shape): com.antigravity.OverallStandingsUpdate & com.antigravity.OverallStandingsUpdate.$Shape;
            static create(properties?: com.antigravity.OverallStandingsUpdate.$Properties): com.antigravity.OverallStandingsUpdate;

            /**
             * Encodes the specified OverallStandingsUpdate message. Does not implicitly {@link com.antigravity.OverallStandingsUpdate.verify|verify} messages.
             * @param message OverallStandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.OverallStandingsUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OverallStandingsUpdate message, length delimited. Does not implicitly {@link com.antigravity.OverallStandingsUpdate.verify|verify} messages.
             * @param message OverallStandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.OverallStandingsUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OverallStandingsUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.OverallStandingsUpdate & com.antigravity.OverallStandingsUpdate.$Shape} OverallStandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.OverallStandingsUpdate & com.antigravity.OverallStandingsUpdate.$Shape;

            /**
             * Decodes an OverallStandingsUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.OverallStandingsUpdate & com.antigravity.OverallStandingsUpdate.$Shape} OverallStandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.OverallStandingsUpdate & com.antigravity.OverallStandingsUpdate.$Shape;

            /**
             * Verifies an OverallStandingsUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OverallStandingsUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OverallStandingsUpdate
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.OverallStandingsUpdate;

            /**
             * Creates a plain object from an OverallStandingsUpdate message. Also converts values to other types if specified.
             * @param message OverallStandingsUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.OverallStandingsUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OverallStandingsUpdate to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for OverallStandingsUpdate
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace OverallStandingsUpdate {

            /** Properties of an OverallStandingsUpdate. */
            interface $Properties {

                /** OverallStandingsUpdate participants */
                participants?: (com.antigravity.RaceParticipant.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an OverallStandingsUpdate. */
            type $Shape = com.antigravity.OverallStandingsUpdate.$Properties;
        }

        /**
         * Properties of a RaceData.
         * @deprecated Use com.antigravity.RaceData.$Properties instead.
         */
        interface IRaceData extends com.antigravity.RaceData.$Properties {
        }

        /** Represents a RaceData. */
        class RaceData {

            /**
             * Constructs a new RaceData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RaceData.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RaceData raceTime. */
            raceTime?: (com.antigravity.RaceTime.$Properties|null);

            /** RaceData lap. */
            lap?: (com.antigravity.Lap.$Properties|null);

            /** RaceData race. */
            race?: (com.antigravity.Race.$Properties|null);

            /** RaceData standingsUpdate. */
            standingsUpdate?: (com.antigravity.StandingsUpdate.$Properties|null);

            /** RaceData overallStandingsUpdate. */
            overallStandingsUpdate?: (com.antigravity.OverallStandingsUpdate.$Properties|null);

            /** RaceData raceState. */
            raceState?: (com.antigravity.RaceState|null);

            /** RaceData carData. */
            carData?: (com.antigravity.CarData.$Properties|null);

            /** RaceData segment. */
            segment?: (com.antigravity.Segment.$Properties|null);

            /** RaceData flag. */
            flag?: (com.antigravity.RaceFlag|null);

            /** RaceData recordData. */
            recordData?: (com.antigravity.RecordData.$Properties|null);

            /**
             * Creates a new RaceData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceData instance
             */
            static create(properties: com.antigravity.RaceData.$Shape): com.antigravity.RaceData & com.antigravity.RaceData.$Shape;
            static create(properties?: com.antigravity.RaceData.$Properties): com.antigravity.RaceData;

            /**
             * Encodes the specified RaceData message. Does not implicitly {@link com.antigravity.RaceData.verify|verify} messages.
             * @param message RaceData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RaceData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceData message, length delimited. Does not implicitly {@link com.antigravity.RaceData.verify|verify} messages.
             * @param message RaceData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RaceData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RaceData & com.antigravity.RaceData.$Shape} RaceData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceData & com.antigravity.RaceData.$Shape;

            /**
             * Decodes a RaceData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceData & com.antigravity.RaceData.$Shape} RaceData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceData & com.antigravity.RaceData.$Shape;

            /**
             * Verifies a RaceData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceData
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RaceData;

            /**
             * Creates a plain object from a RaceData message. Also converts values to other types if specified.
             * @param message RaceData
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RaceData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceData to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RaceData
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RaceData {

            /** Properties of a RaceData. */
            interface $Properties {

                /** RaceData raceTime */
                raceTime?: (com.antigravity.RaceTime.$Properties|null);

                /** RaceData lap */
                lap?: (com.antigravity.Lap.$Properties|null);

                /** RaceData race */
                race?: (com.antigravity.Race.$Properties|null);

                /** RaceData standingsUpdate */
                standingsUpdate?: (com.antigravity.StandingsUpdate.$Properties|null);

                /** RaceData overallStandingsUpdate */
                overallStandingsUpdate?: (com.antigravity.OverallStandingsUpdate.$Properties|null);

                /** RaceData raceState */
                raceState?: (com.antigravity.RaceState|null);

                /** RaceData carData */
                carData?: (com.antigravity.CarData.$Properties|null);

                /** RaceData segment */
                segment?: (com.antigravity.Segment.$Properties|null);

                /** RaceData flag */
                flag?: (com.antigravity.RaceFlag|null);

                /** RaceData recordData */
                recordData?: (com.antigravity.RecordData.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RaceData. */
            type $Shape = com.antigravity.RaceData.$Properties;
        }

        /**
         * Properties of a RaceTime.
         * @deprecated Use com.antigravity.RaceTime.$Properties instead.
         */
        interface IRaceTime extends com.antigravity.RaceTime.$Properties {
        }

        /** Represents a RaceTime. */
        class RaceTime {

            /**
             * Constructs a new RaceTime.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RaceTime.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RaceTime time. */
            time: number;

            /** RaceTime autoStartRemaining. */
            autoStartRemaining: number;

            /** RaceTime autoAdvanceRemaining. */
            autoAdvanceRemaining: number;

            /**
             * Creates a new RaceTime instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceTime instance
             */
            static create(properties: com.antigravity.RaceTime.$Shape): com.antigravity.RaceTime & com.antigravity.RaceTime.$Shape;
            static create(properties?: com.antigravity.RaceTime.$Properties): com.antigravity.RaceTime;

            /**
             * Encodes the specified RaceTime message. Does not implicitly {@link com.antigravity.RaceTime.verify|verify} messages.
             * @param message RaceTime message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RaceTime.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceTime message, length delimited. Does not implicitly {@link com.antigravity.RaceTime.verify|verify} messages.
             * @param message RaceTime message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RaceTime.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceTime message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RaceTime & com.antigravity.RaceTime.$Shape} RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceTime & com.antigravity.RaceTime.$Shape;

            /**
             * Decodes a RaceTime message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RaceTime & com.antigravity.RaceTime.$Shape} RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceTime & com.antigravity.RaceTime.$Shape;

            /**
             * Verifies a RaceTime message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceTime message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceTime
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RaceTime;

            /**
             * Creates a plain object from a RaceTime message. Also converts values to other types if specified.
             * @param message RaceTime
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RaceTime, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceTime to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RaceTime
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RaceTime {

            /** Properties of a RaceTime. */
            interface $Properties {

                /** RaceTime time */
                time?: (number|null);

                /** RaceTime autoStartRemaining */
                autoStartRemaining?: (number|null);

                /** RaceTime autoAdvanceRemaining */
                autoAdvanceRemaining?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RaceTime. */
            type $Shape = com.antigravity.RaceTime.$Properties;
        }

        /**
         * Properties of a Race.
         * @deprecated Use com.antigravity.Race.$Properties instead.
         */
        interface IRace extends com.antigravity.Race.$Properties {
        }

        /** Represents a Race. */
        class Race {

            /**
             * Constructs a new Race.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.Race.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** Race race. */
            race?: (com.antigravity.RaceModel.$Properties|null);

            /** Race drivers. */
            drivers: com.antigravity.RaceParticipant.$Properties[];

            /** Race heats. */
            heats: com.antigravity.Heat.$Properties[];

            /** Race currentHeat. */
            currentHeat?: (com.antigravity.Heat.$Properties|null);

            /** Race state. */
            state: com.antigravity.RaceState;

            /** Race flag. */
            flag: com.antigravity.RaceFlag;

            /** Race recordData. */
            recordData?: (com.antigravity.RecordData.$Properties|null);

            /**
             * Creates a new Race instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Race instance
             */
            static create(properties: com.antigravity.Race.$Shape): com.antigravity.Race & com.antigravity.Race.$Shape;
            static create(properties?: com.antigravity.Race.$Properties): com.antigravity.Race;

            /**
             * Encodes the specified Race message. Does not implicitly {@link com.antigravity.Race.verify|verify} messages.
             * @param message Race message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.Race.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Race message, length delimited. Does not implicitly {@link com.antigravity.Race.verify|verify} messages.
             * @param message Race message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.Race.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Race message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.Race & com.antigravity.Race.$Shape} Race
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Race & com.antigravity.Race.$Shape;

            /**
             * Decodes a Race message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.Race & com.antigravity.Race.$Shape} Race
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Race & com.antigravity.Race.$Shape;

            /**
             * Verifies a Race message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Race message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Race
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.Race;

            /**
             * Creates a plain object from a Race message. Also converts values to other types if specified.
             * @param message Race
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.Race, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Race to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Race
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Race {

            /** Properties of a Race. */
            interface $Properties {

                /** Race race */
                race?: (com.antigravity.RaceModel.$Properties|null);

                /** Race drivers */
                drivers?: (com.antigravity.RaceParticipant.$Properties[]|null);

                /** Race heats */
                heats?: (com.antigravity.Heat.$Properties[]|null);

                /** Race currentHeat */
                currentHeat?: (com.antigravity.Heat.$Properties|null);

                /** Race state */
                state?: (com.antigravity.RaceState|null);

                /** Race flag */
                flag?: (com.antigravity.RaceFlag|null);

                /** Race recordData */
                recordData?: (com.antigravity.RecordData.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Race. */
            type $Shape = com.antigravity.Race.$Properties;
        }

        /**
         * Properties of a RecordEntry.
         * @deprecated Use com.antigravity.RecordEntry.$Properties instead.
         */
        interface IRecordEntry extends com.antigravity.RecordEntry.$Properties {
        }

        /** Represents a RecordEntry. */
        class RecordEntry {

            /**
             * Constructs a new RecordEntry.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RecordEntry.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RecordEntry value. */
            value: number;

            /** RecordEntry holderName. */
            holderName: string;

            /** RecordEntry date. */
            date: (number|Long);

            /** RecordEntry holderNickname. */
            holderNickname: string;

            /** RecordEntry holderTeamName. */
            holderTeamName: string;

            /**
             * Creates a new RecordEntry instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RecordEntry instance
             */
            static create(properties: com.antigravity.RecordEntry.$Shape): com.antigravity.RecordEntry & com.antigravity.RecordEntry.$Shape;
            static create(properties?: com.antigravity.RecordEntry.$Properties): com.antigravity.RecordEntry;

            /**
             * Encodes the specified RecordEntry message. Does not implicitly {@link com.antigravity.RecordEntry.verify|verify} messages.
             * @param message RecordEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RecordEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RecordEntry message, length delimited. Does not implicitly {@link com.antigravity.RecordEntry.verify|verify} messages.
             * @param message RecordEntry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RecordEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RecordEntry message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RecordEntry & com.antigravity.RecordEntry.$Shape} RecordEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RecordEntry & com.antigravity.RecordEntry.$Shape;

            /**
             * Decodes a RecordEntry message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RecordEntry & com.antigravity.RecordEntry.$Shape} RecordEntry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RecordEntry & com.antigravity.RecordEntry.$Shape;

            /**
             * Verifies a RecordEntry message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RecordEntry message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RecordEntry
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RecordEntry;

            /**
             * Creates a plain object from a RecordEntry message. Also converts values to other types if specified.
             * @param message RecordEntry
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RecordEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RecordEntry to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RecordEntry
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RecordEntry {

            /** Properties of a RecordEntry. */
            interface $Properties {

                /** RecordEntry value */
                value?: (number|null);

                /** RecordEntry holderName */
                holderName?: (string|null);

                /** RecordEntry date */
                date?: (number|Long|null);

                /** RecordEntry holderNickname */
                holderNickname?: (string|null);

                /** RecordEntry holderTeamName */
                holderTeamName?: (string|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RecordEntry. */
            type $Shape = com.antigravity.RecordEntry.$Properties;
        }

        /**
         * Properties of a RecordData.
         * @deprecated Use com.antigravity.RecordData.$Properties instead.
         */
        interface IRecordData extends com.antigravity.RecordData.$Properties {
        }

        /** Represents a RecordData. */
        class RecordData {

            /**
             * Constructs a new RecordData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.RecordData.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** RecordData overall. */
            overall?: (com.antigravity.OverallRecords.$Properties|null);

            /** RecordData current. */
            current?: (com.antigravity.CurrentRecords.$Properties|null);

            /**
             * Creates a new RecordData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RecordData instance
             */
            static create(properties: com.antigravity.RecordData.$Shape): com.antigravity.RecordData & com.antigravity.RecordData.$Shape;
            static create(properties?: com.antigravity.RecordData.$Properties): com.antigravity.RecordData;

            /**
             * Encodes the specified RecordData message. Does not implicitly {@link com.antigravity.RecordData.verify|verify} messages.
             * @param message RecordData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.RecordData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RecordData message, length delimited. Does not implicitly {@link com.antigravity.RecordData.verify|verify} messages.
             * @param message RecordData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.RecordData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RecordData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.RecordData & com.antigravity.RecordData.$Shape} RecordData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RecordData & com.antigravity.RecordData.$Shape;

            /**
             * Decodes a RecordData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.RecordData & com.antigravity.RecordData.$Shape} RecordData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RecordData & com.antigravity.RecordData.$Shape;

            /**
             * Verifies a RecordData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RecordData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RecordData
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.RecordData;

            /**
             * Creates a plain object from a RecordData message. Also converts values to other types if specified.
             * @param message RecordData
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.RecordData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RecordData to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for RecordData
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace RecordData {

            /** Properties of a RecordData. */
            interface $Properties {

                /** RecordData overall */
                overall?: (com.antigravity.OverallRecords.$Properties|null);

                /** RecordData current */
                current?: (com.antigravity.CurrentRecords.$Properties|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a RecordData. */
            type $Shape = com.antigravity.RecordData.$Properties;
        }

        /**
         * Properties of an OverallRecords.
         * @deprecated Use com.antigravity.OverallRecords.$Properties instead.
         */
        interface IOverallRecords extends com.antigravity.OverallRecords.$Properties {
        }

        /** Represents an OverallRecords. */
        class OverallRecords {

            /**
             * Constructs a new OverallRecords.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.OverallRecords.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** OverallRecords fastestLap. */
            fastestLap?: (com.antigravity.RecordEntry.$Properties|null);

            /** OverallRecords highestScore. */
            highestScore?: (com.antigravity.RecordEntry.$Properties|null);

            /** OverallRecords laneFastestLap. */
            laneFastestLap: com.antigravity.RecordEntry.$Properties[];

            /** OverallRecords laneHighestScore. */
            laneHighestScore: com.antigravity.RecordEntry.$Properties[];

            /**
             * Creates a new OverallRecords instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OverallRecords instance
             */
            static create(properties: com.antigravity.OverallRecords.$Shape): com.antigravity.OverallRecords & com.antigravity.OverallRecords.$Shape;
            static create(properties?: com.antigravity.OverallRecords.$Properties): com.antigravity.OverallRecords;

            /**
             * Encodes the specified OverallRecords message. Does not implicitly {@link com.antigravity.OverallRecords.verify|verify} messages.
             * @param message OverallRecords message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.OverallRecords.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OverallRecords message, length delimited. Does not implicitly {@link com.antigravity.OverallRecords.verify|verify} messages.
             * @param message OverallRecords message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.OverallRecords.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OverallRecords message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.OverallRecords & com.antigravity.OverallRecords.$Shape} OverallRecords
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.OverallRecords & com.antigravity.OverallRecords.$Shape;

            /**
             * Decodes an OverallRecords message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.OverallRecords & com.antigravity.OverallRecords.$Shape} OverallRecords
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.OverallRecords & com.antigravity.OverallRecords.$Shape;

            /**
             * Verifies an OverallRecords message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OverallRecords message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OverallRecords
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.OverallRecords;

            /**
             * Creates a plain object from an OverallRecords message. Also converts values to other types if specified.
             * @param message OverallRecords
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.OverallRecords, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OverallRecords to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for OverallRecords
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace OverallRecords {

            /** Properties of an OverallRecords. */
            interface $Properties {

                /** OverallRecords fastestLap */
                fastestLap?: (com.antigravity.RecordEntry.$Properties|null);

                /** OverallRecords highestScore */
                highestScore?: (com.antigravity.RecordEntry.$Properties|null);

                /** OverallRecords laneFastestLap */
                laneFastestLap?: (com.antigravity.RecordEntry.$Properties[]|null);

                /** OverallRecords laneHighestScore */
                laneHighestScore?: (com.antigravity.RecordEntry.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an OverallRecords. */
            type $Shape = com.antigravity.OverallRecords.$Properties;
        }

        /**
         * Properties of a CurrentRecords.
         * @deprecated Use com.antigravity.CurrentRecords.$Properties instead.
         */
        interface ICurrentRecords extends com.antigravity.CurrentRecords.$Properties {
        }

        /** Represents a CurrentRecords. */
        class CurrentRecords {

            /**
             * Constructs a new CurrentRecords.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.CurrentRecords.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** CurrentRecords fastestLap. */
            fastestLap?: (com.antigravity.RecordEntry.$Properties|null);

            /** CurrentRecords highestScore. */
            highestScore?: (com.antigravity.RecordEntry.$Properties|null);

            /** CurrentRecords heatFastestLap. */
            heatFastestLap?: (com.antigravity.RecordEntry.$Properties|null);

            /** CurrentRecords laneFastestLap. */
            laneFastestLap: com.antigravity.RecordEntry.$Properties[];

            /** CurrentRecords laneHighestScore. */
            laneHighestScore: com.antigravity.RecordEntry.$Properties[];

            /**
             * Creates a new CurrentRecords instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CurrentRecords instance
             */
            static create(properties: com.antigravity.CurrentRecords.$Shape): com.antigravity.CurrentRecords & com.antigravity.CurrentRecords.$Shape;
            static create(properties?: com.antigravity.CurrentRecords.$Properties): com.antigravity.CurrentRecords;

            /**
             * Encodes the specified CurrentRecords message. Does not implicitly {@link com.antigravity.CurrentRecords.verify|verify} messages.
             * @param message CurrentRecords message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.CurrentRecords.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CurrentRecords message, length delimited. Does not implicitly {@link com.antigravity.CurrentRecords.verify|verify} messages.
             * @param message CurrentRecords message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.CurrentRecords.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CurrentRecords message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.CurrentRecords & com.antigravity.CurrentRecords.$Shape} CurrentRecords
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.CurrentRecords & com.antigravity.CurrentRecords.$Shape;

            /**
             * Decodes a CurrentRecords message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.CurrentRecords & com.antigravity.CurrentRecords.$Shape} CurrentRecords
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.CurrentRecords & com.antigravity.CurrentRecords.$Shape;

            /**
             * Verifies a CurrentRecords message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CurrentRecords message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CurrentRecords
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.CurrentRecords;

            /**
             * Creates a plain object from a CurrentRecords message. Also converts values to other types if specified.
             * @param message CurrentRecords
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.CurrentRecords, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CurrentRecords to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CurrentRecords
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CurrentRecords {

            /** Properties of a CurrentRecords. */
            interface $Properties {

                /** CurrentRecords fastestLap */
                fastestLap?: (com.antigravity.RecordEntry.$Properties|null);

                /** CurrentRecords highestScore */
                highestScore?: (com.antigravity.RecordEntry.$Properties|null);

                /** CurrentRecords heatFastestLap */
                heatFastestLap?: (com.antigravity.RecordEntry.$Properties|null);

                /** CurrentRecords laneFastestLap */
                laneFastestLap?: (com.antigravity.RecordEntry.$Properties[]|null);

                /** CurrentRecords laneHighestScore */
                laneHighestScore?: (com.antigravity.RecordEntry.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CurrentRecords. */
            type $Shape = com.antigravity.CurrentRecords.$Properties;
        }

        /**
         * Properties of a HeatPositionUpdate.
         * @deprecated Use com.antigravity.HeatPositionUpdate.$Properties instead.
         */
        interface IHeatPositionUpdate extends com.antigravity.HeatPositionUpdate.$Properties {
        }

        /** Represents a HeatPositionUpdate. */
        class HeatPositionUpdate {

            /**
             * Constructs a new HeatPositionUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.HeatPositionUpdate.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** HeatPositionUpdate objectId. */
            objectId: string;

            /** HeatPositionUpdate rank. */
            rank: number;

            /** HeatPositionUpdate gapLeader. */
            gapLeader: number;

            /** HeatPositionUpdate gapPosition. */
            gapPosition: number;

            /**
             * Creates a new HeatPositionUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HeatPositionUpdate instance
             */
            static create(properties: com.antigravity.HeatPositionUpdate.$Shape): com.antigravity.HeatPositionUpdate & com.antigravity.HeatPositionUpdate.$Shape;
            static create(properties?: com.antigravity.HeatPositionUpdate.$Properties): com.antigravity.HeatPositionUpdate;

            /**
             * Encodes the specified HeatPositionUpdate message. Does not implicitly {@link com.antigravity.HeatPositionUpdate.verify|verify} messages.
             * @param message HeatPositionUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.HeatPositionUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HeatPositionUpdate message, length delimited. Does not implicitly {@link com.antigravity.HeatPositionUpdate.verify|verify} messages.
             * @param message HeatPositionUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.HeatPositionUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HeatPositionUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.HeatPositionUpdate & com.antigravity.HeatPositionUpdate.$Shape} HeatPositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.HeatPositionUpdate & com.antigravity.HeatPositionUpdate.$Shape;

            /**
             * Decodes a HeatPositionUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.HeatPositionUpdate & com.antigravity.HeatPositionUpdate.$Shape} HeatPositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.HeatPositionUpdate & com.antigravity.HeatPositionUpdate.$Shape;

            /**
             * Verifies a HeatPositionUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HeatPositionUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HeatPositionUpdate
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.HeatPositionUpdate;

            /**
             * Creates a plain object from a HeatPositionUpdate message. Also converts values to other types if specified.
             * @param message HeatPositionUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.HeatPositionUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HeatPositionUpdate to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for HeatPositionUpdate
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace HeatPositionUpdate {

            /** Properties of a HeatPositionUpdate. */
            interface $Properties {

                /** HeatPositionUpdate objectId */
                objectId?: (string|null);

                /** HeatPositionUpdate rank */
                rank?: (number|null);

                /** HeatPositionUpdate gapLeader */
                gapLeader?: (number|null);

                /** HeatPositionUpdate gapPosition */
                gapPosition?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a HeatPositionUpdate. */
            type $Shape = com.antigravity.HeatPositionUpdate.$Properties;
        }

        /**
         * Properties of a StandingsUpdate.
         * @deprecated Use com.antigravity.StandingsUpdate.$Properties instead.
         */
        interface IStandingsUpdate extends com.antigravity.StandingsUpdate.$Properties {
        }

        /** Represents a StandingsUpdate. */
        class StandingsUpdate {

            /**
             * Constructs a new StandingsUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.StandingsUpdate.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** StandingsUpdate updates. */
            updates: com.antigravity.HeatPositionUpdate.$Properties[];

            /**
             * Creates a new StandingsUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StandingsUpdate instance
             */
            static create(properties: com.antigravity.StandingsUpdate.$Shape): com.antigravity.StandingsUpdate & com.antigravity.StandingsUpdate.$Shape;
            static create(properties?: com.antigravity.StandingsUpdate.$Properties): com.antigravity.StandingsUpdate;

            /**
             * Encodes the specified StandingsUpdate message. Does not implicitly {@link com.antigravity.StandingsUpdate.verify|verify} messages.
             * @param message StandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.StandingsUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StandingsUpdate message, length delimited. Does not implicitly {@link com.antigravity.StandingsUpdate.verify|verify} messages.
             * @param message StandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.StandingsUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StandingsUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.StandingsUpdate & com.antigravity.StandingsUpdate.$Shape} StandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.StandingsUpdate & com.antigravity.StandingsUpdate.$Shape;

            /**
             * Decodes a StandingsUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.StandingsUpdate & com.antigravity.StandingsUpdate.$Shape} StandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.StandingsUpdate & com.antigravity.StandingsUpdate.$Shape;

            /**
             * Verifies a StandingsUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StandingsUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StandingsUpdate
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.StandingsUpdate;

            /**
             * Creates a plain object from a StandingsUpdate message. Also converts values to other types if specified.
             * @param message StandingsUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.StandingsUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StandingsUpdate to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for StandingsUpdate
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace StandingsUpdate {

            /** Properties of a StandingsUpdate. */
            interface $Properties {

                /** StandingsUpdate updates */
                updates?: (com.antigravity.HeatPositionUpdate.$Properties[]|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a StandingsUpdate. */
            type $Shape = com.antigravity.StandingsUpdate.$Properties;
        }

        /**
         * Properties of a Segment.
         * @deprecated Use com.antigravity.Segment.$Properties instead.
         */
        interface ISegment extends com.antigravity.Segment.$Properties {
        }

        /** Represents a Segment. */
        class Segment {

            /**
             * Constructs a new Segment.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.Segment.$Properties);

            /** Unknown fields preserved while decoding */
            $unknowns?: Uint8Array[];

            /** Segment objectId. */
            objectId: string;

            /** Segment segmentTime. */
            segmentTime: number;

            /** Segment segmentNumber. */
            segmentNumber: number;

            /** Segment interfaceId. */
            interfaceId: number;

            /**
             * Creates a new Segment instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Segment instance
             */
            static create(properties: com.antigravity.Segment.$Shape): com.antigravity.Segment & com.antigravity.Segment.$Shape;
            static create(properties?: com.antigravity.Segment.$Properties): com.antigravity.Segment;

            /**
             * Encodes the specified Segment message. Does not implicitly {@link com.antigravity.Segment.verify|verify} messages.
             * @param message Segment message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: com.antigravity.Segment.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Segment message, length delimited. Does not implicitly {@link com.antigravity.Segment.verify|verify} messages.
             * @param message Segment message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: com.antigravity.Segment.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Segment message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {com.antigravity.Segment & com.antigravity.Segment.$Shape} Segment
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Segment & com.antigravity.Segment.$Shape;

            /**
             * Decodes a Segment message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {com.antigravity.Segment & com.antigravity.Segment.$Shape} Segment
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Segment & com.antigravity.Segment.$Shape;

            /**
             * Verifies a Segment message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Segment message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Segment
             */
            static fromObject(object: { [k: string]: any }): com.antigravity.Segment;

            /**
             * Creates a plain object from a Segment message. Also converts values to other types if specified.
             * @param message Segment
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: com.antigravity.Segment, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Segment to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Segment
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Segment {

            /** Properties of a Segment. */
            interface $Properties {

                /** Segment objectId */
                objectId?: (string|null);

                /** Segment segmentTime */
                segmentTime?: (number|null);

                /** Segment segmentNumber */
                segmentNumber?: (number|null);

                /** Segment interfaceId */
                interfaceId?: (number|null);

                /** Unknown fields preserved while decoding */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Segment. */
            type $Shape = com.antigravity.Segment.$Properties;
        }
    }
}
