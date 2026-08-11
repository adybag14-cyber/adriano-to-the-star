/**
 * MQTT Broker
 * MQTT message broker implementation
 */

class MQTTBroker {
    constructor() {
        this.brokers = new Map();
        this.clients = new Map();
        this.subscriptions = new Map();
        this.messages = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_qt_tb_ro_ke_r_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_qt_tb_ro_ke_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createBroker(brokerId, brokerData) {
        const broker = {
            id: brokerId,
            ...brokerData,
            name: brokerData.name || brokerId,
            host: brokerData.host || 'localhost',
            port: brokerData.port || 1883,
            clients: [],
            topics: new Map(),
            createdAt: new Date()
        };
        
        this.brokers.set(brokerId, broker);
        console.log(`MQTT broker created: ${brokerId}`);
        return broker;
    }

    connectClient(brokerId, clientId, clientData) {
        const broker = this.brokers.get(brokerId);
        if (!broker) {
            throw new Error('Broker not found');
        }
        
        const client = {
            id: clientId,
            brokerId,
            ...clientData,
            username: clientData.username || '',
            connected: true,
            subscriptions: [],
            connectedAt: new Date(),
            createdAt: new Date()
        };
        
        this.clients.set(clientId, client);
        broker.clients.push(clientId);
        
        return client;
    }

    subscribe(brokerId, clientId, topic) {
        const broker = this.brokers.get(brokerId);
        const client = this.clients.get(clientId);
        
        if (!broker || !client) {
            throw new Error('Broker or client not found');
        }
        
        if (!client.connected) {
            throw new Error('Client is not connected');
        }
        
        const subscription = {
            id: `subscription_${Date.now()}`,
            brokerId,
            clientId,
            topic,
            qos: 0,
            createdAt: new Date()
        };
        
        this.subscriptions.set(subscription.id, subscription);
        
        if (!broker.topics.has(topic)) {
            broker.topics.set(topic, []);
        }
        broker.topics.get(topic).push(clientId);
        
        if (!client.subscriptions.includes(topic)) {
            client.subscriptions.push(topic);
        }
        
        return subscription;
    }

    async publish(brokerId, topic, message, qos = 0) {
        const broker = this.brokers.get(brokerId);
        if (!broker) {
            throw new Error('Broker not found');
        }
        
        const subscribers = broker.topics.get(topic) || [];
        
        const messageRecord = {
            id: `message_${Date.now()}`,
            brokerId,
            topic,
            message,
            qos,
            subscribers: subscribers.length,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.messages.set(messageRecord.id, messageRecord);
        
        return messageRecord;
    }

    getBroker(brokerId) {
        return this.brokers.get(brokerId);
    }

    getClient(clientId) {
        return this.clients.get(clientId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.mqttBroker = new MQTTBroker();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MQTTBroker;
}


