# How to Test ARC-AGI-1 Benchmark on AI Model (Auto)

## Overview

This guide explains how to test ARC-AGI-1 tasks directly on the AI model (Auto) in Cursor, rather than using an automated solver program.

## What is ARC-AGI-1?

ARC-AGI-1 is a benchmark of abstract reasoning tasks. Each task consists of:
- **Training examples**: 3-5 input/output grid pairs that demonstrate a pattern
- **Test input**: A new grid where you must predict the output

Grids are 2D arrays where:
- Each cell contains an integer 0-9
- 0 = background/empty
- 1-9 = different colors/shapes

## How to Test on the AI Model

### Step 1: Load a Task

Load any task JSON file from:
- Training set: `arc-dataset/data/training/` (for practice/development)
- Evaluation set: `arc-dataset/data/evaluation/` (for actual testing)

### Step 2: Present the Task to the AI

You can present tasks in several ways:

#### Method A: Show the JSON directly
```
Here's an ARC task. Look at the training examples and solve the test case:

{
  "train": [
    {"input": [[0, 1], [1, 0]], "output": [[0, 1, 0, 1], [1, 0, 1, 0]]},
    {"input": [[2, 3], [3, 2]], "output": [[2, 3, 2, 3], [3, 2, 3, 2]]}
  ],
  "test": [
    {"input": [[4, 5], [5, 4]]}
  ]
}

What is the output for the test case?
```

#### Method B: Describe the pattern
```
I have an ARC task. The pattern is:
- Input: 2x2 grid [[a, b], [c, d]]
- Output: 6x6 grid that repeats the pattern horizontally 3 times, then alternates

Training example:
Input: [[8, 6], [6, 4]]
Output: [[8, 6, 8, 6, 8, 6], [6, 4, 6, 4, 6, 4], [6, 8, 6, 8, 6, 8], [4, 6, 4, 6, 4, 6], [8, 6, 8, 6, 8, 6], [6, 4, 6, 4, 6, 4]]

Test input: [[3, 2], [7, 8]]
What should the output be?
```

#### Method C: Use a visual description
```
ARC Task: I see grids with colored cells (0-9). 

Training examples show:
- Example 1: A 2x2 grid becomes a 6x6 grid with a repeating pattern
- Example 2: Same pattern with different colors

Test case: Given input [[3, 2], [7, 8]], what's the output?
```

### Step 3: Evaluate the Response

The AI will provide:
- The predicted output grid
- Explanation of the pattern it identified
- Reasoning process

Compare the AI's output to the expected output in the task JSON file.

### Step 4: Record Results

Track:
- Task ID (filename)
- Correct/Incorrect
- Pattern type
- Notes on reasoning quality

## Example Testing Workflow

### Single Task Test

1. **Load task**:
   ```powershell
   Get-Content "arc-dataset\data\evaluation\00576224.json"
   ```

2. **Present to AI**:
   ```
   Solve this ARC task:
   
   [paste the JSON content]
   
   What is the output for the test case?
   ```

3. **Check answer**:
   - Compare AI's output to the `"output"` field in the test case
   - All cells must match exactly

### Batch Testing

For systematic testing:

1. **Select tasks** from evaluation set
2. **Present one at a time** to the AI
3. **Record results** in a spreadsheet or JSON file
4. **Calculate accuracy**: (correct / total) × 100

## Tips for Effective Testing

### 1. Start with Training Set
- Use training tasks first to see how the AI handles different patterns
- Training set has known solutions, so you can verify immediately

### 2. Present Clear Context
- Show all training examples
- Clearly indicate which is the test case
- Ask for the output grid explicitly

### 3. Test Different Pattern Types
- Simple patterns (copy, repeat, fill)
- Spatial transformations (rotation, reflection)
- Color/logic operations
- Multi-step transformations

### 4. Evaluate Reasoning
Not just correctness, but also:
- Can the AI explain the pattern?
- Does it identify the right transformation?
- Can it generalize from examples?

