import {
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { ManagerHeaderComponent as ManagerHeaderComponent_1 } from "@app/components/shared/manager-header/manager-header.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  IAssetMessage,
  IAudioSetEntry,
  ICustomRotation,
  IImageSetEntry,
  ISaveAudioSetEntry,
  ISaveImageSetEntry,
} from "@app/proto/antigravity";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { interpolate, mockTTSContext } from "@app/utils/audio";

import { AudioSetEditorComponent } from "./audio-set-editor/audio-set-editor.component";
import { ImageSetEditorComponent } from "./image-set-editor/image-set-editor.component";

// Interface matching the mock/view needs, mapped from Protobuf
export interface AssetView {
  id: string;
  name: string;
  type: "image" | "sound" | "image_set" | "audio_set" | "custom_rotation";
  size: string;
  url: string;
  editMode?: boolean;
  selected?: boolean;
  images?: IImageSetEntry[];
  audioEntries?: IAudioSetEntry[];
  numLanes?: number;
  customRotations?: ICustomRotation[];
  currentPreviewIndex?: number;
}

@Component({
  standalone: true,
  selector: "app-asset-manager",
  templateUrl: "./asset-manager.component.html",
  styleUrls: ["./asset-manager.component.css"],
  imports: [
    ManagerHeaderComponent_1,
    FormsModule,
    ImageSetEditorComponent,
    AudioSetEditorComponent,
    ConfirmationModalComponent,
    TranslatePipe,
  ],
})
export class AssetManagerComponent implements OnInit, OnDestroy {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  // Data
  assets: AssetView[] = [];
  currentlyPlayingAsset: AssetView | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  // Filtering
  filterType:
    | "all"
    | "image"
    | "sound"
    | "image_set"
    | "audio_set"
    | "custom_rotation" = "all";

  filterName: string = "";
  isUploading: boolean = false;
  isLoading: boolean = true;
  isDragOver: boolean = false;
  errorMessage: string | null = null;
  private errorTimeout: any = null;

  // Image Set Editor
  showImageSetEditor: boolean = false;
  editingAssetId?: string;
  editingAssetName: string = "";
  editingAssetEntries: ISaveImageSetEntry[] = [];

  // Audio Set Editor
  showAudioSetEditor: boolean = false;
  editingAudioAssetId?: string;
  editingAudioAssetName: string = "";
  editingAudioAssetEntries: ISaveAudioSetEntry[] = [];
  lastSelectedIndex: number = -1;

