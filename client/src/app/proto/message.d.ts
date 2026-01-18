import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace com. */
export namespace com {

    /** Namespace antigravity. */
    namespace antigravity {

        /** Properties of a HelloRequest. */
        interface IHelloRequest {

            /** HelloRequest name */
            name?: (string | null);
        }

        /** Represents a HelloRequest. */
        class HelloRequest implements IHelloRequest {

            /**
             * Constructs a new HelloRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IHelloRequest);

            /** HelloRequest name. */
            public name: string;

            /**
             * Creates a new HelloRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HelloRequest instance
             */
            public static create(properties?: com.antigravity.IHelloRequest): com.antigravity.HelloRequest;

            /**
             * Encodes the specified HelloRequest message. Does not implicitly {@link com.antigravity.HelloRequest.verify|verify} messages.
             * @param message HelloRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IHelloRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HelloRequest message, length delimited. Does not implicitly {@link com.antigravity.HelloRequest.verify|verify} messages.
             * @param message HelloRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IHelloRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HelloRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HelloRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): com.antigravity.HelloRequest;

            /**
             * Decodes a HelloRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HelloRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): com.antigravity.HelloRequest;

            /**
             * Verifies a HelloRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string | null);

            /**
             * Creates a HelloRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HelloRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.HelloRequest;

            /**
             * Creates a plain object from a HelloRequest message. Also converts values to other types if specified.
             * @param message HelloRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.HelloRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HelloRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for HelloRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a HelloResponse. */
        interface IHelloResponse {

            /** HelloResponse greeting */
            greeting?: (string | null);
        }

        /** Represents a HelloResponse. */
        class HelloResponse implements IHelloResponse {

            /**
             * Constructs a new HelloResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IHelloResponse);

            /** HelloResponse greeting. */
            public greeting: string;

            /**
             * Creates a new HelloResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HelloResponse instance
             */
            public static create(properties?: com.antigravity.IHelloResponse): com.antigravity.HelloResponse;

            /**
             * Encodes the specified HelloResponse message. Does not implicitly {@link com.antigravity.HelloResponse.verify|verify} messages.
             * @param message HelloResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IHelloResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HelloResponse message, length delimited. Does not implicitly {@link com.antigravity.HelloResponse.verify|verify} messages.
             * @param message HelloResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IHelloResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HelloResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HelloResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): com.antigravity.HelloResponse;

            /**
             * Decodes a HelloResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HelloResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): com.antigravity.HelloResponse;

            /**
             * Verifies a HelloResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string | null);

            /**
             * Creates a HelloResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HelloResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.HelloResponse;

            /**
             * Creates a plain object from a HelloResponse message. Also converts values to other types if specified.
             * @param message HelloResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.HelloResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HelloResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for HelloResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an InitializeRaceRequest. */
        interface IInitializeRaceRequest {

            /** InitializeRaceRequest raceId */
            raceId?: (string | null);

            /** InitializeRaceRequest driverIds */
            driverIds?: (string[] | null);
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
            public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): com.antigravity.InitializeRaceRequest;

            /**
             * Decodes an InitializeRaceRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns InitializeRaceRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): com.antigravity.InitializeRaceRequest;

            /**
             * Verifies an InitializeRaceRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string | null);

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
            success?: (boolean | null);

            /** InitializeRaceResponse message */
            message?: (string | null);
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
            public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): com.antigravity.InitializeRaceResponse;

            /**
             * Decodes an InitializeRaceResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns InitializeRaceResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): com.antigravity.InitializeRaceResponse;

            /**
             * Verifies an InitializeRaceResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string | null);

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
        /** Properties of a RaceTime. */
        interface IRaceTime {

            /** RaceTime time */
            time?: (number | null);
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
            public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): com.antigravity.RaceTime;

            /**
             * Decodes a RaceTime message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): com.antigravity.RaceTime;

            /**
             * Verifies a RaceTime message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string | null);

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
    }
}
