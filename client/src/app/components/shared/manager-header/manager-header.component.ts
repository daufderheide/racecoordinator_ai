import { Component, input, output, ViewChild } from "@angular/core";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep } from "@app/services/help.service";

@Component({
  standalone: true,
  selector: "app-manager-header",
  templateUrl: "./manager-header.component.html",
  styleUrls: ["./manager-header.component.css"],
  imports: [ToolbarComponent, TranslatePipe, BrowserNavigationComponent],
})
export class ManagerHeaderComponent {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  title = input("");
  showActions = input(true);
  showAdd = input(true);
  showEdit = input(true);
  showHelp = input(true);
  showDelete = input(true);
  showCopy = input(false);
  showImport = input(false);
  showExport = input(false);
  showReset = input(false);
  resetTitleKey = input("DBM_BTN_RESET");
  resetDisabledTooltipKey = input("");
  disabledImport = input(false);
  disabledExport = input(false);
  disabledReset = input(false);
  disabledCopy = input(false);
  disabledDelete = input(false);
  isSaving = input(false);
  helpSteps = input<GuideStep[]>([]);
  helpTitle = input("");
  helpRecordName = input<keyof Settings>();

  add = output<void>();
  edit = output<void>();
  copy = output<void>();
  help = output<void>();
  delete = output<void>();
  import = output<void>();
  export = output<void>();
  reset = output<void>();

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

  onImport() {
    this.import.emit();
  }

  onExport() {
    this.export.emit();
  }

  onReset() {
    this.reset.emit();
  }
}
