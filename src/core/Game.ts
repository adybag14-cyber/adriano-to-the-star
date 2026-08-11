import { StateStore } from './StateManager.ts';
import { DIContainer } from './DIContainer.ts';

export class Game {
  #container;
  #state;
  #isInitialized;

  constructor() {
    this.#container = new DIContainer();
    this.#state = new StateStore({
      isRunning: false,
      isPaused: false,
      currentDay: 0,
      resources: {},
      buildings: [],
      colonists: [],
      planetData: null
    });
    this.#isInitialized = false;
  }

  async initialize() {
    if (this.#isInitialized) {
      return;
    }

    this.#registerServices();
    await this.#initializeServices();

    this.#isInitialized = true;
    this.#state.setState({ isRunning: true });
  }

  #registerServices() {
    this.#container.register('state', () => this.#state);
    this.#container.register('game', () => this);
  }

  async #initializeServices() {
    const services = this.#container;
    const serviceNames = ['state', 'game'];
    for (const name of serviceNames) {
      try {
        await services.resolve(name);
      } catch (error) {
        console.error(`Failed to initialize service ${name}:`, error);
      }
    }
  }

  getState() {
    return this.#state.getState();
  }

  setState(partialState: Partial<Record<string, any>> | ((state: Record<string, any>) => Partial<Record<string, any>>)) {
    this.#state.setState(partialState);
  }

  getContainer() {
    return this.#container;
  }

  async start() {
    await this.initialize();
    this.#state.setState({ isRunning: true, isPaused: false });
  }

  pause() {
    this.#state.setState({ isPaused: true });
  }

  resume() {
    this.#state.setState({ isPaused: false });
  }

  stop() {
    this.#state.setState({ isRunning: false, isPaused: false });
  }

  isRunning() {
    return this.#state.getState().isRunning;
  }

  isPaused() {
    return this.#state.getState().isPaused;
  }
}
