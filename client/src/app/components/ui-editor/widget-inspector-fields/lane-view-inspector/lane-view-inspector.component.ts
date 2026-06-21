import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-lane-view-inspector",
  templateUrl: "./lane-view-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class LaneViewInspectorComponent {
  settings = input.required<any>();
  change = output<void>();

  onSettingsChange() {
    this.change.emit();
  }
}
