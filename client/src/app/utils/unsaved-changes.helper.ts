import { TranslationService } from "@app/services/translation.service";

/**
 * Formats a user-friendly unsaved changes discard message with bulleted reasons.
 *
 * If no reasons are provided, falls back to the default UE_CONFIRM_DISCARD_MESSAGE.
 */
export function formatUnsavedChangesMessage(
  translationService: TranslationService,
  reasonKeys: string[],
): string {
  if (!reasonKeys || reasonKeys.length === 0) {
    return translationService.translate("UE_CONFIRM_DISCARD_MESSAGE");
  }

  const header = translationService.translate("DISCARD_REASONS_HEADER");
  const prompt = translationService.translate("DISCARD_CONFIRM_PROMPT");
  const reasonsList = reasonKeys
    .map((key) => `• ${translationService.translate(key)}`)
    .join("\n");

  return `${header}\n${reasonsList}\n\n${prompt}`;
}
