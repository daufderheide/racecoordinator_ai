import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace com. */
export namespace com {

    /** Namespace antigravity. */
    namespace antigravity {

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

        /** Properties of an Asset. */
        interface IAsset {

            /** Asset model */
            model?: (com.antigravity.IModel|null);

            /** Asset name */
            name?: (string|null);

            /** Asset type */
            type?: (string|null);

            /** Asset size */
            size?: (string|null);

            /** Asset url */
            url?: (string|null);
        }

        /** Represents an Asset. */
        class Asset implements IAsset {

            /**
             * Constructs a new Asset.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IAsset);

            /** Asset model. */
            public model?: (com.antigravity.IModel|null);

            /** Asset name. */
            public name: string;

            /** Asset type. */
            public type: string;

            /** Asset size. */
            public size: string;

            /** Asset url. */
            public url: string;

            /**
             * Creates a new Asset instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Asset instance
             */
            public static create(properties?: com.antigravity.IAsset): com.antigravity.Asset;

            /**
             * Encodes the specified Asset message. Does not implicitly {@link com.antigravity.Asset.verify|verify} messages.
             * @param message Asset message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IAsset, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Asset message, length delimited. Does not implicitly {@link com.antigravity.Asset.verify|verify} messages.
             * @param message Asset message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IAsset, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Asset message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Asset
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Asset;

            /**
             * Decodes an Asset message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Asset
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Asset;

            /**
             * Verifies an Asset message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Asset message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Asset
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.Asset;

            /**
             * Creates a plain object from an Asset message. Also converts values to other types if specified.
             * @param message Asset
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.Asset, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Asset to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Asset
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ListAssetsRequest. */
        interface IListAssetsRequest {
        }

        /** Represents a ListAssetsRequest. */
        class ListAssetsRequest implements IListAssetsRequest {

            /**
             * Constructs a new ListAssetsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IListAssetsRequest);

            /**
             * Creates a new ListAssetsRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListAssetsRequest instance
             */
            public static create(properties?: com.antigravity.IListAssetsRequest): com.antigravity.ListAssetsRequest;

            /**
             * Encodes the specified ListAssetsRequest message. Does not implicitly {@link com.antigravity.ListAssetsRequest.verify|verify} messages.
             * @param message ListAssetsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IListAssetsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListAssetsRequest message, length delimited. Does not implicitly {@link com.antigravity.ListAssetsRequest.verify|verify} messages.
             * @param message ListAssetsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IListAssetsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListAssetsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListAssetsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ListAssetsRequest;

            /**
             * Decodes a ListAssetsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListAssetsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ListAssetsRequest;

            /**
             * Verifies a ListAssetsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListAssetsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListAssetsRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.ListAssetsRequest;

            /**
             * Creates a plain object from a ListAssetsRequest message. Also converts values to other types if specified.
             * @param message ListAssetsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.ListAssetsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListAssetsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ListAssetsRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an UploadAssetRequest. */
        interface IUploadAssetRequest {

            /** UploadAssetRequest name */
            name?: (string|null);

            /** UploadAssetRequest type */
            type?: (string|null);

            /** UploadAssetRequest data */
            data?: (Uint8Array|null);
        }

        /** Represents an UploadAssetRequest. */
        class UploadAssetRequest implements IUploadAssetRequest {

            /**
             * Constructs a new UploadAssetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IUploadAssetRequest);

            /** UploadAssetRequest name. */
            public name: string;

            /** UploadAssetRequest type. */
            public type: string;

            /** UploadAssetRequest data. */
            public data: Uint8Array;

            /**
             * Creates a new UploadAssetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UploadAssetRequest instance
             */
            public static create(properties?: com.antigravity.IUploadAssetRequest): com.antigravity.UploadAssetRequest;

            /**
             * Encodes the specified UploadAssetRequest message. Does not implicitly {@link com.antigravity.UploadAssetRequest.verify|verify} messages.
             * @param message UploadAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IUploadAssetRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UploadAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.UploadAssetRequest.verify|verify} messages.
             * @param message UploadAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IUploadAssetRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UploadAssetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns UploadAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.UploadAssetRequest;

            /**
             * Decodes an UploadAssetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns UploadAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.UploadAssetRequest;

            /**
             * Verifies an UploadAssetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UploadAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UploadAssetRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.UploadAssetRequest;

            /**
             * Creates a plain object from an UploadAssetRequest message. Also converts values to other types if specified.
             * @param message UploadAssetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.UploadAssetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UploadAssetRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for UploadAssetRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DeleteAssetRequest. */
        interface IDeleteAssetRequest {

            /** DeleteAssetRequest id */
            id?: (string|null);
        }

        /** Represents a DeleteAssetRequest. */
        class DeleteAssetRequest implements IDeleteAssetRequest {

            /**
             * Constructs a new DeleteAssetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IDeleteAssetRequest);

            /** DeleteAssetRequest id. */
            public id: string;

