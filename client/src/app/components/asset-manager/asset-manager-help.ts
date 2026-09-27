import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

function getManagementHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    {
      title: translationService.translate("AM_HELP_WELCOME_TITLE"),
      content: translationService.translate("AM_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    {
      selector: ".stats-content",
      title: translationService.translate("AM_HELP_STATS_TITLE"),
      content: translationService.translate("AM_HELP_STATS_CONTENT"),
      position: "right",
    },
    {
      selector: ".upload-zone",
      title: translationService.translate("AM_HELP_UPLOAD_TITLE"),
      content: translationService.translate("AM_HELP_UPLOAD_CONTENT"),
      position: "right",
    },
    {
      selector: ".btn-image-set",
      title: translationService.translate("AM_HELP_IMAGE_SET_TITLE"),
      content: translationService.translate("AM_HELP_IMAGE_SET_CONTENT"),
      position: "right",
    },
    {
      selector: ".btn-audio-set",
      title: translationService.translate("AM_HELP_AUDIO_SET_TITLE"),
      content: translationService.translate("AM_HELP_AUDIO_SET_CONTENT"),
      position: "right",
    },
    {
      selector: ".btn-custom-rotation",
      title: translationService.translate("AM_HELP_CUSTOM_ROTATION_TITLE"),
      content: translationService.translate("AM_HELP_CUSTOM_ROTATION_CONTENT"),
      position: "right",
    },
    {
      selector: ".library-panel",
      title: translationService.translate("AM_HELP_LIBRARY_TITLE"),
      content: translationService.translate("AM_HELP_LIBRARY_CONTENT"),
      position: "left",
    },
  ];
}

function getFilterHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    {
      selector: ".filter-all",
      title: translationService.translate("AM_HELP_FILTER_ALL_TITLE"),
      content: translationService.translate("AM_HELP_FILTER_ALL_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".filter-images",
      title: translationService.translate("AM_HELP_FILTER_IMAGES_TITLE"),
      content: translationService.translate("AM_HELP_FILTER_IMAGES_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".filter-image-sets",
      title: translationService.translate("AM_HELP_FILTER_IMAGE_SETS_TITLE"),
      content: translationService.translate(
        "AM_HELP_FILTER_IMAGE_SETS_CONTENT",
      ),
      position: "bottom",
    },
    {
      selector: ".filter-sounds",
      title: translationService.translate("AM_HELP_FILTER_SOUNDS_TITLE"),
      content: translationService.translate("AM_HELP_FILTER_SOUNDS_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".filter-audio-sets",
      title: translationService.translate("AM_HELP_FILTER_AUDIO_SETS_TITLE"),
      content: translationService.translate(
        "AM_HELP_FILTER_AUDIO_SETS_CONTENT",
      ),
      position: "bottom",
    },
    {
      selector: ".filter-custom-rotations",
      title: translationService.translate(
        "AM_HELP_FILTER_CUSTOM_ROTATIONS_TITLE",
      ),
      content: translationService.translate(
        "AM_HELP_FILTER_CUSTOM_ROTATIONS_CONTENT",
      ),
      position: "bottom",
    },
    {
      selector: "#asset-layout-switcher",
      title: translationService.translate("AM_HELP_LAYOUT_TITLE"),
      content: translationService.translate("AM_HELP_LAYOUT_CONTENT"),
      position: "bottom",
    },
    {
      selector: ".filter-input",
      title: translationService.translate("AM_HELP_FILTER_NAME_TITLE"),
      content: translationService.translate("AM_HELP_FILTER_NAME_CONTENT"),
      position: "bottom",
    },
  ];
}

export function getAssetManagerHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    ...getManagementHelpSteps(translationService),
    ...getFilterHelpSteps(translationService),
  ];
}
