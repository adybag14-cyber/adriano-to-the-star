/**
 * Service Desk
 * Service desk system
 */

class ServiceDesk {
    constructor() {
        this.tickets = new Map();
        this.categories = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_er_vi_ce_de_sk_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_er_vi_ce_de_sk_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createCategory(categoryId, categoryData) {
        const category = {
            id: categoryId,
            ...categoryData,
            name: categoryData.name || categoryId,
            tickets: [],
            createdAt: new Date()
        };
        
        this.categories.set(categoryId, category);
        console.log(`Ticket category created: ${categoryId}`);
        return category;
    }

    createTicket(categoryId, ticketId, ticketData) {
        const category = this.categories.get(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        
        const ticket = {
            id: ticketId,
            categoryId,
            ...ticketData,
            title: ticketData.title || ticketId,
            description: ticketData.description || '',
            priority: ticketData.priority || 'medium',
            status: 'open',
            assignee: ticketData.assignee || null,
            createdAt: new Date()
        };
        
        this.tickets.set(ticketId, ticket);
        category.tickets.push(ticketId);
        
        return ticket;
    }

    updateTicketStatus(ticketId, status) {
        const ticket = this.tickets.get(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        
        ticket.status = status;
        ticket.updatedAt = new Date();
        
        if (status === 'resolved') {
            ticket.resolvedAt = new Date();
        } else if (status === 'closed') {
            ticket.closedAt = new Date();
        }
        
        return ticket;
    }

    getTicket(ticketId) {
        return this.tickets.get(ticketId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.serviceDesk = new ServiceDesk();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceDesk;
}

