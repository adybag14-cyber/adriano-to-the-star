export class DIContainer {
  #services;
  #factories;
  #singletons;

  constructor() {
    this.#services = new Map();
    this.#factories = new Map();
    this.#singletons = new Map();
  }

  register(name, factory, isSingleton = true) {
    this.#factories.set(name, { factory, isSingleton });
    return this;
  }

  registerInstance(name, instance) {
    this.#singletons.set(name, instance);
    return this;
  }

  resolve(name) {
    if (this.#singletons.has(name)) {
      return this.#singletons.get(name);
    }

    if (!this.#factories.has(name)) {
      throw new Error(`Service '${name}' not registered`);
    }

    const { factory, isSingleton } = this.#factories.get(name);
    const instance = factory(this);

    if (isSingleton) {
      this.#singletons.set(name, instance);
    }

    return instance;
  }

  has(name) {
    return this.#singletons.has(name) || this.#factories.has(name);
  }

  clear() {
    this.#services.clear();
    this.#factories.clear();
    this.#singletons.clear();
  }
}

export function createContainer() {
  return new DIContainer();
}
