import { Component, input, output, ViewChild } from "@angular/core";
import { ToolbarComponent } from "src/app/components/shared/toolbar/toolbar.component";
import { Settings } from "src/app/models/settings";
import { GuideStep } from "src/app/services/help.service";
import { BackButtonComponent } from "../back-button/back-button.component";

import { ToolbarComponent as ToolbarComponent_1 } from "../toolbar/toolbar.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-manager-header",
  templateUrl: "./manager-header.component.html",
  styleUrls: ["./manager-header.component.css"],
  imports: [BackButtonComponent, ToolbarComponent_1, TranslatePipe],
})
export class ManagerHeaderComponent {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  title = input("");
  backTargetUrl = input("/raceday-setup");
  showActions = input(true);
  showAdd = input(true);
  showEdit = input(true);
  showHelp = input(true);
  showDelete = input(true);
  showCopy = input(false);
  isSaving = input(false);
  helpSteps = input<GuideStep[]>([]);
  helpTitle = input("");
  helpRecordName = input<keyof Settings>();

  add = output<void>();
  edit = output<void>();
  copy = output<void>();
  help = output<void>();
  delete = output<void>();

  onAdd() {
    this.add.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  onHelp() {
    this.help.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onCopy() {
    this.copy.emit();
  }
}
