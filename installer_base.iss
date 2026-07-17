; Race Coordinator AI Common Installer Definitions
; This file is included by installer_offline.iss and installer_online.iss

#define MyAppName "Race Coordinator AI"
#define MyAppVersion "0.0.0_dev"
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
SetupIconFile=client\src\favicon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Server JAR
Source: "release\RaceCoordinator\RaceCoordinator.jar"; DestDir: "{app}"; Flags: ignoreversion
; Scripts
Source: "release\RaceCoordinator\start_win.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\RaceCoordinator\start_win.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\RaceCoordinator\setup_windows.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\RaceCoordinator\install_dependencies.ps1"; DestDir: "{app}"; Flags: ignoreversion
; Web Client Files
Source: "release\RaceCoordinator\web\*"; DestDir: "{app}\server\web"; Flags: ignoreversion recursesubdirs createallsubdirs
; Arduino Resources
Source: "release\RaceCoordinator\arduino\*"; DestDir: "{app}\arduino"; Flags: ignoreversion recursesubdirs createallsubdirs
; VC++ Redistributables
Source: "release\RaceCoordinator\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: ignoreversion skipifsourcedoesntexist; Check: IsWindows10OrNewer
Source: "release\RaceCoordinator\vcredist_x86.exe"; DestDir: "{tmp}"; Flags: ignoreversion skipifsourcedoesntexist; Check: not IsWindows10OrNewer

[Icons]
; Desktop Icons
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\start_win.vbs"; \
    IconFilename: "{app}\server\web\favicon.ico"; WorkingDir: "{app}"

; Start Menu Icons
Name: "{group}\{#MyAppName}"; Filename: "{app}\start_win.vbs"; \
    IconFilename: "{app}\server\web\favicon.ico"; WorkingDir: "{app}"

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

[Run]
; Install VC++ Redistributable before launching
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; Check: NeedsVCRedist64; StatusMsg: "Installing Visual C++ Redistributable..."; Flags: waituntilterminated skipifdoesntexist
Filename: "{tmp}\vcredist_x86.exe"; Parameters: "/install /quiet /norestart"; Check: NeedsVCRedist86; StatusMsg: "Installing Visual C++ 2013 Redistributable..."; Flags: waituntilterminated skipifdoesntexist

; Server
Filename: "{app}\start_win.vbs"; WorkingDir: "{app}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent 64bit shellexec; Check: not IsRestartAppRequested
Filename: "{app}\start_win.vbs"; Parameters: "--headless"; WorkingDir: "{app}"; Flags: nowait 64bit shellexec; Check: IsRestartAppRequested

[Code]
function KillProcesses: Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  // Kill java and mongod processes that might be using our ports or files.
  // We use PowerShell to specifically target processes using our known ports (7070, 8085, 27017)
  // as well as a fallback by name for our specific JAR.
  Log('Attempting to kill existing Race Coordinator processes...');
  
  // 1. Kill by port (most reliable for clearing locks)
  Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 7070, 8085, 27017 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  
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

