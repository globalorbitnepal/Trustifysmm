@echo off
:: Run as Administrator (right-click -> Run as administrator)
:: Fixes "DNS_PROBE_FINISHED_NXDOMAIN" after nameservers were moved to Cloudflare.
title TrustifySMM DNS fix

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Please right-click this file and choose "Run as administrator".
  pause
  exit /b 1
)

echo Flushing old DNS cache...
ipconfig /flushdns

echo Setting Cloudflare DNS on active adapters (1.1.1.1 / 1.0.0.1)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object { try { Set-DnsClientServerAddress -InterfaceIndex $_.InterfaceIndex -ServerAddresses '1.1.1.1','1.0.0.1' -ErrorAction Stop; Write-Host ('Updated: ' + $_.Name) } catch { Write-Host ('Skip: ' + $_.Name) } }"

ipconfig /flushdns

echo.
echo Done. Opening https://trustifysmm.com/signin ...
start https://trustifysmm.com/signin
pause