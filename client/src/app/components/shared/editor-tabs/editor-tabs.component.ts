import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";

export interface EditorTab {
  id: string;
  label: string;
}

@Component({
  standalone: true,
  selector: "app-editor-tabs",
  templateUrl: "./editor-tabs.component.html",
  styleUrls: ["./editor-tabs.component.css"],
  imports: [CommonModule],
})
export class EditorTabsComponent {
  readonly tabs = input<EditorTab[]>([]);
  readonly tabClicked = output<string>();

  onTabClick(tabId: string) {
    this.tabClicked.emit(tabId);
  }
}
