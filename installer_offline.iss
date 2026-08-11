; Race Coordinator AI Offline Installer Script
; Bundles modern and legacy JRE dependencies (JRE 8/17)
; Only installs the version appropriate for the current OS

#include "installer_base.iss"

[Setup]
OutputBaseFilename=RaceCoordinatorAI_Offline_Setup

[Files]
; Modern OS (Win10+)
Source: "release\RaceCoordinator\jre17\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Check: NeedsModernJava

; Legacy OS
Source: "release\RaceCoordinator\jre8\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Check: NeedsLegacyJava

[Code]

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if DirExists(ExpandConstant('{app}\jre')) then
      SaveStringToFile(ExpandConstant('{app}\jre\.rcai_version'), GetRequiredJavaVersion(IsWindows10OrNewer()), False);
  end;
end;