function IsVCRedist64Installed: Boolean;
begin
  Result := RegKeyExists(HKLM, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64');
  if (not Result) and IsWin64 then
    Result := RegKeyExists(HKLM64, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64');
end;

function IsVCRedist86Installed: Boolean;
begin
  Result := RegKeyExists(HKLM, 'SOFTWARE\Microsoft\VisualStudio\12.0\VC\Runtimes\x86');
  if (not Result) and IsWin64 then
    Result := RegKeyExists(HKLM64, 'SOFTWARE\Microsoft\VisualStudio\12.0\VC\Runtimes\x86');
end;

function NeedsVCRedist64: Boolean;
begin
  if not IsWindows10OrNewer then
    Result := False
  else
    Result := not IsVCRedist64Installed;
end;

function NeedsVCRedist86: Boolean;
begin
  if IsWindows10OrNewer then
    Result := False
  else
    Result := not IsVCRedist86Installed;
end;

function IsRestartAppRequested: Boolean;
var
  i: Integer;
begin
  Result := False;
  for i := 1 to ParamCount do
  begin
    if CompareText(ParamStr(i), '/RESTARTAPP') = 0 then
    begin
      Result := True;
      Exit;
    end;
  end;
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

function GetRequiredJavaVersion(IsModernOS: Boolean): String;
begin
  if IsModernOS then Result := '17' else Result := '8';
end;

function GetRequiredMongoVersion(IsModernOS: Boolean): String;
begin
  if IsModernOS then Result := '6.0.21' else Result := '3.2.22';
end;

function IsJavaInstalled(IsModernOS: Boolean): Boolean;
var
  VersionFile: String;
  InstalledVersion: AnsiString;
begin
  VersionFile := ExpandConstant('{app}\jre\.rcai_version');
  if FileExists(VersionFile) then
  begin
    LoadStringFromFile(VersionFile, InstalledVersion);
    if Trim(String(InstalledVersion)) = GetRequiredJavaVersion(IsModernOS) then
    begin
      // Ensure the installation is not corrupt (must have bin\java.exe and bin\management.dll)
      if FileExists(ExpandConstant('{app}\jre\bin\java.exe')) and FileExists(ExpandConstant('{app}\jre\bin\management.dll')) then
      begin
        Result := True;
        Exit;
      end;
    end;
  end;

  if IsModernOS then
  begin
    Result := RegKeyExists(HKLM, 'SOFTWARE\Eclipse Foundation\JDK\17\jre') or 
              RegKeyExists(HKLM, 'SOFTWARE\JavaSoft\JDK\17');
    if (not Result) and IsWin64 then
      Result := RegKeyExists(HKLM64, 'SOFTWARE\Eclipse Foundation\JDK\17\jre') or 
                RegKeyExists(HKLM64, 'SOFTWARE\JavaSoft\JDK\17');
  end
  else
  begin
    Result := RegKeyExists(HKLM, 'SOFTWARE\JavaSoft\Java Runtime Environment\1.8');
    if (not Result) and IsWin64 then
      Result := RegKeyExists(HKLM64, 'SOFTWARE\JavaSoft\Java Runtime Environment\1.8');
  end;
end;

function IsMongoInstalled(IsModernOS: Boolean): Boolean;
var
  VersionFile: String;
  InstalledVersion: AnsiString;
begin
  VersionFile := ExpandConstant('{app}\mongodb\.rcai_version');
  if FileExists(VersionFile) then
  begin
    LoadStringFromFile(VersionFile, InstalledVersion);
    if Trim(String(InstalledVersion)) = GetRequiredMongoVersion(IsModernOS) then
    begin
      Result := True;
      Exit;
    end;
  end;

  if IsModernOS then
  begin
    Result := RegKeyExists(HKLM, 'SOFTWARE\MongoDB\Server\6.0');
    if (not Result) and IsWin64 then
      Result := RegKeyExists(HKLM64, 'SOFTWARE\MongoDB\Server\6.0');
  end
  else
  begin
    Result := RegKeyExists(HKLM, 'SOFTWARE\MongoDB\Server\3.2');
    if (not Result) and IsWin64 then
      Result := RegKeyExists(HKLM64, 'SOFTWARE\MongoDB\Server\3.2');
  end;
end;

function NeedsModernJava: Boolean;
begin
  Result := IsWindows10OrNewer() and not IsJavaInstalled(True);
end;

function NeedsModernMongo: Boolean;
begin
  Result := IsWindows10OrNewer() and not IsMongoInstalled(True);
end;

function NeedsLegacyJava: Boolean;
begin
  Result := (not IsWindows10OrNewer()) and not IsJavaInstalled(False);
end;

function NeedsLegacyMongo: Boolean;
begin
  Result := (not IsWindows10OrNewer()) and not IsMongoInstalled(False);
end;

