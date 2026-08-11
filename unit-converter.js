/**
 * Unit Converter
 * 
 * Convert between different units of measurement:
 * length, weight, temperature, volume, and more.
 * 
 * @class UnitConverter
 * @example
 * // Auto-initializes on page load
 * // Access via: window.unitConverter()
 * 
 * // Convert units
 * const converter = window.unitConverter();
 * const result = converter.convert(100, 'meters', 'feet');
 */
class UnitConverter {
    constructor() {
        this.conversions = {
            length: {
                meters: 1,
                kilometers: 0.001,
                centimeters: 100,
                millimeters: 1000,
                miles: 0.000621371,
                feet: 3.28084,
                inches: 39.3701,
                yards: 1.09361,
                nauticalMiles: 0.000539957
            },
            weight: {
                kilograms: 1,
                grams: 1000,
                pounds: 2.20462,
                ounces: 35.274,
                tons: 0.001,
                stone: 0.157473
            },
            temperature: {
                celsius: 1,
                fahrenheit: 1,
                kelvin: 1
            },
            volume: {
                liters: 1,
                milliliters: 1000,
                gallons: 0.264172,
                quarts: 1.05669,
                pints: 2.11338,
                cups: 4.22675,
                fluidOunces: 33.814,
                cubicMeters: 0.001,
                cubicFeet: 0.0353147
            },
            area: {
                squareMeters: 1,
                squareKilometers: 0.000001,
                squareFeet: 10.7639,
                squareMiles: 3.861e-7,
                acres: 0.000247105,
                hectares: 0.0001
            },
            time: {
                seconds: 1,
                minutes: 1/60,
                hours: 1/3600,
                days: 1/86400,
                weeks: 1/604800,
                months: 1/2629746,
                years: 1/31556952
            }
        };
        this.init();
    }

