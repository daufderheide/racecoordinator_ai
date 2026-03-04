; Race Coordinator AI Common Installer Definitions
; This file is included by installer_offline.iss and installer_min.iss

#define MyAppName "Race Coordinator AI"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Antigravity"
#define MyAppURL "http://localhost:7070"
#define MyAppExeName "RaceCoordinator.jar"

[Setup]
AppId={{C6F6F6F6-E6E6-4E4E-A7A7-9D9D9D9D9D9D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Server JAR
Source: "release\RaceCoordinator\RaceCoordinator.jar"; DestDir: "{app}"; Flags: ignoreversion
; Web Client Files
Source: "release\RaceCoordinator\web\*"; DestDir: "{app}\web"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Headless Server Shortcut
; Unified shortcut - assumes appropriate JRE is installed to {app}\jre
Name: "{autodesktop}\Race Coordinator Server (Headless)"; Filename: "{app}\jre\bin\java.exe"; \
    Parameters: "-Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"" --headless"; \
    IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"

; Client Shortcut (opens browser)
Name: "{autodesktop}\Race Coordinator Client"; Filename: "cmd.exe"; \
    Parameters: "/c start {#MyAppURL}"; IconFilename: "{app}\web\favicon.ico"

[Dirs]
; Writable data directory in ProgramData
Name: "{commonappdata}\{#MyAppName}"; Permissions: users-full
Name: "{commonappdata}\{#MyAppName}\mongodb_data"; Permissions: users-full
Name: "{commonappdata}\{#MyAppName}\server_temp"; Permissions: users-full
Name: "{app}\mongodb"; Permissions: users-full

[Code]
function IsWindows10OrNewer: Boolean;
var
  Version: TWindowsVersion;
begin
  GetWindowsVersionEx(Version);
  // Windows 10 is version 10.0
  Result := (Version.Major >= 10);
end;