            /**
             * Creates a new DeleteAssetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeleteAssetRequest instance
             */
            public static create(properties?: com.antigravity.IDeleteAssetRequest): com.antigravity.DeleteAssetRequest;

            /**
             * Encodes the specified DeleteAssetRequest message. Does not implicitly {@link com.antigravity.DeleteAssetRequest.verify|verify} messages.
             * @param message DeleteAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IDeleteAssetRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeleteAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.DeleteAssetRequest.verify|verify} messages.
             * @param message DeleteAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IDeleteAssetRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeleteAssetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DeleteAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeleteAssetRequest;

            /**
             * Decodes a DeleteAssetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DeleteAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeleteAssetRequest;

            /**
             * Verifies a DeleteAssetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeleteAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeleteAssetRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.DeleteAssetRequest;

            /**
             * Creates a plain object from a DeleteAssetRequest message. Also converts values to other types if specified.
             * @param message DeleteAssetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.DeleteAssetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeleteAssetRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DeleteAssetRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RenameAssetRequest. */
        interface IRenameAssetRequest {

            /** RenameAssetRequest id */
            id?: (string|null);

            /** RenameAssetRequest newName */
            newName?: (string|null);
        }

        /** Represents a RenameAssetRequest. */
        class RenameAssetRequest implements IRenameAssetRequest {

            /**
             * Constructs a new RenameAssetRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRenameAssetRequest);

            /** RenameAssetRequest id. */
            public id: string;

            /** RenameAssetRequest newName. */
            public newName: string;

            /**
             * Creates a new RenameAssetRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RenameAssetRequest instance
             */
            public static create(properties?: com.antigravity.IRenameAssetRequest): com.antigravity.RenameAssetRequest;

            /**
             * Encodes the specified RenameAssetRequest message. Does not implicitly {@link com.antigravity.RenameAssetRequest.verify|verify} messages.
             * @param message RenameAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRenameAssetRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RenameAssetRequest message, length delimited. Does not implicitly {@link com.antigravity.RenameAssetRequest.verify|verify} messages.
             * @param message RenameAssetRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRenameAssetRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RenameAssetRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RenameAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RenameAssetRequest;

            /**
             * Decodes a RenameAssetRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RenameAssetRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RenameAssetRequest;

            /**
             * Verifies a RenameAssetRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RenameAssetRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RenameAssetRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RenameAssetRequest;

            /**
             * Creates a plain object from a RenameAssetRequest message. Also converts values to other types if specified.
             * @param message RenameAssetRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RenameAssetRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RenameAssetRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RenameAssetRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

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

        /** Properties of a RaceScoring. */
        interface IRaceScoring {

            /** RaceScoring finishMethod */
            finishMethod?: (com.antigravity.RaceScoring.FinishMethod|null);

            /** RaceScoring finishValue */
            finishValue?: (number|Long|null);

            /** RaceScoring heatRanking */
            heatRanking?: (com.antigravity.RaceScoring.HeatRanking|null);

            /** RaceScoring heatRankingTiebreaker */
            heatRankingTiebreaker?: (com.antigravity.RaceScoring.TieBreaker|null);
        }

        /** Represents a RaceScoring. */
        class RaceScoring implements IRaceScoring {

            /**
             * Constructs a new RaceScoring.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRaceScoring);

            /** RaceScoring finishMethod. */
            public finishMethod: com.antigravity.RaceScoring.FinishMethod;

            /** RaceScoring finishValue. */
            public finishValue: (number|Long);

            /** RaceScoring heatRanking. */
            public heatRanking: com.antigravity.RaceScoring.HeatRanking;

            /** RaceScoring heatRankingTiebreaker. */
            public heatRankingTiebreaker: com.antigravity.RaceScoring.TieBreaker;

            /**
             * Creates a new RaceScoring instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceScoring instance
             */
            public static create(properties?: com.antigravity.IRaceScoring): com.antigravity.RaceScoring;

            /**
             * Encodes the specified RaceScoring message. Does not implicitly {@link com.antigravity.RaceScoring.verify|verify} messages.
             * @param message RaceScoring message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRaceScoring, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceScoring message, length delimited. Does not implicitly {@link com.antigravity.RaceScoring.verify|verify} messages.
             * @param message RaceScoring message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRaceScoring, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceScoring message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RaceScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceScoring;

            /**
             * Decodes a RaceScoring message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceScoring
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceScoring;

            /**
             * Verifies a RaceScoring message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceScoring message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceScoring
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RaceScoring;

            /**
             * Creates a plain object from a RaceScoring message. Also converts values to other types if specified.
             * @param message RaceScoring
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RaceScoring, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceScoring to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RaceScoring
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace RaceScoring {

            /** FinishMethod enum. */
            enum FinishMethod {
                Lap = 0,
                Timed = 1
            }

