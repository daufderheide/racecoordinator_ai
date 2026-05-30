; Race Coordinator AI Online Installer Script
; Downloads Java 17 and MongoDB during installation only if they are not detected

#include "installer_base.iss"

[Setup]
OutputBaseFilename=RaceCoordinatorAI_Online_Setup

[Code]
var
  DownloadPage: TDownloadWizardPage;

function IsJava17Installed: Boolean;
begin
  // Check common registry keys for Java 17 (Adoptium/Temurin or Oracle)
  Result := RegKeyExists(HKLM, 'SOFTWARE\Eclipse Foundation\JDK\17\jre') or 
            RegKeyExists(HKLM, 'SOFTWARE\JavaSoft\JDK\17') or
            RegKeyExists(HKLM64, 'SOFTWARE\Eclipse Foundation\JDK\17\jre') or 
            RegKeyExists(HKLM64, 'SOFTWARE\JavaSoft\JDK\17');
end;

function IsMongo60Installed: Boolean;
begin
  // Check for MongoDB 6.0 service or installation path
  Result := RegKeyExists(HKLM, 'SOFTWARE\MongoDB\Server\6.0') or
            RegKeyExists(HKLM64, 'SOFTWARE\MongoDB\Server\6.0');
end;

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
          DelTree(SubPath, True, True, True);
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
  NeedsJava, NeedsMongo: Boolean;
begin
  if CurPageID = wpReady then begin
    NeedsJava := not IsJava17Installed();
    NeedsMongo := not IsMongo60Installed();
    
    if NeedsJava or NeedsMongo then begin
      DownloadPage.Clear;
      
      if NeedsJava then begin
        // Java 17 JRE ZIP (Adoptium Temurin)
        DownloadPage.Add('https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jre/hotspot/normal/eclipse', 'java_setup.zip', '');
      end;
      
      if NeedsMongo then begin
        // MongoDB 6.0.21 ZIP (x64)
        DownloadPage.Add('https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.21.zip', 'mongodb_setup.zip', '');
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
begin
  if CurStep = ssPostInstall then
  begin
    JavaZip := ExpandConstant('{tmp}\java_setup.zip');
    MongoZip := ExpandConstant('{tmp}\mongodb_setup.zip');

    if FileExists(JavaZip) then
    begin
      ExtractZip(JavaZip, ExpandConstant('{app}\jre'), 'Extracting Java 17 Runtime...');
      FlattenDirectory(ExpandConstant('{app}\jre'));
      DeleteFile(JavaZip);
    end;

    if FileExists(MongoZip) then
    begin
      ExtractZip(MongoZip, ExpandConstant('{app}\mongodb'), 'Extracting MongoDB 6.0...');
      FlattenDirectory(ExpandConstant('{app}\mongodb'));
      DeleteFile(MongoZip);
    end;
  end;
end;
