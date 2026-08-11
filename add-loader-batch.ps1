$files = Get-ChildItem -Path . -Filter *.html

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false

    # 1. Add manifest link if missing
    if ($content -notmatch '<link rel="manifest" href="manifest.json">') {
        if ($content -match '</head>') {
            $content = $content -replace '</head>', '    <link rel="manifest" href="manifest.json">
</head>'
            $modified = $true
            Write-Host "Added manifest to $($file.Name)"
        }
    }

    # 2. Add loader.js if missing
    if ($content -notmatch '<script src="loader.js"></script>') {
        if ($content -match '</head>') {
            $content = $content -replace '</head>', '    <script src="loader.js"></script>
</head>'
            $modified = $true
            Write-Host "Added loader.js to $($file.Name)"
        }
    }

    # 3. Add pwa-loader.js if missing
    if ($content -notmatch '<script src="pwa-loader.js"></script>') {
        if ($content -match '</body>') {
            $content = $content -replace '</body>', '    <script src="pwa-loader.js"></script>
</body>'
            $modified = $true
            Write-Host "Added pwa-loader.js to $($file.Name)"
        }
    }

    if ($modified) {
        $content | Set-Content $file.FullName
    }
}
