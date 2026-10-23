export interface TrackEditorSections {
  general: boolean;
  interfaces: boolean;
  lanes: boolean;
}

export class TrackEditorUiHelper {
  static calculateScale(windowWidth: number, windowHeight: number): number {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    return Math.min(scaleX, scaleY);
  }

  static handleKeyboardEvent(
    event: KeyboardEvent,
    isEditMode: boolean,
    undo: () => void,
    redo: () => void,
  ): void {
    if (!isEditMode) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      redo();
    }
  }

  static loadSavedSections(): TrackEditorSections {
    const defaultSections: TrackEditorSections = {
      general: true,
      interfaces: true,
      lanes: true,
    };
    const saved = localStorage.getItem("rc.track-editor.sections");
    if (saved) {
      try {
        const savedSections = JSON.parse(saved);
        return { ...defaultSections, ...savedSections };
      } catch {
        return defaultSections;
      }
    }
    return defaultSections;
  }

  static saveSections(sections: TrackEditorSections): void {
    localStorage.setItem("rc.track-editor.sections", JSON.stringify(sections));
  }

  static toggleSection(
    sections: TrackEditorSections,
    section: keyof TrackEditorSections,
    forcedState?: boolean,
  ): TrackEditorSections {
    const updated = {
      ...sections,
      [section]:
        typeof forcedState === "boolean" ? forcedState : !sections[section],
    };
    TrackEditorUiHelper.saveSections(updated);
    return updated;
  }

  static toggleAllSections(
    sections: TrackEditorSections,
    forcedState?: boolean,
  ): { nextState: boolean; sections: TrackEditorSections } {
    const areAllExpanded = Object.values(sections).every(Boolean);
    const nextState = forcedState !== undefined ? forcedState : !areAllExpanded;
    const updated: TrackEditorSections = {
      general: nextState,
      interfaces: nextState,
      lanes: nextState,
    };
    TrackEditorUiHelper.saveSections(updated);
    return { nextState, sections: updated };
  }
}