    init() {
        // Create unit converter button
        this.createConverterButton();
        
        console.log('✅ Unit Converter initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("u_ni_tc_on_ve_rt_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create unit converter button
     * 
     * @method createConverterButton
     * @returns {void}
     */
    createConverterButton() {
        // Check if button already exists
        if (document.getElementById('unit-converter-btn')) return;

        const button = document.createElement('button');
        button.id = 'unit-converter-btn';
        button.className = 'unit-converter-btn';
        button.setAttribute('aria-label', 'Unit Converter');
        button.innerHTML = '📏';
        button.title = 'Unit Converter';
        
        button.addEventListener('click', () => this.showConverterModal());
        
        document.body.appendChild(button);
    }

    /**
     * Show unit converter modal
     * 
     * @method showConverterModal
     * @returns {void}
     */
    showConverterModal() {
        // Check if modal already exists
        let modal = document.getElementById('unit-converter-modal');
        if (modal) {
            modal.classList.add('open');
            return;
        }

        // Create modal
        modal = document.createElement('div');
        modal.id = 'unit-converter-modal';
        modal.className = 'unit-converter-modal';
        modal.innerHTML = `
            <div class="unit-converter-content">
                <div class="unit-converter-header">
                    <h3>📏 Unit Converter</h3>
                    <button class="unit-converter-close" aria-label="Close">×</button>
                </div>
                <div class="unit-converter-body">
                    <div class="converter-category">
                        <label for="converter-category">Category:</label>
                        <select id="converter-category" class="converter-select">
                            <option value="length">Length</option>
                            <option value="weight">Weight</option>
                            <option value="temperature">Temperature</option>
                            <option value="volume">Volume</option>
                            <option value="area">Area</option>
                            <option value="time">Time</option>
                        </select>
                    </div>
                    <div class="converter-inputs">
                        <div class="converter-input-group">
                            <input type="number" id="converter-value" class="converter-input" placeholder="Enter value" value="1">
                            <select id="converter-from" class="converter-select"></select>
                        </div>
                        <div class="converter-arrow">⇄</div>
                        <div class="converter-input-group">
                            <input type="number" id="converter-result" class="converter-input" readonly>
                            <select id="converter-to" class="converter-select"></select>
                        </div>
                    </div>
                    <div class="converter-actions">
                        <button class="converter-swap-btn" id="converter-swap-btn">Swap</button>
                        <button class="converter-copy-btn" id="converter-copy-btn">Copy Result</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners();

        // Initialize with default category
        this.updateCategory('length');

        // Show modal
        setTimeout(() => modal.classList.add('open'), 10);
    }

    /**
     * Setup event listeners
     * 
     * @method setupEventListeners
     * @returns {void}
     */
    setupEventListeners() {
        const modal = document.getElementById('unit-converter-modal');
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.unit-converter-close');
        closeBtn.addEventListener('click', () => this.hideConverterModal());

        // Category selector
        const categorySelect = modal.querySelector('#converter-category');
        categorySelect.addEventListener('change', (e) => {
            this.updateCategory(e.target.value);
        });

        // Value input
        const valueInput = modal.querySelector('#converter-value');
        valueInput.addEventListener('input', () => this.performConversion());

        // From/To selectors
        const fromSelect = modal.querySelector('#converter-from');
        const toSelect = modal.querySelector('#converter-to');
        fromSelect.addEventListener('change', () => this.performConversion());
        toSelect.addEventListener('change', () => this.performConversion());

        // Swap button
        const swapBtn = modal.querySelector('#converter-swap-btn');
        swapBtn.addEventListener('click', () => this.swapUnits());

        // Copy button
        const copyBtn = modal.querySelector('#converter-copy-btn');
        copyBtn.addEventListener('click', () => this.copyResult());

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideConverterModal();
            }
        });
    }

    /**
     * Hide converter modal
     * 
     * @method hideConverterModal
     * @returns {void}
     */
    hideConverterModal() {
        const modal = document.getElementById('unit-converter-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    /**
     * Update category
     * 
     * @method updateCategory
     * @param {string} category - Category name
     * @returns {void}
     */
    updateCategory(category) {
        const modal = document.getElementById('unit-converter-modal');
        if (!modal) return;

        const fromSelect = modal.querySelector('#converter-from');
        const toSelect = modal.querySelector('#converter-to');

        // Clear options
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        if (category === 'temperature') {
            // Special handling for temperature
            const tempUnits = ['celsius', 'fahrenheit', 'kelvin'];
            tempUnits.forEach(unit => {
                const option1 = document.createElement('option');
                const option2 = document.createElement('option');
                option1.value = unit;
                option2.value = unit;
                option1.textContent = this.formatUnitName(unit);
                option2.textContent = this.formatUnitName(unit);
                fromSelect.appendChild(option1);
                toSelect.appendChild(option2);
            });
        } else {
            // Regular units
            const units = Object.keys(this.conversions[category] || {});
            units.forEach(unit => {
                const option1 = document.createElement('option');
                const option2 = document.createElement('option');
                option1.value = unit;
                option2.value = unit;
                option1.textContent = this.formatUnitName(unit);
                option2.textContent = this.formatUnitName(unit);
                fromSelect.appendChild(option1);
                toSelect.appendChild(option2);
            });
        }

        // Perform conversion
        this.performConversion();
    }

    /**
     * Format unit name for display
     * 
     * @method formatUnitName
     * @param {string} unit - Unit name
     * @returns {string} Formatted unit name
     */
    formatUnitName(unit) {
        return unit
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Perform conversion
     * 
     * @method performConversion
     * @returns {void}
     */
    performConversion() {
        const modal = document.getElementById('unit-converter-modal');
        if (!modal) return;

        const category = modal.querySelector('#converter-category').value;
        const value = parseFloat(modal.querySelector('#converter-value').value) || 0;
        const from = modal.querySelector('#converter-from').value;
        const to = modal.querySelector('#converter-to').value;

        if (!from || !to) return;

        let result;

        if (category === 'temperature') {
            result = this.convertTemperature(value, from, to);
        } else {
            result = this.convert(value, category, from, to);
        }

        const resultInput = modal.querySelector('#converter-result');
        if (resultInput) {
            resultInput.value = result.toFixed(6).replace(/\.?0+$/, '');
        }
    }

    /**
     * Convert units
     * 
     * @method convert
     * @param {number} value - Value to convert
     * @param {string} category - Category name
     * @param {string} from - From unit
     * @param {string} to - To unit
     * @returns {number} Converted value
     */
    convert(value, category, from, to) {
        const conversions = this.conversions[category];
        if (!conversions || !conversions[from] || !conversions[to]) {
            return 0;
        }

        // Convert to base unit, then to target unit
        const baseValue = value / conversions[from];
        return baseValue * conversions[to];
    }

    /**
     * Convert temperature
     * 
     * @method convertTemperature
     * @param {number} value - Temperature value
     * @param {string} from - From unit
     * @param {string} to - To unit
     * @returns {number} Converted temperature
     */
    convertTemperature(value, from, to) {
        if (from === to) return value;

        // Convert to Celsius first
        let celsius = value;
        if (from === 'fahrenheit') {
            celsius = (value - 32) * 5 / 9;
        } else if (from === 'kelvin') {
            celsius = value - 273.15;
        }

        // Convert from Celsius to target
        if (to === 'fahrenheit') {
            return celsius * 9 / 5 + 32;
        } else if (to === 'kelvin') {
            return celsius + 273.15;
        }

        return celsius;
    }

    /**
     * Swap units
     * 
     * @method swapUnits
     * @returns {void}
     */
    swapUnits() {
        const modal = document.getElementById('unit-converter-modal');
        if (!modal) return;

        const fromSelect = modal.querySelector('#converter-from');
        const toSelect = modal.querySelector('#converter-to');
        const valueInput = modal.querySelector('#converter-value');
        const resultInput = modal.querySelector('#converter-result');

        // Swap select values
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;

        // Swap input values
        const tempValue = valueInput.value;
        valueInput.value = resultInput.value;
        resultInput.value = tempValue;

        // Perform conversion
        this.performConversion();
    }

    /**
     * Copy result
     * 
     * @method copyResult
     * @returns {void}
     */
    async copyResult() {
        const modal = document.getElementById('unit-converter-modal');
        if (!modal) return;

        const resultInput = modal.querySelector('#converter-result');
        const toSelect = modal.querySelector('#converter-to');
        
        if (!resultInput || !resultInput.value) return;

        const text = `${resultInput.value} ${this.formatUnitName(toSelect.value)}`;

        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Result copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy result:', error);
            this.showNotification('Failed to copy result', 'error');
        }
    }

    /**
     * Show notification
     * 
     * @method showNotification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @returns {void}
     */
    showNotification(message, type = 'info') {
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            center.show(message, {
                type,
                duration: 2000
            });
        }
    }
}

// Initialize globally
let unitConverterInstance = null;

function initUnitConverter() {
    if (!unitConverterInstance) {
        unitConverterInstance = new UnitConverter();
    }
    return unitConverterInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUnitConverter);
} else {
    initUnitConverter();
}

// Export globally
window.UnitConverter = UnitConverter;
window.unitConverter = () => unitConverterInstance;

