; Race Coordinator AI Online Installer Script
; Downloads dependencies (Java 17/Mongo 6 for Win10+, Java 8/Mongo 3.2 for Legacy) during installation

#include "installer_base.iss"

[Setup]
OutputBaseFilename=RaceCoordinatorAI_Online_Setup

[Code]
var
  DownloadPage: TDownloadWizardPage;



procedure ExtractZip(const ZipFile, DestDir, StatusMsg: String);
var
  ResultCode: Integer;
  PSCommand: String;
begin
  WizardForm.StatusLabel.Caption := StatusMsg;
  WizardForm.ProgressGauge.Style := npbstMarquee;
  try
    if not DirExists(DestDir) then
      ForceDirectories(DestDir);
      
    // PowerShell command for extraction
    PSCommand := Format('-NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path ''%s'' -DestinationPath ''%s'' -Force"', [ZipFile, DestDir]);
    Log('Running PowerShell: ' + PSCommand);
    
    if Exec('powershell.exe', PSCommand, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
    begin
      if ResultCode <> 0 then
        MsgBox(Format('Extraction of %s failed with code %d.', [ExtractFileName(ZipFile), ResultCode]), mbError, MB_OK);
    end
    else
      MsgBox('Failed to launch PowerShell for extraction: ' + ExtractFileName(ZipFile), mbError, MB_OK);
  finally
    WizardForm.ProgressGauge.Style := npbstNormal;
  end;
end;

procedure FlattenDirectory(const BasePath: String);
var
  FindRec: TFindRec;
  SubPath: String;
  ResultCode: Integer;
begin
  // Look for the first subfolder inside BasePath
  if FindFirst(BasePath + '\*', FindRec) then
  begin
    try
      repeat
        if (FindRec.Attributes and FILE_ATTRIBUTE_DIRECTORY <> 0) and 
           (FindRec.Name <> '.') and (FindRec.Name <> '..') then
        begin
          SubPath := BasePath + '\' + FindRec.Name;
          Log('Flattening folder: ' + SubPath + ' into ' + BasePath);
          
          // Move all files and folders from SubPath to BasePath
          // Since Inno doesn't have a built-in 'MoveFolderContent', we use PowerShell for reliability
          Exec('powershell.exe', Format('-NoProfile -ExecutionPolicy Bypass -Command "Move-Item -Path ''%s\*'' -Destination ''%s'' -Force"', [SubPath, BasePath]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
          
          // Remove the now empty subfolder
          DelTree(SubPath, True, False, False);
          break; // Only flatten the first subfolder found
        end;
      until not FindNext(FindRec);
    finally
      FindClose(FindRec);
    end;
  end;
end;

// FlattenJreDirectory is replaced by the more generic FlattenDirectory

function OnDownloadProgress(const Url, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  if ProgressMax <> 0 then
    Log(Format('  Download progress for %s: %d%%', [FileName, Integer((Progress * 100) div ProgressMax)]));
  Result := True;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), 'Checking and downloading dependencies...', @OnDownloadProgress);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  NeedsJava, NeedsMongo, IsModernOS: Boolean;
begin
  if CurPageID = wpReady then begin
    IsModernOS := IsWindows10OrNewer();
    NeedsJava := not IsJavaInstalled(IsModernOS);
    NeedsMongo := not IsMongoInstalled(IsModernOS);
    
    if NeedsJava or NeedsMongo then begin
      DownloadPage.Clear;
      
      if NeedsJava then begin
        if IsModernOS then
          DownloadPage.Add('https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jre/hotspot/normal/eclipse', 'java_setup.zip', '')
        else
          DownloadPage.Add('https://api.adoptium.net/v3/binary/latest/8/ga/windows/x86/jre/hotspot/normal/eclipse', 'java_setup.zip', '');
      end;
      
      if NeedsMongo then begin
        if IsModernOS then
          DownloadPage.Add('https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.21.zip', 'mongodb_setup.zip', '')
        else
          DownloadPage.Add('https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.2.22.zip', 'mongodb_setup.zip', '');
      end;
      
      DownloadPage.Show;
      try
        try
          DownloadPage.Download;
          Result := True;
        except
          if DownloadPage.AbortedByUser then
            Result := False
          else
          begin
            if Pos('12007', GetExceptionMessage) > 0 then
            begin
              MsgBox('Network Error: The installer could not resolve the download server addresses (DNS Error 12007).' + #13#10#13#10 +
                     'This "Online" installer requires an active internet connection to download Java and MongoDB.' + #13#10#13#10 +
                     'Please check your internet connection or try again later.', mbCriticalError, MB_OK);
              Result := False;
            end
            else
            begin
              SuppressibleMsgBox(AddPeriod(GetExceptionMessage), mbCriticalError, MB_OK, IDOK);
              Result := False;
            end;
          end;
        end;
      finally
        DownloadPage.Hide;
      end;
    end else
      Result := True;
  end else
    Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  JavaZip, MongoZip: String;
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
    JavaZip := ExpandConstant('{tmp}\java_setup.zip');
    MongoZip := ExpandConstant('{tmp}\mongodb_setup.zip');

    if FileExists(JavaZip) then
    begin
      DelTree(ExpandConstant('{app}\jre'), True, False, False);
      ExtractZip(JavaZip, ExpandConstant('{app}\jre'), 'Extracting Java Runtime...');
      FlattenDirectory(ExpandConstant('{app}\jre'));
      DeleteFile(JavaZip);
      SaveStringToFile(ExpandConstant('{app}\jre\.rcai_version'), GetRequiredJavaVersion(IsWindows10OrNewer()), False);
    end;

    if FileExists(MongoZip) then
    begin
      DelTree(ExpandConstant('{app}\mongodb'), True, False, False);
      ExtractZip(MongoZip, ExpandConstant('{app}\mongodb'), 'Extracting MongoDB...');
      FlattenDirectory(ExpandConstant('{app}\mongodb'));
      DeleteFile(MongoZip);
      SaveStringToFile(ExpandConstant('{app}\mongodb\.rcai_version'), GetRequiredMongoVersion(IsWindows10OrNewer()), False);
    end;
  end;
end;