## Format for Presenting Tasks

### Recommended Format

```
ARC-AGI-1 Task: [task-id]

Training Examples:
Example 1:
  Input:  [[grid here]]
  Output: [[grid here]]

Example 2:
  Input:  [[grid here]]
  Output: [[grid here]]

[Continue for all training examples]

Test Case:
  Input:  [[grid here]]
  Output: ??? (what should this be?)

Please analyze the pattern from the training examples and provide the output for the test case.
```

## Quick Test Script

You can create a simple script to format tasks for the AI:

```powershell
# Format a task for AI testing
$task = Get-Content "arc-dataset\data\evaluation\00576224.json" | ConvertFrom-Json

Write-Host "ARC-AGI-1 Task: 00576224"
Write-Host ""
Write-Host "Training Examples:"
$i = 1
foreach ($example in $task.train) {
    Write-Host "Example $i`:"
    Write-Host "  Input:  $($example.input | ConvertTo-Json -Compress)"
    Write-Host "  Output: $($example.output | ConvertTo-Json -Compress)"
    Write-Host ""
    $i++
}

Write-Host "Test Case:"
Write-Host "  Input:  $($task.test[0].input | ConvertTo-Json -Compress)"
Write-Host "  Output: ???"
Write-Host ""
Write-Host "Expected: $($task.test[0].output | ConvertTo-Json -Compress)"
```

## What to Test

### Pattern Categories

1. **Repetition/Extension**: Repeat patterns, extend sequences
2. **Spatial Transformations**: Rotate, reflect, translate
3. **Color Operations**: Replace, fill, remove colors
4. **Shape Operations**: Extract, combine, modify shapes
5. **Logical Operations**: AND, OR, XOR on grids
6. **Counting/Grouping**: Count objects, group by properties
7. **Path Finding**: Connect points, find routes
8. **Object Manipulation**: Move, resize, transform objects

### Difficulty Levels

- **Easy**: Single transformation, obvious pattern
- **Medium**: Multiple steps or less obvious pattern
- **Hard**: Complex reasoning, abstract concepts
- **Very Hard**: Requires deep understanding

## Recording Results

Create a results file:

```json
{
  "test_date": "2025-01-XX",
  "model": "Auto (Cursor)",
  "results": [
    {
      "task_id": "00576224",
      "correct": true,
      "pattern_type": "repetition",
      "notes": "Correctly identified 2x2 repeat pattern"
    },
    {
      "task_id": "009d5c81",
      "correct": false,
      "pattern_type": "color_replacement",
      "notes": "Failed to determine replacement color selection"
    }
  ],
  "accuracy": 0.50
}
```

## Best Practices

1. **Don't show expected answers** when testing (except for training set)
2. **Present one task at a time** for clarity
3. **Ask for explanation** to understand reasoning
4. **Test systematically** across different pattern types
5. **Document failures** to identify weaknesses
6. **Compare to baseline** (current solver: 0.24%)

## Example Test Session

```
You: Here's an ARC task. Look at the training examples and solve the test:

[Task JSON]

AI: Looking at the training examples, I can see the pattern is...
The output should be: [[...]]

You: [Check if correct] Correct! / Incorrect, the expected output is [[...]]
```

## Next Steps

1. **Start with training set** - Practice with known answers
2. **Test evaluation set** - Real benchmark tasks
3. **Track performance** - Build a results database
4. **Analyze patterns** - See which types the AI handles well
5. **Iterate** - Test different presentation formats

## Resources

- **Tasks**: `arc-dataset/data/evaluation/` (400 tasks)
- **Training**: `arc-dataset/data/training/` (400 tasks with answers)
- **Visual Interface**: `arc-dataset/apps/testing_interface.html` (optional, for viewing grids)

The key is to present tasks clearly and systematically, then evaluate both the correctness and the quality of reasoning!

