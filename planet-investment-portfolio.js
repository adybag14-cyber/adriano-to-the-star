/**
 * Planet Investment Portfolio System
 * Track and manage planet investments, returns, and portfolio performance
 */

class PlanetInvestmentPortfolio {
    constructor() {
        this.portfolio = [];
        this.investments = [];
        this.currentUser = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        // Check for Supabase
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
            }
        }

        // Load portfolio data
        this.loadData();

        // Check expirations periodically
        setInterval(() => this.checkExpirations(), 60000); // Every minute

        this.isInitialized = true;
        console.log('📊 Planet Investment Portfolio initialized');
    }

    loadData() {
        try {
            const portfolioData = localStorage.getItem('planet-investment-portfolio');
            if (portfolioData) {
                this.portfolio = JSON.parse(portfolioData);
            }

            const investmentsData = localStorage.getItem('planet-investments');
            if (investmentsData) {
                this.investments = JSON.parse(investmentsData);
            }
        } catch (error) {
            console.error('Error loading portfolio data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('planet-investment-portfolio', JSON.stringify(this.portfolio));
            localStorage.setItem('planet-investments', JSON.stringify(this.investments));
        } catch (error) {
            console.error('Error saving portfolio data:', error);
        }
    }

    /**
     * Add investment to portfolio
     */
    async addInvestment(planetData, investmentAmount, purchasePrice, expectedReturn = 0, notes = '') {
        if (!this.currentUser) {
            alert('Please log in to add investments');
            return null;
        }

        const investment = {
            id: `investment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            planetData: planetData,
            userId: this.currentUser.id,
            investmentAmount: parseFloat(investmentAmount),
            purchasePrice: parseFloat(purchasePrice),
            currentPrice: parseFloat(purchasePrice), // Will be updated
            expectedReturn: parseFloat(expectedReturn), // Annual percentage
            notes: notes,
            purchaseDate: new Date().toISOString(),
            status: 'active', // active, sold, expired
            returns: [],
            totalReturn: 0,
            totalReturnPercentage: 0
        };

        this.investments.push(investment);
        this.updatePortfolio();
        this.saveData();

        // Save to Supabase if available
        if (window.supabase) {
            try {
                const { error } = await window.supabase
                    .from('planet_investments')
                    .insert({
                        investment_id: investment.id,
                        planet_kepid: planetData.kepid,
                        user_id: this.currentUser.id,
                        investment_amount: investment.investmentAmount,
                        purchase_price: investment.purchasePrice,
                        current_price: investment.currentPrice,
                        expected_return: investment.expectedReturn,
                        notes: investment.notes,
                        purchase_date: investment.purchaseDate,
                        status: investment.status
                    });

                if (error) throw error;
            } catch (error) {
                console.error('Error saving investment to Supabase:', error);
            }
        }

        console.log('✅ Investment added to portfolio:', investment.id);
        return investment;
    }

    /**
     * Update investment price and calculate returns
     */
    updateInvestmentPrice(investmentId, newPrice) {
        const investment = this.investments.find(inv => inv.id === investmentId);
        if (!investment) return false;

        const oldPrice = investment.currentPrice;
        investment.currentPrice = parseFloat(newPrice);

        // Calculate return
        const priceChange = investment.currentPrice - investment.purchasePrice;
        const returnAmount = (priceChange / investment.purchasePrice) * investment.investmentAmount;
        const returnPercentage = (priceChange / investment.purchasePrice) * 100;

        investment.totalReturn = returnAmount;
        investment.totalReturnPercentage = returnPercentage;

        // Record return entry
        investment.returns.push({
            date: new Date().toISOString(),
            price: investment.currentPrice,
            returnAmount: returnAmount,
            returnPercentage: returnPercentage
        });

        this.updatePortfolio();
        this.saveData();

        // Update Supabase
        if (window.supabase) {
            try {
                window.supabase
                    .from('planet_investments')
                    .update({
                        current_price: investment.currentPrice,
                        total_return: investment.totalReturn,
                        total_return_percentage: investment.totalReturnPercentage
                    })
                    .eq('investment_id', investmentId);
            } catch (error) {
                console.error('Error updating investment in Supabase:', error);
            }
        }

        return true;
    }

    /**
     * Sell investment
     */
    async sellInvestment(investmentId, sellPrice) {
        if (!this.currentUser) {
            alert('Please log in to sell investments');
            return false;
        }

        const investment = this.investments.find(inv => inv.id === investmentId);
        if (!investment) {
            alert('Investment not found');
            return false;
        }

        if (investment.userId !== this.currentUser.id) {
            alert('You can only sell your own investments');
            return false;
        }

        const sellPriceNum = parseFloat(sellPrice);
        const finalReturn = (sellPriceNum - investment.purchasePrice) / investment.purchasePrice * investment.investmentAmount;
        const finalReturnPercentage = (sellPriceNum - investment.purchasePrice) / investment.purchasePrice * 100;

        investment.status = 'sold';
        investment.sellPrice = sellPriceNum;
        investment.sellDate = new Date().toISOString();
        investment.finalReturn = finalReturn;
        investment.finalReturnPercentage = finalReturnPercentage;

        // Update totals
        investment.totalReturn = finalReturn;
        investment.totalReturnPercentage = finalReturnPercentage;

        this.updatePortfolio();
        this.saveData();

        // Update Supabase
        if (window.supabase) {
            try {
                const { error } = await window.supabase
                    .from('planet_investments')
                    .update({
                        status: 'sold',
                        sell_price: sellPriceNum,
                        sell_date: investment.sellDate,
                        final_return: finalReturn,
                        final_return_percentage: finalReturnPercentage
                    })
                    .eq('investment_id', investmentId);

                if (error) throw error;
            } catch (error) {
                console.error('Error updating investment sale in Supabase:', error);
            }
        }

        console.log(`✅ Investment sold. Final return: ${finalReturnPercentage.toFixed(2)}%`);
        return true;
    }

    /**
     * Update portfolio summary
     */
    updatePortfolio() {
        if (!this.currentUser) return;

        const activeInvestments = this.investments.filter(inv => 
            inv.userId === this.currentUser.id && inv.status === 'active'
        );

        const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
        const totalCurrentValue = activeInvestments.reduce((sum, inv) => 
            sum + (inv.currentPrice / inv.purchasePrice) * inv.investmentAmount, 0
        );
        const totalReturn = totalCurrentValue - totalInvested;
        const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        this.portfolio = [{
            userId: this.currentUser.id,
            totalInvested: totalInvested,
            totalCurrentValue: totalCurrentValue,
            totalReturn: totalReturn,
            totalReturnPercentage: totalReturnPercentage,
            investmentCount: activeInvestments.length,
            lastUpdated: new Date().toISOString()
        }];

        this.saveData();
    }

    /**
     * Get portfolio summary
     */
    getPortfolioSummary() {
        if (!this.currentUser) return null;
        return this.portfolio.find(p => p.userId === this.currentUser.id) || null;
    }

    /**
     * Get all investments
     */
    getMyInvestments() {
        if (!this.currentUser) return [];
        return this.investments.filter(inv => inv.userId === this.currentUser.id);
    }

    /**
     * Get active investments
     */
    getActiveInvestments() {
        if (!this.currentUser) return [];
        return this.investments.filter(inv => 
            inv.userId === this.currentUser.id && inv.status === 'active'
        );
    }

    /**
     * Get sold investments
     */
    getSoldInvestments() {
        if (!this.currentUser) return [];
        return this.investments.filter(inv => 
            inv.userId === this.currentUser.id && inv.status === 'sold'
        );
    }

    /**
     * Get top performing investments
     */
    getTopPerformers(limit = 5) {
        if (!this.currentUser) return [];
        return this.getMyInvestments()
            .filter(inv => inv.status === 'active')
            .sort((a, b) => b.totalReturnPercentage - a.totalReturnPercentage)
            .slice(0, limit);
    }

    /**
     * Get worst performing investments
     */
    getWorstPerformers(limit = 5) {
        if (!this.currentUser) return [];
        return this.getMyInvestments()
            .filter(inv => inv.status === 'active')
            .sort((a, b) => a.totalReturnPercentage - b.totalReturnPercentage)
            .slice(0, limit);
    }

    /**
     * Calculate portfolio performance over time
     */
    getPerformanceHistory(days = 30) {
        if (!this.currentUser) return [];

        const history = [];
        const now = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const investmentsOnDate = this.investments.filter(inv => {
                if (inv.userId !== this.currentUser.id || inv.status !== 'active') return false;
                const purchaseDate = new Date(inv.purchaseDate);
                return purchaseDate <= date;
            });

            const totalValue = investmentsOnDate.reduce((sum, inv) => {
                // Use historical price if available, otherwise current
                const historicalReturn = inv.returns.find(r => {
                    const returnDate = new Date(r.date);
                    return returnDate <= date && returnDate > new Date(date.getTime() - 86400000);
                });
                
                if (historicalReturn) {
                    return sum + (historicalReturn.price / inv.purchasePrice) * inv.investmentAmount;
                }
                return sum + (inv.currentPrice / inv.purchasePrice) * inv.investmentAmount;
            }, 0);

            history.push({
                date: date.toISOString(),
                value: totalValue
            });
        }

        return history;
    }

    /**
     * Check and handle expirations
     */
    checkExpirations() {
        // This can be extended to handle investment expirations if needed
        this.updatePortfolio();
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.planetInvestmentPortfolio) {
            window.planetInvestmentPortfolio = new PlanetInvestmentPortfolio();
        }
    });
}

