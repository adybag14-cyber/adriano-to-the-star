# Remove build files from public directory
Set-Location public

$patterns = @(
    'sync-*.js',
    'update-*.js',
    'generate-*.js',
    'count-*.js',
    'download-*.js',
    'extract-*.js',
    'setup-*.js',
    'package-cli.js',
    'kepler_data_parsed.js',
    'eslint.config.js'
)

foreach ($pattern in $patterns) {
    Get-ChildItem -Filter $pattern -ErrorAction SilentlyContinue | 
        Remove-Item -Force -ErrorAction SilentlyContinue
}

Set-Location ..

