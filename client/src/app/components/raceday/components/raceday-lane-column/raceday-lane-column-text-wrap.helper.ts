export function isNameOrTeamProperty(property?: string): boolean {
  if (!property) return false;
  const baseKey = property.split("_")[0];
  return (
    baseKey === "driver.name" ||
    baseKey === "driver.nickname" ||
    baseKey === "participant.team.name" ||
    baseKey === "team.name" ||
    baseKey === "name" ||
    baseKey === "nickname" ||
    baseKey === "team"
  );
}

export function isNumericalOrTimeText(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  return (
    /^[+-]?\d+(?:[.:]\d+)*(?:\s*(?:s|ms|kph|mph|%|laps?))?$/i.test(clean) ||
    /^--(?:\.--+)?$/.test(clean) ||
    /^(?:DNS|DNF|DQ|DSQ)$/i.test(clean)
  );
}

export function checkWordsWrapFit(
  ctx: CanvasRenderingContext2D,
  words: string[],
  testSize: number,
  availWidth: number,
  availHeight: number,
  family: string,
): boolean {
  if (testSize <= 0) return false;
  const lineHeight = Math.ceil(testSize * 1.15);
  const maxLines = Math.floor(availHeight / lineHeight);
  if (maxLines < 2) return false;

  ctx.font = `700 ${testSize}px ${family}`;
  let linesCount = 1;
  let currentLineWidth = 0;

  for (const word of words) {
    const wordW = ctx.measureText(word).width;
    if (wordW > availWidth) {
      return false;
    }
    const spaceW = currentLineWidth > 0 ? ctx.measureText(" ").width : 0;
    if (currentLineWidth + spaceW + wordW <= availWidth) {
      currentLineWidth += spaceW + wordW;
    } else {
      linesCount++;
      currentLineWidth = wordW;
      if (linesCount > maxLines) {
        return false;
      }
    }
  }

  return linesCount <= maxLines;
}

export function findBestWrapFontSize(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxSize: number,
  minSize: number,
  availWidth: number,
  availHeight: number,
  family: string,
): number {
  for (let testSize = maxSize; testSize >= minSize; testSize--) {
    if (
      checkWordsWrapFit(ctx, words, testSize, availWidth, availHeight, family)
    ) {
      return testSize;
    }
  }
  return 0;
}

export function computeBestWrapTextFontSize(
  ctx: CanvasRenderingContext2D,
  words: string[],
  baseFontSize: number,
  singleLineSize: number,
  availWidth: number,
  availHeight: number,
  family: string,
): number {
  for (let testSize = baseFontSize; testSize > singleLineSize; testSize--) {
    if (
      checkWordsWrapFit(ctx, words, testSize, availWidth, availHeight, family)
    ) {
      return testSize;
    }
  }
  return 0;
}

export function computeSingleLineTextScale(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseFontSize: number,
  availWidth: number,
  availHeight: number,
  computedFamily: string,
  minSize: number = 10,
): number {
  ctx.font = `700 ${baseFontSize}px ${computedFamily}`;
  const textWidth = ctx.measureText(text).width || 1;

  let scale = 1;
  if (availWidth > 0 && textWidth > availWidth) {
    scale = Math.min(scale, availWidth / textWidth);
  }
  if (availHeight > 0 && baseFontSize > availHeight) {
    scale = Math.min(scale, availHeight / baseFontSize);
  }

  return Math.max(minSize, Math.floor(baseFontSize * scale));
}

export function applyValueWrapStyles(
  cardEl: HTMLElement,
  isWrapped: boolean,
  allowWrap: boolean,
): void {
  const textEl = cardEl.querySelector(".lane-col-text") as HTMLElement | null;
  const valueEl = cardEl.querySelector(".lane-col-value") as HTMLElement | null;

  if (isWrapped) {
    if (textEl) {
      textEl.style.whiteSpace = "normal";
      textEl.style.wordBreak = "break-word";
      textEl.style.overflowWrap = "break-word";
      textEl.style.lineHeight = "1.15";
      textEl.style.textOverflow = "clip";
    }
    if (valueEl) {
      valueEl.style.whiteSpace = "normal";
      valueEl.style.lineHeight = "1.15";
    }
  } else {
    if (textEl) {
      textEl.style.whiteSpace = "nowrap";
      textEl.style.wordBreak = "";
      textEl.style.overflowWrap = "";
      textEl.style.lineHeight = "";
      textEl.style.textOverflow = allowWrap ? "ellipsis" : "clip";
    }
    if (valueEl) {
      valueEl.style.whiteSpace = "nowrap";
      valueEl.style.lineHeight = "";
    }
  }
}
