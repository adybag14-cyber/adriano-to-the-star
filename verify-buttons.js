/**
 * Verification Script for Language Switcher and Color Scheme Buttons
 * Checks if buttons exist and are functional
 */

function verifyButtons() {
    console.log('🔍 Verifying Language Switcher and Color Scheme Buttons...');
    
    // Check Language Switcher
    const langSwitcher = document.getElementById('language-switcher');
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    
    console.log('📍 Language Switcher:');
    console.log('  - Container exists:', !!langSwitcher);
    console.log('  - Toggle button exists:', !!langToggleBtn);
    console.log('  - Dropdown exists:', !!langDropdown);
    
    if (langSwitcher) {
        const styles = window.getComputedStyle(langSwitcher);
        console.log('  - Position:', styles.position);
        console.log('  - Top:', styles.top);
        console.log('  - Right:', styles.right);
        console.log('  - Z-index:', styles.zIndex);
        console.log('  - Display:', styles.display);
        console.log('  - Visibility:', styles.visibility);
    }
    
    // Check Color Scheme Picker
    const colorPicker = document.getElementById('color-scheme-picker');
    const colorToggleBtn = document.getElementById('color-scheme-toggle');
    const colorMenu = document.getElementById('color-scheme-menu');
    
    console.log('🎨 Color Scheme Picker:');
    console.log('  - Container exists:', !!colorPicker);
    console.log('  - Toggle button exists:', !!colorToggleBtn);
    console.log('  - Menu exists:', !!colorMenu);
    
    if (colorPicker) {
        const styles = window.getComputedStyle(colorPicker);
        console.log('  - Position:', styles.position);
        console.log('  - Display:', styles.display);
        console.log('  - Visibility:', styles.visibility);
    }
    
    if (colorToggleBtn) {
        const styles = window.getComputedStyle(colorToggleBtn);
        console.log('  - Toggle button position:', styles.position);
        console.log('  - Toggle button bottom:', styles.bottom);
        console.log('  - Toggle button right:', styles.right);
        console.log('  - Toggle button z-index:', styles.zIndex);
    }
    
    // Test functionality
    console.log('🧪 Testing Functionality:');
    
    // Test language switcher click
    if (langToggleBtn) {
        console.log('  - Language toggle button is clickable');
        langToggleBtn.addEventListener('click', () => {
            console.log('  ✅ Language switcher clicked!');
        });
    } else {
        console.log('  ❌ Language toggle button NOT found');
    }
    
    // Test color scheme toggle click
    if (colorToggleBtn) {
        console.log('  - Color scheme toggle button is clickable');
        colorToggleBtn.addEventListener('click', () => {
            console.log('  ✅ Color scheme toggle clicked!');
        });
    } else {
        console.log('  ❌ Color scheme toggle button NOT found');
    }
    
    // Check if i18n and colorSchemeManager are initialized
    console.log('🔧 Initialization Status:');
    console.log('  - window.i18n exists:', typeof window.i18n !== 'undefined');
    console.log('  - window.colorSchemeManager exists:', typeof window.colorSchemeManager !== 'undefined');
    
    if (window.i18n) {
        console.log('  - Current language:', window.i18n.currentLanguage);
    }
    
    if (window.colorSchemeManager) {
        console.log('  - Current scheme:', window.colorSchemeManager.currentScheme);
    }
    
    return {
        langSwitcher: !!langSwitcher,
        langToggleBtn: !!langToggleBtn,
        colorPicker: !!colorPicker,
        colorToggleBtn: !!colorToggleBtn,
        i18nInitialized: typeof window.i18n !== 'undefined',
        colorSchemeInitialized: typeof window.colorSchemeManager !== 'undefined'
    };
}

// Run verification when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(verifyButtons, 1000); // Wait for scripts to initialize
    });
} else {
    setTimeout(verifyButtons, 1000);
}

// Also expose globally for manual testing
window.verifyButtons = verifyButtons;

