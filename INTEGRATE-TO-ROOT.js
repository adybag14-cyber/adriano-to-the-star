// Agent 6 - Root Folder Integration Script
// Copy this file to your main project root and include it in your HTML

(function () {
  'use strict';

  // Configuration - adjust paths as needed for your project structure
  const AGENT6_CONFIG = {
    basePath: './agent6/', // Path from root to agent6 directory
    autoInitialize: true,
    debug: true
  };

  // Integration helper
  const Agent6Integration = {
    isLoaded: false,
    modules: {},

    trackEvent(eventName, data = {}) {
      try {
        if (typeof window !== 'undefined' && window.performanceMonitoring) {
          window.performanceMonitoring.recordMetric("i_nt_eg_ra_te-t_o-r_oo_t_" + eventName, 1, data);
        }
      } catch (e) { /* Silent fail */ }
    },

    // Initialize Agent 6 integration
    async init() {
      this.trackEvent('i_nt_eg_ra_te-t_o-r_oo_t_initialized');

      try {
        // Check if Agent 6 is already available
        if (window.Agent6) {
          console.log('✅ Agent 6 already available globally');
          this.isLoaded = true;
          return window.Agent6;
        }


        // Load the Agent 6 integration script
        await this.loadScript(AGENT6_CONFIG.basePath + 'ROOT-INTEGRATION.js');

        // Wait for Agent 6 to be available
        let attempts = 0;
        const maxAttempts = 50;

        while (!window.Agent6 && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.Agent6) {
          throw new Error('Agent 6 failed to load after ' + maxAttempts + ' attempts');
        }

        this.isLoaded = true;
        console.log('✅ Agent 6 Root Integration loaded successfully!');

        // Auto-initialize if configured
        if (AGENT6_CONFIG.autoInitialize) {
          await window.Agent6.initialize();
        }

        return window.Agent6;

      } catch (error) {
        console.error('❌ Agent 6 Root Integration failed:', error);
        throw error;
      }
    },

    // Load a script dynamically
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => {
          console.log(`📄 Script loaded: ${src}`);
          resolve();
        };

        script.onerror = () => {
          console.error(`❌ Failed to load script: ${src}`);
          reject(new Error(`Failed to load script: ${src}`));
        };

        document.head.appendChild(script);
      });
    },

    // Quick access to common modules
    async getLeadScoring() {
      await this.ensureLoaded();
      await window.Agent6.loadModule('LeadScoring');
      return window.Agent6.createInstance('LeadScoring');
    },

    async getIAM() {
      await this.ensureLoaded();
      await window.Agent6.loadModule('IamSystem');
      return window.Agent6.createInstance('IamSystem');
    },

    async getBlockchainWallet() {
      await this.ensureLoaded();
      await window.Agent6.loadModule('BlockchainWallet');
      return window.Agent6.createInstance('BlockchainWallet');
    },

    async getComputerVision() {
      await this.ensureLoaded();
      await window.Agent6.loadModule('ComputerVision');
      return window.Agent6.createInstance('ComputerVision');
    },

    async getModal() {
      await this.ensureLoaded();
      await window.Agent6.loadModule('Modal');
      return window.Agent6.createInstance('Modal');
    },

    // Get any module by name
    async getModule(moduleName, ...args) {
      await this.ensureLoaded();
      await window.Agent6.loadModule(moduleName);
      return window.Agent6.createInstance(moduleName, ...args);
    },

    // Ensure Agent 6 is loaded
    async ensureLoaded() {
      if (!this.isLoaded) {
        await this.init();
      }
      return window.Agent6;
    },

    // Quick setup for common use cases
    async setupBusinessLogic() {
      await this.ensureLoaded();

      const modules = {
        leadScoring: await this.getLeadScoring(),
        iam: await this.getIAM(),
        analytics: await this.getModule('DataProfiling')
      };

      console.log('✅ Business logic modules ready:', Object.keys(modules));
      return modules;
    },

    async setupSecurity() {
      await this.ensureLoaded();

      const modules = {
        iam: await this.getIAM(),
        mfa: await this.getModule('MfaSystem'),
        audit: await this.getModule('SecurityAuditLog'),
        siem: await this.getModule('SiemSystem')
      };

      console.log('✅ Security modules ready:', Object.keys(modules));
      return modules;
    },

    async setupBlockchain() {
      await this.ensureLoaded();

      const modules = {
        wallet: await this.getBlockchainWallet(),
        explorer: await this.getModule('BlockchainExplorer'),
        nft: await this.getModule('NftMinting')
      };

      console.log('✅ Blockchain modules ready:', Object.keys(modules));
      return modules;
    },

    // Utility methods
    getLoadedModules() {
      return window.Agent6 ? window.Agent6.getLoadedModules() : [];
    },

    getAvailableModules() {
      return window.Agent6 ? window.Agent6.getAvailableModules() : [];
    },

    async healthCheck() {
      if (!window.Agent6) {
        return { status: 'not_loaded', modules: 0 };
      }
      return await window.Agent6.healthCheck();
    }
  };

  // Global access
  window.A6Root = Agent6Integration;
  window.Agent6Root = Agent6Integration;
  window.A6R = Agent6Integration;

  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (AGENT6_CONFIG.autoInitialize) {
        Agent6Integration.init().catch(console.error);
      }
    });
  } else {
    if (AGENT6_CONFIG.autoInitialize) {
      Agent6Integration.init().catch(console.error);
    }
  }

  console.log('🎯 Agent 6 Root Integration script loaded!');
  console.log('💡 Use window.A6Root, window.Agent6Root, or window.A6R to access integration');

})();