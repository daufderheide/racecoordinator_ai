import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace com. */
export namespace com {

    /** Namespace antigravity. */
    namespace antigravity {

        /** Properties of an InitializeRaceRequest. */
        interface IInitializeRaceRequest {

            /** InitializeRaceRequest raceId */
            raceId?: (string|null);

            /** InitializeRaceRequest driverIds */
            driverIds?: (string[]|null);

            /** InitializeRaceRequest isDemoMode */
            isDemoMode?: (boolean|null);
        }

        /** Represents an InitializeRaceRequest. */
        class InitializeRaceRequest implements IInitializeRaceRequest {

            /**
             * Constructs a new InitializeRaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IInitializeRaceRequest);

            /** InitializeRaceRequest raceId. */
            public raceId: string;

            /** InitializeRaceRequest driverIds. */
            public driverIds: string[];

            /** InitializeRaceRequest isDemoMode. */
            public isDemoMode: boolean;

            /**
             * Creates a new InitializeRaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InitializeRaceRequest instance
             */
            public static create(properties?: com.antigravity.IInitializeRaceRequest): com.antigravity.InitializeRaceRequest;

            /**
             * Encodes the specified InitializeRaceRequest message. Does not implicitly {@link com.antigravity.InitializeRaceRequest.verify|verify} messages.
             * @param message InitializeRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IInitializeRaceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InitializeRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.InitializeRaceRequest.verify|verify} messages.
             * @param message InitializeRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IInitializeRaceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InitializeRaceRequest;

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InitializeRaceRequest;

            /**
             * Verifies an InitializeRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InitializeRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InitializeRaceRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.InitializeRaceRequest;

            /**
             * Creates a plain object from an InitializeRaceRequest message. Also converts values to other types if specified.
             * @param message InitializeRaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.InitializeRaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InitializeRaceRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for InitializeRaceRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an InitializeRaceResponse. */
        interface IInitializeRaceResponse {

            /** InitializeRaceResponse success */
            success?: (boolean|null);

            /** InitializeRaceResponse message */
            message?: (string|null);
        }

        /** Represents an InitializeRaceResponse. */
        class InitializeRaceResponse implements IInitializeRaceResponse {

            /**
             * Constructs a new InitializeRaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IInitializeRaceResponse);

            /** InitializeRaceResponse success. */
            public success: boolean;

            /** InitializeRaceResponse message. */
            public message: string;

            /**
             * Creates a new InitializeRaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InitializeRaceResponse instance
             */
            public static create(properties?: com.antigravity.IInitializeRaceResponse): com.antigravity.InitializeRaceResponse;

            /**
             * Encodes the specified InitializeRaceResponse message. Does not implicitly {@link com.antigravity.InitializeRaceResponse.verify|verify} messages.
             * @param message InitializeRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IInitializeRaceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InitializeRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.InitializeRaceResponse.verify|verify} messages.
             * @param message InitializeRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IInitializeRaceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.InitializeRaceResponse;

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.InitializeRaceResponse;

            /**
             * Verifies an InitializeRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InitializeRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InitializeRaceResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.InitializeRaceResponse;

            /**
             * Creates a plain object from an InitializeRaceResponse message. Also converts values to other types if specified.
             * @param message InitializeRaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.InitializeRaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InitializeRaceResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for InitializeRaceResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a StartRaceRequest. */
        interface IStartRaceRequest {
        }

        /** Represents a StartRaceRequest. */
        class StartRaceRequest implements IStartRaceRequest {

            /**
             * Constructs a new StartRaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IStartRaceRequest);

            /**
             * Creates a new StartRaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StartRaceRequest instance
             */
            public static create(properties?: com.antigravity.IStartRaceRequest): com.antigravity.StartRaceRequest;

            /**
             * Encodes the specified StartRaceRequest message. Does not implicitly {@link com.antigravity.StartRaceRequest.verify|verify} messages.
             * @param message StartRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IStartRaceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StartRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.StartRaceRequest.verify|verify} messages.
             * @param message StartRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IStartRaceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StartRaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns StartRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.StartRaceRequest;

            /**
             * Decodes a StartRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns StartRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.StartRaceRequest;

            /**
             * Verifies a StartRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StartRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StartRaceRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.StartRaceRequest;

            /**
             * Creates a plain object from a StartRaceRequest message. Also converts values to other types if specified.
             * @param message StartRaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.StartRaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StartRaceRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for StartRaceRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a StartRaceResponse. */
        interface IStartRaceResponse {

