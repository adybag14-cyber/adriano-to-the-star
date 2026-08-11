param([string]$jarFile = "Starsector/starsector-core/starfarer_obf_v2.jar")
Write-Host "--- MANIFEST FOR $jarFile ---"
& "C:\Users\Ady\.antigravity\extensions\redhat.java-1.51.0-win32-x64\jre\21.0.9-win32-x86_64\bin\jar.exe" xf $jarFile META-INF/MANIFEST.MF
Get-Content META-INF/MANIFEST.MF
Remove-Item META-INF -Recurse