            /** HeatRanking enum. */
            enum HeatRanking {
                LAP_COUNT = 0,
                FASTEST_LAP = 1,
                TOTAL_TIME = 2
            }

            /** TieBreaker enum. */
            enum TieBreaker {
                FASTEST_LAP_TIME = 0,
                MEDIAN_LAP_TIME = 1,
                AVERAGE_LAP_TIME = 2
            }
        }

        /** Properties of a RaceModel. */
        interface IRaceModel {

            /** RaceModel model */
            model?: (com.antigravity.IModel|null);

            /** RaceModel name */
            name?: (string|null);

            /** RaceModel track */
            track?: (com.antigravity.ITrackModel|null);

            /** RaceModel raceScoring */
            raceScoring?: (com.antigravity.IRaceScoring|null);
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

            /** RaceModel raceScoring. */
            public raceScoring?: (com.antigravity.IRaceScoring|null);

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

        /** Properties of a NextHeatRequest. */
        interface INextHeatRequest {
        }

        /** Represents a NextHeatRequest. */
        class NextHeatRequest implements INextHeatRequest {

            /**
             * Constructs a new NextHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.INextHeatRequest);

            /**
             * Creates a new NextHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NextHeatRequest instance
             */
            public static create(properties?: com.antigravity.INextHeatRequest): com.antigravity.NextHeatRequest;

            /**
             * Encodes the specified NextHeatRequest message. Does not implicitly {@link com.antigravity.NextHeatRequest.verify|verify} messages.
             * @param message NextHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.INextHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NextHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.NextHeatRequest.verify|verify} messages.
             * @param message NextHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.INextHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NextHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns NextHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.NextHeatRequest;

            /**
             * Decodes a NextHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns NextHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.NextHeatRequest;

            /**
             * Verifies a NextHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NextHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NextHeatRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.NextHeatRequest;

            /**
             * Creates a plain object from a NextHeatRequest message. Also converts values to other types if specified.
             * @param message NextHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.NextHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NextHeatRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for NextHeatRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a NextHeatResponse. */
        interface INextHeatResponse {

            /** NextHeatResponse success */
            success?: (boolean|null);

            /** NextHeatResponse message */
            message?: (string|null);
        }

        /** Represents a NextHeatResponse. */
        class NextHeatResponse implements INextHeatResponse {

            /**
             * Constructs a new NextHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.INextHeatResponse);

            /** NextHeatResponse success. */
            public success: boolean;

            /** NextHeatResponse message. */
            public message: string;

            /**
             * Creates a new NextHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NextHeatResponse instance
             */
            public static create(properties?: com.antigravity.INextHeatResponse): com.antigravity.NextHeatResponse;

            /**
             * Encodes the specified NextHeatResponse message. Does not implicitly {@link com.antigravity.NextHeatResponse.verify|verify} messages.
             * @param message NextHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.INextHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NextHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.NextHeatResponse.verify|verify} messages.
             * @param message NextHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.INextHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NextHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns NextHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.NextHeatResponse;

            /**
             * Decodes a NextHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns NextHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.NextHeatResponse;

            /**
             * Verifies a NextHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NextHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NextHeatResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.NextHeatResponse;

            /**
             * Creates a plain object from a NextHeatResponse message. Also converts values to other types if specified.
             * @param message NextHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.NextHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NextHeatResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for NextHeatResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RestartHeatRequest. */
        interface IRestartHeatRequest {
        }

        /** Represents a RestartHeatRequest. */
        class RestartHeatRequest implements IRestartHeatRequest {

            /**
             * Constructs a new RestartHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRestartHeatRequest);

            /**
             * Creates a new RestartHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RestartHeatRequest instance
             */
            public static create(properties?: com.antigravity.IRestartHeatRequest): com.antigravity.RestartHeatRequest;

            /**
             * Encodes the specified RestartHeatRequest message. Does not implicitly {@link com.antigravity.RestartHeatRequest.verify|verify} messages.
             * @param message RestartHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRestartHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RestartHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.RestartHeatRequest.verify|verify} messages.
             * @param message RestartHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRestartHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RestartHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RestartHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RestartHeatRequest;

            /**
             * Decodes a RestartHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RestartHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RestartHeatRequest;

            /**
             * Verifies a RestartHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RestartHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RestartHeatRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RestartHeatRequest;

            /**
             * Creates a plain object from a RestartHeatRequest message. Also converts values to other types if specified.
             * @param message RestartHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RestartHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RestartHeatRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RestartHeatRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RestartHeatResponse. */
        interface IRestartHeatResponse {

            /** RestartHeatResponse success */
            success?: (boolean|null);

            /** RestartHeatResponse message */
            message?: (string|null);
        }

        /** Represents a RestartHeatResponse. */
        class RestartHeatResponse implements IRestartHeatResponse {

            /**
             * Constructs a new RestartHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRestartHeatResponse);

            /** RestartHeatResponse success. */
            public success: boolean;

