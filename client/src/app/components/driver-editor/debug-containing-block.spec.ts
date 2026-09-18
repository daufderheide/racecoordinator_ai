import { test } from "@playwright/test";
test("debug containing block", async ({ page }) => {
  await page.goto("/driver-editor?id=d1");
  await page.locator(".page-container").waitFor();
  await page.locator(".loader-overlay").waitFor({ state: "hidden" });

  const blocks = await page.evaluate(() => {
    let el = document.querySelector("app-image-selector");
    let results = [];
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const isCB =
        style.transform !== "none" ||
        style.perspective !== "none" ||
        style.filter !== "none" ||
        (style.backdropFilter && style.backdropFilter !== "none") ||
        (style.contain && style.contain !== "none") ||
        (style.willChange !== "auto" && style.willChange.includes("transform"));
      if (isCB) {
        results.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          transform: style.transform,
          perspective: style.perspective,
          filter: style.filter,
          backdropFilter: style.backdropFilter,
          contain: style.contain,
          willChange: style.willChange,
        });
      }
      el = el.parentElement;
    }
    return results;
  });
  console.log("Containing blocks:", blocks);
});
