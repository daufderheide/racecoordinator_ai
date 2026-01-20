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

        /** Properties of a RaceModel. */
        interface IRaceModel {

            /** RaceModel model */
            model?: (com.antigravity.IModel|null);

            /** RaceModel name */
            name?: (string|null);

            /** RaceModel track */
            track?: (com.antigravity.ITrackModel|null);
        }

        /** Represents a RaceModel. */
        class RaceModel implements IRaceModel {

            /**
             * Constructs a new RaceModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRaceModel);

            /** RaceModel model. */
            public model?: (com.antigravity.IModel|null);

            /** RaceModel name. */
            public name: string;

            /** RaceModel track. */
            public track?: (com.antigravity.ITrackModel|null);

            /**
             * Creates a new RaceModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceModel instance
             */
            public static create(properties?: com.antigravity.IRaceModel): com.antigravity.RaceModel;

            /**
             * Encodes the specified RaceModel message. Does not implicitly {@link com.antigravity.RaceModel.verify|verify} messages.
             * @param message RaceModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRaceModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceModel message, length delimited. Does not implicitly {@link com.antigravity.RaceModel.verify|verify} messages.
             * @param message RaceModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRaceModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RaceModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceModel;

            /**
             * Decodes a RaceModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceModel;

            /**
             * Verifies a RaceModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceModel
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RaceModel;

            /**
             * Creates a plain object from a RaceModel message. Also converts values to other types if specified.
             * @param message RaceModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RaceModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceModel to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RaceModel
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TrackModel. */
        interface ITrackModel {

            /** TrackModel model */
            model?: (com.antigravity.IModel|null);

            /** TrackModel name */
            name?: (string|null);

            /** TrackModel lanes */
            lanes?: (com.antigravity.ILaneModel[]|null);
        }

        /** Represents a TrackModel. */
        class TrackModel implements ITrackModel {

            /**
             * Constructs a new TrackModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ITrackModel);

            /** TrackModel model. */
            public model?: (com.antigravity.IModel|null);

            /** TrackModel name. */
            public name: string;

            /** TrackModel lanes. */
            public lanes: com.antigravity.ILaneModel[];

            /**
             * Creates a new TrackModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TrackModel instance
             */
            public static create(properties?: com.antigravity.ITrackModel): com.antigravity.TrackModel;

            /**
             * Encodes the specified TrackModel message. Does not implicitly {@link com.antigravity.TrackModel.verify|verify} messages.
             * @param message TrackModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.ITrackModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TrackModel message, length delimited. Does not implicitly {@link com.antigravity.TrackModel.verify|verify} messages.
             * @param message TrackModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.ITrackModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TrackModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TrackModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.TrackModel;

            /**
             * Decodes a TrackModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TrackModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.TrackModel;

            /**
             * Verifies a TrackModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TrackModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TrackModel
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.TrackModel;

            /**
             * Creates a plain object from a TrackModel message. Also converts values to other types if specified.
             * @param message TrackModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.TrackModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TrackModel to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TrackModel
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a LaneModel. */
        interface ILaneModel {

            /** LaneModel backgroundColor */
            backgroundColor?: (string|null);

            /** LaneModel foregroundColor */
            foregroundColor?: (string|null);

            /** LaneModel length */
            length?: (number|null);

            /** LaneModel objectId */
            objectId?: (string|null);
        }

        /** Represents a LaneModel. */
        class LaneModel implements ILaneModel {

            /**
             * Constructs a new LaneModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ILaneModel);

            /** LaneModel backgroundColor. */
            public backgroundColor: string;

            /** LaneModel foregroundColor. */
            public foregroundColor: string;

            /** LaneModel length. */
            public length: number;

            /** LaneModel objectId. */
            public objectId: string;

            /**
             * Creates a new LaneModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LaneModel instance
             */
            public static create(properties?: com.antigravity.ILaneModel): com.antigravity.LaneModel;

            /**
             * Encodes the specified LaneModel message. Does not implicitly {@link com.antigravity.LaneModel.verify|verify} messages.
             * @param message LaneModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.ILaneModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LaneModel message, length delimited. Does not implicitly {@link com.antigravity.LaneModel.verify|verify} messages.
             * @param message LaneModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.ILaneModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LaneModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LaneModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.LaneModel;

            /**
             * Decodes a LaneModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LaneModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.LaneModel;

            /**
             * Verifies a LaneModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LaneModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LaneModel
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.LaneModel;

            /**
             * Creates a plain object from a LaneModel message. Also converts values to other types if specified.
             * @param message LaneModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.LaneModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LaneModel to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for LaneModel
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Model. */
        interface IModel {

            /** Model entityId */
            entityId?: (string|null);
        }

        /** Represents a Model. */
        class Model implements IModel {

            /**
             * Constructs a new Model.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IModel);

            /** Model entityId. */
            public entityId: string;

            /**
             * Creates a new Model instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Model instance
             */
            public static create(properties?: com.antigravity.IModel): com.antigravity.Model;

            /**
             * Encodes the specified Model message. Does not implicitly {@link com.antigravity.Model.verify|verify} messages.
             * @param message Model message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Model message, length delimited. Does not implicitly {@link com.antigravity.Model.verify|verify} messages.
             * @param message Model message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Model message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Model
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Model;

            /**
             * Decodes a Model message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Model
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Model;

            /**
             * Verifies a Model message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Model message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Model
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.Model;

            /**
             * Creates a plain object from a Model message. Also converts values to other types if specified.
             * @param message Model
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.Model, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Model to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Model
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DriverModel. */
        interface IDriverModel {

            /** DriverModel model */
            model?: (com.antigravity.IModel|null);

            /** DriverModel name */
            name?: (string|null);

            /** DriverModel nickname */
            nickname?: (string|null);
        }

        /** Represents a DriverModel. */
        class DriverModel implements IDriverModel {

            /**
             * Constructs a new DriverModel.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IDriverModel);

            /** DriverModel model. */
            public model?: (com.antigravity.IModel|null);

            /** DriverModel name. */
            public name: string;

            /** DriverModel nickname. */
            public nickname: string;

            /**
             * Creates a new DriverModel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DriverModel instance
             */
            public static create(properties?: com.antigravity.IDriverModel): com.antigravity.DriverModel;

            /**
             * Encodes the specified DriverModel message. Does not implicitly {@link com.antigravity.DriverModel.verify|verify} messages.
             * @param message DriverModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IDriverModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DriverModel message, length delimited. Does not implicitly {@link com.antigravity.DriverModel.verify|verify} messages.
             * @param message DriverModel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IDriverModel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DriverModel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DriverModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DriverModel;

            /**
             * Decodes a DriverModel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DriverModel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DriverModel;

            /**
             * Verifies a DriverModel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DriverModel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DriverModel
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.DriverModel;

            /**
             * Creates a plain object from a DriverModel message. Also converts values to other types if specified.
             * @param message DriverModel
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.DriverModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DriverModel to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DriverModel
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

            /** Lap lapNumber */
            lapNumber?: (number|null);

            /** Lap averageLapTime */
            averageLapTime?: (number|null);

            /** Lap medianLapTime */
            medianLapTime?: (number|null);

            /** Lap bestLapTime */
            bestLapTime?: (number|null);
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

            /** Lap lapNumber. */
            public lapNumber: number;

            /** Lap averageLapTime. */
            public averageLapTime: number;

            /** Lap medianLapTime. */
            public medianLapTime: number;

            /** Lap bestLapTime. */
            public bestLapTime: number;

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

            /** RaceData fullUpdate */
            fullUpdate?: (com.antigravity.IFullUpdate|null);
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

            /** RaceData fullUpdate. */
            public fullUpdate?: (com.antigravity.IFullUpdate|null);

            /** RaceData data. */
            public data?: ("raceTime"|"lap"|"fullUpdate");

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

        /** Properties of a FullUpdate. */
        interface IFullUpdate {

            /** FullUpdate race */
            race?: (com.antigravity.IRaceModel|null);

            /** FullUpdate drivers */
            drivers?: (com.antigravity.IDriverModel[]|null);

            /** FullUpdate heats */
            heats?: (com.antigravity.IHeat[]|null);

            /** FullUpdate currentHeat */
            currentHeat?: (com.antigravity.IHeat|null);
        }

        /** Represents a FullUpdate. */
        class FullUpdate implements IFullUpdate {

            /**
             * Constructs a new FullUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IFullUpdate);

            /** FullUpdate race. */
            public race?: (com.antigravity.IRaceModel|null);

            /** FullUpdate drivers. */
            public drivers: com.antigravity.IDriverModel[];

            /** FullUpdate heats. */
            public heats: com.antigravity.IHeat[];

            /** FullUpdate currentHeat. */
            public currentHeat?: (com.antigravity.IHeat|null);

            /**
             * Creates a new FullUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FullUpdate instance
             */
            public static create(properties?: com.antigravity.IFullUpdate): com.antigravity.FullUpdate;

            /**
             * Encodes the specified FullUpdate message. Does not implicitly {@link com.antigravity.FullUpdate.verify|verify} messages.
             * @param message FullUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IFullUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FullUpdate message, length delimited. Does not implicitly {@link com.antigravity.FullUpdate.verify|verify} messages.
             * @param message FullUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IFullUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FullUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FullUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.FullUpdate;

            /**
             * Decodes a FullUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FullUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.FullUpdate;

            /**
             * Verifies a FullUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FullUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FullUpdate
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.FullUpdate;

            /**
             * Creates a plain object from a FullUpdate message. Also converts values to other types if specified.
             * @param message FullUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.FullUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FullUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FullUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Heat. */
        interface IHeat {

            /** Heat heatDrivers */
            heatDrivers?: (com.antigravity.IDriverHeatData[]|null);

            /** Heat heatNumber */
            heatNumber?: (number|null);

            /** Heat objectId */
            objectId?: (string|null);
        }

        /** Represents a Heat. */
        class Heat implements IHeat {

            /**
             * Constructs a new Heat.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IHeat);

            /** Heat heatDrivers. */
            public heatDrivers: com.antigravity.IDriverHeatData[];

            /** Heat heatNumber. */
            public heatNumber: number;

            /** Heat objectId. */
            public objectId: string;

            /**
             * Creates a new Heat instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Heat instance
             */
            public static create(properties?: com.antigravity.IHeat): com.antigravity.Heat;

            /**
             * Encodes the specified Heat message. Does not implicitly {@link com.antigravity.Heat.verify|verify} messages.
             * @param message Heat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IHeat, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Heat message, length delimited. Does not implicitly {@link com.antigravity.Heat.verify|verify} messages.
             * @param message Heat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IHeat, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Heat message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Heat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Heat;

            /**
             * Decodes a Heat message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Heat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Heat;

            /**
             * Verifies a Heat message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Heat message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Heat
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.Heat;

            /**
             * Creates a plain object from a Heat message. Also converts values to other types if specified.
             * @param message Heat
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.Heat, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Heat to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Heat
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DriverHeatData. */
        interface IDriverHeatData {

            /** DriverHeatData driver */
            driver?: (com.antigravity.IRaceParticipant|null);

            /** DriverHeatData objectId */
            objectId?: (string|null);
        }

        /** Represents a DriverHeatData. */
        class DriverHeatData implements IDriverHeatData {

            /**
             * Constructs a new DriverHeatData.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IDriverHeatData);

            /** DriverHeatData driver. */
            public driver?: (com.antigravity.IRaceParticipant|null);

            /** DriverHeatData objectId. */
            public objectId: string;

            /**
             * Creates a new DriverHeatData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DriverHeatData instance
             */
            public static create(properties?: com.antigravity.IDriverHeatData): com.antigravity.DriverHeatData;

            /**
             * Encodes the specified DriverHeatData message. Does not implicitly {@link com.antigravity.DriverHeatData.verify|verify} messages.
             * @param message DriverHeatData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IDriverHeatData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DriverHeatData message, length delimited. Does not implicitly {@link com.antigravity.DriverHeatData.verify|verify} messages.
             * @param message DriverHeatData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IDriverHeatData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DriverHeatData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DriverHeatData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DriverHeatData;

            /**
             * Decodes a DriverHeatData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DriverHeatData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DriverHeatData;

            /**
             * Verifies a DriverHeatData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DriverHeatData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DriverHeatData
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.DriverHeatData;

            /**
             * Creates a plain object from a DriverHeatData message. Also converts values to other types if specified.
             * @param message DriverHeatData
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.DriverHeatData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DriverHeatData to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DriverHeatData
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RaceParticipant. */
        interface IRaceParticipant {

            /** RaceParticipant objectId */
            objectId?: (string|null);

            /** RaceParticipant driver */
            driver?: (com.antigravity.IDriverModel|null);
        }

        /** Represents a RaceParticipant. */
        class RaceParticipant implements IRaceParticipant {

            /**
             * Constructs a new RaceParticipant.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRaceParticipant);

            /** RaceParticipant objectId. */
            public objectId: string;

            /** RaceParticipant driver. */
            public driver?: (com.antigravity.IDriverModel|null);

            /**
             * Creates a new RaceParticipant instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceParticipant instance
             */
            public static create(properties?: com.antigravity.IRaceParticipant): com.antigravity.RaceParticipant;

            /**
             * Encodes the specified RaceParticipant message. Does not implicitly {@link com.antigravity.RaceParticipant.verify|verify} messages.
             * @param message RaceParticipant message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRaceParticipant, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceParticipant message, length delimited. Does not implicitly {@link com.antigravity.RaceParticipant.verify|verify} messages.
             * @param message RaceParticipant message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRaceParticipant, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceParticipant message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RaceParticipant
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceParticipant;

            /**
             * Decodes a RaceParticipant message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceParticipant
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceParticipant;

            /**
             * Verifies a RaceParticipant message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceParticipant message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceParticipant
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RaceParticipant;

            /**
             * Creates a plain object from a RaceParticipant message. Also converts values to other types if specified.
             * @param message RaceParticipant
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RaceParticipant, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceParticipant to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RaceParticipant
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