            /** RestartHeatResponse message. */
            public message: string;

            /**
             * Creates a new RestartHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RestartHeatResponse instance
             */
            public static create(properties?: com.antigravity.IRestartHeatResponse): com.antigravity.RestartHeatResponse;

            /**
             * Encodes the specified RestartHeatResponse message. Does not implicitly {@link com.antigravity.RestartHeatResponse.verify|verify} messages.
             * @param message RestartHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRestartHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RestartHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.RestartHeatResponse.verify|verify} messages.
             * @param message RestartHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRestartHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RestartHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RestartHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RestartHeatResponse;

            /**
             * Decodes a RestartHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RestartHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RestartHeatResponse;

            /**
             * Verifies a RestartHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RestartHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RestartHeatResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RestartHeatResponse;

            /**
             * Creates a plain object from a RestartHeatResponse message. Also converts values to other types if specified.
             * @param message RestartHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RestartHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RestartHeatResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RestartHeatResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SkipHeatRequest. */
        interface ISkipHeatRequest {
        }

        /** Represents a SkipHeatRequest. */
        class SkipHeatRequest implements ISkipHeatRequest {

            /**
             * Constructs a new SkipHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ISkipHeatRequest);

            /**
             * Creates a new SkipHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SkipHeatRequest instance
             */
            public static create(properties?: com.antigravity.ISkipHeatRequest): com.antigravity.SkipHeatRequest;

            /**
             * Encodes the specified SkipHeatRequest message. Does not implicitly {@link com.antigravity.SkipHeatRequest.verify|verify} messages.
             * @param message SkipHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.ISkipHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SkipHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.SkipHeatRequest.verify|verify} messages.
             * @param message SkipHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.ISkipHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SkipHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SkipHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SkipHeatRequest;

            /**
             * Decodes a SkipHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SkipHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SkipHeatRequest;

            /**
             * Verifies a SkipHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SkipHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SkipHeatRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.SkipHeatRequest;

            /**
             * Creates a plain object from a SkipHeatRequest message. Also converts values to other types if specified.
             * @param message SkipHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.SkipHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SkipHeatRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SkipHeatRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SkipHeatResponse. */
        interface ISkipHeatResponse {

            /** SkipHeatResponse success */
            success?: (boolean|null);

            /** SkipHeatResponse message */
            message?: (string|null);
        }

        /** Represents a SkipHeatResponse. */
        class SkipHeatResponse implements ISkipHeatResponse {

            /**
             * Constructs a new SkipHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ISkipHeatResponse);

            /** SkipHeatResponse success. */
            public success: boolean;

            /** SkipHeatResponse message. */
            public message: string;

            /**
             * Creates a new SkipHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SkipHeatResponse instance
             */
            public static create(properties?: com.antigravity.ISkipHeatResponse): com.antigravity.SkipHeatResponse;

            /**
             * Encodes the specified SkipHeatResponse message. Does not implicitly {@link com.antigravity.SkipHeatResponse.verify|verify} messages.
             * @param message SkipHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.ISkipHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SkipHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.SkipHeatResponse.verify|verify} messages.
             * @param message SkipHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.ISkipHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SkipHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SkipHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.SkipHeatResponse;

            /**
             * Decodes a SkipHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SkipHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.SkipHeatResponse;

            /**
             * Verifies a SkipHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SkipHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SkipHeatResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.SkipHeatResponse;

            /**
             * Creates a plain object from a SkipHeatResponse message. Also converts values to other types if specified.
             * @param message SkipHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.SkipHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SkipHeatResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SkipHeatResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DeferHeatRequest. */
        interface IDeferHeatRequest {
        }

        /** Represents a DeferHeatRequest. */
        class DeferHeatRequest implements IDeferHeatRequest {

            /**
             * Constructs a new DeferHeatRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IDeferHeatRequest);

            /**
             * Creates a new DeferHeatRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeferHeatRequest instance
             */
            public static create(properties?: com.antigravity.IDeferHeatRequest): com.antigravity.DeferHeatRequest;

            /**
             * Encodes the specified DeferHeatRequest message. Does not implicitly {@link com.antigravity.DeferHeatRequest.verify|verify} messages.
             * @param message DeferHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IDeferHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeferHeatRequest message, length delimited. Does not implicitly {@link com.antigravity.DeferHeatRequest.verify|verify} messages.
             * @param message DeferHeatRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IDeferHeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeferHeatRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DeferHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeferHeatRequest;

            /**
             * Decodes a DeferHeatRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DeferHeatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeferHeatRequest;

            /**
             * Verifies a DeferHeatRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeferHeatRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeferHeatRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.DeferHeatRequest;

            /**
             * Creates a plain object from a DeferHeatRequest message. Also converts values to other types if specified.
             * @param message DeferHeatRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.DeferHeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeferHeatRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DeferHeatRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DeferHeatResponse. */
        interface IDeferHeatResponse {

