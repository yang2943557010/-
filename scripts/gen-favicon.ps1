Add-Type -AssemblyName System.Drawing

$size = 32
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
  (New-Object System.Drawing.Point 0, 0),
  (New-Object System.Drawing.Point $size, $size),
  [System.Drawing.Color]::FromArgb(255, 99, 102, 241),
  [System.Drawing.Color]::FromArgb(255, 139, 92, 246)
)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(2, 2, 28, 28, 0, 360)
$g.FillPath($brush, $path)

$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 2.2
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($pen, 12.2, 19.8, 10.1, 21.9)
$g.DrawLine($pen, 19.8, 12.2, 21.9, 10.1)
$g.DrawLine($pen, 13.2, 18.8, 18.8, 13.2)

$root = Split-Path -Parent $PSScriptRoot
$icoPath = Join-Path $root 'favicon.ico'
$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()
$g.Dispose()
$bmp.Dispose()
$icon.Dispose()
Write-Output "Created $icoPath"

$appleSize = 180
$abmp = New-Object System.Drawing.Bitmap $appleSize, $appleSize
$ag = [System.Drawing.Graphics]::FromImage($abmp)
$ag.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$abrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
  (New-Object System.Drawing.Point 0, 0),
  (New-Object System.Drawing.Point $appleSize, $appleSize),
  [System.Drawing.Color]::FromArgb(255, 99, 102, 241),
  [System.Drawing.Color]::FromArgb(255, 139, 92, 246)
)
$apath = New-Object System.Drawing.Drawing2D.GraphicsPath
$apath.AddArc(12, 12, 156, 156, 0, 360)
$ag.FillPath($abrush, $apath)

$apen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 12
$apen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$apen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$ag.DrawLine($apen, 68, 112, 56, 124)
$ag.DrawLine($apen, 112, 68, 124, 56)
$ag.DrawLine($apen, 74, 106, 106, 74)

$applePath = Join-Path $root 'assets\apple-touch-icon.png'
$abmp.Save($applePath, [System.Drawing.Imaging.ImageFormat]::Png)
$ag.Dispose()
$abmp.Dispose()
Write-Output "Created $applePath"
