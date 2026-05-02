import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { ToolbarComponent } from "src/app/components/shared/toolbar/toolbar.component";
import { Settings } from "src/app/models/settings";
import { GuideStep } from "src/app/services/help.service";
import { BackButtonComponent } from "../back-button/back-button.component";
import { NgIf } from "@angular/common";
import { ToolbarComponent as ToolbarComponent_1 } from "../toolbar/toolbar.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-manager-header",
  templateUrl: "./manager-header.component.html",
  styleUrls: ["./manager-header.component.css"],
  imports: [BackButtonComponent, NgIf, ToolbarComponent_1, TranslatePipe],
})
export class ManagerHeaderComponent {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  @Input() title: string = "";
  @Input() backTargetUrl: string = "/raceday-setup";
  @Input() showActions: boolean = true;
  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() showCopy: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() helpSteps: GuideStep[] = [];
  @Input() helpTitle: string = "";
  @Input() helpRecordName?: keyof Settings;

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

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
