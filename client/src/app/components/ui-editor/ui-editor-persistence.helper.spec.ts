import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { CustomUiService } from "@app/services/custom-ui.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";

import { buildAutoSavePipeline } from "./ui-editor-persistence.helper";

describe("ui-editor-persistence.helper", () => {
  it("should return null if not saveable or no changes", () => {
    const ctx: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: false,
      isAnyThemeNameInvalid: false,
      isAnyCustomUiNameInvalid: false,
    };
    expect(buildAutoSavePipeline(ctx)).toBeNull();
  });

  it("should build save pipeline saving changed settings, themes, and UIs", (done) => {
    const theme: Theme = {
      entity_id: "t1",
      name: "Theme 1 Modified",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const ui: CustomUI = {
      entity_id: "ui1",
      name: "UI 1 Modified",
      is_default: false,
    };

    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "updateTheme",
      "updateCustomUI",
    ]);
    dataServiceSpy.updateTheme.and.returnValue(of(theme));
    dataServiceSpy.updateCustomUI.and.returnValue(of(ui));

    const settingsServiceSpy = jasmine.createSpyObj<SettingsService>(
      "SettingsService",
      ["saveSettings"],
    );

    const ctx: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: true,
      isAnyThemeNameInvalid: false,
      isAnyCustomUiNameInvalid: false,
      editingSettings: new Settings(),
      displayThemes: [theme],
      displayCustomUIs: [ui],
      initialState: {
        themes: [
          {
            entity_id: "t1",
            name: "Theme 1 Original",
            is_default: false,
            slots: {},
            audio_slots: {},
          },
        ],
        customUIs: [
          { entity_id: "ui1", name: "UI 1 Original", is_default: false },
        ],
      },
      dataService: dataServiceSpy,
      settingsService: settingsServiceSpy,
      themeService: jasmine.createSpyObj<ThemeService>("ThemeService", [
        "refresh",
      ]),
      customUiService: jasmine.createSpyObj<CustomUiService>(
        "CustomUiService",
        ["initialize"],
      ),
    };

    const pipeline = buildAutoSavePipeline(ctx);
    expect(pipeline).not.toBeNull();

    pipeline?.subscribe(() => {
      expect(settingsServiceSpy.saveSettings).toHaveBeenCalled();
      expect(dataServiceSpy.updateTheme).toHaveBeenCalledWith("t1", theme);
      expect(dataServiceSpy.updateCustomUI).toHaveBeenCalledWith("ui1", ui);
      done();
    });
  });
});
