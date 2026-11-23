import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { DataService } from "@app/data.service";

/** An image from the asset library, using the existing image selector. */
@Component({
  standalone: true,
  selector: "app-kit-image",
  imports: [ImageSelectorComponent],
  template: `
    <div class="kit-image">
      <app-image-selector
        [imageUrl]="value() || undefined"
        (imageUrlChange)="valueChange.emit($event || '')"
        [assets]="assets()"
        [size]="'large'"
      ></app-image-selector>
    </div>
  `,
})
export class KitImageComponent implements OnInit {
  value = input<string | undefined>();
  valueChange = output<string>();

  private dataService = inject(DataService);
  private destroyRef = inject(DestroyRef);
  assets = signal<any[]>([]);

  ngOnInit(): void {
    this.dataService
      .listAssets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) =>
          this.assets.set(
            (assets || []).filter((a) => a && a.type === "image"),
          ),
      });
  }
}
