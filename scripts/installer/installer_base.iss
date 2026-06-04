; Race Coordinator AI Common Installer Definitions
; Included by installer_online.iss and installer_offline_legacy.iss

#define MyAppName "Race Coordinator AI"
#define MyAppVersion "0.0.0.21"
#define MyAppPublisher "Antigravity"
#define MyAppURL "http://localhost:7070"
#define MyAppExeName "RaceCoordinator.jar"

[Setup]
; This .iss lives in scripts\installer\; SourceDir rebases relative [Files]
; Source paths back to the repo root, and OutputDir keeps the built .exe at
; <repo>\Output\ instead of scripts\installer\Output\.
SourceDir=..\..
OutputDir=Output
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
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Server JAR
Source: "release\RaceCoordinator\RaceCoordinator.jar"; DestDir: "{app}"; Flags: ignoreversion
; Web Client Files
Source: "release\RaceCoordinator\web\*"; DestDir: "{app}\server\web"; Flags: ignoreversion recursesubdirs createallsubdirs
; Arduino Resources
Source: "release\RaceCoordinator\arduino\*"; DestDir: "{app}\arduino"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Desktop Icons
Name: "{autodesktop}\Race Coordinator Server (Headless)"; Filename: "{cmd}"; \
    Parameters: "/c ""if exist ""{app}\jre\bin\java.exe"" (""{app}\jre\bin\java.exe"" -Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"" --headless) else (java -Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"" --headless) || pause"""; \
    IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"

Name: "{autodesktop}\Race Coordinator Client"; Filename: "{cmd}"; \
    Parameters: "/c start {#MyAppURL}"; IconFilename: "{app}\server\web\favicon.ico"

; Start Menu Icons
Name: "{group}\Race Coordinator Server"; Filename: "{cmd}"; \
    Parameters: "/c ""if exist ""{app}\jre\bin\java.exe"" (""{app}\jre\bin\java.exe"" -Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"") else (java -Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"") || pause"""; \
    IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"

Name: "{group}\Race Coordinator Server (Headless)"; Filename: "{cmd}"; \
    Parameters: "/c ""if exist ""{app}\jre\bin\java.exe"" (""{app}\jre\bin\java.exe"" -Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"" --headless) else (java -Dapp.data.dir=""{commonappdata}\{#MyAppName}"" -jar ""{app}\{#MyAppExeName}"" --headless) || pause"""; \
    IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"

Name: "{group}\Race Coordinator Client"; Filename: "cmd.exe"; \
    Parameters: "/c start {#MyAppURL}"; IconFilename: "{app}\server\web\favicon.ico"

Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

[UninstallDelete]
Type: files; Name: "{app}\install_java.log"
Type: files; Name: "{app}\install_mongo.log"
Type: filesandordirs; Name: "{app}\jre"
Type: filesandordirs; Name: "{app}\mongodb"

[Dirs]
; Writable data directory in ProgramData
Name: "{commonappdata}\{#MyAppName}"; Permissions: users-full
Name: "{commonappdata}\{#MyAppName}\mongodb_data"; Permissions: users-full
Name: "{commonappdata}\{#MyAppName}\server_temp"; Permissions: users-full
Name: "{app}\mongodb"; Permissions: users-full

[Code]
function KillProcesses: Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  // Kill java and mongod processes that might be using our ports or files.
  // We use PowerShell to specifically target processes using our known ports (7070, 27017)
  // as well as a fallback by name for our specific JAR.
  Log('Attempting to kill existing Race Coordinator processes...');
  
  // 1. Kill by port (most reliable for clearing locks)
  Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 7070, 27017 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  
  // 2. Kill by name/command line (fallback)
  Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name java, mongod -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like ''*RaceCoordinator*'' -or $_.Name -eq ''mongod'' } | Stop-Process -Force -ErrorAction SilentlyContinue"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

function IsWindows10OrNewer: Boolean;
var
  Version: TWindowsVersion;
begin
  GetWindowsVersionEx(Version);
  // Windows 10 is version 10.0
  Result := (Version.Major >= 10);
end;

function InitializeSetup: Boolean;
begin
  KillProcesses;
  Result := True;
end;

function InitializeUninstall: Boolean;
begin
  KillProcesses;
  Result := True;
end;
