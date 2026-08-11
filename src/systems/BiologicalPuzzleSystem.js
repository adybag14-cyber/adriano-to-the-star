/**
 * 🧬 Era III: Citizen Science Integration - Biological Puzzles (Folding@Home)
 * 
 * Protein folding puzzles that contribute to real scientific research
 * through engaging game mechanics similar to Foldit.
 */

class BiologicalPuzzleSystem {
    constructor(game) {
        this.game = game;
        this.activePuzzles = [];
        this.completedPuzzles = [];
        this.contributionScore = 0;
        this.proteinsFolded = 0;
        
        // Protein data sources (simulated for now, would connect to Folding@Home API)
        this.proteinSources = {
            pdb: 'https://www.rcsb.org/pdb',
            foldingathome: 'https://foldingathome.org/api'
        };
        
        console.log("🧬 Biological Puzzle System: Initializing protein folding challenges...");
    }
    
    /**
     * Creates a protein folding puzzle
     */
    createFoldingPuzzle(proteinId, difficulty = 'medium') {
        const puzzle = {
            id: this.generatePuzzleId(),
            proteinId: proteinId,
            difficulty: difficulty,
            status: 'pending',
            structure: null,
            targetEnergy: 0,
            currentEnergy: 0,
            moves: 0,
            maxMoves: this.getMaxMoves(difficulty),
            reward: this.calculateReward(difficulty),
            createdAt: Date.now()
        };
        
        this.activePuzzles.push(puzzle);
        return puzzle;
    }
    
    /**
     * Load protein structure for a puzzle
     */
    async loadProteinStructure(proteinId) {
        // Simulated protein structure data
        // In production, this would fetch from PDB or Folding@Home API
        const structures = {
            '1CRN': {
                name: 'Crambin',
                length: 46,
                type: 'protein',
                description: 'Small plant seed protein',
                initialStructure: this.generateInitialStructure(46)
            },
            '2JEF': {
                name: 'Ubiquitin',
                length: 76,
                type: 'protein',
                description: 'Regulatory protein involved in protein degradation',
                initialStructure: this.generateInitialStructure(76)
            },
            '1AON': {
                name: 'Bovine Pancreatic Trypsin Inhibitor',
                length: 58,
                type: 'protein',
                description: 'Serine protease inhibitor',
                initialStructure: this.generateInitialStructure(58)
            }
        };
        
        return structures[proteinId] || null;
    }
    
    /**
     * Generate initial protein structure (simplified)
     */
    generateInitialStructure(length) {
        const structure = [];
        for (let i = 0; i < length; i++) {
            structure.push({
                residue: i + 1,
                position: {
                    x: Math.random() * 10 - 5,
                    y: Math.random() * 10 - 5,
                    z: Math.random() * 10 - 5
                },
                rotation: {
                    phi: Math.random() * 360,
                    psi: Math.random() * 360,
                    omega: Math.random() * 360
                },
                secondaryStructure: this.assignSecondaryStructure(i, length)
            });
        }
        return structure;
    }
    
    /**
     * Assign secondary structure type (alpha helix, beta sheet, coil)
     */
    assignSecondaryStructure(index, length) {
        const rand = Math.random();
        if (rand < 0.3) return 'helix';
        if (rand < 0.6) return 'sheet';
        return 'coil';
    }
    
    /**
     * Initialize a folding puzzle with protein data
     */
    async initializePuzzle(puzzleId) {
        const puzzle = this.activePuzzles.find(p => p.id === puzzleId);
        
        if (!puzzle) {
            throw new Error('Puzzle not found');
        }
        
        const proteinData = await this.loadProteinStructure(puzzle.proteinId);
        
        if (proteinData) {
            puzzle.structure = {
                name: proteinData.name,
                length: proteinData.length,
                type: proteinData.type,
                description: proteinData.description,
                residues: proteinData.initialStructure
            };
            
            // Calculate target energy (lower is better)
            puzzle.targetEnergy = this.calculateTargetEnergy(puzzle.structure);
            puzzle.currentEnergy = this.calculateCurrentEnergy(puzzle.structure);
            
            puzzle.status = 'ready';
        }
        
        return puzzle;
    }
    