            /** StartRaceResponse success */
            success?: (boolean|null);

            /** StartRaceResponse message */
            message?: (string|null);
        }

        /** Represents a StartRaceResponse. */
        class StartRaceResponse implements IStartRaceResponse {

            /**
             * Constructs a new StartRaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IStartRaceResponse);

            /** StartRaceResponse success. */
            public success: boolean;

            /** StartRaceResponse message. */
            public message: string;

            /**
             * Creates a new StartRaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StartRaceResponse instance
             */
            public static create(properties?: com.antigravity.IStartRaceResponse): com.antigravity.StartRaceResponse;

            /**
             * Encodes the specified StartRaceResponse message. Does not implicitly {@link com.antigravity.StartRaceResponse.verify|verify} messages.
             * @param message StartRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IStartRaceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StartRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.StartRaceResponse.verify|verify} messages.
             * @param message StartRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IStartRaceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StartRaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns StartRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.StartRaceResponse;

            /**
             * Decodes a StartRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns StartRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.StartRaceResponse;

            /**
             * Verifies a StartRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StartRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StartRaceResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.StartRaceResponse;

            /**
             * Creates a plain object from a StartRaceResponse message. Also converts values to other types if specified.
             * @param message StartRaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.StartRaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StartRaceResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for StartRaceResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PauseRaceRequest. */
        interface IPauseRaceRequest {
        }

        /** Represents a PauseRaceRequest. */
        class PauseRaceRequest implements IPauseRaceRequest {

            /**
             * Constructs a new PauseRaceRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IPauseRaceRequest);

            /**
             * Creates a new PauseRaceRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PauseRaceRequest instance
             */
            public static create(properties?: com.antigravity.IPauseRaceRequest): com.antigravity.PauseRaceRequest;

            /**
             * Encodes the specified PauseRaceRequest message. Does not implicitly {@link com.antigravity.PauseRaceRequest.verify|verify} messages.
             * @param message PauseRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IPauseRaceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PauseRaceRequest message, length delimited. Does not implicitly {@link com.antigravity.PauseRaceRequest.verify|verify} messages.
             * @param message PauseRaceRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IPauseRaceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PauseRaceRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PauseRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.PauseRaceRequest;

            /**
             * Decodes a PauseRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PauseRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.PauseRaceRequest;

            /**
             * Verifies a PauseRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PauseRaceRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PauseRaceRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.PauseRaceRequest;

            /**
             * Creates a plain object from a PauseRaceRequest message. Also converts values to other types if specified.
             * @param message PauseRaceRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.PauseRaceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PauseRaceRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PauseRaceRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PauseRaceResponse. */
        interface IPauseRaceResponse {

            /** PauseRaceResponse success */
            success?: (boolean|null);

            /** PauseRaceResponse message */
            message?: (string|null);
        }

        /** Represents a PauseRaceResponse. */
        class PauseRaceResponse implements IPauseRaceResponse {

            /**
             * Constructs a new PauseRaceResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IPauseRaceResponse);

            /** PauseRaceResponse success. */
            public success: boolean;

            /** PauseRaceResponse message. */
            public message: string;

            /**
             * Creates a new PauseRaceResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PauseRaceResponse instance
             */
            public static create(properties?: com.antigravity.IPauseRaceResponse): com.antigravity.PauseRaceResponse;

