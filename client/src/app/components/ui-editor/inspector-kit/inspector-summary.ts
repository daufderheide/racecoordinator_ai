import { InspectorFolder, TextPartField } from "./inspector-schema";

/**
 * One line shown on a closed folder, so you can see what's set without
 * opening it. Built from the folder's own fields; never longer than a few parts.
 */
export function folderSummary(
  folder: InspectorFolder,
  settings: Record<string, any>,
  widget: any,
  t: (key: string) => string,
): string {
  const fields = folder.groups.flatMap((g) => g.fields);
  const parts: string[] = [];

  if (folder.id === "text") {
    for (const f of fields.filter(
      (x): x is TextPartField => x.type === "textPart",
    )) {
      const size = f.keys.size ? settings[f.keys.size] : undefined;
      parts.push(size ? `${t(f.labelKey)} ${size}` : t(f.labelKey));
    }
    return parts.join(" · ");
  }

  if (folder.id === "frame") {
    parts.push(
      settings["backgroundColor"]
        ? t("UE_KIT_SUMMARY_OWN_COLOR")
        : t("UE_KIT_SUMMARY_THEME_COLOR"),
    );
    if (settings["showBorder"] === false) {
      parts.push(t("UE_KIT_SUMMARY_NO_BORDER"));
    } else if (settings["borderWidth"] !== undefined) {
      parts.push(`${settings["borderWidth"]}px ${t("UE_KIT_SUMMARY_BORDER")}`);
    }
    if (settings["borderRadius"] !== undefined) {
      parts.push(
        `${settings["borderRadius"]}px ${t("UE_KIT_SUMMARY_CORNERS")}`,
      );
    }
    return parts.join(" · ");
  }

  if (folder.id === "layout" && widget) {
    return `${widget.x ?? 0}, ${widget.y ?? 0} · ${widget.width ?? 0} × ${widget.height ?? 0}`;
  }

  // Content / behaviour: how many switches are on, plus the first choices.
  const switches = fields.filter((f) => f.type === "switch");
  if (switches.length) {
    const on = switches.filter(
      (f) => "key" in f && settings[f.key] !== false,
    ).length;
    parts.push(`${on}/${switches.length} ${t("UE_KIT_SUMMARY_ON")}`);
  }
  for (const f of fields) {
    if (parts.length >= 3) break;
    if (
      (f.type === "segment" || f.type === "select") &&
      settings[f.key] !== undefined
    ) {
      const opt = f.options.find((o) => o.value === settings[f.key]);
      if (opt)
        parts.push(
          opt.labelKey ? t(opt.labelKey) : (opt.label ?? String(opt.value)),
        );
    }
  }
  return parts.join(" · ");
}