    /**
     * Make a move in the protein folding puzzle
     */
    makeMove(puzzleId, moveType, residueIndex, parameters) {
        const puzzle = this.activePuzzles.find(p => p.id === puzzleId);
        
        if (!puzzle || puzzle.status !== 'ready') {
            throw new Error('Puzzle not ready');
        }
        
        if (puzzle.moves >= puzzle.maxMoves) {
            throw new Error('Maximum moves reached');
        }
        
        // Apply the move
        this.applyMove(puzzle.structure, moveType, residueIndex, parameters);
        
        // Recalculate energy
        puzzle.currentEnergy = this.calculateCurrentEnergy(puzzle.structure);
        puzzle.moves++;
        
        // Check if puzzle is solved
        const isSolved = this.checkSolved(puzzle);
        
        if (isSolved) {
            puzzle.status = 'solved';
            this.completePuzzle(puzzle);
        }
        
        return {
            success: true,
            currentEnergy: puzzle.currentEnergy,
            movesRemaining: puzzle.maxMoves - puzzle.moves,
            isSolved: isSolved
        };
    }
    
    /**
     * Apply a move to the protein structure
     */
    applyMove(structure, moveType, residueIndex, parameters) {
        const residue = structure.residues[residueIndex];
        
        switch (moveType) {
            case 'rotate':
                // Rotate backbone dihedral angles
                residue.rotation.phi = (residue.rotation.phi + (parameters.phi || 0)) % 360;
                residue.rotation.psi = (residue.rotation.psi + (parameters.psi || 0)) % 360;
                break;
                
            case 'translate':
                // Move residue position
                residue.position.x += parameters.dx || 0;
                residue.position.y += parameters.dy || 0;
                residue.position.z += parameters.dz || 0;
                break;
                
            case 'fold':
                // Apply folding pattern
                this.applyFoldingPattern(structure, residueIndex, parameters.pattern);
                break;
                
            case 'optimize':
                // Local energy minimization
                this.localOptimize(structure, residueIndex, parameters.radius || 3);
                break;
        }
        
        // Update adjacent residues to maintain chain continuity
        this.updateAdjacentResidues(structure, residueIndex);
    }
    
    /**
     * Apply a folding pattern to a region
     */
    applyFoldingPattern(structure, startIndex, pattern) {
        const patterns = {
            'alpha_helix': {
                phi: -57,
                psi: -47,
                omega: 180
            },
            'beta_sheet': {
                phi: -135,
                psi: 135,
                omega: 180
            },
            'random_coil': {
                phi: Math.random() * 360 - 180,
                psi: Math.random() * 360 - 180,
                omega: 180
            }
        };
        
        const targetPattern = patterns[pattern] || patterns.random_coil;
        const length = Math.min(10, structure.residues.length - startIndex);
        
        for (let i = 0; i < length; i++) {
            const residue = structure.residues[startIndex + i];
            residue.rotation.phi = targetPattern.phi;
            residue.rotation.psi = targetPattern.psi;
            residue.rotation.omega = targetPattern.omega;
        }
    }
    
    /**
     * Local energy optimization around a residue
     */
    localOptimize(structure, centerIndex, radius) {
        const startIndex = Math.max(0, centerIndex - radius);
        const endIndex = Math.min(structure.residues.length, centerIndex + radius);
        
        for (let i = startIndex; i < endIndex; i++) {
            // Slight random adjustments to find lower energy state
            structure.residues[i].rotation.phi += (Math.random() - 0.5) * 10;
            structure.residues[i].rotation.psi += (Math.random() - 0.5) * 10;
        }
    }
    
    /**
     * Update adjacent residues to maintain chain continuity
     */
    updateAdjacentResidues(structure, index) {
        if (index > 0) {
            // Update previous residue's omega angle
            structure.residues[index - 1].rotation.omega = 180;
        }
        
        if (index < structure.residues.length - 1) {
            // Update next residue's position based on current
            const current = structure.residues[index];
            const next = structure.residues[index + 1];
            
            // Simple distance constraint
            const distance = 3.8; // Angstroms
            next.position.x = current.position.x + distance;
            next.position.y = current.position.y;
            next.position.z = current.position.z;
        }
    }
    
    /**
     * Calculate target energy (simplified)
     */
    calculateTargetEnergy(structure) {
        // In a real implementation, this would use molecular mechanics force fields
        // Here we use a simplified model based on secondary structure
        const helixBonus = structure.residues.filter(r => r.secondaryStructure === 'helix').length * -10;
        const sheetBonus = structure.residues.filter(r => r.secondaryStructure === 'sheet').length * -8;
        const coilPenalty = structure.residues.filter(r => r.secondaryStructure === 'coil').length * 2;
        
        return helixBonus + sheetBonus + coilPenalty - 100;
    }
    