            /**
             * Encodes the specified PauseRaceResponse message. Does not implicitly {@link com.antigravity.PauseRaceResponse.verify|verify} messages.
             * @param message PauseRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IPauseRaceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PauseRaceResponse message, length delimited. Does not implicitly {@link com.antigravity.PauseRaceResponse.verify|verify} messages.
             * @param message PauseRaceResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IPauseRaceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PauseRaceResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PauseRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.PauseRaceResponse;

            /**
             * Decodes a PauseRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PauseRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.PauseRaceResponse;

            /**
             * Verifies a PauseRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PauseRaceResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PauseRaceResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.PauseRaceResponse;

            /**
             * Creates a plain object from a PauseRaceResponse message. Also converts values to other types if specified.
             * @param message PauseRaceResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.PauseRaceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PauseRaceResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PauseRaceResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RaceTime. */
        interface IRaceTime {

            /** RaceTime time */
            time?: (number|null);
        }

        /** Represents a RaceTime. */
        class RaceTime implements IRaceTime {

            /**
             * Constructs a new RaceTime.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRaceTime);

            /** RaceTime time. */
            public time: number;

            /**
             * Creates a new RaceTime instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceTime instance
             */
            public static create(properties?: com.antigravity.IRaceTime): com.antigravity.RaceTime;

            /**
             * Encodes the specified RaceTime message. Does not implicitly {@link com.antigravity.RaceTime.verify|verify} messages.
             * @param message RaceTime message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRaceTime, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceTime message, length delimited. Does not implicitly {@link com.antigravity.RaceTime.verify|verify} messages.
             * @param message RaceTime message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRaceTime, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceTime message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceTime;

            /**
             * Decodes a RaceTime message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceTime;

            /**
             * Verifies a RaceTime message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceTime message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceTime
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RaceTime;

            /**
             * Creates a plain object from a RaceTime message. Also converts values to other types if specified.
             * @param message RaceTime
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RaceTime, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceTime to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RaceTime
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Lap. */
        interface ILap {

            /** Lap lane */
            lane?: (number|null);

            /** Lap lapTime */
            lapTime?: (number|null);
        }

        /** Represents a Lap. */
        class Lap implements ILap {

            /**
             * Constructs a new Lap.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ILap);

            /** Lap lane. */
            public lane: number;

            /** Lap lapTime. */
            public lapTime: number;

            /**
             * Creates a new Lap instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Lap instance
             */
            public static create(properties?: com.antigravity.ILap): com.antigravity.Lap;

            /**
             * Encodes the specified Lap message. Does not implicitly {@link com.antigravity.Lap.verify|verify} messages.
             * @param message Lap message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.ILap, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Lap message, length delimited. Does not implicitly {@link com.antigravity.Lap.verify|verify} messages.
             * @param message Lap message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.ILap, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Lap message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Lap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Lap;

            /**
             * Decodes a Lap message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Lap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Lap;

            /**
             * Verifies a Lap message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Lap message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Lap
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.Lap;

            /**
             * Creates a plain object from a Lap message. Also converts values to other types if specified.
             * @param message Lap
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.Lap, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Lap to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Lap
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RaceData. */
        interface IRaceData {

            /** RaceData raceTime */
            raceTime?: (com.antigravity.IRaceTime|null);

            /** RaceData lap */
            lap?: (com.antigravity.ILap|null);
        }

        /** Represents a RaceData. */
        class RaceData implements IRaceData {

            /**
             * Constructs a new RaceData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRaceData);

            /** RaceData raceTime. */
            public raceTime?: (com.antigravity.IRaceTime|null);

            /** RaceData lap. */
            public lap?: (com.antigravity.ILap|null);

            /** RaceData data. */
            public data?: ("raceTime"|"lap");

            /**
             * Creates a new RaceData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceData instance
             */
            public static create(properties?: com.antigravity.IRaceData): com.antigravity.RaceData;

            /**
             * Encodes the specified RaceData message. Does not implicitly {@link com.antigravity.RaceData.verify|verify} messages.
             * @param message RaceData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRaceData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceData message, length delimited. Does not implicitly {@link com.antigravity.RaceData.verify|verify} messages.
             * @param message RaceData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRaceData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RaceData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceData;

            /**
             * Decodes a RaceData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceData;

            /**
             * Verifies a RaceData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceData
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RaceData;

            /**
             * Creates a plain object from a RaceData message. Also converts values to other types if specified.
             * @param message RaceData
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RaceData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceData to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RaceData
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
