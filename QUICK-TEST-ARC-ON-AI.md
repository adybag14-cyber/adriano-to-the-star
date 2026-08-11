# Quick Guide: Testing ARC-AGI-1 on AI Model

## Fastest Way to Test

### Step 1: Format a Task

```powershell
.\format-task-for-ai.ps1 -TaskPath "arc-dataset\data\evaluation\00576224.json"
```

This will output formatted text you can copy-paste directly to the AI.

### Step 2: Paste to AI

Copy the output and paste it in a message to the AI (Auto in Cursor).

### Step 3: Check Answer

After the AI responds, check if it's correct:

```powershell
.\format-task-for-ai.ps1 -TaskPath "arc-dataset\data\evaluation\00576224.json" -ShowAnswer
```

## Example

**You run:**
```powershell
.\format-task-for-ai.ps1 -TaskPath "arc-dataset\data\evaluation\00576224.json"
```

**Output (copy this to AI):**
```
ARC-AGI-1 Task: 00576224.json

Training Examples:
Example 1:
  Input:  [[8,6],[6,4]]
  Output: [[8,6,8,6,8,6],[6,4,6,4,6,4],[6,8,6,8,6,8],[4,6,4,6,4,6],[8,6,8,6,8,6],[6,4,6,4,6,4]]

Test Case:
  Input:  [[3,2],[7,8]]
  Output: ??? (what should this be?)

Please analyze the pattern from the training examples and provide the output grid for the test case.
```

**AI responds with solution**

**You verify:**
```powershell
.\format-task-for-ai.ps1 -TaskPath "arc-dataset\data\evaluation\00576224.json" -ShowAnswer
```

## Testing Multiple Tasks

### Random Task
```powershell
$tasks = Get-ChildItem "arc-dataset\data\evaluation\*.json"
$randomTask = $tasks | Get-Random
.\format-task-for-ai.ps1 -TaskPath $randomTask.FullName
```

### Specific Task by ID
```powershell
.\format-task-for-ai.ps1 -TaskPath "arc-dataset\data\evaluation\009d5c81.json"
```

### All Tasks (for systematic testing)
```powershell
$tasks = Get-ChildItem "arc-dataset\data\evaluation\*.json"
foreach ($task in $tasks) {
    Write-Host "`n=== $($task.Name) ===" -ForegroundColor Cyan
    .\format-task-for-ai.ps1 -TaskPath $task.FullName
    Read-Host "Press Enter for next task"
}
```

## Manual Format (if script doesn't work)

Just show the JSON directly:

```
Here's an ARC task. Solve the test case:

[paste JSON from task file]

What is the output for the test input?
```

## Tips

1. **Start with training set** - Has answers, good for practice
2. **One task at a time** - Don't overwhelm the AI
3. **Ask for explanation** - "Explain the pattern you identified"
4. **Track results** - Keep a list of correct/incorrect

That's it! The script formats everything for you to copy-paste to the AI.

