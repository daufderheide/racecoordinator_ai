import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";

@Component({
  standalone: true,
  selector: "app-database-manager",
  templateUrl: "./database-manager.component.html",
  styleUrls: ["./database-manager.component.css"],
  imports: [
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    ManagerHeaderComponent,
    FormsModule,
    DecimalPipe,
    TranslatePipe,
  ],
})
export class DatabaseManagerComponent implements OnInit, OnDestroy {
  databases: any[] = [];
  selectedDatabase: any = null;
  currentDatabaseName: string = "";
  loading = false;
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

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  // Modal State
  showConfirmModal = false;
  confirmModalTitle = "";
  confirmModalMessage = "";
  confirmModalParams: any = {};
  private onConfirmAction: () => void = () => {};

  showAckModal = false;
  ackModalTitle = "";
  ackModalMessage = "";
  ackModalParams: any = {};

  showInputModal = false;
  inputModalTitle = "";
  inputModalMessage = "";
  inputModalParams: any = {};
  inputValue = "";
  private onInputConfirmAction: (value: string) => void = () => {};

  constructor(
    private dataService: DataService,
    private settingsService: SettingsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.initialLoad();
    this.raceConnectionService.connect();
  }

  ngOnDestroy(): void {
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
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

  initialLoad() {
    this.loading = true;
    this.cdr.detectChanges();

    forkJoin({
      dbs: this.dataService.getDatabases(),
      current: this.dataService.getCurrentDatabase(),
    }).subscribe({
      next: ({ dbs, current }) => {
        this.databases = dbs;
        this.currentDatabaseName = current.name;

        // Auto-select current database if no selection or if strictly loading fresh
        if (!this.selectedDatabase) {
          const found = this.databases.find(
            (d) => d.name === this.currentDatabaseName,
          );
          if (found) {
            this.selectedDatabase = found;
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Error loading initial data", err);
        this.openAck("DBM_TITLE", "DBM_ERR_LOAD_INFO");
        this.loading = false;
      },
    });
  }

  loadDatabases() {
    this.loading = true;
    this.cdr.detectChanges(); // Ensure loading state renders immediately
    this.dataService.getDatabases().subscribe({
      next: (dbs) => {
        this.databases = dbs;

        // Re-establish selection object reference from new list
        if (this.selectedDatabase) {
          const found = this.databases.find(
            (d) => d.name === this.selectedDatabase.name,
          );
          if (found) {
            this.selectedDatabase = found;
          }
        } else if (this.currentDatabaseName) {
          // Fallback to current if nothing selected
          const found = this.databases.find(
            (d) => d.name === this.currentDatabaseName,
          );
          if (found) this.selectedDatabase = found;
        }

        this.loading = false;
        this.cdr.detectChanges(); // Ensure data updates render immediately
      },
      error: (err) => {
        this.logger.error("Error loading databases", err);
        this.openAck("DBM_TITLE", "DBM_ERR_LOAD_LIST");
        this.loading = false;
      },
    });
  }

  selectDatabase(db: any) {
    this.selectedDatabase = db;
  }

  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        this.isConnectionLost = state === ConnectionState.DISCONNECTED;
        if (this.isConnectionLost) {
          this.handleConnectionLoss();
        }
      });
  }

  handleConnectionLoss() {
    let startTime = Date.now();
    const intervalId = setInterval(() => {
      if (!this.isConnectionLost) {
        clearInterval(intervalId);
        return;
      }
      if (Date.now() - startTime > 5000) {
        clearInterval(intervalId);
        this.router.navigate(["/raceday-setup"]);
      }
    }, 1000);
  }

