import { Injectable } from "@angular/core";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { LoggerService } from "@app/services/logger.service";

@Injectable({
  providedIn: "root",
})
export class CustomUiService {
  private customUIs: CustomUI[] = [];
  private initialized = false;
  private customUIsSubject = new BehaviorSubject<CustomUI[]>([]);
  readonly customUIs$ = this.customUIsSubject.asObservable();

  constructor(
    private dataService: DataService,
    private logger: LoggerService,
  ) {
    if (this.dataService?.socketConnected$) {
      this.dataService.socketConnected$.subscribe((connected) => {
        if (connected) {
          this.logger.info(
            "CustomUiService: Socket connected, initializing custom UIs...",
          );
          this.initialize().catch((err) => {
            this.logger.error(
              "CustomUiService: Error in auto-initialization",
              err,
            );
          });
        }
      });
    }
  }

  async initialize(): Promise<void> {
    try {
      this.customUIs = await firstValueFrom(this.dataService.getCustomUIs());
    } catch (e: any) {
      if (e.status !== 0) {
        this.logger.error("CustomUiService: Failed to fetch custom UIs", e);
      } else {
        this.logger.debug(
          "CustomUiService: Server offline, unable to fetch custom UIs.",
        );
      }
      this.customUIs = [];
    }
    this.initialized = true;
    this.customUIsSubject.next(this.customUIs);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCustomUIs(): CustomUI[] {
    return this.customUIs;
  }

  getCustomUI(id: string): CustomUI | undefined {
    return this.customUIs.find((ui) => ui.entity_id === id);
  }
}
