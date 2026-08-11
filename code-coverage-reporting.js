/**
 * Code Coverage Reporting System
 * Tracks and reports code coverage metrics
 * 
 * Features:
 * - Function coverage tracking
 * - Branch coverage tracking
 * - Statement coverage tracking
 * - Coverage reports (HTML, JSON, XML)
 * - Coverage thresholds
 */

class CodeCoverageReporting {
    constructor() {
        this.coverage = {
            functions: new Map(),
            branches: new Map(),
            statements: new Map()
        };
        this.thresholds = {
            functions: 80,
            branches: 75,
            statements: 80
        };
        this.init();
    }

    init() {
        this.instrumentCode();
        this.trackEvent('code_cov_initialized');
    }

    instrumentCode() {
        // This would typically be done by a build tool
        // For now, we provide a manual instrumentation API
        if (typeof window !== 'undefined') {
            window.__coverage__ = this.coverage;
        }
    }

    /**
     * Mark function as executed
     * @param {string} file - File path
     * @param {string} functionName - Function name
     */
    markFunction(file, functionName) {
        const key = `${file}:${functionName}`;
        if (!this.coverage.functions.has(key)) {
            this.coverage.functions.set(key, { count: 0, file, functionName });
        }
        this.coverage.functions.get(key).count++;
    }

    /**
     * Mark branch as executed
     * @param {string} file - File path
     * @param {number} line - Line number
     * @param {number} branch - Branch index
     */
    markBranch(file, line, branch) {
        const key = `${file}:${line}:${branch}`;
        if (!this.coverage.branches.has(key)) {
            this.coverage.branches.set(key, { count: 0, file, line, branch });
        }
        this.coverage.branches.get(key).count++;
    }

    /**
     * Mark statement as executed
     * @param {string} file - File path
     * @param {number} line - Line number
     */
    markStatement(file, line) {
        const key = `${file}:${line}`;
        if (!this.coverage.statements.has(key)) {
            this.coverage.statements.set(key, { count: 0, file, line });
        }
        this.coverage.statements.get(key).count++;
    }

