import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Reader } from "protobufjs/minimal";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  DeleteAssetRequest,
  DeleteAssetResponse,
  IAssetMessage,
  ICustomRotation,
  ISaveAudioSetEntry,
  ISaveImageSetEntry,
  ListAssetsResponse,
  RenameAssetRequest,
  RenameAssetResponse,
  SaveAudioSetRequest,
  SaveAudioSetResponse,
  SaveCustomRotationRequest,
  SaveCustomRotationResponse,
  SaveImageSetRequest,
  SaveImageSetResponse,
  UploadAssetRequest,
  UploadAssetResponse,
} from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";

export class DataAssetHelper {
  private assetsSubject = new BehaviorSubject<IAssetMessage[]>([]);
  public assets$ = this.assetsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private getBaseUrl: () => string,
    private logger: LoggerService,
  ) {}

  get loadedAssets(): IAssetMessage[] {
    return this.assetsSubject.getValue();
  }

  setLoadedAssets(assets: IAssetMessage[]): void {
    this.assetsSubject.next(assets || []);
  }

  registerAsset(asset: IAssetMessage): void {
    if (!asset) return;
    const current = this.assetsSubject.getValue();
    const assetId = asset.model?.entityId;
    const index = current.findIndex(
      (a) =>
        (assetId && a.model?.entityId === assetId) ||
        (asset.hash &&
          a.hash &&
          a.hash.toLowerCase() === asset.hash.toLowerCase() &&
          a.type === asset.type),
    );
    if (index !== -1) {
      const updated = [...current];
      updated[index] = asset;
      this.assetsSubject.next(updated);
    } else {
      this.assetsSubject.next([...current, asset]);
    }
  }

  async computeFileHash(file: File): Promise<string> {
    if (!file) return "";
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  findAssetByHash(hash: string, type?: string): IAssetMessage | undefined {
    if (!hash) return undefined;
    const normalizedHash = hash.toLowerCase();
    const current = this.assetsSubject.getValue();
    return current.find((a) => {
      if (!a.hash || a.hash.toLowerCase() !== normalizedHash) return false;
      if (type && a.type && a.type.toLowerCase() !== type.toLowerCase())
        return false;
      return true;
    });
  }

  listAssets(): Observable<IAssetMessage[]> {
    return this.http
      .get(`${this.getBaseUrl()}/api/assets/list`, {
        responseType: "arraybuffer",
      })
      .pipe(
        map((response) => {
          try {
            const listResponse = ListAssetsResponse.decode(
              Reader.create(new Uint8Array(response as any)),
            );
            const assets = listResponse.assets || [];
            this.assetsSubject.next(assets);
            return assets;
          } catch (error) {
            this.logger.error("Error decoding asset list protobuf", error);
            return [];
          }
        }),
      );
  }

  getAssetUrl(id: string): string {
    return `${this.getBaseUrl()}/api/assets/download/${id}`;
  }

  resolveAssetUrl(url?: string): string {
    if (!url || !url.trim()) return "";
    const clean = url.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    if (clean.startsWith("/assets/")) {
      return clean;
    }
    if (clean.startsWith("assets/images/")) {
      return clean;
    }
    if (clean.startsWith("assets/default_")) {
      return "/" + clean;
    }

    const lower = clean.toLowerCase();
    const filename = lower.includes("/")
      ? lower.substring(lower.lastIndexOf("/") + 1)
      : lower;
    const noExt = filename.includes(".")
      ? filename.substring(0, filename.lastIndexOf("."))
      : filename;

    const assets = this.loadedAssets || [];
    const directMatch = assets.find((a) => {
      const id = a.model?.entityId?.toLowerCase();
      const name = a.name?.toLowerCase();
      const aUrl = a.url?.toLowerCase();
      return (
        id === lower ||
        id === filename ||
        id === noExt ||
        name === lower ||
        name === filename ||
        name === noExt ||
        aUrl === "/" + lower ||
        (aUrl && aUrl.endsWith("/" + filename))
      );
    });
    if (directMatch?.url) {
      return directMatch.url;
    }

    return this.resolveHelmetAssetUrl(lower, clean, assets);
  }

  private resolveHelmetAssetUrl(
    lower: string,
    clean: string,
    assets: IAssetMessage[],
  ): string {
    if (
      !lower.includes("helmet") &&
      !lower.includes("defaults/helmets") &&
      !lower.endsWith(".png")
    ) {
      return clean;
    }

    const targetId = this.matchHelmetTargetId(lower);
    if (!targetId) {
      return clean;
    }

    const helmetAsset = assets.find(
      (a) => a.model?.entityId?.toLowerCase() === targetId,
    );
    if (helmetAsset?.url) {
      return helmetAsset.url;
    }

    const fallbackMap: Record<string, string> = {
      "default_black-yellow":
        "/assets/default_black-yellow_Helmet_Black-Yellow",
      "default_red-yellow": "/assets/default_red-yellow_Helmet_Red-Yellow",
      "default_blue-white": "/assets/default_blue-white_Helmet_Blue-White",
      "default_green-white": "/assets/default_green-white_Helmet_Green-White",
      default_black: "/assets/default_black_Helmet_Black",
      "default_white-blue": "/assets/default_white-blue_Helmet_White-Blue",
      "default_red-orange": "/assets/default_red-orange_Helmet_Red-Orange",
      "default_silver-green":
        "/assets/default_silver-green_Helmet_Silver-Green",
    };

    return fallbackMap[targetId] || clean;
  }

  private matchHelmetTargetId(lower: string): string {
    if (lower.includes("yellow")) return "default_black-yellow";
    if (lower.includes("red")) return "default_red-yellow";
    if (lower.includes("blue")) return "default_blue-white";
    if (lower.includes("green")) return "default_green-white";
    if (lower.includes("black")) return "default_black";
    if (lower.includes("white")) return "default_white-blue";
    if (lower.includes("orange")) return "default_red-orange";
    if (lower.includes("silver")) return "default_silver-green";
    return "";
  }

  uploadAsset(
    name: string,
    type: string,
    data: Uint8Array,
  ): Observable<IAssetMessage> {
    const request = UploadAssetRequest.create({
      name,
      type,
      data,
    });
    const buffer = UploadAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/assets/upload`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const uploadResponse = UploadAssetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!uploadResponse.success) {
            throw new Error(uploadResponse.message);
          }
          const asset = uploadResponse.asset!;
          this.registerAsset(asset);
          return asset;
        }),
      );
  }

  saveImageSet(
    name: string,
    entries: ISaveImageSetEntry[],
    id?: string,
  ): Observable<IAssetMessage> {
    const request = SaveImageSetRequest.create({
      id,
      name,
      entries,
    });
    const buffer = SaveImageSetRequest.encode(request).finish();
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/octet-stream",
    );

    return this.http
      .post(
        `${this.getBaseUrl()}/api/assets/save-image-set`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const saveResponse = SaveImageSetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!saveResponse.success) {
            throw new Error(
              saveResponse.message ?? "Unknown error saving image set",
            );
          }
          return saveResponse.asset!;
        }),
      );
  }

  saveAudioSet(
    name: string,
    entries: ISaveAudioSetEntry[],
    id?: string,
  ): Observable<IAssetMessage> {
    const request = SaveAudioSetRequest.create({
      id,
      name,
      entries,
    });
    const buffer = SaveAudioSetRequest.encode(request).finish();
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/octet-stream",
    );

    return this.http
      .post(
        `${this.getBaseUrl()}/api/assets/save-audio-set`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const saveResponse = SaveAudioSetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!saveResponse.success) {
            throw new Error(
              saveResponse.message ?? "Unknown error saving audio set",
            );
          }
          return saveResponse.asset!;
        }),
      );
  }

  saveCustomRotation(
    name: string,
    numLanes: number,
    rotations: ICustomRotation[],
    id?: string,
  ): Observable<IAssetMessage> {
    const request = SaveCustomRotationRequest.create({
      id,
      name,
      numLanes,
      rotations,
    });
    const buffer = SaveCustomRotationRequest.encode(request).finish();
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/octet-stream",
    );

    return this.http
      .post(
        `${this.getBaseUrl()}/api/assets/save-custom-rotation`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const saveResponse = SaveCustomRotationResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!saveResponse.success) {
            throw new Error(
              saveResponse.message ?? "Unknown error saving custom rotation",
            );
          }
          return saveResponse.asset!;
        }),
      );
  }

  deleteAsset(id: string): Observable<boolean> {
    const request = DeleteAssetRequest.create({ id });
    const buffer = DeleteAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/assets/delete`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const deleteResponse = DeleteAssetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!deleteResponse.success) {
            throw new Error(deleteResponse.message);
          }
          const current = this.assetsSubject.getValue();
          this.assetsSubject.next(
            current.filter((a) => a.model?.entityId !== id),
          );
          return true;
        }),
      );
  }

  renameAsset(id: string, newName: string): Observable<boolean> {
    const request = RenameAssetRequest.create({ id, newName });
    const buffer = RenameAssetRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/assets/rename`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          const renameResponse = RenameAssetResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
          if (!renameResponse.success) {
            throw new Error(renameResponse.message);
          }
          const current = this.assetsSubject.getValue();
          const index = current.findIndex((a) => a.model?.entityId === id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = { ...updated[index], name: newName };
            this.assetsSubject.next(updated);
          }
          return true;
        }),
      );
  }
}