            /** DeferHeatResponse success */
            success?: (boolean|null);
        }

        /** Represents a DeferHeatResponse. */
        class DeferHeatResponse implements IDeferHeatResponse {

            /**
             * Constructs a new DeferHeatResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IDeferHeatResponse);

            /** DeferHeatResponse success. */
            public success: boolean;

            /**
             * Creates a new DeferHeatResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeferHeatResponse instance
             */
            public static create(properties?: com.antigravity.IDeferHeatResponse): com.antigravity.DeferHeatResponse;

            /**
             * Encodes the specified DeferHeatResponse message. Does not implicitly {@link com.antigravity.DeferHeatResponse.verify|verify} messages.
             * @param message DeferHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IDeferHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeferHeatResponse message, length delimited. Does not implicitly {@link com.antigravity.DeferHeatResponse.verify|verify} messages.
             * @param message DeferHeatResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IDeferHeatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeferHeatResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DeferHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeferHeatResponse;

            /**
             * Decodes a DeferHeatResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DeferHeatResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeferHeatResponse;

            /**
             * Verifies a DeferHeatResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeferHeatResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeferHeatResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.DeferHeatResponse;

            /**
             * Creates a plain object from a DeferHeatResponse message. Also converts values to other types if specified.
             * @param message DeferHeatResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.DeferHeatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeferHeatResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DeferHeatResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RaceSubscriptionRequest. */
        interface IRaceSubscriptionRequest {

            /** RaceSubscriptionRequest subscribe */
            subscribe?: (boolean|null);
        }

        /** Represents a RaceSubscriptionRequest. */
        class RaceSubscriptionRequest implements IRaceSubscriptionRequest {

            /**
             * Constructs a new RaceSubscriptionRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRaceSubscriptionRequest);

            /** RaceSubscriptionRequest subscribe. */
            public subscribe: boolean;

            /**
             * Creates a new RaceSubscriptionRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RaceSubscriptionRequest instance
             */
            public static create(properties?: com.antigravity.IRaceSubscriptionRequest): com.antigravity.RaceSubscriptionRequest;

            /**
             * Encodes the specified RaceSubscriptionRequest message. Does not implicitly {@link com.antigravity.RaceSubscriptionRequest.verify|verify} messages.
             * @param message RaceSubscriptionRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRaceSubscriptionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RaceSubscriptionRequest message, length delimited. Does not implicitly {@link com.antigravity.RaceSubscriptionRequest.verify|verify} messages.
             * @param message RaceSubscriptionRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRaceSubscriptionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RaceSubscriptionRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RaceSubscriptionRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RaceSubscriptionRequest;

            /**
             * Decodes a RaceSubscriptionRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RaceSubscriptionRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RaceSubscriptionRequest;

            /**
             * Verifies a RaceSubscriptionRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RaceSubscriptionRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RaceSubscriptionRequest
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RaceSubscriptionRequest;

            /**
             * Creates a plain object from a RaceSubscriptionRequest message. Also converts values to other types if specified.
             * @param message RaceSubscriptionRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RaceSubscriptionRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RaceSubscriptionRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RaceSubscriptionRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ListAssetsResponse. */
        interface IListAssetsResponse {

            /** ListAssetsResponse assets */
            assets?: (com.antigravity.IAsset[]|null);
        }

        /** Represents a ListAssetsResponse. */
        class ListAssetsResponse implements IListAssetsResponse {

            /**
             * Constructs a new ListAssetsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IListAssetsResponse);

            /** ListAssetsResponse assets. */
            public assets: com.antigravity.IAsset[];

            /**
             * Creates a new ListAssetsResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListAssetsResponse instance
             */
            public static create(properties?: com.antigravity.IListAssetsResponse): com.antigravity.ListAssetsResponse;

            /**
             * Encodes the specified ListAssetsResponse message. Does not implicitly {@link com.antigravity.ListAssetsResponse.verify|verify} messages.
             * @param message ListAssetsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IListAssetsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListAssetsResponse message, length delimited. Does not implicitly {@link com.antigravity.ListAssetsResponse.verify|verify} messages.
             * @param message ListAssetsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IListAssetsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListAssetsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListAssetsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ListAssetsResponse;

            /**
             * Decodes a ListAssetsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListAssetsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ListAssetsResponse;

            /**
             * Verifies a ListAssetsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListAssetsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListAssetsResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.ListAssetsResponse;

            /**
             * Creates a plain object from a ListAssetsResponse message. Also converts values to other types if specified.
             * @param message ListAssetsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.ListAssetsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListAssetsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ListAssetsResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an UploadAssetResponse. */
        interface IUploadAssetResponse {

            /** UploadAssetResponse success */
            success?: (boolean|null);

            /** UploadAssetResponse message */
            message?: (string|null);

