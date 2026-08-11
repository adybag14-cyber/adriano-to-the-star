class AccessControlMatrix {
  constructor() { this.matrix = new Map(); this.roles = new Set(); this.resources = new Set(); }
  addRole(role) { this.roles.add(role); return true; }
  addResource(resource) { this.resources.add(resource); return true; }
  grant(role, resource, actions) {
    const key = `${role}:${resource}`;
    this.matrix.set(key, actions);
    return true;
  }
  revoke(role, resource) {
    const key = `${role}:${resource}`;
    return this.matrix.delete(key);
  }
  can(role, resource, action) {
    const key = `${role}:${resource}`;
    const actions = this.matrix.get(key);
    if (!actions) return false;
    return actions.includes(action) || actions.includes('*');
  }
  getPermissions(role, resource) {
    const key = `${role}:${resource}`;
    return this.matrix.get(key) || [];
  }
  getRolePermissions(role) {
    const permissions = {};
    this.resources.forEach(resource => {
      const perms = this.getPermissions(role, resource);
      if (perms.length > 0) permissions[resource] = perms;
    });
    return permissions;
  }
  getResourcePermissions(resource) {
    const permissions = {};
    this.roles.forEach(role => {
      const perms = this.getPermissions(role, resource);
      if (perms.length > 0) permissions[role] = perms;
    });
    return permissions;
  }
  getRoles() { return Array.from(this.roles); }
  getResources() { return Array.from(this.resources); }
  hasRole(role) { return this.roles.has(role); }
  hasResource(resource) { return this.resources.has(resource); }
  removeRole(role) {
    if (!this.roles.has(role)) return false;
    this.roles.delete(role);
    const keysToDelete = [];
    for (const key of this.matrix.keys()) {
      if (key.startsWith(`${role}:`)) keysToDelete.push(key);
    }
    keysToDelete.forEach(key => this.matrix.delete(key));
    return true;
  }
  removeResource(resource) {
    if (!this.resources.has(resource)) return false;
    this.resources.delete(resource);
    const keysToDelete = [];
    for (const key of this.matrix.keys()) {
      if (key.endsWith(`:${resource}`)) keysToDelete.push(key);
    }
    keysToDelete.forEach(key => this.matrix.delete(key));
    return true;
  }
  exportMatrix() {
    const exportData = {};
    for (const [key, actions] of this.matrix.entries()) {
      const [role, resource] = key.split(':');
      if (!exportData[role]) exportData[role] = {};
      exportData[role][resource] = actions;
    }
    return exportData;
  }
  importMatrix(data) {
    for (const role in data) {
      this.addRole(role);
      for (const resource in data[role]) {
        this.addResource(resource);
        this.grant(role, resource, data[role][resource]);
      }
    }
    return true;
  }
}
window.AccessControlMatrix = AccessControlMatrix;