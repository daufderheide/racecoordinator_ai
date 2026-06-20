import { CommonModule } from "@angular/common";
import {
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-image-inspector",
  templateUrl: "./image-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe, ImageSelectorComponent],
})
export class ImageInspectorComponent implements OnInit, OnDestroy {
  settings = input.required<any>();
  change = output<void>();

  private dataService = inject(DataService);
  private sub: Subscription | null = null;
  imageAssets: any[] = [];

  ngOnInit() {
    this.sub = this.dataService.listAssets().subscribe({
      next: (assets) => {
        this.imageAssets = (assets || []).filter(
          (a) => a && a.type === "image",
        );
      },
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  onImageUrlChange(newUrl: string | undefined) {
    if (this.settings()) {
      this.settings().imageUrl = newUrl || "";
      this.change.emit();
    }
  }
}
