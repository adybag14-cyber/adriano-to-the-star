class IamSystem {
  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Set();
  }
  async init() {}
  addPermission(perm) {
    this.permissions.add(String(perm));
  }
  addRole(name, perms) {
    this.roles.set(String(name), new Set((perms || []).map(p => String(p))));
  }
  addUser(id, roleNames) {
    this.users.set(String(id), new Set((roleNames || []).map(r => String(r))));
  }
  grantRole(id, roleName) {
    const r = this.users.get(String(id));
    if (!r) return false;
    r.add(String(roleName));
    return true;
  }
  revokeRole(id, roleName) {
    const r = this.users.get(String(id));
    if (!r) return false;
    r.delete(String(roleName));
    return true;
  }
  can(id, perm) {
    const roles = this.users.get(String(id));
    if (!roles) return false;
    const p = String(perm);
    for (const rn of roles) {
      const set = this.roles.get(rn);
      if (set && set.has(p)) return true;
    }
    return false;
  }
}
window.IamSystem = IamSystem;
