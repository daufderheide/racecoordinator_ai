import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Router } from "@angular/router";
import { NgIf, NgFor } from "@angular/common";
import { BackButtonComponent } from "../back-button/back-button.component";
import { FormsModule } from "@angular/forms";
import { AssetPreviewComponent } from "../asset-preview/asset-preview.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-item-selector",
  templateUrl: "./item-selector.component.html",
  styleUrls: ["./item-selector.component.css"],
  imports: [
    NgIf,
    BackButtonComponent,
    FormsModule,
    NgFor,
    AssetPreviewComponent,
    TranslatePipe,
  ],
})
export class ItemSelectorComponent {
  @Input() visible = false;
  @Input() title?: string;
  @Input() items: any[] = [];
  searchTerm: string = "";

  @Input() itemType: "image" | "sound" | "image_set" | "audio" | "audio_set" =
    "image";

  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() backButtonLabel?: string;

  get filteredItems() {
    let results = this.items;

    // Filter by type if itemType is specified
    if (this.itemType) {
      if (this.itemType === "audio") {
        results = results.filter(
          (item) => item.type === "sound" || item.type === "audio_set",
        );
      } else {
        results = results.filter((item) => item.type === this.itemType);
      }
    }

    if (!this.searchTerm) {
      return results;
    }

    const lowerTerm = this.searchTerm.toLowerCase();
    return results.filter(
      (item) => item.name && item.name.toLowerCase().includes(lowerTerm),
    );
  }

  @Output() select = new EventEmitter<any>();
  @Output() play = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  onBack() {
    if (this.backButtonRoute) {
      this.router.navigate([this.backButtonRoute], {
        queryParams: this.backButtonQueryParams,
      });
    }
    this.close.emit();
  }

  onSelect(item: any) {
    this.select.emit(item);
  }

  onPlay(event: MouseEvent, item: any) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.play.emit(item);
  }

  onClose() {
    this.close.emit();
  }
}
