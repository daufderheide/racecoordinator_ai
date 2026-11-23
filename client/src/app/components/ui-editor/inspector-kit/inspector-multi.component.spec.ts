import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InspectorMultiComponent } from "./inspector-multi.component";

describe("InspectorMultiComponent", () => {
  let fixture: ComponentFixture<InspectorMultiComponent>;
  const q = (sel: string) =>
    fixture.nativeElement.querySelector(sel) as HTMLElement | null;

  beforeEach(() => {
    fixture = TestBed.createComponent(InspectorMultiComponent);
    fixture.componentRef.setInput("items", [
      { id: "a", name: "Timer", icon: "timer" },
      { id: "b", name: "Label", icon: "label", locked: true },
    ]);
    fixture.componentRef.setInput("mainId", "a");
    fixture.detectChanges();
  });

  it("lists the selected widgets, marks the main one and locked ones", () => {
    const rows = fixture.nativeElement.querySelectorAll(".kit-multi-row");
    expect(rows.length).toBe(2);
    expect(rows[0].classList).toContain("is-main");
    expect(rows[1].classList).not.toContain("is-main");
    expect(rows[1].querySelector(".kit-multi-lock")).not.toBeNull();
    expect(q("#kit-multi-count")).not.toBeNull();
  });

  it("makes a row main, removes a row, keeps only the main", () => {
    const made: string[] = [];
    const removed: string[] = [];
    let kept = 0;
    fixture.componentInstance.makeMain.subscribe((id) => made.push(id));
    fixture.componentInstance.remove.subscribe((id) => removed.push(id));
    fixture.componentInstance.keepMain.subscribe(() => kept++);

    (q('[data-id="b"] .kit-multi-name') as HTMLButtonElement).click();
    (q('[data-remove="a"]') as HTMLButtonElement).click();
    (q("#kit-multi-keep-main") as HTMLButtonElement).click();
    expect(made).toEqual(["b"]);
    expect(removed).toEqual(["a"]);
    expect(kept).toBe(1);
  });

  it("asks to delete all selected widgets from the header button", () => {
    let asked = 0;
    fixture.componentInstance.deleteAll.subscribe(() => asked++);
    (q("#kit-multi-delete") as HTMLButtonElement).click();
    expect(asked).toBe(1);
  });

  it("has align, distribute and same-size tools (phase 4c-3)", () => {
    const actions: string[] = [];
    fixture.componentInstance.arrange.subscribe((a) => actions.push(a));
    const tools = fixture.nativeElement.querySelectorAll("[data-arrange]");
    expect(tools.length).toBe(10);
    (q('[data-arrange="left"]') as HTMLButtonElement).click();
    (q('[data-arrange="sameHeight"]') as HTMLButtonElement).click();
    expect(actions).toEqual(["left", "sameHeight"]);
    // distributing needs 3: greyed out with 2
    expect(
      (q('[data-arrange="distributeX"]') as HTMLButtonElement).disabled,
    ).toBeTrue();
    expect(
      (q('[data-arrange="top"]') as HTMLButtonElement).disabled,
    ).toBeFalse();
    // one of the two is locked: the note says so
    expect(q("#kit-multi-locked-note")).not.toBeNull();
  });

  it("enables distributing with 3 and hides the note without locked widgets", () => {
    fixture.componentRef.setInput("items", [
      { id: "a", name: "A", icon: "timer" },
      { id: "b", name: "B", icon: "timer" },
      { id: "c", name: "C", icon: "timer" },
    ]);
    fixture.detectChanges();
    expect(
      (q('[data-arrange="distributeY"]') as HTMLButtonElement).disabled,
    ).toBeFalse();
    expect(q("#kit-multi-locked-note")).toBeNull();
  });

  it("copies style from the main widget and pastes on all (phase 5a)", () => {
    const events: string[] = [];
    fixture.componentInstance.copyStyle.subscribe(() => events.push("copy"));
    fixture.componentInstance.pasteStyle.subscribe(() => events.push("paste"));
    const paste = q("#kit-paste-style") as HTMLButtonElement;
    expect(paste.disabled).toBeTrue();
    fixture.componentRef.setInput("canPasteStyle", true);
    fixture.detectChanges();
    expect(paste.disabled).toBeFalse();
    expect(paste.classList).toContain("kit-has-dot");
    (q("#kit-copy-style") as HTMLButtonElement).click();
    paste.click();
    expect(events).toEqual(["copy", "paste"]);
  });

  it("offers duplicate only when something can be duplicated (phase 5c)", () => {
    expect(q("#kit-duplicate")).toBeNull();
    fixture.componentRef.setInput("canDuplicate", true);
    fixture.detectChanges();
    let asked = 0;
    fixture.componentInstance.duplicate.subscribe(() => asked++);
    (q("#kit-duplicate") as HTMLButtonElement).click();
    expect(asked).toBe(1);
  });
});
