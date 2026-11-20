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
});
