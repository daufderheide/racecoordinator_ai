import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

import { RaceEditorFuelHelpHelper } from "./race-editor-fuel-help.helper";
import { RaceEditorGeneralHelpHelper } from "./race-editor-general-help.helper";

export class RaceEditorHelpHelper {
  static getHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorGeneralHelpHelper.getGeneralHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getHeatsHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getScoringHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getGroupsHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getStartMethodHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getTeamOptionsHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorFuelHelpHelper.getAnalogFuelHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorFuelHelpHelper.getDigitalFuelHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getSeasonPointsHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
}
