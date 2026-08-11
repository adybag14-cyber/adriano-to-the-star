class IncidentResponse {
  constructor() { this.incidents = []; this.playbooks = new Map(); this.team = []; }
  createIncident(type, severity, description, reporter='system') {
    const incident = {
      id: Date.now() + Math.random(),
      type,
      severity,
      description,
      reporter,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignedTo: null,
      timeline: [{
        timestamp: Date.now(),
        event: 'incident_created',
        details: { description }
      }]
    };
    this.incidents.push(incident);
    return incident.id;
  }
  assignIncident(incidentId, assignee) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return false;
    incident.assignedTo = assignee;
    incident.updatedAt = Date.now();
    incident.timeline.push({
      timestamp: Date.now(),
      event: 'assigned',
      details: { assignee }
    });
    return true;
  }
  updateStatus(incidentId, status) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return false;
    const oldStatus = incident.status;
    incident.status = status;
    incident.updatedAt = Date.now();
    incident.timeline.push({
      timestamp: Date.now(),
      event: 'status_changed',
      details: { oldStatus, newStatus: status }
    });
    return true;
  }
  addTimelineEvent(incidentId, event, details={}) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return false;
    incident.timeline.push({
      timestamp: Date.now(),
      event,
      details
    });
    incident.updatedAt = Date.now();
    return true;
  }
  getIncidents(filters={}) {
    return this.incidents.filter(incident => {
      if (filters.type && incident.type !== filters.type) return false;
      if (filters.severity && incident.severity !== filters.severity) return false;
      if (filters.status && incident.status !== filters.status) return false;
      if (filters.assignedTo && incident.assignedTo !== filters.assignedTo) return false;
      return true;
    });
  }
  getIncident(id) {
    return this.incidents.find(i => i.id === id);
  }
  createPlaybook(name, steps) {
    this.playbooks.set(name, { name, steps, createdAt: Date.now() });
  }
  getPlaybook(name) {
    return this.playbooks.get(name);
  }
  runPlaybook(incidentId, playbookName) {
    const playbook = this.playbooks.get(playbookName);
    if (!playbook) return false;
    const incident = this.getIncident(incidentId);
    if (!incident) return false;
    playbook.steps.forEach((step, index) => {
      this.addTimelineEvent(incidentId, `playbook_step_${index}`, { step: step.description });
    });
    return true;
  }
  getStats() {
    const stats = {
      total: this.incidents.length,
      byStatus: {},
      bySeverity: {},
      byType: {},
      byAssignee: {},
      avgResolutionTime: 0
    };
    this.incidents.forEach(incident => {
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;
      if (incident.assignedTo) {
        stats.byAssignee[incident.assignedTo] = (stats.byAssignee[incident.assignedTo] || 0) + 1;
      }
    });
    return stats;
  }
}
window.IncidentResponse = IncidentResponse;