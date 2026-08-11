export type StateListener<T> = (state: T, previousState: T) => void;
export type StateSelector<T, R> = (state: T) => R;

export class StateStore<T extends Record<string, any>> {
  #state: T;
  #listeners: Set<StateListener<T>>;
  #selectors: Map<string, { selector: StateSelector<T, any>; listener: (value: any) => void }>;

  constructor(initialState: T) {
    this.#state = { ...initialState };
    this.#listeners = new Set();
    this.#selectors = new Map();
  }

  getState(): Readonly<T> {
    return this.#state;
  }

  setState(partialState: Partial<T> | ((state: T) => Partial<T>)): void {
    const previousState = { ...this.#state };
    
    if (typeof partialState === 'function') {
      this.#state = { ...this.#state, ...partialState(this.#state) };
    } else {
      this.#state = { ...this.#state, ...partialState };
    }

    this.#notifyListeners(previousState);
    this.#notifySelectors();
  }

  subscribe(listener: StateListener<T>): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  select<R>(key: string, selector: StateSelector<T, R>, listener: (value: R) => void): () => void {
    this.#selectors.set(key, { selector, listener });
    listener(selector(this.#state));
    return () => this.#selectors.delete(key);
  }

  #notifyListeners(previousState: T): void {
    for (const listener of this.#listeners) {
      try {
        listener(this.#state, previousState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    }
  }

  #notifySelectors(): void {
    for (const [key, { selector, listener }] of this.#selectors) {
      try {
        listener(selector(this.#state));
      } catch (error) {
        console.error(`Error in selector ${key}:`, error);
      }
    }
  }

  reset(): void {
    const previousState = { ...this.#state };
    this.#state = {} as T;
    this.#notifyListeners(previousState);
  }
}

export function createStore<T extends Record<string, any>>(initialState: T): StateStore<T> {
  return new StateStore(initialState);
}
