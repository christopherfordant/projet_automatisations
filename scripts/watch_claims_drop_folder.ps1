param(
    [string]$WatchPath = "dropzones\\incoming",
    [string]$ArchivePath = "dropzones\\archive",
    [string]$ErrorPath = "dropzones\\error",
    [string]$N8nBaseUrl = "http://127.0.0.1:5678",
    [string]$CsvWebhookPath = "/webhook/mutuelle/full-csv-claims-pipeline",
    [string]$BatchWebhookPath = "/webhook/mutuelle/claims-intake-batch",
    [string]$ClaimsWebhookPath = "/webhook/mutuelle/claims-intake",
    [string]$DocumentWebhookPath = "/webhook/mutuelle/document-completeness",
    [string]$DefaultProvider = "mock"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedWatchPath = Join-Path $projectRoot $WatchPath
$resolvedArchivePath = Join-Path $projectRoot $ArchivePath
$resolvedErrorPath = Join-Path $projectRoot $ErrorPath

foreach ($path in @($resolvedWatchPath, $resolvedArchivePath, $resolvedErrorPath)) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
}

function Move-ProcessedFile {
    param(
        [string]$SourcePath,
        [string]$DestinationRoot
    )

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $destinationName = "{0}-{1}{2}" -f [System.IO.Path]::GetFileNameWithoutExtension($SourcePath), $timestamp, [System.IO.Path]::GetExtension($SourcePath)
    $destinationPath = Join-Path $DestinationRoot $destinationName
    Move-Item -Path $SourcePath -Destination $destinationPath -Force
    return $destinationPath
}

function Invoke-N8nJsonWebhook {
    param(
        [string]$Uri,
        [object]$Payload
    )

    $body = $Payload | ConvertTo-Json -Depth 10 -Compress
    return Invoke-RestMethod -Method Post -Uri $Uri -ContentType "application/json" -Body $body
}

function Invoke-FileDispatch {
    param(
        [string]$FilePath
    )

    $extension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
    $fileName = [System.IO.Path]::GetFileName($FilePath)

    if ($extension -eq ".csv") {
        $csvContent = Get-Content $FilePath -Raw
        $payload = @{
            source_name = $fileName
            imported_by = "drop_folder_watcher"
            provider = $DefaultProvider
            csv_content = $csvContent
        }

        return Invoke-N8nJsonWebhook -Uri ($N8nBaseUrl + $CsvWebhookPath) -Payload $payload
    }

    if ($extension -eq ".json") {
        $payload = Get-Content $FilePath -Raw | ConvertFrom-Json -Depth 20

        if ($payload.PSObject.Properties.Name -contains "items") {
            return Invoke-N8nJsonWebhook -Uri ($N8nBaseUrl + $BatchWebhookPath) -Payload $payload
        }

        if ($payload.PSObject.Properties.Name -contains "document_type") {
            return Invoke-N8nJsonWebhook -Uri ($N8nBaseUrl + $DocumentWebhookPath) -Payload $payload
        }

        return Invoke-N8nJsonWebhook -Uri ($N8nBaseUrl + $ClaimsWebhookPath) -Payload $payload
    }

    throw "Format non supporte: $extension"
}

function Process-File {
    param(
        [string]$FilePath
    )

    if (-not (Test-Path $FilePath)) {
        return
    }

    Start-Sleep -Milliseconds 500

    try {
        $result = Invoke-FileDispatch -FilePath $FilePath
        $archivedPath = Move-ProcessedFile -SourcePath $FilePath -DestinationRoot $resolvedArchivePath
        Write-Host ""
        Write-Host "Traite avec succes: $archivedPath" -ForegroundColor Green
        Write-Host ($result | ConvertTo-Json -Depth 10)
    } catch {
        $errorPath = Move-ProcessedFile -SourcePath $FilePath -DestinationRoot $resolvedErrorPath
        Write-Host ""
        Write-Host "Echec de traitement: $errorPath" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "Surveillance du dossier: $resolvedWatchPath" -ForegroundColor Cyan
Write-Host "Archive: $resolvedArchivePath" -ForegroundColor Green
Write-Host "Erreur: $resolvedErrorPath" -ForegroundColor Yellow
Write-Host "Webhook CSV: $N8nBaseUrl$CsvWebhookPath"
Write-Host "Webhook batch JSON: $N8nBaseUrl$BatchWebhookPath"
Write-Host "Webhook claims JSON: $N8nBaseUrl$ClaimsWebhookPath"
Write-Host "Webhook document JSON: $N8nBaseUrl$DocumentWebhookPath"
Write-Host ""
Write-Host "Depose un .csv ou un .json dans le dossier surveille, puis laisse cette fenetre ouverte." -ForegroundColor Cyan

Get-ChildItem -Path $resolvedWatchPath -File | ForEach-Object {
    Process-File -FilePath $_.FullName
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $resolvedWatchPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()

    if ($extension -notin @(".csv", ".json")) {
        return
    }

    Process-File -FilePath $path
}

$createdRegistration = Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action
$renamedRegistration = Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $action

try {
    while ($true) {
        Start-Sleep -Seconds 2
    }
} finally {
    Unregister-Event -SourceIdentifier $createdRegistration.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $renamedRegistration.Name -ErrorAction SilentlyContinue
    $watcher.Dispose()
}
