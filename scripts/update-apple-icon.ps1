Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$icon = New-Object System.Drawing.Icon (Join-Path $root '05_link_spark.ico')
$bmp = $icon.ToBitmap()
$appleSize = 180
$out = New-Object System.Drawing.Bitmap $appleSize, $appleSize
$g = [System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)
$scale = [Math]::Min($appleSize / $bmp.Width, $appleSize / $bmp.Height)
$w = [int]($bmp.Width * $scale)
$h = [int]($bmp.Height * $scale)
$x = [int](($appleSize - $w) / 2)
$y = [int](($appleSize - $h) / 2)
$g.DrawImage($bmp, $x, $y, $w, $h)
$applePath = Join-Path $root 'assets\apple-touch-icon.png'
$out.Save($applePath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$out.Dispose()
$bmp.Dispose()
$icon.Dispose()
Write-Output "Updated $applePath"
