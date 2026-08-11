#!/usr/bin/env python3
"""
ARC-AGI-1 Benchmark Solver
Attempts to solve ARC tasks by identifying patterns from training examples.
"""

import json
import os
from typing import List, Dict, Tuple, Any
import copy

def load_task(task_path: str) -> Dict:
    """Load a task JSON file."""
    with open(task_path, 'r') as f:
        return json.load(f)

def grids_equal(grid1: List[List[int]], grid2: List[List[int]]) -> bool:
    """Check if two grids are equal."""
    if len(grid1) != len(grid2):
        return False
    for i in range(len(grid1)):
        if len(grid1[i]) != len(grid2[i]):
            return False
        for j in range(len(grid1[i])):
            if grid1[i][j] != grid2[i][j]:
                return False
    return True

def get_grid_size(grid: List[List[int]]) -> Tuple[int, int]:
    """Get grid dimensions (height, width)."""
    if not grid:
        return (0, 0)
    return (len(grid), len(grid[0]) if grid[0] else 0)

def copy_grid(grid: List[List[int]]) -> List[List[int]]:
    """Deep copy a grid."""
    return [row[:] for row in grid]

def fill_hollow_shapes(input_grid: List[List[int]], fill_color: int = 4) -> List[List[int]]:
    """
    Fill hollow shapes (rectangles/circles made of one color) with another color.
    This is a common ARC pattern.
    """
    output = copy_grid(input_grid)
    height, width = get_grid_size(input_grid)
    
    # Find all non-zero colors in the grid
    colors = set()
    for row in input_grid:
        for cell in row:
            if cell != 0:
                colors.add(cell)
    
    if not colors:
        return output
    
    # For each color, try to find and fill hollow shapes
    for color in colors:
        # Simple flood fill approach: find enclosed regions
        visited = [[False] * width for _ in range(height)]
        
        def is_enclosed(y: int, x: int) -> bool:
            """Check if a cell is inside an enclosed region."""
            if y < 0 or y >= height or x < 0 or x >= width:
                return False
            if visited[y][x] or input_grid[y][x] != 0:
                return False
            return True
        
        def flood_fill(y: int, x: int, target_color: int):
            """Fill an enclosed region."""
            stack = [(y, x)]
            filled = []
            enclosed = True
            
            while stack:
                cy, cx = stack.pop()
                if cy < 0 or cy >= height or cx < 0 or cx >= width:
                    enclosed = False
                    continue
                if visited[cy][cx] or input_grid[cy][cx] != 0:
                    continue
                
                visited[cy][cx] = True
                filled.append((cy, cx))
                
                # Check neighbors
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < height and 0 <= nx < width:
                        if not visited[ny][nx] and input_grid[ny][nx] == 0:
                            stack.append((ny, nx))
                    else:
                        enclosed = False
            
            if enclosed and filled:
                for fy, fx in filled:
                    output[fy][fx] = fill_color
    
    return output

def extract_objects(grid: List[List[int]], color: int) -> List[List[Tuple[int, int]]]:
    """Extract connected components of a specific color."""
    height, width = get_grid_size(grid)
    visited = [[False] * width for _ in range(height)]
    objects = []
    
    def dfs(y: int, x: int, component: List[Tuple[int, int]]):
        if y < 0 or y >= height or x < 0 or x >= width:
            return
        if visited[y][x] or grid[y][x] != color:
            return
        
        visited[y][x] = True
        component.append((y, x))
        
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            dfs(y + dy, x + dx, component)
    
    for y in range(height):
        for x in range(width):
            if grid[y][x] == color and not visited[y][x]:
                component = []
                dfs(y, x, component)
                if component:
                    objects.append(component)
    
    return objects

def solve_hollow_fill_pattern(train_pairs: List[Dict]) -> bool:
    """
    Check if the pattern is about filling hollow shapes.
    Returns True if this pattern matches.
    """
    for pair in train_pairs:
        input_grid = pair['input']
        output_grid = pair['output']
        
        # Check if output is input with some cells filled
        height, width = get_grid_size(input_grid)
        if get_grid_size(output_grid) != (height, width):
            return False
        
        # Count how many cells changed from 0 to non-zero
        changes = 0
        for y in range(height):
            for x in range(width):
                if input_grid[y][x] == 0 and output_grid[y][x] != 0:
                    changes += 1
        
        # If many cells were filled, might be hollow fill
        if changes > 0:
            return True
    
    return False

