# Renders store and social images from store/promo/promo.html with headless Chrome.
# Usage (from the project root):  powershell -ExecutionPolicy Bypass -File tools/render-promo.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome or Edge not found." }

$port = 5179
$server = Start-Process python -ArgumentList "-m", "http.server", $port, "--bind", "127.0.0.1" -WorkingDirectory $root -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 1

$jobs = @(
  @{ k = "og";         w = 1200; h = 630; out = "docs/og-image.png" },
  @{ k = "marquee";    w = 1400; h = 560; out = "store/images/marquee-1400x560.png" },
  @{ k = "tile";       w = 440;  h = 280; out = "store/images/small-tile-440x280.png" },
  @{ k = "shot-blur";  w = 1280; h = 800; out = "store/images/screenshot-1-blur.png" },
  @{ k = "shot-popup"; w = 1280; h = 800; out = "store/images/screenshot-2-popup.png" },
  @{ k = "shot-lock";  w = 1280; h = 800; out = "store/images/screenshot-3-lock.png" }
)

New-Item -ItemType Directory -Force (Join-Path $root "store/images") | Out-Null
$ErrorActionPreference = "Continue" # Chrome logs harmless warnings to stderr
try {
  foreach ($j in $jobs) {
    $out = Join-Path $root $j.out
    $profile = Join-Path $env:TEMP ("tirai-render-" + $j.k)
    & $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
      --user-data-dir="$profile" --window-size="$($j.w),$($j.h)" --virtual-time-budget=6000 `
      --screenshot="$out" "http://127.0.0.1:$port/store/promo/promo.html?k=$($j.k)" 2>$null | Out-Null
    Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue
    Write-Host "rendered $($j.out)"
  }
} finally {
  Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
}
