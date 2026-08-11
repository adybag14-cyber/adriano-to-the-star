/**
 * Task Management
 * Task management system
 */

class TaskManagement {
    constructor() {
        this.tasks = new Map();
        this.lists = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_as_km_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_as_km_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createList(listId, listData) {
        const list = {
            id: listId,
            ...listData,
            name: listData.name || listId,
            tasks: [],
            createdAt: new Date()
        };
        
        this.lists.set(listId, list);
        console.log(`Task list created: ${listId}`);
        return list;
    }

    createTask(listId, taskId, taskData) {
        const list = this.lists.get(listId);
        if (!list) {
            throw new Error('List not found');
        }
        
        const task = {
            id: taskId,
            listId,
            ...taskData,
            name: taskData.name || taskId,
            status: 'todo',
            priority: taskData.priority || 'medium',
            assignee: taskData.assignee || null,
            dueDate: taskData.dueDate || null,
            createdAt: new Date()
        };
        
        this.tasks.set(taskId, task);
        list.tasks.push(taskId);
        
        return task;
    }

    updateTaskStatus(taskId, status) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        
        task.status = status;
        task.updatedAt = new Date();
        
        if (status === 'completed') {
            task.completedAt = new Date();
        }
        
        return task;
    }

    getList(listId) {
        return this.lists.get(listId);
    }

    getTask(taskId) {
        return this.tasks.get(taskId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.taskManagement = new TaskManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskManagement;
}