  useDatabase() {
    if (!this.selectedDatabase) return;
    if (this.selectedDatabase.name === this.currentDatabaseName) {
      return;
    }

    this.openConfirm(
      "DBM_CONFIRM_SWITCH_TITLE",
      "DBM_CONFIRM_SWITCH_MSG",
      { name: this.selectedDatabase.name },
      () => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.switchDatabase(this.selectedDatabase.name).subscribe({
          next: (stats) => {
            this.currentDatabaseName = stats.name;
            this.loadDatabases(); // toggle loading off in here
          },
          error: (err) => {
            this.logger.error("Error switching database", err);
            this.openAck("DBM_TITLE", "DBM_ERR_SWITCH");
            this.loading = false;
          },
        });
      },
    );
  }

  createDatabase() {
    this.openInput(
      "DBM_PROMPT_CREATE_TITLE",
      "DBM_PROMPT_CREATE_MSG",
      {},
      (name) => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.createDatabase(name).subscribe({
          next: (stats) => {
            this.currentDatabaseName = stats.name;
            this.selectedDatabase = stats;
            this.loadDatabases(); // toggle loading off in here
          },
          error: (err) => {
            this.logger.error("Error creating database", err);
            this.loading = false;
            if (err.status === 409) {
              this.openAck("DBM_TITLE", "DBM_ERR_EXISTS");
            } else {
              this.openAck("DBM_TITLE", "DBM_ERR_CREATE");
            }
            this.cdr.detectChanges();
          },
        });
      },
    );
  }

  copyDatabase() {
    if (!this.selectedDatabase) return;
    const sourceName = this.selectedDatabase.name;

    this.openInput(
      "DBM_PROMPT_COPY_TITLE",
      "DBM_PROMPT_COPY_MSG",
      { name: sourceName },
      (newName) => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.copyDatabase(newName, sourceName).subscribe({
          next: (stats) => {
            this.openAck("DBM_TITLE", "DBM_SUCCESS_COPY", {
              name: stats.name,
            });
            this.selectedDatabase = stats; // Select the new copy
            this.loadDatabases(); // toggle loading off in here
          },
          error: (err) => {
            this.logger.error("Error copying database", err);
            this.loading = false;
            if (err.status === 409) {
              this.openAck("DBM_TITLE", "DBM_ERR_EXISTS");
            } else {
              this.openAck("DBM_TITLE", "DBM_ERR_COPY");
            }
            this.cdr.detectChanges();
          },
        });
      },
      this.generateUniqueName(`${sourceName}_copy`),
    );
  }

  resetDatabase() {
    if (!this.selectedDatabase) return;
    const dbName = this.selectedDatabase.name;

    this.openConfirm(
      "DBM_CONFIRM_RESET_TITLE",
      "DBM_CONFIRM_RESET_MSG_1",
      { name: dbName },
      () => {
        this.openConfirm(
          "DBM_CONFIRM_RESET_TITLE",
          "DBM_CONFIRM_RESET_MSG_2",
          {},
          () => {
            this.loading = true;
            this.cdr.detectChanges();

            this.dataService.resetDatabase(dbName).subscribe({
              next: (stats) => {
                // If we reset the ACTIVE database, we should also reset local settings
                if (dbName === this.currentDatabaseName) {
                  this.settingsService.resetToDefaults();
                }
                this.openAck("DBM_TITLE", "DBM_SUCCESS_RESET", {
                  name: stats.name,
                });
                this.loadDatabases(); // toggle loading off in here
              },
              error: (err) => {
                this.logger.error("Error resetting database", err);
                this.openAck("DBM_TITLE", "DBM_ERR_RESET");
                this.loading = false;
              },
            });
          },
        );
      },
    );
  }

  deleteDatabase() {
    if (!this.selectedDatabase) return;
    const dbName = this.selectedDatabase.name;

    if (dbName === this.currentDatabaseName) {
      this.openAck("DBM_TITLE", "DBM_ERR_DELETE_ACTIVE");
      return;
    }

    this.openConfirm(
      "DBM_CONFIRM_DELETE_TITLE",
      "DBM_CONFIRM_DELETE_MSG",
      { name: dbName },
      () => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.deleteDatabase(dbName).subscribe({
          next: () => {
            this.openAck("DBM_TITLE", "DBM_SUCCESS_DELETE", {
              name: dbName,
            });
            this.selectedDatabase = null; // Clear selection
            this.loadDatabases();
          },
          error: (err) => {
            this.logger.error("Error deleting database", err);
            this.loading = false;
            this.openAck("DBM_TITLE", "DBM_ERR_DELETE");
            this.cdr.detectChanges();
          },
        });
      },
    );
  }

  exportDatabase() {
    if (!this.selectedDatabase) return;
    this.dataService.exportDatabase(this.selectedDatabase.name);
  }

  importDatabase() {
    const fileInput = document.getElementById(
      "databaseImportInput",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const uniqueName = this.generateUniqueName(baseName);

    this.openInput(
      "DBM_PROMPT_IMPORT_TITLE",
      "DBM_PROMPT_IMPORT_MSG",
      { filename: file.name },
      (name) => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.importDatabase(name, file).subscribe({
          next: (stats) => {
            this.openAck("DBM_TITLE", "DBM_SUCCESS_IMPORT", {
              name: stats.name,
            });
            this.selectedDatabase = stats; // Select the newly imported DB
            this.loadDatabases();
          },
          error: (err) => {
            this.logger.error("Error importing database", err);
            this.loading = false;
            this.openAck("DBM_TITLE", "DBM_ERR_IMPORT");
            this.cdr.detectChanges();
          },
        });
      },
      uniqueName,
    );
    // Reset input so the same file can be selected again
    event.target.value = "";
  }

  generateUniqueName(base: string): string {
    let name = base;
    let counter = 1;
    while (!this.isNameUnique(name)) {
      name = `${base}_${counter}`;
      counter++;
    }
    return name;
  }

  isNameUnique(name: string): boolean {
    return !this.databases.find(
      (db) => db.name.toLowerCase() === name.toLowerCase(),
    );
  }

  // Modal Helpers
  openConfirm(
    titleKey: string,
    messageKey: string,
    msgParams: any,
    onConfirm: () => void,
  ) {
    this.confirmModalTitle = titleKey;
    this.confirmModalMessage = messageKey;
    this.confirmModalParams = msgParams || {};
    this.onConfirmAction = onConfirm;
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }

  onConfirm() {
    this.showConfirmModal = false;
    this.onConfirmAction();
    this.cdr.detectChanges();
  }

  onCancelConfirm() {
    this.showConfirmModal = false;
    this.cdr.detectChanges();
  }

  openAck(titleKey: string, messageKey: string, msgParams: any = {}) {
    this.ackModalTitle = titleKey;
    this.ackModalMessage = messageKey;
    this.ackModalParams = msgParams;
    this.showAckModal = true;
    this.cdr.detectChanges();
  }

  onAck() {
    this.showAckModal = false;
    this.cdr.detectChanges();
  }

  openInput(
    titleKey: string,
    messageKey: string,
    msgParams: any,
    onConfirm: (val: string) => void,
    initialValue: string = "",
  ) {
    this.inputModalTitle = titleKey;
    this.inputModalMessage = messageKey;
    this.inputModalParams = msgParams || {};
    this.inputValue = initialValue;
    this.onInputConfirmAction = onConfirm;
    this.showInputModal = true;
    this.cdr.detectChanges();
  }

  onInputConfirm() {
    if (this.inputValue && this.isNameUnique(this.inputValue)) {
      this.showInputModal = false;
      this.onInputConfirmAction(this.inputValue);
    }
    this.cdr.detectChanges();
  }

  onCancelInput() {
    this.showInputModal = false;
    this.cdr.detectChanges();
  }

  getHelpSteps() {
    return [
      {
        targetId: "sidebar-list",
        title: "DBM_HELP_SIDEBAR_TITLE",
        content: "DBM_HELP_SIDEBAR_CONTENT",
        position: "right" as const,
      },
      {
        targetId: "detail-panel",
        title: "DBM_HELP_DETAIL_TITLE",
        content: "DBM_HELP_DETAIL_CONTENT",
        position: "left" as const,
      },
    ];
  }
}
