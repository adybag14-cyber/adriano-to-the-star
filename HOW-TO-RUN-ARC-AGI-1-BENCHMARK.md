# How to Run ARC-AGI-1 Benchmark

## Prerequisites

✅ **Already Set Up:**
- ARC dataset cloned to `arc-dataset/` directory
- 400 evaluation tasks available in `arc-dataset/data/evaluation/`
- Python solvers created (`arc-solver.py` and `arc-solver-advanced.py`)

## Quick Start

### Option 1: Run the Advanced Solver (Recommended)

```bash
python arc-solver-advanced.py
```

This will:
1. Test on 3 specific tasks first (for verification)
2. Run on all 400 evaluation tasks
3. Show progress every 50 tasks
4. Save results to `arc-agi-1-advanced-results.json`

### Option 2: Run the Basic Solver

```bash
python arc-solver.py
```

This is a simpler solver with fewer patterns (currently 0% accuracy).

## Understanding the Benchmark

### Task Structure

Each task is a JSON file with:
- **`train`**: 3-5 example input/output pairs (for learning the pattern)
- **`test`**: 1+ test input(s) where you need to predict the output

### Example Task Format

```json
{
  "train": [
    {
      "input": [[0, 1], [1, 0]],
      "output": [[0, 1, 0, 1], [1, 0, 1, 0]]
    }
  ],
  "test": [
    {
      "input": [[2, 3], [3, 2]],
      "output": [[2, 3, 2, 3], [3, 2, 3, 2]]  // This is what you need to predict
    }
  ]
}
```

### Grid Format

- Grids are 2D arrays (lists of lists)
- Each cell contains an integer from 0-9
- 0 = background/empty
- 1-9 = different colors/shapes

## Running Custom Evaluations

### Test on Specific Tasks

You can modify the solver to test on specific tasks:

```python
# In arc-solver-advanced.py, modify the test_tasks list:
test_tasks = [
    "arc-dataset/data/evaluation/00576224.json",
    "arc-dataset/data/evaluation/009d5c81.json",
    # Add more task IDs here
]
```

### Test on Training Set First

The training set (`arc-dataset/data/training/`) has 400 tasks with known solutions - use these to develop and test your solver before running on the evaluation set.

## Output Format

### Results JSON Structure

```json
{
  "test_accuracy": 0.24,
  "task_accuracy": 0.25,
  "total_correct": 1,
  "total_tests": 419,
  "all_correct_tasks": 1,
  "total_tasks": 400,
  "results": [
    {
      "task": "00576224.json",
      "all_correct": true,
      "correct": 1,
      "total": 1
    },
    ...
  ]
}
```

## Benchmark Rules

1. **No Peeking**: Don't look at evaluation tasks during development
2. **3 Trials**: You get 3 attempts per test input (not enforced in our solver)
3. **Exact Match**: Solutions must match exactly - all cells must be correct
4. **Grid Size**: You must predict the correct output grid dimensions

## Current Solver Status

### Implemented Patterns
- ✅ 2x2 Grid Repeat Pattern
- ⚠️ Color Replacement (partial)
- ⚠️ Fill Rectangles (partial)

### Current Performance
- **Score: 0.24% (1/419 correct)**
- **Fully Solved Tasks: 1/400**

## Improving the Solver

### To Add New Patterns:

1. **Identify the pattern** from training examples
2. **Create a pattern function** in `arc-solver-advanced.py`:
   ```python
   def pattern_your_pattern_name(input_grid, train_pairs):
       # Your pattern logic here
       return output_grid
   ```
3. **Add it to `solve_task_advanced()`**:
   ```python
   if solution is None:
       solution = pattern_your_pattern_name(test_input, train_pairs)
   ```
4. **Test on training set** first
5. **Run on evaluation set** when confident

### Testing Workflow

```bash
# 1. Test on training set (has known answers)
python -c "
from arc_solver_advanced import *
task = load_task('arc-dataset/data/training/00d62c1b.json')
solutions = solve_task_advanced(task)
print('Correct!' if grids_equal(solutions[0], task['test'][0]['output']) else 'Wrong')
"

# 2. Run full evaluation
python arc-solver-advanced.py
```

## Visualization (Optional)

You can use the provided HTML interface to manually view tasks:

```bash
# Open in browser:
start arc-dataset/apps/testing_interface.html
```

Then load any task JSON file to see the grids visually.

## Next Steps

1. **Run the benchmark**: `python arc-solver-advanced.py`
2. **Review results**: Check `arc-agi-1-advanced-results.json`
3. **Identify failures**: Look at tasks that failed
4. **Add patterns**: Implement solutions for common failure cases
5. **Iterate**: Repeat until satisfied with performance

## Tips for Success

- Start with simple patterns (copy, repeat, fill)
- Use training set to develop patterns
- Test incrementally - don't wait for full evaluation
- Look for common transformations (rotation, reflection, color changes)
- Consider spatial relationships (above, below, inside, outside)

## Resources

- **Dataset**: `arc-dataset/` (already cloned)
- **Documentation**: `arc-dataset/README.md`
- **Progress Report**: `ARC-AGI-1-MANUAL-SOLVING-PROGRESS.md`
- **Results**: `arc-agi-1-advanced-results.json`

