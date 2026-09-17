import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-editor-section",
  templateUrl: "./editor-section.component.html",
  styleUrls: ["./editor-section.component.css"],
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorSectionComponent {
  titleKey = input<string | undefined>(undefined);
  titleText = input<string | undefined>(undefined);
  expanded = model<boolean>(true);
  sectionId = input<string | undefined>(undefined);
  headerId = input<string | undefined>(undefined);
  headingLevel = input<"h1" | "h2" | "h3" | "h4">("h1");
  collapsible = input<boolean>(true);
  bordered = input<boolean>(false);
  customClass = input<string | undefined>(undefined);

  toggle = output<boolean>();

  onHeaderClick(_event: MouseEvent) {
    if (!this.collapsible()) return;
    this.toggleSection();
  }

  onKeydown(e: Event) {
    if (!this.collapsible()) return;
    e.preventDefault();
    this.toggleSection();
  }

  private toggleSection() {
    const next = !this.expanded();
    this.expanded.set(next);
    this.toggle.emit(next);
  }
}
