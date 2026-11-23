import {
  InspectorFolder,
  InspectorOption,
  TextPartField,
} from "./inspector-schema";

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
    if (settings["shadow"] === "soft" || settings["shadow"] === "raised") {
      parts.push(
        `${t(settings["shadow"] === "soft" ? "UE_KIT_SHADOW_SOFT" : "UE_KIT_SHADOW_RAISED")} ${t("UE_KIT_SHADOW").toLowerCase()}`,
      );
    }
    return parts.join(" · ");
  }

  if (folder.id === "layout" && widget) {
    // positions can be fractions after scaling; the summary shows whole pixels
    const r = (v: any) => Math.round(Number(v) || 0);
    const where = `${r(widget.x)}, ${r(widget.y)} · ${r(widget.width)} × ${r(widget.height)}`;
    return settings["locked"] === true
      ? `${where} · ${t("UE_KIT_LOCKED")}`
      : where;
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
    const chosen =
      f.type === "segment" || f.type === "select"
        ? f.read
          ? f.read(settings)
          : settings[f.key]
        : undefined;
    if (chosen !== undefined && chosen !== null) {
      // 2 and "2" are the same choice (older inspectors stored text)
      const opt = (f as { options: InspectorOption[] }).options.find(
        (o) => String(o.value) === String(chosen),
      );
      if (opt)
        parts.push(
          opt.labelKey ? t(opt.labelKey) : (opt.label ?? String(opt.value)),
        );
    } else if (f.type === "text" && settings[f.key]) {
      const text = String(settings[f.key]);
      parts.push(`"${text.length > 24 ? text.slice(0, 23) + "…" : text}"`);
    } else if (f.type === "image" && settings[f.key]) {
      const name = String(settings[f.key]).split(/[\\/]/).pop() || "";
      parts.push(name.length > 28 ? name.slice(0, 27) + "…" : name);
    }
  }
  return parts.join(" · ");
}
