; Race Coordinator AI Online Installer Script
; Downloads Java 17 for Win10+ or Java 8 for Legacy OS during installation

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
  TarPath: String;
begin
  WizardForm.StatusLabel.Caption := StatusMsg;
  WizardForm.ProgressGauge.Style := npbstMarquee;
  try
    if not DirExists(DestDir) then
      ForceDirectories(DestDir);
      
    if IsWindows10OrNewer() then
    begin
      TarPath := ExpandConstant('{sysnative}\tar.exe');
      if FileExists(TarPath) then
      begin
        Log('Running TAR: ' + TarPath);
        if Exec(TarPath, Format('-xf "%s" -C "%s"', [ZipFile, DestDir]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
        begin
          if ResultCode = 0 then
            Exit; // Success
            
          Log(Format('TAR extraction failed with code %d. Falling back to PowerShell.', [ResultCode]));
        end
        else
          Log('Failed to execute TAR. Falling back to PowerShell.');
      end
      else
        Log('TAR not found at ' + TarPath + '. Falling back to PowerShell.');
    end;
    
    // PowerShell command for extraction (legacy fallback or TAR failure)
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
  RoboPath: String;
begin
  if FindFirst(BasePath + '\*', FindRec) then
  begin
    try
      repeat
        if (FindRec.Attributes and FILE_ATTRIBUTE_DIRECTORY <> 0) and 
           (FindRec.Name <> '.') and (FindRec.Name <> '..') then
        begin
          SubPath := BasePath + '\' + FindRec.Name;
          Log('Flattening folder: ' + SubPath + ' into ' + BasePath);
          
          RoboPath := ExpandConstant('{sys}\robocopy.exe');
          if FileExists(RoboPath) then
          begin
            Log('Running Robocopy: ' + RoboPath);
            Exec(RoboPath, Format('"%s" "%s" /E /MOVE', [SubPath, BasePath]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
          end;
          
          if DirExists(SubPath) then
          begin
            Log('Robocopy fallback to PowerShell Copy-Item for: ' + SubPath);
            Exec('powershell.exe', Format('-NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path ''%s\*'' -Destination ''%s'' -Recurse -Force; Remove-Item -Path ''%s'' -Recurse -Force"', [SubPath, BasePath, SubPath]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
          end;
          
          if DirExists(SubPath) then
            DelTree(SubPath, True, False, False);
          break;
        end;
      until not FindNext(FindRec);
    finally
      FindClose(FindRec);
    end;
  end;
end;

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

procedure CurStepChanged(CurStep: TSetupStep);
var
  JavaZip: String;
  NeedsJava, IsModernOS: Boolean;
begin
  if CurStep = ssInstall then
  begin
    IsModernOS := IsWindows10OrNewer();
    NeedsJava := not IsJavaInstalled(IsModernOS);
    
    if NeedsJava then begin
      DownloadPage.Clear;
      
      if IsModernOS then
        DownloadPage.Add('https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.19%2B10/OpenJDK17U-jre_x64_windows_hotspot_17.0.19_10.zip', 'java_setup.zip', '')
      else
        DownloadPage.Add('https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u472-b08/OpenJDK8U-jre_x86-32_windows_hotspot_8u472b08.zip', 'java_setup.zip', '');
      
      DownloadPage.Show;
      try
        try
          DownloadPage.Download;
        except
          if DownloadPage.AbortedByUser then
            Abort()
          else
          begin
            if Pos('12007', GetExceptionMessage) > 0 then
            begin
              MsgBox('Network Error: The installer could not resolve the download server addresses (DNS Error 12007).' + #13#10#13#10 +
                     'This "Online" installer requires an active internet connection to download Java.' + #13#10#13#10 +
                     'Please check your internet connection or try again later.', mbCriticalError, MB_OK);
            end
            else
            begin
              SuppressibleMsgBox(AddPeriod(GetExceptionMessage), mbCriticalError, MB_OK, IDOK);
            end;
            Abort();
          end;
        end;
      finally
        DownloadPage.Hide;
      end;
    end;
  end;

  if CurStep = ssPostInstall then
  begin
    JavaZip := ExpandConstant('{tmp}\java_setup.zip');

    if FileExists(JavaZip) then
    begin
      DelTree(ExpandConstant('{app}\jre'), True, False, False);
      ExtractZip(JavaZip, ExpandConstant('{app}\jre'), 'Extracting Java Runtime...');
      FlattenDirectory(ExpandConstant('{app}\jre'));
      DeleteFile(JavaZip);
      SaveStringToFile(ExpandConstant('{app}\jre\.rcai_version'), GetRequiredJavaVersion(IsWindows10OrNewer()), False);
    end;
  end;
end;
