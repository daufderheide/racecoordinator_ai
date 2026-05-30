; Race Coordinator AI Offline Legacy Installer Script
; Bundles legacy dependencies (JRE 8, MongoDB 3.2)
; Only installs the version appropriate for the current OS

#include "installer_base.iss"

[Setup]
OutputBaseFilename=RaceCoordinatorAI_Offline_Legacy_Setup

[Files]
; JRE (JRE 8 for legacy Windows)
Source: "release\RaceCoordinator\jre8\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; MongoDB (MongoDB 3.2 for legacy Windows)
Source: "release\RaceCoordinator\mongodb32\*"; DestDir: "{app}\mongodb"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