            /** UploadAssetResponse asset */
            asset?: (com.antigravity.IAsset|null);
        }

        /** Represents an UploadAssetResponse. */
        class UploadAssetResponse implements IUploadAssetResponse {

            /**
             * Constructs a new UploadAssetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IUploadAssetResponse);

            /** UploadAssetResponse success. */
            public success: boolean;

            /** UploadAssetResponse message. */
            public message: string;

            /** UploadAssetResponse asset. */
            public asset?: (com.antigravity.IAsset|null);

            /**
             * Creates a new UploadAssetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UploadAssetResponse instance
             */
            public static create(properties?: com.antigravity.IUploadAssetResponse): com.antigravity.UploadAssetResponse;

            /**
             * Encodes the specified UploadAssetResponse message. Does not implicitly {@link com.antigravity.UploadAssetResponse.verify|verify} messages.
             * @param message UploadAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IUploadAssetResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UploadAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.UploadAssetResponse.verify|verify} messages.
             * @param message UploadAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IUploadAssetResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UploadAssetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns UploadAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.UploadAssetResponse;

            /**
             * Decodes an UploadAssetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns UploadAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.UploadAssetResponse;

            /**
             * Verifies an UploadAssetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UploadAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UploadAssetResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.UploadAssetResponse;

            /**
             * Creates a plain object from an UploadAssetResponse message. Also converts values to other types if specified.
             * @param message UploadAssetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.UploadAssetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UploadAssetResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for UploadAssetResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DeleteAssetResponse. */
        interface IDeleteAssetResponse {

            /** DeleteAssetResponse success */
            success?: (boolean|null);

            /** DeleteAssetResponse message */
            message?: (string|null);
        }

        /** Represents a DeleteAssetResponse. */
        class DeleteAssetResponse implements IDeleteAssetResponse {

            /**
             * Constructs a new DeleteAssetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IDeleteAssetResponse);

            /** DeleteAssetResponse success. */
            public success: boolean;

            /** DeleteAssetResponse message. */
            public message: string;

            /**
             * Creates a new DeleteAssetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeleteAssetResponse instance
             */
            public static create(properties?: com.antigravity.IDeleteAssetResponse): com.antigravity.DeleteAssetResponse;

            /**
             * Encodes the specified DeleteAssetResponse message. Does not implicitly {@link com.antigravity.DeleteAssetResponse.verify|verify} messages.
             * @param message DeleteAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IDeleteAssetResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeleteAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.DeleteAssetResponse.verify|verify} messages.
             * @param message DeleteAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IDeleteAssetResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeleteAssetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DeleteAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.DeleteAssetResponse;

            /**
             * Decodes a DeleteAssetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DeleteAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.DeleteAssetResponse;

            /**
             * Verifies a DeleteAssetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeleteAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeleteAssetResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.DeleteAssetResponse;

            /**
             * Creates a plain object from a DeleteAssetResponse message. Also converts values to other types if specified.
             * @param message DeleteAssetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.DeleteAssetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeleteAssetResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DeleteAssetResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RenameAssetResponse. */
        interface IRenameAssetResponse {

            /** RenameAssetResponse success */
            success?: (boolean|null);

            /** RenameAssetResponse message */
            message?: (string|null);
        }

        /** Represents a RenameAssetResponse. */
        class RenameAssetResponse implements IRenameAssetResponse {

            /**
             * Constructs a new RenameAssetResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRenameAssetResponse);

            /** RenameAssetResponse success. */
            public success: boolean;

            /** RenameAssetResponse message. */
            public message: string;

            /**
             * Creates a new RenameAssetResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RenameAssetResponse instance
             */
            public static create(properties?: com.antigravity.IRenameAssetResponse): com.antigravity.RenameAssetResponse;

            /**
             * Encodes the specified RenameAssetResponse message. Does not implicitly {@link com.antigravity.RenameAssetResponse.verify|verify} messages.
             * @param message RenameAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRenameAssetResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RenameAssetResponse message, length delimited. Does not implicitly {@link com.antigravity.RenameAssetResponse.verify|verify} messages.
             * @param message RenameAssetResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRenameAssetResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RenameAssetResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RenameAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.RenameAssetResponse;

            /**
             * Decodes a RenameAssetResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RenameAssetResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.RenameAssetResponse;

            /**
             * Verifies a RenameAssetResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RenameAssetResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RenameAssetResponse
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.RenameAssetResponse;

            /**
             * Creates a plain object from a RenameAssetResponse message. Also converts values to other types if specified.
             * @param message RenameAssetResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.RenameAssetResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RenameAssetResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RenameAssetResponse
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
        }

        /** Represents a Lap. */
        class Lap implements ILap {

            /**
             * Constructs a new Lap.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.ILap);

            /** Lap objectId. */
            public objectId: string;

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