def solve_task(task: Dict, max_trials: int = 3, verbose: bool = False) -> List[List[List[int]]]:
    """
    Solve an ARC task.
    Returns a list of output grids for each test input.
    """
    train_pairs = task['train']
    test_pairs = task['test']
    
    solutions = []
    
    for test_pair in test_pairs:
        test_input = test_pair['input']
        expected_output = test_pair.get('output', None)
        
        # Try different solving strategies
        solution = None
        
        # Strategy 1: Hollow fill pattern
        if solve_hollow_fill_pattern(train_pairs):
            solution = fill_hollow_shapes(test_input)
        
        # Strategy 2: Copy input (for tasks where output = input)
        if solution is None:
            # Check if all training examples have output == input
            all_same = True
            for pair in train_pairs:
                if not grids_equal(pair['input'], pair['output']):
                    all_same = False
                    break
            if all_same:
                solution = copy_grid(test_input)
        
        # Strategy 3: Default - return input as-is
        if solution is None:
            solution = copy_grid(test_input)
        
        solutions.append(solution)
        
        # Verify if we have expected output (only if verbose)
        if verbose and expected_output is not None:
            if grids_equal(solution, expected_output):
                print(f"[OK] Correct solution found!")
            else:
                print(f"[X] Solution doesn't match expected output")
    
    return solutions

def evaluate_on_training_set(verbose: bool = False):
    """Evaluate solver on training set to see baseline performance."""
    training_dir = "arc-dataset/data/training"
    correct = 0
    total = 0
    
    print("Evaluating on training set...")
    if not verbose:
        print("(Running silently, will show summary at end)")
    print("-" * 50)
    
    for filename in sorted(os.listdir(training_dir)):
        if not filename.endswith('.json'):
            continue
        
        task_path = os.path.join(training_dir, filename)
        task = load_task(task_path)
        
        solutions = solve_task(task, max_trials=1)  # Don't print during solve
        
        # Check if solutions match expected outputs
        for i, test_pair in enumerate(task['test']):
            if 'output' in test_pair:
                total += 1
                if grids_equal(solutions[i], test_pair['output']):
                    correct += 1
                    if verbose:
                        print(f"[OK] {filename} - Test {i+1}: CORRECT")
                else:
                    if verbose:
                        print(f"[X] {filename} - Test {i+1}: WRONG")
    
    accuracy = (correct / total * 100) if total > 0 else 0
    print("-" * 50)
    print(f"Training Set Accuracy: {correct}/{total} ({accuracy:.2f}%)")
    return accuracy

def evaluate_on_evaluation_set(limit: int = None, verbose: bool = False):
    """Evaluate solver on evaluation set (the actual benchmark)."""
    evaluation_dir = "arc-dataset/data/evaluation"
    correct = 0
    total = 0
    results = []
    
    print("\nEvaluating on evaluation set (ARC-AGI-1 Benchmark)...")
    if limit:
        print(f"Limited to first {limit} tasks for testing")
    if not verbose:
        print("(Running silently, will show summary at end)")
    print("-" * 50)
    
    filenames = sorted([f for f in os.listdir(evaluation_dir) if f.endswith('.json')])
    if limit:
        filenames = filenames[:limit]
    
    processed = 0
    for filename in filenames:
        task_path = os.path.join(evaluation_dir, filename)
        task = load_task(task_path)
        
        solutions = solve_task(task, max_trials=1)  # Don't print during solve
        
        # Check if solutions match expected outputs
        for i, test_pair in enumerate(task['test']):
            if 'output' in test_pair:
                total += 1
                is_correct = grids_equal(solutions[i], test_pair['output'])
                if is_correct:
                    correct += 1
                    if verbose:
                        print(f"[OK] {filename} - Test {i+1}: CORRECT")
                else:
                    if verbose:
                        print(f"[X] {filename} - Test {i+1}: WRONG")
                
                results.append({
                    'task': filename,
                    'test_index': i,
                    'correct': is_correct
                })
        
        processed += 1
        if processed % 50 == 0:
            print(f"Processed {processed}/{len(filenames)} tasks... ({correct}/{total} correct so far)")
    
    accuracy = (correct / total * 100) if total > 0 else 0
    print("-" * 50)
    print(f"Evaluation Set Accuracy: {correct}/{total} ({accuracy:.2f}%)")
    
    # Save results
    with open('arc-agi-1-results.json', 'w') as f:
        json.dump({
            'accuracy': accuracy,
            'correct': correct,
            'total': total,
            'results': results
        }, f, indent=2)
    
    return accuracy

if __name__ == "__main__":
    print("=" * 50)
    print("ARC-AGI-1 Benchmark Solver")
    print("=" * 50)
    
    # First, test on a few training examples
    print("\nTesting on sample training task...")
    sample_task = load_task("arc-dataset/data/training/00d62c1b.json")
    solutions = solve_task(sample_task, verbose=True)
    print(f"Generated {len(solutions)} solution(s)")
    
    # Evaluate on training set
    train_accuracy = evaluate_on_training_set(verbose=False)
    
    # Evaluate on evaluation set (the actual benchmark)
    print("\nRunning full evaluation set (this may take a while)...")
    eval_accuracy = evaluate_on_evaluation_set(limit=None, verbose=False)
    
    print("\n" + "=" * 50)
    print("FINAL RESULTS")
    print("=" * 50)
    print(f"Training Set: {train_accuracy:.2f}%")
    print(f"Evaluation Set (ARC-AGI-1): {eval_accuracy:.2f}%")
    print("\nResults saved to: arc-agi-1-results.json")
    print("=" * 50)