  scale: number = 1;
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.queryParams);

  backTargetUrl = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    const returnUrl =
      p?.["returnUrl"] || this.route.snapshot.queryParamMap.get("returnUrl");
    if (from === "modify-heats") {
      return returnUrl || "/default-raceday";
    }
    return "/raceday-setup";
  });

  backQueryParams = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    return from === "modify-heats" ? { modifyHeats: "true" } : {};
  });

  // Delete Confirmation
  showDeleteConfirm: boolean = false;
  assetsToDeleteIds: string[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    private helpService: HelpService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {}

  activeDatabaseName: string = "";

  /* eslint-disable max-lines-per-function */
  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadActiveDatabase();
    this.loadAssets();
    this.raceConnectionService.connect();
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  loadActiveDatabase() {
    this.dataService.getCurrentDatabase().subscribe({
      next: (stats) => {
        this.logger.debug("AssetManager: Loaded active database stats:", stats);
        if (stats && stats.name) {
          this.activeDatabaseName = stats.name;
          this.cdr.detectChanges();
        } else {
          this.logger.warn("AssetManager: Stats or name missing in response");
        }
      },
      error: (err) => this.logger.error("Failed to load active database", err),
    });
  }

  ngOnDestroy() {
    this.stopAsset();
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
    }
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  isDestroyed = false;

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        this.isConnectionLost = state === ConnectionState.DISCONNECTED;
        this.cdr.detectChanges();

        if (this.isConnectionLost) {
          // Start a separate check to see if we timed out too long?
          // Or just rely on user action / auto-reconnect from service.
          // Original code navigated away after 5s.
          this.handleConnectionLoss();
        }
      });
  }

  handleConnectionLoss() {
    // We can rely on the service to keep checking.
    // If we want the specific "navigate away after 5s" behavior, we implement that listener here.
    // The service continues to poll.

    // We verify if we are really lost or just glitching by checking service
    // But for now, let's keep the UI simple or consistent.

    // Original requirement: "respond to lost communication in the same way".
    // If RacedaySetup shows a overlay, we should probably do similar or just show an overlay here too.
    // The original code navigated to /raceday-setup.

    let startTime = Date.now();
    const intervalId = setInterval(() => {
      if (!this.isConnectionLost) {
        clearInterval(intervalId);
        return;
      }

      if (Date.now() - startTime > 5000) {
        clearInterval(intervalId);
        this.logger.warn(
          "Connection retry timed out. Navigating to splash screen.",
        );
        this.router.navigate(["/raceday-setup"]);
      }
    }, 1000);
  }

  loadAssets() {
    this.isLoading = true;
    this.dataService.listAssets().subscribe({
      next: (serverAssets) => {
        if (serverAssets) {
          this.assets = serverAssets.map((a) => {
            // Determine type more robustly
            let type: any = a.type;
            if (a.customRotations && a.customRotations.length > 0) {
              type = "custom_rotation";
            } else if (a.audioEntries && a.audioEntries.length > 0) {
              type = "audio_set";
            } else if (a.images && a.images.length > 0) {
              type = "image_set";
            } else if (!type) {
              type = "image";
            }

            return {
              id: a.model?.entityId || "",
              name: a.name || "Unknown",
              type: type,
              size: a.size || "0 B",
              url: this.getAssetUrl(a),
              editMode: false,
              selected: false,
              images: a.images || [],
              audioEntries: a.audioEntries || [],
              numLanes: a.numLanes ?? undefined,
              customRotations: a.customRotations || [],
              currentPreviewIndex: 0,
            };
          });
          this.startPreviewCycling();
        } else {
          this.assets = [];
        }
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges(); // Force update
        }
      },
      error: (err) => {
        this.logger.error("Failed to list assets", err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges(); // Force update
        }
      },
    });
  }

  // Helper to construct full URL if needed, or use what server sent
  getAssetUrl(asset: IAssetMessage): string {
    // If server provides a relative path, prepend base url
    if (asset.url && asset.url.startsWith("/")) {
      return `${this.dataService.serverUrl}${asset.url}`;
    }
    return asset.url || "";
  }

  get filteredAssets(): AssetView[] {
    return this.assets.filter((asset) => {
      const typeMatch =
        this.filterType === "all" || asset.type === this.filterType;
      const nameMatch =
        !this.filterName ||
        asset.name.toLowerCase().includes(this.filterName.toLowerCase());

      return typeMatch && nameMatch;
    });
  }

  get allImages(): AssetView[] {
    return this.assets.filter(
      (a) => a.type === "image" || a.type === "image_set",
    );
  }

  get allAudio(): AssetView[] {
    return this.assets.filter(
      (a) => a.type === "sound" || a.type === "audio_set",
    );
  }

  get totalSize(): string {
    let totalBytes = 0;
    for (const asset of this.assets) {
      totalBytes += this.parseSize(asset.size);
    }
    return this.formatBytes(totalBytes);
  }

  private parseSize(sizeStr: string): number {
    if (!sizeStr) return 0;

    // Handle IEC units (KiB, MiB) by converting to JEDEC-like (KB, MB) for the parser
    // This assumes the value is base-1024 in both cases, which it is.
    const normalized = sizeStr.replace("iB", "B");

    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    const parts = normalized.split(" ");
    if (parts.length !== 2) return 0;

    const value = parseFloat(parts[0]);
    const unit = parts[1].toUpperCase();
    const power = units.indexOf(unit);

    if (power === -1) return 0;
    return value * Math.pow(1024, power);
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  get totalBytes(): number {
    return this.assets.reduce(
      (sum, asset) => sum + this.parseSize(asset.size),
      0,
    );
  }

  private getBytesByType(type: AssetView["type"]): number {
    return this.assets
      .filter((a) => a.type === type)
      .reduce((sum, a) => sum + this.parseSize(a.size), 0);
  }

  get imageBytes(): number {
    return this.getBytesByType("image");
  }
  get imageSetBytes(): number {
    return this.getBytesByType("image_set");
  }
  get soundBytes(): number {
    return this.getBytesByType("sound");
  }
  get audioSetBytes(): number {
    return this.getBytesByType("audio_set");
  }
  get customRotationBytes(): number {
    return this.getBytesByType("custom_rotation");
  }

  get imageUsagePercent(): number {
    return this.totalBytes === 0
      ? 0
      : (this.imageBytes / this.totalBytes) * 100;
  }

  get imageSetUsagePercent(): number {
    return this.totalBytes === 0
      ? 0
      : (this.imageSetBytes / this.totalBytes) * 100;
  }

  get soundUsagePercent(): number {
    return this.totalBytes === 0
      ? 0
      : (this.soundBytes / this.totalBytes) * 100;
  }

  get audioSetUsagePercent(): number {
    return this.totalBytes === 0
      ? 0
      : (this.audioSetBytes / this.totalBytes) * 100;
  }

  get customRotationUsagePercent(): number {
    return this.totalBytes === 0
      ? 0
      : (this.customRotationBytes / this.totalBytes) * 100;
  }

  formatAssetTooltip(bytes: number): string {
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${bytes.toLocaleString()} bytes (${mb} MB)`;
  }

  get imageCount(): number {
    return this.assets.filter((a) => a.type === "image").length;
  }

  get soundCount(): number {
    return this.assets.filter((a) => a.type === "sound").length;
  }

  get imageSetCount(): number {
    return this.assets.filter((a) => a.type === "image_set").length;
  }

  get audioSetCount(): number {
    return this.assets.filter((a) => a.type === "audio_set").length;
  }

  get customRotationCount(): number {
    return this.assets.filter((a) => a.type === "custom_rotation").length;
  }

  setFilterType(
    type:
      | "all"
      | "image"
      | "sound"
      | "image_set"
      | "audio_set"
      | "custom_rotation",
  ) {
    this.filterType = type;
  }

  private previewInterval: any;
  private startPreviewCycling() {
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
    }
    // Disable cycling in tests to ensure deterministic screendiffs
    // TODO(aufderheide): This is a total hack for testing and should be removed.
    if ((window as any).isPlaywright) {
      return;
    }
    this.previewInterval = setInterval(() => {
      this.assets.forEach((asset) => {
        if (
          asset.type === "image_set" &&
          asset.images &&
          asset.images.length > 0
        ) {
          // Cycle from 100% to 0%.
          // Assuming images are already sorted or we sort them now.
          // Let's assume they are sorted by percentage descending (100 to 0).
          const index = asset.currentPreviewIndex ?? 0;
          asset.currentPreviewIndex = (index + 1) % asset.images.length;
        }
      });
      this.cdr.detectChanges();
    }, 1000); // 1 second per image
  }

  getAssetImageUrl(asset: AssetView): string {
    if (asset.type === "image_set" && asset.images && asset.images.length > 0) {
      const entry = asset.images[asset.currentPreviewIndex ?? 0];
      return this.getFullUrl(entry.url ?? "");
    }
    return asset.url;
  }

  onAssetDragStart(event: DragEvent, asset: AssetView) {
    if (asset.type === "image") {
      event.dataTransfer?.setData("text/plain", asset.url);
      // Optional: hide the drag image or customize it
    }
  }

  private getFullUrl(url: string): string {
    if (url && url.startsWith("/")) {
      return `${this.dataService.serverUrl}${url}`;
    }
    return url;
  }

  onContainerDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onContainerDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles(files);
    }
  }

  onUpload(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadFiles(files);
    }
  }

  uploadFiles(files: FileList) {
    if (files && files.length > 0) {
      this.errorMessage = null;
      if (this.errorTimeout) {
        clearTimeout(this.errorTimeout);
        this.errorTimeout = null;
      }

      const allowedExtensions =
        /\.(png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|aac|flac)$/i;
      const hasInvalidFiles = Array.from(files).some((file: any) => {
        const isMimeValid =
          file.type &&
          (file.type.startsWith("image/") || file.type.startsWith("audio/"));
        const isExtValid = allowedExtensions.test(file.name);
        return !isMimeValid && !isExtValid;
      });

      if (hasInvalidFiles) {
        this.errorMessage = "AM_ERR_ONLY_IMAGE_AUDIO_SUPPORTED";
        this.errorTimeout = setTimeout(() => {
          this.errorMessage = null;
          this.cdr.detectChanges();
        }, 5000);
        this.cdr.detectChanges();
        return;
      }

      this.isUploading = true;
      this.cdr.detectChanges();

      const readFilePromises = Array.from(files).map((file: any) =>
        this.readFile(file),
      );

      Promise.all(readFilePromises).then((fileDataList) => {
        const uploadObservables = fileDataList.map((fileData: any) =>
          this.dataService.uploadAsset(
            fileData.name,
            fileData.type,
            fileData.data,
          ),
        );

        forkJoin(uploadObservables).subscribe({
          next: () => {
            this.logger.info("All uploads successful");
            this.loadAssets();
            this.isUploading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.logger.error("One or more uploads failed", err);
            this.isUploading = false;
            this.cdr.detectChanges();
          },
        });
      });
    }
  }

  readFile(
    file: File,
  ): Promise<{ name: string; type: string; data: Uint8Array }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        const type = file.type.startsWith("image/") ? "image" : "sound";
        resolve({ name: file.name, type, data: bytes });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  onDelete(id: string) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset && asset.selected) {
      this.assetsToDeleteIds = this.selectedAssets.map((a: AssetView) => a.id);
    } else {
      this.assetsToDeleteIds = [id];
    }
    this.showDeleteConfirm = true;
  }

  toggleSelection(asset: AssetView, event: MouseEvent) {
    const assets = this.filteredAssets;
    const currentIndex = assets.indexOf(asset);

    if (event.ctrlKey || event.metaKey) {
      // Toggle individual selection
      asset.selected = !asset.selected;
      this.lastSelectedIndex = currentIndex;
    } else if (event.shiftKey && this.lastSelectedIndex !== -1) {
      // Range selection
      const start = Math.min(this.lastSelectedIndex, currentIndex);
      const end = Math.max(this.lastSelectedIndex, currentIndex);

      const range = assets.slice(start, end + 1);
      range.forEach((a) => (a.selected = true));
    } else {
      // Single selection (clear others)
      this.assets.forEach((a) => (a.selected = false));
      asset.selected = true;
      this.lastSelectedIndex = currentIndex;
    }

    this.cdr.detectChanges();
  }

  get selectedAssets(): AssetView[] {
    return this.assets.filter((a) => a.selected);
  }

  onDeleteSelected() {
    this.assetsToDeleteIds = this.selectedAssets.map((a: AssetView) => a.id);
    if (this.assetsToDeleteIds.length > 0) {
      this.showDeleteConfirm = true;
    }
  }

  onEditSelected() {
    const selected = this.selectedAssets;
    if (selected.length === 1) {
      const asset = selected[0];
      if (asset.type === "image_set") {
        this.openEditImageSetEditor(asset);
      } else if (asset.type === "audio_set") {
        this.openEditAudioSetEditor(asset);
      } else if (asset.type === "custom_rotation") {
        this.openEditCustomRotationEditor(asset);
      } else {
        this.startEditing(asset.id);
      }
    }
  }

  playAsset(asset: AssetView) {
    if (this.currentlyPlayingAsset) {
      this.stopAsset();
    }

    if (asset.type === "sound") {
      this.currentlyPlayingAsset = asset;
      this.cdr.detectChanges();
      this.playUrl(asset.url)
        .then(() => {
          if (this.currentlyPlayingAsset === asset) {
            this.currentlyPlayingAsset = null;
            this.cdr.detectChanges();
          }
        })
        .catch((err) => {
          this.logger.error("Error playing sound", err);
          if (this.currentlyPlayingAsset === asset) {
            this.currentlyPlayingAsset = null;
            this.cdr.detectChanges();
          }
        });
    } else if (asset.type === "audio_set") {
      this.playAudioSet(asset);
    }
  }

  stopAsset() {
    this.currentlyPlayingAsset = null;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.cdr.detectChanges();
  }

  private playUrl(url: string | undefined): Promise<void> {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let playableUrl = url;
      if (url.startsWith("/")) {
        playableUrl = `${this.dataService.serverUrl}${url}`;
      } else if (url === "default_penalty") {
        playableUrl = `${this.dataService.serverUrl}/assets/default_penalty_Penalty`;
      }
      const audio = new Audio(playableUrl);
      this.currentAudio = audio;
      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };
      audio.onerror = (err) => {
        this.currentAudio = null;
        reject(err);
      };
      audio.play().catch(reject);
    });
  }

  private playTTSPromise(text: string | undefined): Promise<void> {
    return new Promise((resolve) => {
      if (!text || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const playContext = mockTTSContext();
      const interpolatedText = interpolate(text, playContext);
      const utterance = new SpeechSynthesisUtterance(interpolatedText);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  private async playAudioSet(asset: AssetView) {
    if (!asset || !asset.audioEntries || asset.audioEntries.length === 0) {
      return;
    }

    this.currentlyPlayingAsset = asset;
    this.cdr.detectChanges();

    for (const entry of asset.audioEntries) {
      if (this.currentlyPlayingAsset !== asset) break;
      try {
        const entryType = entry.type || "preset";
        if (entryType === "preset") {
          await this.playUrl(entry.url || undefined);
        } else if (entryType === "tts") {
          await this.playTTSPromise(entry.text || undefined);
        }
      } catch (e) {
        this.logger.error("Error playing audio set entry", e);
      }
    }

    if (this.currentlyPlayingAsset === asset) {
      this.currentlyPlayingAsset = null;
      this.cdr.detectChanges();
    }
  }

  onConfirmDelete() {
    if (this.assetsToDeleteIds.length > 0) {
      const deleteObservables = this.assetsToDeleteIds.map((id) =>
        this.dataService.deleteAsset(id),
      );
      forkJoin(deleteObservables).subscribe({
        next: () => {
          this.loadAssets();
          this.onCancelDelete();
        },
        error: (err) => {
          this.logger.error("One or more deletes failed", err);
          this.loadAssets(); // Reload to see what's left
          this.onCancelDelete();
        },
      });
    }
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
    this.assetsToDeleteIds = [];
  }

  startEditing(id: string) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset) {
      asset.editMode = true;
    }
  }

  cancelEditing(id: string) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset) {
      asset.editMode = false;
      this.loadAssets(); // Revert changes
    }
  }

  saveName(id: string, newName: string) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset) {
      this.dataService.renameAsset(id, newName).subscribe({
        next: () => {
          asset.editMode = false;
          asset.name = newName; // Optimistic update or reload
          this.loadAssets();
        },
        error: (err) => this.logger.error("Rename failed", err),
      });
    }
  }

  // Image Set Editor Methods
  openNewImageSetEditor() {
    this.editingAssetId = undefined;
    this.editingAssetName = "";
    this.editingAssetEntries = [];
    this.showImageSetEditor = true;
  }

  openEditImageSetEditor(asset: AssetView) {
    this.editingAssetId = asset.id;
    this.editingAssetName = asset.name;
    this.editingAssetEntries = (asset.images || []).map((img) => ({
      percentage: img.percentage,
      url: img.url,
      name: img.name,
      data: new Uint8Array(),
    }));
    this.showImageSetEditor = true;
  }

  onImageSetSaved(_asset: IAssetMessage) {
    this.loadAssets();
  }

  openNewAudioSetEditor() {
    this.editingAudioAssetId = undefined;
    this.editingAudioAssetName = "";
    this.editingAudioAssetEntries = [];
    this.showAudioSetEditor = true;
  }

  openEditAudioSetEditor(asset: AssetView) {
    this.editingAudioAssetId = asset.id;
    this.editingAudioAssetName = asset.name;
    this.editingAudioAssetEntries = (asset.audioEntries || []).map((entry) => ({
      timeSeconds: entry.timeSeconds,
      url: entry.url,
      name: entry.name,
      data: new Uint8Array(),
      type: entry.type || "preset",
      text: entry.text || "",
    }));
    this.showAudioSetEditor = true;
    this.cdr.detectChanges();
  }

  onAudioSetSaved(_asset: IAssetMessage) {
    this.showAudioSetEditor = false;
    this.loadAssets();
  }

  // Custom Rotation Editor Methods
  openNewCustomRotationEditor() {
    this.router.navigate(["/custom-rotation-editor"], {
      queryParams: {
        id: "new",
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
  }

  openEditCustomRotationEditor(asset: AssetView) {
    this.router.navigate(["/custom-rotation-editor"], {
      queryParams: {
        id: asset.id,
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
  }

  onCustomRotationSaved(_asset: IAssetMessage) {
    this.loadAssets();
  }

  /* eslint-disable max-lines-per-function */
  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("AM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("AM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: ".stats-content",
        title: this.translationService.translate("AM_HELP_STATS_TITLE"),
        content: this.translationService.translate("AM_HELP_STATS_CONTENT"),
        position: "right",
      },
      {
        selector: ".upload-zone",
        title: this.translationService.translate("AM_HELP_UPLOAD_TITLE"),
        content: this.translationService.translate("AM_HELP_UPLOAD_CONTENT"),
        position: "right",
      },
      {
        selector: ".btn-image-set",
        title: this.translationService.translate("AM_HELP_IMAGE_SET_TITLE"),
        content: this.translationService.translate("AM_HELP_IMAGE_SET_CONTENT"),
        position: "right",
      },
      {
        selector: ".btn-audio-set",
        title: this.translationService.translate("AM_HELP_AUDIO_SET_TITLE"),
        content: this.translationService.translate("AM_HELP_AUDIO_SET_CONTENT"),
        position: "right",
      },
      {
        selector: ".btn-custom-rotation",
        title: this.translationService.translate(
          "AM_HELP_CUSTOM_ROTATION_TITLE",
        ),
        content: this.translationService.translate(
          "AM_HELP_CUSTOM_ROTATION_CONTENT",
        ),
        position: "right",
      },
      {
        selector: ".library-panel",
        title: this.translationService.translate("AM_HELP_LIBRARY_TITLE"),
        content: this.translationService.translate("AM_HELP_LIBRARY_CONTENT"),
        position: "left",
      },
      {
        selector: ".filter-all",
        title: this.translationService.translate("AM_HELP_FILTER_ALL_TITLE"),
        content: this.translationService.translate(
          "AM_HELP_FILTER_ALL_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".filter-images",
        title: this.translationService.translate("AM_HELP_FILTER_IMAGES_TITLE"),
        content: this.translationService.translate(
          "AM_HELP_FILTER_IMAGES_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".filter-image-sets",
        title: this.translationService.translate(
          "AM_HELP_FILTER_IMAGE_SETS_TITLE",
        ),
        content: this.translationService.translate(
          "AM_HELP_FILTER_IMAGE_SETS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".filter-sounds",
        title: this.translationService.translate("AM_HELP_FILTER_SOUNDS_TITLE"),
        content: this.translationService.translate(
          "AM_HELP_FILTER_SOUNDS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".filter-audio-sets",
        title: this.translationService.translate(
          "AM_HELP_FILTER_AUDIO_SETS_TITLE",
        ),
        content: this.translationService.translate(
          "AM_HELP_FILTER_AUDIO_SETS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".filter-custom-rotations",
        title: this.translationService.translate(
          "AM_HELP_FILTER_CUSTOM_ROTATIONS_TITLE",
        ),
        content: this.translationService.translate(
          "AM_HELP_FILTER_CUSTOM_ROTATIONS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: ".filter-input",
        title: this.translationService.translate("AM_HELP_FILTER_NAME_TITLE"),
        content: this.translationService.translate(
          "AM_HELP_FILTER_NAME_CONTENT",
        ),
        position: "bottom",
      },
    ];
  }
}