            /** RaceData race */
            race?: (com.antigravity.IRace|null);

            /** RaceData reactionTime */
            reactionTime?: (com.antigravity.IReactionTime|null);

            /** RaceData standingsUpdate */
            standingsUpdate?: (com.antigravity.IStandingsUpdate|null);

            /** RaceData overallStandingsUpdate */
            overallStandingsUpdate?: (com.antigravity.IOverallStandingsUpdate|null);
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

            /** RaceData race. */
            public race?: (com.antigravity.IRace|null);

            /** RaceData reactionTime. */
            public reactionTime?: (com.antigravity.IReactionTime|null);

            /** RaceData standingsUpdate. */
            public standingsUpdate?: (com.antigravity.IStandingsUpdate|null);

            /** RaceData overallStandingsUpdate. */
            public overallStandingsUpdate?: (com.antigravity.IOverallStandingsUpdate|null);

            /** RaceData data. */
            public data?: ("raceTime"|"lap"|"race"|"reactionTime"|"standingsUpdate"|"overallStandingsUpdate");

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

        /** Properties of a Race. */
        interface IRace {

            /** Race race */
            race?: (com.antigravity.IRaceModel|null);

            /** Race drivers */
            drivers?: (com.antigravity.IRaceParticipant[]|null);

            /** Race heats */
            heats?: (com.antigravity.IHeat[]|null);

            /** Race currentHeat */
            currentHeat?: (com.antigravity.IHeat|null);
        }

        /** Represents a Race. */
        class Race implements IRace {

            /**
             * Constructs a new Race.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IRace);

            /** Race race. */
            public race?: (com.antigravity.IRaceModel|null);

            /** Race drivers. */
            public drivers: com.antigravity.IRaceParticipant[];

            /** Race heats. */
            public heats: com.antigravity.IHeat[];

            /** Race currentHeat. */
            public currentHeat?: (com.antigravity.IHeat|null);

            /**
             * Creates a new Race instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Race instance
             */
            public static create(properties?: com.antigravity.IRace): com.antigravity.Race;

            /**
             * Encodes the specified Race message. Does not implicitly {@link com.antigravity.Race.verify|verify} messages.
             * @param message Race message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IRace, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Race message, length delimited. Does not implicitly {@link com.antigravity.Race.verify|verify} messages.
             * @param message Race message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IRace, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Race message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Race
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.Race;

            /**
             * Decodes a Race message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Race
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.Race;

            /**
             * Verifies a Race message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Race message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Race
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.Race;

            /**
             * Creates a plain object from a Race message. Also converts values to other types if specified.
             * @param message Race
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.Race, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Race to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Race
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

            /** Heat standings */
            standings?: (string[]|null);
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

            /** Heat standings. */
            public standings: string[];

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

            /** RaceParticipant rank. */
            public rank: number;

            /** RaceParticipant totalLaps. */
            public totalLaps: number;

            /** RaceParticipant totalTime. */
            public totalTime: number;

            /** RaceParticipant bestLapTime. */
            public bestLapTime: number;

            /** RaceParticipant averageLapTime. */
            public averageLapTime: number;

            /** RaceParticipant medianLapTime. */
            public medianLapTime: number;

            /** RaceParticipant rankValue. */
            public rankValue: number;

            /** RaceParticipant seed. */
            public seed: number;

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

        /** Properties of a ReactionTime. */
        interface IReactionTime {

            /** ReactionTime objectId */
            objectId?: (string|null);

            /** ReactionTime reactionTime */
            reactionTime?: (number|null);
        }

        /** Represents a ReactionTime. */
        class ReactionTime implements IReactionTime {

            /**
             * Constructs a new ReactionTime.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IReactionTime);

            /** ReactionTime objectId. */
            public objectId: string;

            /** ReactionTime reactionTime. */
            public reactionTime: number;

            /**
             * Creates a new ReactionTime instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ReactionTime instance
             */
            public static create(properties?: com.antigravity.IReactionTime): com.antigravity.ReactionTime;

            /**
             * Encodes the specified ReactionTime message. Does not implicitly {@link com.antigravity.ReactionTime.verify|verify} messages.
             * @param message ReactionTime message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IReactionTime, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ReactionTime message, length delimited. Does not implicitly {@link com.antigravity.ReactionTime.verify|verify} messages.
             * @param message ReactionTime message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IReactionTime, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ReactionTime message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ReactionTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.ReactionTime;

            /**
             * Decodes a ReactionTime message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ReactionTime
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.ReactionTime;

            /**
             * Verifies a ReactionTime message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ReactionTime message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ReactionTime
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.ReactionTime;

            /**
             * Creates a plain object from a ReactionTime message. Also converts values to other types if specified.
             * @param message ReactionTime
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.ReactionTime, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ReactionTime to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ReactionTime
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a HeatPositionUpdate. */
        interface IHeatPositionUpdate {

