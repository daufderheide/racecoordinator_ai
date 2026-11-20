import type { CustomWidgetManifest } from "@app/models/custom-widget.model";
import type { TranslationService } from "@app/services/translation.service";

export type WidgetNameTranslations = Pick<
  TranslationService,
  "findTranslation"
>;

export function resolveCustomWidgetName(
  widgetType: string | undefined,
  manifest: CustomWidgetManifest | undefined,
  translations?: WidgetNameTranslations | null,
): string {
  const key = manifest?.nameKey || manifest?.name;
  const localizedName = key && translations?.findTranslation?.(key);
  return (
    localizedName || manifest?.name || widgetType?.replace(/^custom:/, "") || ""
  );
}
