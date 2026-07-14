; Race Coordinator AI Offline Installer Script
; Bundles modern and legacy dependencies (JRE 8/17, MongoDB 3.2/6.0)
; Only installs the version appropriate for the current OS

#include "installer_base.iss"

[Setup]
OutputBaseFilename=RaceCoordinatorAI_Offline_Setup

[Files]
; Modern OS (Win10+)
Source: "release\RaceCoordinator\jre17\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Check: NeedsModernJava
Source: "release\RaceCoordinator\mongodb60\*"; DestDir: "{app}\mongodb"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Check: NeedsModernMongo

; Legacy OS
Source: "release\RaceCoordinator\jre8\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Check: NeedsLegacyJava
Source: "release\RaceCoordinator\mongodb32\*"; DestDir: "{app}\mongodb"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Check: NeedsLegacyMongo

[Code]

procedure CurStepChanged(CurStep: TSetupStep);
var
  MongoSource, MongoDest: String;
begin
  if CurStep = ssInstall then
  begin
    MongoSource := ExpandConstant('{app}\mongodb\bin\mongod.exe');
    MongoDest := ExpandConstant('{commonappdata}\{#MyAppName}\migration_tools\mongod_legacy.exe');
    
    if FileExists(MongoSource) then
    begin
      if not DirExists(ExpandConstant('{commonappdata}\{#MyAppName}\migration_tools')) then
        ForceDirectories(ExpandConstant('{commonappdata}\{#MyAppName}\migration_tools'));
        
      Log('Backing up legacy MongoDB executable for potential migration...');
      FileCopy(MongoSource, MongoDest, False);
    end;
  end;

  if CurStep = ssPostInstall then
  begin
    if DirExists(ExpandConstant('{app}\jre')) then
      SaveStringToFile(ExpandConstant('{app}\jre\.rcai_version'), GetRequiredJavaVersion(IsWindows10OrNewer()), False);

    if DirExists(ExpandConstant('{app}\mongodb')) then
      SaveStringToFile(ExpandConstant('{app}\mongodb\.rcai_version'), GetRequiredMongoVersion(IsWindows10OrNewer()), False);
  end;
end;
