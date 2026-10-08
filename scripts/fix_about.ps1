$path = "app\(landing)\about\page.tsx"
$t = Get-Content $path -Raw
$m = 'building pathways that connect businesses to opportunities'
$i = $t.IndexOf($m)
if ($i -lt 0) { Write-Host 'nomarker'; exit }
$e = $t.IndexOf('</p>', $i)
if ($e -lt 0) { Write-Host 'noend'; exit }
$ins = "`r`n            </p>`r`n            <div className=`"pt-4 space-y-4 text-slate-200`">`r`n              <p>TALLGATE LIMITED is a forward-thinking hybrid technology and service company dedicated to helping small and medium-sized businesses establish, strengthen, and scale their digital presence. We provide affordable, practical, and results-driven digital solutions that enable businesses to compete effectively in an increasingly digital economy.</p>`r`n              <p>Founded on the belief that every business deserves access to modern digital tools, TALLGATE bridges the gap between traditional business operations and digital transformation. Through a combination of technology, strategic support, and skilled talent, we help businesses improve visibility, attract customers, increase sales, and achieve sustainable growth.</p>`r`n              <p>In addition to supporting businesses, TALLGATE is committed to empowering the next generation of professionals by creating opportunities for university students and young graduates to develop valuable digital skills, gain practical experience, and participate in meaningful employment opportunities.</p>`r`n            </div>`r`n"
$nt = $t.Substring(0, $e+4) + $ins + $t.Substring($e+4)
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $path), $nt, $utf8)
Write-Host 'ok'
