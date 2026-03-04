; Race Coordinator AI Offline Installer Script
; Bundles modern dependencies (JRE 17, MongoDB 4.4)

#include "installer_base.iss"

[Setup]
OutputBaseFilename=RaceCoordinatorAI_Offline_Setup

[Files]
; JRE (JRE 17 for Windows 10 and newer)
Source: "release\RaceCoordinator\jre17\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; MongoDB (MongoDB 4.4 for Windows 10 and newer)
Source: "release\RaceCoordinator\mongodb44\*"; DestDir: "{app}\mongodb"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