    /**
     * Generate coverage report
     * @param {string} format - Report format (json, html, xml)
     */
    generateReport(format = 'json') {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.getSummary(),
            files: this.getFileCoverage(),
            thresholds: this.thresholds
        };

        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'html':
                return this.generateHTMLReport(report);
            case 'xml':
                return this.generateXMLReport(report);
            default:
                return report;
        }
    }

    getSummary() {
        const totalFunctions = this.coverage.functions.size;
        const totalBranches = this.coverage.branches.size;
        const totalStatements = this.coverage.statements.size;

        const coveredFunctions = Array.from(this.coverage.functions.values())
            .filter(f => f.count > 0).length;
        const coveredBranches = Array.from(this.coverage.branches.values())
            .filter(b => b.count > 0).length;
        const coveredStatements = Array.from(this.coverage.statements.values())
            .filter(s => s.count > 0).length;

        return {
            functions: {
                total: totalFunctions,
                covered: coveredFunctions,
                percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions * 100).toFixed(2) : 0
            },
            branches: {
                total: totalBranches,
                covered: coveredBranches,
                percentage: totalBranches > 0 ? (coveredBranches / totalBranches * 100).toFixed(2) : 0
            },
            statements: {
                total: totalStatements,
                covered: coveredStatements,
                percentage: totalStatements > 0 ? (coveredStatements / totalStatements * 100).toFixed(2) : 0
            }
        };
    }

    getFileCoverage() {
        const files = new Map();

        // Aggregate by file
        this.coverage.functions.forEach((data, key) => {
            if (!files.has(data.file)) {
                files.set(data.file, { functions: [], branches: [], statements: [] });
            }
            files.get(data.file).functions.push(data);
        });

        this.coverage.branches.forEach((data, key) => {
            if (!files.has(data.file)) {
                files.set(data.file, { functions: [], branches: [], statements: [] });
            }
            files.get(data.file).branches.push(data);
        });

        this.coverage.statements.forEach((data, key) => {
            if (!files.has(data.file)) {
                files.set(data.file, { functions: [], branches: [], statements: [] });
            }
            files.get(data.file).statements.push(data);
        });

        // Convert to object with coverage percentages
        const result = {};
        files.forEach((data, file) => {
            const funcCovered = data.functions.filter(f => f.count > 0).length;
            const branchCovered = data.branches.filter(b => b.count > 0).length;
            const stmtCovered = data.statements.filter(s => s.count > 0).length;

            result[file] = {
                functions: {
                    total: data.functions.length,
                    covered: funcCovered,
                    percentage: data.functions.length > 0 ? (funcCovered / data.functions.length * 100).toFixed(2) : 0
                },
                branches: {
                    total: data.branches.length,
                    covered: branchCovered,
                    percentage: data.branches.length > 0 ? (branchCovered / data.branches.length * 100).toFixed(2) : 0
                },
                statements: {
                    total: data.statements.length,
                    covered: stmtCovered,
                    percentage: data.statements.length > 0 ? (stmtCovered / data.statements.length * 100).toFixed(2) : 0
                }
            };
        });

        return result;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Code Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
        .percentage { font-size: 24px; font-weight: bold; }
        .pass { color: #4ade80; }
        .fail { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Code Coverage Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <div class="metric">
            <div>Functions</div>
            <div class="percentage ${parseFloat(report.summary.functions.percentage) >= this.thresholds.functions ? 'pass' : 'fail'}">
                ${report.summary.functions.percentage}%
            </div>
            <div>${report.summary.functions.covered}/${report.summary.functions.total}</div>
        </div>
        <div class="metric">
            <div>Branches</div>
            <div class="percentage ${parseFloat(report.summary.branches.percentage) >= this.thresholds.branches ? 'pass' : 'fail'}">
                ${report.summary.branches.percentage}%
            </div>
            <div>${report.summary.branches.covered}/${report.summary.branches.total}</div>
        </div>
        <div class="metric">
            <div>Statements</div>
            <div class="percentage ${parseFloat(report.summary.statements.percentage) >= this.thresholds.statements ? 'pass' : 'fail'}">
                ${report.summary.statements.percentage}%
            </div>
            <div>${report.summary.statements.covered}/${report.summary.statements.total}</div>
        </div>
    </div>
    <h2>File Coverage</h2>
    <table>
        <tr>
            <th>File</th>
            <th>Functions</th>
            <th>Branches</th>
            <th>Statements</th>
        </tr>
        ${Object.entries(report.files).map(([file, data]) => `
            <tr>
                <td>${file}</td>
                <td>${data.functions.percentage}%</td>
                <td>${data.branches.percentage}%</td>
                <td>${data.statements.percentage}%</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>
        `;
    }

    generateXMLReport(report) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<coverage>
    <summary>
        <functions>
            <total>${report.summary.functions.total}</total>
            <covered>${report.summary.functions.covered}</covered>
            <percentage>${report.summary.functions.percentage}</percentage>
        </functions>
        <branches>
            <total>${report.summary.branches.total}</total>
            <covered>${report.summary.branches.covered}</covered>
            <percentage>${report.summary.branches.percentage}</percentage>
        </branches>
        <statements>
            <total>${report.summary.statements.total}</total>
            <covered>${report.summary.statements.covered}</covered>
            <percentage>${report.summary.statements.percentage}</percentage>
        </statements>
    </summary>
    <files>
        ${Object.entries(report.files).map(([file, data]) => `
        <file path="${file}">
            <functions percentage="${data.functions.percentage}"/>
            <branches percentage="${data.branches.percentage}"/>
            <statements percentage="${data.statements.percentage}"/>
        </file>
        `).join('')}
    </files>
</coverage>`;
    }

    /**
     * Check if coverage meets thresholds
     */
    checkThresholds() {
        const summary = this.getSummary();
        const passed = 
            parseFloat(summary.functions.percentage) >= this.thresholds.functions &&
            parseFloat(summary.branches.percentage) >= this.thresholds.branches &&
            parseFloat(summary.statements.percentage) >= this.thresholds.statements;

        if (!passed) {
            console.warn('⚠️ Coverage thresholds not met:', {
                functions: `${summary.functions.percentage}% (required: ${this.thresholds.functions}%)`,
                branches: `${summary.branches.percentage}% (required: ${this.thresholds.branches}%)`,
                statements: `${summary.statements.percentage}% (required: ${this.thresholds.statements}%)`
            });
        }

        return passed;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`code_cov_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.codeCoverage = new CodeCoverageReporting();
}

