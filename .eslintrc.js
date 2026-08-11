module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    globals: {
        // --- Core Libraries ---
        THREE: 'readonly',
        $: 'readonly',
        jQuery: 'readonly',
        supabase: 'readonly',
        ethers: 'readonly',
        LivekitClient: 'readonly',
        
        // --- Project Systems ---
        ExoplanetPioneer: 'readonly',
        OptimizedDatabase: 'readonly',
        SentientLifeEngine: 'readonly',
        InterstellarTradeSystem: 'readonly',
        WebGPURenderer: 'readonly',
        BuildingArchitect: 'readonly',
        
        // --- WebXR & Hardware APIs ---
        GPUBufferUsage: 'readonly',
        GPUTextureUsage: 'readonly',
        XRSession: 'readonly',
        RTCPeerConnection: 'readonly'
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        // Allow unused variables if they start with an underscore (common for error handling)
        'no-unused-vars': ['warn', { 
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_' 
        }],
        'no-console': 'off',
        'no-undef': 'warn', // Downgrade to warn for legacy scripts
        'indent': ['off'], // Disable strict indent to match existing diverse styles
        'quotes': ['warn', 'single', { 'avoidEscape': true }],
        'semi': ['error', 'always'],
        'no-empty': 'warn',
        'no-useless-escape': 'off'
    }
};

