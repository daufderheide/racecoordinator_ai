import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-leaderboard-inspector",
  templateUrl: "./leaderboard-inspector.component.html",
  styleUrls: ["../../ui-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class LeaderboardInspectorComponent {
  settings = input.required<any>();
  change = output<void>();

  onSettingsChange() {
    this.change.emit();
  }

  onColorChange(field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.settings()) {
      this.settings()[field] = value;
      this.change.emit();
    }
  }

  resetColor(field: string) {
    if (this.settings()) {
      this.settings()[field] = "";
      this.change.emit();
    }
  }
}
