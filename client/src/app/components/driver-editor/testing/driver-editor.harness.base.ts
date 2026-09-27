import { ConfirmationModalHarnessBase } from "../../shared/confirmation-modal/testing/confirmation-modal.harness.base";

export abstract class DriverEditorHarnessBase {
  static readonly hostSelector = "app-driver-editor";

  static readonly selectors = {
    nameInput: "#driver-name-input",
    nicknameInput: "#driver-nickname-input",
    linkToggleBtn: "#driver-link-toggle-btn",
    linkDivider: "#driver-name-nickname-link-section",
    undoBtn: "app-editor-title .undo",
    redoBtn: "app-editor-title .redo",
  };

  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getNickname(): Promise<string>;
  abstract setNickname(nickname: string): Promise<void>;
  abstract isNameNicknameLinked(): Promise<boolean>;
  abstract toggleNameNicknameLink(): Promise<void>;
  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract getConfirmationModal(): Promise<ConfirmationModalHarnessBase>;
}
