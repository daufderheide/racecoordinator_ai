import { BehaviorSubject } from "rxjs";
import { ConnectionState } from "@app/services/connection-monitor.service";

import { TrackEditorUiHelper } from "./track-editor-ui.helper";

describe("TrackEditorUiHelper", () => {
  describe("calculateScale", () => {
    it("should calculate minimum aspect ratio scale", () => {
      expect(TrackEditorUiHelper.calculateScale(1600, 900)).toBe(1);
      expect(TrackEditorUiHelper.calculateScale(800, 450)).toBe(0.5);
      expect(TrackEditorUiHelper.calculateScale(3200, 900)).toBe(1);
    });
  });

  describe("handleKeyboardEvent", () => {
    let undoSpy: jasmine.Spy;
    let redoSpy: jasmine.Spy;

    beforeEach(() => {
      undoSpy = jasmine.createSpy("undo");
      redoSpy = jasmine.createSpy("redo");
    });

    it("should do nothing if isEditMode is false", () => {
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
      TrackEditorUiHelper.handleKeyboardEvent(event, false, undoSpy, redoSpy);
      expect(undoSpy).not.toHaveBeenCalled();
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it("should trigger undo on ctrl+z", () => {
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
      spyOn(event, "preventDefault");
      TrackEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(undoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger redo on ctrl+shift+z", () => {
      const event = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
      });
      spyOn(event, "preventDefault");
      TrackEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(redoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger redo on ctrl+y", () => {
      const event = new KeyboardEvent("keydown", { key: "y", ctrlKey: true });
      spyOn(event, "preventDefault");
      TrackEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(redoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("sections storage and toggling", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should return defaults when nothing in localStorage", () => {
      const sections = TrackEditorUiHelper.loadSavedSections();
      expect(sections).toEqual({
        general: true,
        interfaces: true,
        lanes: true,
      });
    });

    it("should toggle specific section and persist", () => {
      const initial = { general: true, interfaces: true, lanes: true };
      const toggled = TrackEditorUiHelper.toggleSection(initial, "lanes");
      expect(toggled.lanes).toBeFalse();
      expect(localStorage.getItem("rc.track-editor.sections")).toContain(
        '"lanes":false',
      );
    });

    it("should toggle all sections", () => {
      const initial = { general: true, interfaces: true, lanes: true };
      const res = TrackEditorUiHelper.toggleAllSections(initial);
      expect(res.nextState).toBeFalse();
      expect(res.sections.general).toBeFalse();
      expect(res.sections.lanes).toBeFalse();
      expect(res.sections.interfaces).toBeFalse();
    });
  });

  describe("focusNameInput", () => {
    it("should focus element if present", (done) => {
      const input = document.createElement("input");
      input.id = "test-track-name-input";
      document.body.appendChild(input);
      spyOn(input, "focus");
      spyOn(input, "select");

      TrackEditorUiHelper.focusNameInput("test-track-name-input");
      setTimeout(() => {
        expect(input.focus).toHaveBeenCalled();
        expect(input.select).toHaveBeenCalled();
        document.body.removeChild(input);
        done();
      }, 10);
    });

    it("should handle missing element safely", (done) => {
      expect(() => {
        TrackEditorUiHelper.focusNameInput("non-existent-input");
      }).not.toThrow();
      setTimeout(done, 10);
    });
  });

  describe("navigation", () => {
    let mockRouter: any;
    let mockRoute: any;

    beforeEach(() => {
      mockRouter = {
        navigate: jasmine.createSpy("navigate"),
        navigateByUrl: jasmine.createSpy("navigateByUrl"),
      };
      mockRoute = {
        snapshot: {
          queryParamMap: {
            get: jasmine.createSpy("get").and.returnValue(null),
          },
        },
      };
    });

    it("should navigate to returnUrl if present", () => {
      mockRoute.snapshot.queryParamMap.get.and.callFake((key: string) =>
        key === "returnUrl" ? "/custom-return" : null,
      );
      TrackEditorUiHelper.navigateBack(mockRouter, mockRoute);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/custom-return");
    });

    it("should navigate to default-raceday if from=modify-heats", () => {
      mockRoute.snapshot.queryParamMap.get.and.callFake((key: string) =>
        key === "from" ? "modify-heats" : null,
      );
      TrackEditorUiHelper.navigateBack(mockRouter, mockRoute);
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/default-raceday"], {
        queryParams: { modifyHeats: "true" },
      });
    });

    it("should navigate to /raceday-setup by default", () => {
      TrackEditorUiHelper.navigateBack(mockRouter, mockRoute);
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });

    it("should navigateToTrack with proper params", () => {
      const mockNavService = {
        setLastEditedId: jasmine.createSpy("setLastEditedId"),
      };
      TrackEditorUiHelper.navigateToTrack(
        mockRouter,
        mockRoute,
        mockNavService as any,
        "track-123",
      );
      expect(mockNavService.setLastEditedId).toHaveBeenCalledWith(
        "track",
        "track-123",
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: mockRoute,
        queryParams: { id: "track-123" },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    });
  });

  describe("connection monitoring and loss", () => {
    it("should trigger callback when connection is lost", () => {
      const connectionSubject = new BehaviorSubject<ConnectionState>(
        ConnectionState.CONNECTED,
      );
      const mockMonitor = {
        connectionState$: connectionSubject.asObservable(),
      } as any;
      let lost = false;
      const sub = TrackEditorUiHelper.monitorConnection(
        mockMonitor,
        (isLost) => {
          lost = isLost;
        },
      );

      expect(lost).toBeFalse();
      connectionSubject.next(ConnectionState.DISCONNECTED);
      expect(lost).toBeTrue();
      sub.unsubscribe();
    });

    it("should handleConnectionLoss interval and timeout", (done) => {
      let isLost = true;
      const onTimeout = jasmine.createSpy("onTimeout");
      const intervalId = TrackEditorUiHelper.handleConnectionLoss(
        () => isLost,
        onTimeout,
        50,
        10,
      );

      setTimeout(() => {
        clearInterval(intervalId);
        expect(onTimeout).toHaveBeenCalled();
        done();
      }, 80);
    });

    it("should abort handleConnectionLoss if connection restored", (done) => {
      let isLost = true;
      const onTimeout = jasmine.createSpy("onTimeout");
      const intervalId = TrackEditorUiHelper.handleConnectionLoss(
        () => isLost,
        onTimeout,
        50,
        10,
      );

      // restore connection quickly
      setTimeout(() => {
        isLost = false;
      }, 20);

      setTimeout(() => {
        clearInterval(intervalId);
        expect(onTimeout).not.toHaveBeenCalled();
        done();
      }, 80);
    });
  });

  describe("confirmLedStringDialog", () => {
    it("should call addLedString on target editor when valid index", () => {
      const editor = { addLedString: jasmine.createSpy("addLedString") };
      const res = TrackEditorUiHelper.confirmLedStringDialog(0, 10, [editor]);
      expect(res).toBeTrue();
      expect(editor.addLedString).toHaveBeenCalledWith(10);
    });

    it("should return false for invalid index", () => {
      const res = TrackEditorUiHelper.confirmLedStringDialog(-1, 10, []);
      expect(res).toBeFalse();
    });
  });
});
