# PowerShell script to format SSH key for GitHub Secrets
# Usage: .\Format-SSHKey-For-GitHub.ps1 -KeyPath "C:\path\to\your-key.pem"

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyPath
)

if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ Error: File not found: $KeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Formatting SSH key for GitHub Secrets...`n" -ForegroundColor Cyan

Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "COPY EVERYTHING BELOW (including \n characters)" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

# Read the file and replace newlines with \n
$content = Get-Content $KeyPath -Raw
$formatted = $content -replace "`r`n", "\n" -replace "`n", "\n"
# Remove trailing \n if exists
$formatted = $formatted.TrimEnd("\n")
# Add final \n
$formatted = $formatted + "\n"

Write-Host $formatted -ForegroundColor Green

Write-Host "`n══════════════════════════════════════════════════════════════" -ForegroundColor Yellow

# Copy to clipboard if available
try {
    Set-Clipboard -Value $formatted
    Write-Host "`n✅ Key copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "`n⚠️  Could not copy to clipboard, please copy manually" -ForegroundColor Yellow
}

Write-Host "`n📝 Steps to add to GitHub:" -ForegroundColor Cyan
Write-Host "1. The formatted key is shown above (and copied to clipboard if available)"
Write-Host "2. Go to: https://github.com/Genessence/Kaizen-Amber/settings/secrets/actions"
Write-Host "3. Remove existing EC2_SSH_KEY if it exists"
Write-Host "4. Click 'New repository secret'"
Write-Host "5. Name: EC2_SSH_KEY"
Write-Host "6. Value: Paste the formatted key"
Write-Host "7. Click 'Add secret'"
Write-Host "`n✅ The key should be ONE line with \n characters in it`n" -ForegroundColor Green

