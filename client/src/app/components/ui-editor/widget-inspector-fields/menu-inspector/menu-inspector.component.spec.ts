import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { DEFAULT_FONTS, FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";

import { MenuInspectorComponent } from "./menu-inspector.component";

describe("MenuInspectorComponent", () => {
  let component: MenuInspectorComponent;
  let fixture: ComponentFixture<MenuInspectorComponent>;

  beforeEach(async () => {
    const mockTranslationService = {
      translations$: new BehaviorSubject<{ [key: string]: string }>({}),
      translate: (key: string) => key,
    };

    const mockFontService = {
      availableFonts: signal(DEFAULT_FONTS).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [MenuInspectorComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: FontService, useValue: mockFontService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuInspectorComponent);
    component = fixture.componentInstance;
    const mockWidget: AbsoluteWidgetNode = {
      id: "w1",
      type: "menu",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      textColor: "#ffffff",
      backgroundColor: "#000000",
    } as any;
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when onSettingsChange is called", () => {
    spyOn(component.change, "emit");
    component.onSettingsChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    spyOn(component.change, "emit");
    const mockEvent = { target: { value: "#ff0000" } } as unknown as Event;
    component.onColorChange("textColor", mockEvent);
    expect(component.widget().textColor).toBe("#ff0000");
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should reset color on resetColor", () => {
    spyOn(component.change, "emit");
    component.resetColor("backgroundColor");
    expect(component.widget().backgroundColor).toBe("");
    expect(component.change.emit).toHaveBeenCalled();
  });
});
