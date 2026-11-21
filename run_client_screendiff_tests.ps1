$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$ClientDir = Join-Path $ProjectRoot "client"
$LocalNodeDir = Join-Path $ProjectRoot "tools\node"
if (Test-Path -LiteralPath $LocalNodeDir) {
    $env:Path = "$LocalNodeDir;$env:Path"
}

# Separate report paths and Linux caches for different checkouts.
$Sha256 = [Security.Cryptography.SHA256]::Create()
$CheckoutId = [BitConverter]::ToString($Sha256.ComputeHash(
    [Text.Encoding]::UTF8.GetBytes($ProjectRoot.ToLowerInvariant())
)).Replace("-", "").Substring(0, 12).ToLowerInvariant()
$Sha256.Dispose()
$TempRoot = if ($env:TEMP) { $env:TEMP } else { [IO.Path]::GetTempPath() }
$IsolatedDir = Join-Path $TempRoot "racecoordinator-client-visual-$CheckoutId"

function Lock-VisualReports {
    New-Item -ItemType Directory -Path $IsolatedDir -Force | Out-Null
    try {
        [IO.File]::Open((Join-Path $IsolatedDir "runner.lock"), "OpenOrCreate", "ReadWrite", "None")
    } catch [IO.IOException] {
        throw "This checkout's visual reports are already in use. Wait for the other run to finish."
    }
}

if ($args -contains "--sync-only") {
    $ReportLock = Lock-VisualReports
    try {
        $env:CLIENT_DIR = $ClientDir
        $env:ISOLATED_DIR = $IsolatedDir
        $env:PW_REPORT_PATH = Join-Path $IsolatedDir "pw-result.json"
        node (Join-Path $ProjectRoot "scripts\sync_snapshots.js")
        exit $LASTEXITCODE
    } finally {
        $ReportLock.Dispose()
    }
}

$ChangedFlag = $null
$NativeFlag = $false
$NoReportFlag = $false
$PlaywrightArgs = @()
foreach ($arg in $args) {
    if ($arg -eq "--changed" -or $arg -like "--changed=*") {
        $ChangedFlag = $arg
    } elseif ($arg -eq "-Native" -or $arg -eq "--native") {
        $NativeFlag = $true
    } elseif ($arg -eq "--no-report") {
        $NoReportFlag = $true
    } else {
        $PlaywrightArgs += $arg -replace '^[.]?[/\\]?client[/\\]', ''
    }
}

if ($ChangedFlag) {
    Write-Host "Resolving screendiff tests for changed files..." -ForegroundColor Cyan
    $ChangedTests = node (Join-Path $ProjectRoot "scripts\find_changed_screendiff_tests.js") $ChangedFlag
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    if (-not $ChangedTests) {
        Write-Host "No screendiff tests found for the changed files." -ForegroundColor Yellow
        exit 0
    }
    $PlaywrightArgs = @($ChangedTests -split '\s+' | Where-Object { $_ }) + $PlaywrightArgs
}

Write-Host "--- Running Client Visual Tests ---" -ForegroundColor Cyan

if ($NativeFlag) {
    Push-Location $ClientDir
    try {
        npx.cmd playwright install chromium
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

        $env:PW_REPORT_PATH = Join-Path $ClientDir "playwright-report\pw-result.json"
        node node_modules/@playwright/test/cli.js test @PlaywrightArgs
        $TestExitCode = $LASTEXITCODE

        if ($TestExitCode -ne 0 -and [Environment]::UserInteractive -and -not $env:CI -and -not $NoReportFlag) {
            node node_modules/@playwright/test/cli.js show-report (Join-Path $ClientDir "playwright-report")
        }
    } finally {
        Pop-Location
    }
    exit $TestExitCode
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop is required for Linux screendiffs. Use -Native to run Chromium on Windows.'
}
$Engine = docker info --format '{{.OSType}}'
if ($LASTEXITCODE -ne 0 -or $Engine -ne "linux") {
    throw 'Start Docker Desktop with its Linux engine and try again.'
}

$Archive = Join-Path $IsolatedDir "inputs-$PID.tar"
$ContainerName = "rcai-visual-$CheckoutId"
$WorkerCount = if ($env:PWTEST_WORKERS) { $env:PWTEST_WORKERS } else { "100%" }
$Runner = Join-Path $ProjectRoot "scripts\run_windows_screendiffs.js"
$ReportLock = Lock-VisualReports
try {
    # A single archive transfer avoids scanning and compiling across the Windows mount.
    tar.exe -cf $Archive -C $ProjectRoot `
        --exclude=client/src/app/proto/message.js --exclude=client/src/app/proto/message.d.ts `
        client/src client/scripts client/package.json client/package-lock.json client/angular.json `
        client/playwright.config.ts client/tsconfig.json client/tsconfig.app.json client/tsconfig.spec.json server/proto
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Running Linux screendiffs in Docker. Reports go to $IsolatedDir." -ForegroundColor Green
    $DockerArgs = @(
        "run", "--rm", "--init", "--ipc=host", "--name", $ContainerName,
        "-v", "${ContainerName}:/work",
        "-v", "${Archive}:/inputs.tar:ro",
        "-v", "${IsolatedDir}:/report",
        "-v", "${Runner}:/runner.js:ro",
        "-e", "CI=1",
        "-e", "PWTEST_WORKERS=$WorkerCount",
        "-e", "PW_REPORTER",
        "-e", "PW_VERBOSE",
        "mcr.microsoft.com/playwright:v1.61.1-jammy",
        "node", "/runner.js"
    )
    & docker @DockerArgs @PlaywrightArgs
    $TestExitCode = $LASTEXITCODE

    $UpdatedDir = Join-Path $IsolatedDir "updated-snapshots"
    if ($TestExitCode -eq 0 -and (Test-Path -LiteralPath $UpdatedDir)) {
        foreach ($snapshot in Get-ChildItem -LiteralPath $UpdatedDir -Recurse -File -Filter "*-linux.png") {
            $RelativePath = $snapshot.FullName.Substring($UpdatedDir.Length + 1)
            $Destination = Join-Path (Join-Path $ClientDir "src") $RelativePath
            New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
            Copy-Item -LiteralPath $snapshot.FullName -Destination $Destination -Force
        }
    }
    $HtmlReport = Join-Path $IsolatedDir "playwright-report"
    if ($TestExitCode -ne 0 -and
        (Test-Path -LiteralPath (Join-Path $IsolatedDir "pw-result.json")) -and
        (Test-Path -LiteralPath (Join-Path $HtmlReport "index.html"))) {
        if ([Environment]::UserInteractive -and -not $env:CI -and -not $env:ANTIGRAVITY_AGENT -and -not $NoReportFlag) {
            Push-Location $ClientDir
            try {
                npx.cmd playwright show-report $HtmlReport
            } finally {
                Pop-Location
            }
        } else {
            Write-Host "Review the Docker report in $HtmlReport." -ForegroundColor Yellow
        }
    }
    exit $TestExitCode
} finally {
    Remove-Item -LiteralPath $Archive -Force -ErrorAction SilentlyContinue
    $ReportLock.Dispose()
}
