import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../data.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-database-manager',
  templateUrl: './database-manager.component.html',
  styleUrls: ['./database-manager.component.css'],
  standalone: false
})
export class DatabaseManagerComponent implements OnInit {
  databases: any[] = [];
  selectedDatabase: any = null;
  currentDatabaseName: string = '';
  loading = false;
  scale: number = 1;

  // Modal State
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalParams: any = {};
  private onConfirmAction: () => void = () => { };

  showAckModal = false;
  ackModalTitle = '';
  ackModalMessage = '';
  ackModalParams: any = {};

  showInputModal = false;
  inputModalTitle = '';
  inputModalMessage = '';
  inputModalParams: any = {};
  inputValue = '';
  private onInputConfirmAction: (value: string) => void = () => { };

  constructor(
    private dataService: DataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updateScale();
    this.initialLoad();
  }

  @HostListener('window:resize')
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
      current: this.dataService.getCurrentDatabase()
    }).subscribe({
      next: ({ dbs, current }) => {
        this.databases = dbs;
        this.currentDatabaseName = current.name;

        // Auto-select current database if no selection or if strictly loading fresh
        if (!this.selectedDatabase) {
          const found = this.databases.find(d => d.name === this.currentDatabaseName);
          if (found) {
            this.selectedDatabase = found;
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading initial data', err);
        this.openAck('DBM_TITLE', 'DBM_ERR_LOAD_INFO');
        this.loading = false;
      }
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
          const found = this.databases.find(d => d.name === this.selectedDatabase.name);
          if (found) {
            this.selectedDatabase = found;
          }
        } else if (this.currentDatabaseName) {
          // Fallback to current if nothing selected
          const found = this.databases.find(d => d.name === this.currentDatabaseName);
          if (found) this.selectedDatabase = found;
        }

        this.loading = false;
        this.cdr.detectChanges(); // Ensure data updates render immediately
      },
      error: (err) => {
        console.error('Error loading databases', err);
        this.openAck('DBM_TITLE', 'DBM_ERR_LOAD_LIST');
        this.loading = false;
      }
    });
  }

  selectDatabase(db: any) {
    this.selectedDatabase = db;
  }

  useDatabase() {
    if (!this.selectedDatabase) return;
    if (this.selectedDatabase.name === this.currentDatabaseName) {
      return;
    }

    this.openConfirm(
      'DBM_CONFIRM_SWITCH_TITLE',
      'DBM_CONFIRM_SWITCH_MSG',
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
            console.error('Error switching database', err);
            this.openAck('DBM_TITLE', 'DBM_ERR_SWITCH');
            this.loading = false;
          }
        });
      }
    );
  }

  createDatabase() {
    this.openInput(
      'DBM_PROMPT_CREATE_TITLE',
      'DBM_PROMPT_CREATE_MSG',
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
            console.error('Error creating database', err);
            this.loading = false;
            if (err.status === 409) {
              this.openAck('DBM_TITLE', 'DBM_ERR_EXISTS');
            } else {
              this.openAck('DBM_TITLE', 'DBM_ERR_CREATE');
            }
            this.cdr.detectChanges();
          }
        });
      }
    );
  }

  copyDatabase() {
    if (!this.selectedDatabase) return;
    if (this.selectedDatabase.name !== this.currentDatabaseName) {
      this.openAck('DBM_TITLE', 'DBM_ERR_COPY_INACTIVE');
      return;
    }

    this.openInput(
      'DBM_PROMPT_COPY_TITLE',
      'DBM_PROMPT_COPY_MSG',
      { name: this.selectedDatabase.name },
      (newName) => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.copyDatabase(newName).subscribe({
          next: (stats) => {
            this.openAck('DBM_TITLE', 'DBM_SUCCESS_COPY', { name: stats.name });
            this.loadDatabases(); // toggle loading off in here
          },
          error: (err) => {
            console.error('Error copying database', err);
            this.loading = false;
            if (err.status === 409) {
              this.openAck('DBM_TITLE', 'DBM_ERR_EXISTS');
            } else {
              this.openAck('DBM_TITLE', 'DBM_ERR_COPY');
            }
            this.cdr.detectChanges();
          }
        });
      }
    );
  }

  resetDatabase() {
    if (!this.selectedDatabase) return;
    if (this.selectedDatabase.name !== this.currentDatabaseName) {
      this.openAck('DBM_TITLE', 'DBM_ERR_RESET_INACTIVE');
      return;
    }

    this.openConfirm(
      'DBM_CONFIRM_RESET_TITLE',
      'DBM_CONFIRM_RESET_MSG_1',
      { name: this.selectedDatabase.name },
      () => {
        this.openConfirm(
          'DBM_CONFIRM_RESET_TITLE',
          'DBM_CONFIRM_RESET_MSG_2',
          {},
          () => {
            this.loading = true;
            this.cdr.detectChanges();

            this.dataService.resetDatabase().subscribe({
              next: (stats) => {
                this.openAck('DBM_TITLE', 'DBM_SUCCESS_RESET', { name: stats.name });
                this.loadDatabases(); // toggle loading off in here
              },
              error: (err) => {
                console.error('Error resetting database', err);
                this.openAck('DBM_TITLE', 'DBM_ERR_RESET');
                this.loading = false;
              }
            });
          }
        );
      }
    );
  }

  deleteDatabase() {
    if (!this.selectedDatabase) return;
    if (this.selectedDatabase.name === this.currentDatabaseName) {
      this.openAck('DBM_TITLE', 'DBM_ERR_DELETE_ACTIVE');
      return;
    }

    this.openConfirm(
      'DBM_CONFIRM_DELETE_TITLE',
      'DBM_CONFIRM_DELETE_MSG',
      { name: this.selectedDatabase.name },
      () => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.deleteDatabase(this.selectedDatabase.name).subscribe({
          next: () => {
            this.openAck('DBM_TITLE', 'DBM_SUCCESS_DELETE', { name: this.selectedDatabase.name });
            this.selectedDatabase = null; // Clear selection
            this.loadDatabases();
          },
          error: (err) => {
            console.error('Error deleting database', err);
            this.loading = false;
            this.openAck('DBM_TITLE', 'DBM_ERR_DELETE');
            this.cdr.detectChanges();
          }
        });
      }
    );
  }

  exportDatabase() {
    if (!this.selectedDatabase) return;
    this.dataService.exportDatabase(this.selectedDatabase.name);
  }

  importDatabase() {
    const fileInput = document.getElementById('databaseImportInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.openInput(
      'DBM_PROMPT_IMPORT_TITLE',
      'DBM_PROMPT_IMPORT_MSG',
      { filename: file.name },
      (name) => {
        this.loading = true;
        this.cdr.detectChanges();

        this.dataService.importDatabase(name, file).subscribe({
          next: (stats) => {
            this.openAck('DBM_TITLE', 'DBM_SUCCESS_IMPORT', { name: stats.name });
            this.loadDatabases();
          },
          error: (err) => {
            console.error('Error importing database', err);
            this.loading = false;
            this.openAck('DBM_TITLE', 'DBM_ERR_IMPORT');
            this.cdr.detectChanges();
          }
        });
      }
    );
    // Reset input so the same file can be selected again
    event.target.value = '';
  }

  onBack() {
    this.router.navigate(['/raceday-setup']);
  }

  // Modal Helpers
  openConfirm(titleKey: string, messageKey: string, msgParams: any, onConfirm: () => void) {
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

  openInput(titleKey: string, messageKey: string, msgParams: any, onConfirm: (val: string) => void) {
    this.inputModalTitle = titleKey;
    this.inputModalMessage = messageKey;
    this.inputModalParams = msgParams || {};
    this.inputValue = '';
    this.onInputConfirmAction = onConfirm;
    this.showInputModal = true;
    this.cdr.detectChanges();
  }

  onInputConfirm() {
    if (this.inputValue) {
      this.showInputModal = false;
      this.onInputConfirmAction(this.inputValue);
    }
    this.cdr.detectChanges();
  }

  onCancelInput() {
    this.showInputModal = false;
    this.cdr.detectChanges();
  }
}