            /** HeatPositionUpdate objectId */
            objectId?: (string|null);

            /** HeatPositionUpdate rank */
            rank?: (number|null);
        }

        /** Represents a HeatPositionUpdate. */
        class HeatPositionUpdate implements IHeatPositionUpdate {

            /**
             * Constructs a new HeatPositionUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IHeatPositionUpdate);

            /** HeatPositionUpdate objectId. */
            public objectId: string;

            /** HeatPositionUpdate rank. */
            public rank: number;

            /**
             * Creates a new HeatPositionUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HeatPositionUpdate instance
             */
            public static create(properties?: com.antigravity.IHeatPositionUpdate): com.antigravity.HeatPositionUpdate;

            /**
             * Encodes the specified HeatPositionUpdate message. Does not implicitly {@link com.antigravity.HeatPositionUpdate.verify|verify} messages.
             * @param message HeatPositionUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IHeatPositionUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HeatPositionUpdate message, length delimited. Does not implicitly {@link com.antigravity.HeatPositionUpdate.verify|verify} messages.
             * @param message HeatPositionUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IHeatPositionUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HeatPositionUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HeatPositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.HeatPositionUpdate;

            /**
             * Decodes a HeatPositionUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HeatPositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.HeatPositionUpdate;

            /**
             * Verifies a HeatPositionUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HeatPositionUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HeatPositionUpdate
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.HeatPositionUpdate;

            /**
             * Creates a plain object from a HeatPositionUpdate message. Also converts values to other types if specified.
             * @param message HeatPositionUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.HeatPositionUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HeatPositionUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for HeatPositionUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a StandingsUpdate. */
        interface IStandingsUpdate {

            /** StandingsUpdate updates */
            updates?: (com.antigravity.IHeatPositionUpdate[]|null);
        }

        /** Represents a StandingsUpdate. */
        class StandingsUpdate implements IStandingsUpdate {

            /**
             * Constructs a new StandingsUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IStandingsUpdate);

            /** StandingsUpdate updates. */
            public updates: com.antigravity.IHeatPositionUpdate[];

            /**
             * Creates a new StandingsUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StandingsUpdate instance
             */
            public static create(properties?: com.antigravity.IStandingsUpdate): com.antigravity.StandingsUpdate;

            /**
             * Encodes the specified StandingsUpdate message. Does not implicitly {@link com.antigravity.StandingsUpdate.verify|verify} messages.
             * @param message StandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IStandingsUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StandingsUpdate message, length delimited. Does not implicitly {@link com.antigravity.StandingsUpdate.verify|verify} messages.
             * @param message StandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IStandingsUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StandingsUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns StandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.StandingsUpdate;

            /**
             * Decodes a StandingsUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns StandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.StandingsUpdate;

            /**
             * Verifies a StandingsUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StandingsUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StandingsUpdate
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.StandingsUpdate;

            /**
             * Creates a plain object from a StandingsUpdate message. Also converts values to other types if specified.
             * @param message StandingsUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.StandingsUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StandingsUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for StandingsUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an OverallStandingsUpdate. */
        interface IOverallStandingsUpdate {

            /** OverallStandingsUpdate participants */
            participants?: (com.antigravity.IRaceParticipant[]|null);
        }

        /** Represents an OverallStandingsUpdate. */
        class OverallStandingsUpdate implements IOverallStandingsUpdate {

            /**
             * Constructs a new OverallStandingsUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: com.antigravity.IOverallStandingsUpdate);

            /** OverallStandingsUpdate participants. */
            public participants: com.antigravity.IRaceParticipant[];

            /**
             * Creates a new OverallStandingsUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OverallStandingsUpdate instance
             */
            public static create(properties?: com.antigravity.IOverallStandingsUpdate): com.antigravity.OverallStandingsUpdate;

            /**
             * Encodes the specified OverallStandingsUpdate message. Does not implicitly {@link com.antigravity.OverallStandingsUpdate.verify|verify} messages.
             * @param message OverallStandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: com.antigravity.IOverallStandingsUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OverallStandingsUpdate message, length delimited. Does not implicitly {@link com.antigravity.OverallStandingsUpdate.verify|verify} messages.
             * @param message OverallStandingsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: com.antigravity.IOverallStandingsUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OverallStandingsUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OverallStandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): com.antigravity.OverallStandingsUpdate;

            /**
             * Decodes an OverallStandingsUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OverallStandingsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): com.antigravity.OverallStandingsUpdate;

            /**
             * Verifies an OverallStandingsUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OverallStandingsUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OverallStandingsUpdate
             */
            public static fromObject(object: { [k: string]: any }): com.antigravity.OverallStandingsUpdate;

            /**
             * Creates a plain object from an OverallStandingsUpdate message. Also converts values to other types if specified.
             * @param message OverallStandingsUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: com.antigravity.OverallStandingsUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OverallStandingsUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for OverallStandingsUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