    /**
     * Calculate current energy of the structure
     */
    calculateCurrentEnergy(structure) {
        let energy = 0;
        
        // Bond energy (simplified)
        for (let i = 0; i < structure.residues.length - 1; i++) {
            const current = structure.residues[i];
            const next = structure.residues[i + 1];
            
            const distance = Math.sqrt(
                Math.pow(next.position.x - current.position.x, 2) +
                Math.pow(next.position.y - current.position.y, 2) +
                Math.pow(next.position.z - current.position.z, 2)
            );
            
            // Penalize deviations from ideal bond length
            energy += Math.abs(distance - 3.8) * 50;
        }
        
        // Secondary structure energy
        for (const residue of structure.residues) {
            if (residue.secondaryStructure === 'helix') {
                energy -= 10;
            } else if (residue.secondaryStructure === 'sheet') {
                energy -= 8;
            } else {
                energy += 2;
            }
        }
        
        // Steric clashes (simplified)
        for (let i = 0; i < structure.residues.length; i++) {
            for (let j = i + 2; j < structure.residues.length; j++) {
                const r1 = structure.residues[i];
                const r2 = structure.residues[j];
                
                const distance = Math.sqrt(
                    Math.pow(r2.position.x - r1.position.x, 2) +
                    Math.pow(r2.position.y - r1.position.y, 2) +
                    Math.pow(r2.position.z - r1.position.z, 2)
                );
                
                if (distance < 3.0) {
                    energy += (3.0 - distance) * 100;
                }
            }
        }
        
        return energy;
    }
    
    /**
     * Check if the puzzle is solved
     */
    checkSolved(puzzle) {
        const energyDifference = Math.abs(puzzle.currentEnergy - puzzle.targetEnergy);
        const tolerance = puzzle.targetEnergy * 0.1; // 10% tolerance
        
        return energyDifference < tolerance;
    }
    
    /**
     * Complete a puzzle
     */
    completePuzzle(puzzle) {
        puzzle.completedAt = Date.now();
        
        // Calculate score based on energy and moves used
        const energyScore = Math.max(0, 1 - (Math.abs(puzzle.currentEnergy - puzzle.targetEnergy) / Math.abs(puzzle.targetEnergy)));
        const moveScore = 1 - (puzzle.moves / puzzle.maxMoves);
        const finalScore = energyScore * moveScore * puzzle.reward;
        
        puzzle.score = finalScore;
        
        // Update player stats
        this.proteinsFolded++;
        this.contributionScore += finalScore;
        
        // Move to completed
        this.completedPuzzles.push(puzzle);
        this.activePuzzles = this.activePuzzles.filter(p => p.id !== puzzle.id);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('PROTEIN_FOLDED', {
            detail: {
                puzzleId: puzzle.id,
                proteinId: puzzle.proteinId,
                score: finalScore,
                energy: puzzle.currentEnergy
            }
        }));
        
        console.log(`🧬 Protein Folded: ${puzzle.structure.name} (Score: ${finalScore.toFixed(2)})`);
    }
    
    /**
     * Get maximum moves based on difficulty
     */
    getMaxMoves(difficulty) {
        const moves = {
            'easy': 100,
            'medium': 50,
            'hard': 25
        };
        return moves[difficulty] || 50;
    }
    
    /**
     * Calculate reward based on difficulty
     */
    calculateReward(difficulty) {
        const rewards = {
            'easy': 200,
            'medium': 500,
            'hard': 1000
        };
        return rewards[difficulty] || 500;
    }
    
    /**
     * Get player's folding statistics
     */
    getFoldingStats() {
        return {
            totalScore: this.contributionScore,
            proteinsFolded: this.proteinsFolded,
            puzzlesCompleted: this.completedPuzzles.length,
            averageScore: this.completedPuzzles.length > 0
                ? this.completedPuzzles.reduce((sum, p) => sum + p.score, 0) / this.completedPuzzles.length
                : 0,
            scientificImpact: this.contributionScore * 2 // Proteins contribute more to science
        };
    }
    
    /**
     * Generate unique puzzle ID
     */
    generatePuzzleId() {
        return `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Sync folding contributions to the cloud
     */
    async syncContributions() {
        const stats = this.getFoldingStats();
        
        try {
            const response = await fetch('/api/biological-puzzles/contributions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: this.game.playerId,
                    stats: stats,
                    completedPuzzles: this.completedPuzzles
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to sync folding contributions:', error);
            return null;
        }
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.BiologicalPuzzleSystem = BiologicalPuzzleSystem;
}
