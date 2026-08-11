# PowerShell script to run ARC-AGI-1 Benchmark

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ARC-AGI-1 Benchmark Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dataset exists
if (-not (Test-Path "arc-dataset\data\evaluation")) {
    Write-Host "ERROR: ARC dataset not found!" -ForegroundColor Red
    Write-Host "Please clone the dataset first:" -ForegroundColor Yellow
    Write-Host "  git clone https://github.com/fchollet/ARC.git arc-dataset" -ForegroundColor Yellow
    exit 1
}

# Check if solver exists
if (-not (Test-Path "arc-solver-advanced.py")) {
    Write-Host "ERROR: Solver not found!" -ForegroundColor Red
    Write-Host "Expected: arc-solver-advanced.py" -ForegroundColor Yellow
    exit 1
}

# Count tasks
$taskCount = (Get-ChildItem "arc-dataset\data\evaluation" -Filter "*.json").Count
Write-Host "Found $taskCount evaluation tasks" -ForegroundColor Green
Write-Host ""

# Ask user what to do
Write-Host "Select an option:" -ForegroundColor Yellow
Write-Host "  1. Run full benchmark (all 400 tasks) - takes ~5-10 minutes"
Write-Host "  2. Run quick test (first 10 tasks) - takes ~30 seconds"
Write-Host "  3. Test on specific task (00576224.json - the one we solved)"
Write-Host "  4. View results from last run"
Write-Host ""
$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running full benchmark..." -ForegroundColor Green
        python arc-solver-advanced.py
        Write-Host ""
        Write-Host "Results saved to: arc-agi-1-advanced-results.json" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "Running quick test on first 10 tasks..." -ForegroundColor Green
        # Create a temporary script that limits to 10 tasks
        python -c "exec(open('arc-solver-advanced.py').read().replace('limit=None', 'limit=10').replace('verbose=False', 'verbose=True'))"
    }
    "3" {
        Write-Host ""
        Write-Host "Testing on task 00576224.json..." -ForegroundColor Green
        python -c "import sys; sys.path.insert(0, '.'); exec(open('arc-solver-advanced.py').read()); all_correct, correct, total = evaluate_task('arc-dataset/data/evaluation/00576224.json', verbose=True); print(f'\nResult: {correct}/{total} correct')"
    }
    "4" {
        if (Test-Path "arc-agi-1-advanced-results.json") {
            Write-Host ""
            Write-Host "Last Run Results:" -ForegroundColor Green
            python -c "import json; data = json.load(open('arc-agi-1-advanced-results.json')); print(f\"Test Accuracy: {data['test_accuracy']:.2f}%\"); print(f\"Task Accuracy: {data['task_accuracy']:.2f}%\"); print(f\"Correct: {data['total_correct']}/{data['total_tests']}\"); print(f\"Fully Solved Tasks: {data['all_correct_tasks']}/{data['total_tasks']}\")"
        } else {
            Write-Host "No results file found. Run the benchmark first." -ForegroundColor Red
        }
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

