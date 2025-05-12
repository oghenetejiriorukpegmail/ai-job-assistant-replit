# PowerShell script to download and install MongoDB

# Create data directory if it doesn't exist
if (-not (Test-Path "C:\data\db")) {
    New-Item -ItemType Directory -Path "C:\data\db" -Force
    Write-Host "Created MongoDB data directory at C:\data\db"
}

# Download MongoDB installer
$downloadUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.12-signed.msi"
$installerPath = "$env:TEMP\mongodb-installer.msi"

Write-Host "Downloading MongoDB installer..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath

# Install MongoDB
Write-Host "Installing MongoDB..."
Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet ADDLOCAL=ALL" -Wait

# Add MongoDB to PATH if not already there
$mongodbPath = "C:\Program Files\MongoDB\Server\6.0\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if (-not $currentPath.Contains($mongodbPath)) {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$mongodbPath", "Machine")
    Write-Host "Added MongoDB to system PATH"
}

# Start MongoDB service
Write-Host "Starting MongoDB service..."
Start-Service MongoDB

Write-Host "MongoDB installation complete!"
Write-Host "MongoDB is running as a Windows service."
Write-Host "Data directory: C:\data\db"
Write-Host "Connection string: mongodb://localhost:27017"
