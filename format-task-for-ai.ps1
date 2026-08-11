# PowerShell script to format ARC tasks for AI testing

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskPath,
    
    [switch]$ShowAnswer
)

if (-not (Test-Path $TaskPath)) {
    Write-Host "Error: Task file not found: $TaskPath" -ForegroundColor Red
    exit 1
}

$task = Get-Content $TaskPath -Raw | ConvertFrom-Json
$taskId = Split-Path $TaskPath -Leaf

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "ARC-AGI-1 Task: $taskId" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

Write-Host "Copy the following and paste it to the AI:" -ForegroundColor Yellow
Write-Host ""

Write-Host "---" -ForegroundColor Gray
Write-Host "ARC-AGI-1 Task: $taskId" -ForegroundColor White
Write-Host ""
Write-Host "Training Examples:" -ForegroundColor White

$i = 1
foreach ($example in $task.train) {
    Write-Host "Example $i`:" -ForegroundColor Green
    Write-Host "  Input:" -ForegroundColor Gray
    $inputJson = ($example.input | ConvertTo-Json -Compress)
    Write-Host "    $inputJson" -ForegroundColor White
    Write-Host "  Output:" -ForegroundColor Gray
    $outputJson = ($example.output | ConvertTo-Json -Compress)
    Write-Host "    $outputJson" -ForegroundColor White
    Write-Host ""
    $i++
}

Write-Host "Test Case:" -ForegroundColor Yellow
Write-Host "  Input:" -ForegroundColor Gray
$testInputJson = ($task.test[0].input | ConvertTo-Json -Compress)
Write-Host "    $testInputJson" -ForegroundColor White
Write-Host "  Output: ??? (what should this be?)" -ForegroundColor Yellow
Write-Host ""

if ($ShowAnswer) {
    Write-Host "---" -ForegroundColor Gray
    Write-Host "EXPECTED ANSWER (for verification):" -ForegroundColor Red
    $expectedJson = ($task.test[0].output | ConvertTo-Json -Compress)
    Write-Host "  $expectedJson" -ForegroundColor Red
    Write-Host "---" -ForegroundColor Gray
} else {
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To see the expected answer, run:" -ForegroundColor Gray
    Write-Host "  .\format-task-for-ai.ps1 -TaskPath `"$TaskPath`" -ShowAnswer" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Please analyze the pattern from the training examples and provide the output grid for the test case." -ForegroundColor White
Write-Host ""

