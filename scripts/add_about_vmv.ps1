$path = "app\(landing)\about\page.tsx"
$t = Get-Content $path -Raw
$before = "        </div>

        {/* ==================================================================== */}
        {/* 5. COMPANY PROFILE DOCUMENT                                          */}
        {/* ==================================================================== */}"
$ins = @"
        </div>

        {/* ==================================================================== */}
        {/* 4. VISION, MISSION & CORE VALUES                                   */}
        {/* ==================================================================== */}
        <div className="space-y-10">
          <SectionHeader
            title="Vision, Mission & Core Values"
            description="Guiding our commitment to empowering businesses and individuals."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base bg-white/[0.03] border border-white/10 p-6 space-y-3">
              <h3 className="text-lg font-bold text-white">Vision</h3>
              <p className="text-sm text-slate-200 leading-relaxed">"To become Africa's leading digital enablement company, empowering businesses and individuals through technology, innovation, and opportunity."</p>
            </div>
            <div className="card-base bg-white/[0.03] border border-white/10 p-6 space-y-3">
              <h3 className="text-lg font-bold text-white">Mission</h3>
              <p className="text-sm text-slate-200 leading-relaxed">"To simplify digital transformation for small businesses by providing accessible, affordable, and innovative solutions that drive growth, efficiency, and long-term success."</p>
            </div>
          </div>
          <div className="card-base bg-white/[0.03] border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Core Values</h3>
            <ol className="space-y-2 text-sm text-slate-200">
              <li>1. Innovation</li>
              <li>2. Excellence</li>
              <li>3. Integrity</li>
              <li>4. Empowerment</li>
              <li>5. Customer Success</li>
              <li>6. Collaboration</li>
            </ol>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. COMPANY PROFILE DOCUMENT                                          */}
        {/* ==================================================================== */}
"@
if ($t.Contains($before)) {
  $t2 = $t.Replace($before, $ins)
  Set-Content -Path $path -Value $t2 -NoNewline
  Write-Host 'ok'
} else { Write-Host 'nomatch' }
