## spa-state-management

Tiny, framework-agnostic state and event utilities for micro frontends (MFEs) and SPA architectures.

- **Dynamic store**: add/remove/replace reducers at runtime
- **Event bus**: simple pub/sub across MFEs without tight coupling
- **Namespaced actions**: prevent type collisions across teams

Works great when you have multiple independently deployed SPAs (e.g., SPA1, SPA2) sharing state or communicating via events in a host shell.

### Install

```bash
npm install spa-state-management
# or
yarn add spa-state-management
# or
pnpm add spa-state-management
```

### TypeScript Support

This package ships with types. No extra config is required.

---

## Quick Start

```ts
import { createDynamicStore, createEventBus } from 'spa-state-management';

// Shell app (host)
const store = createDynamicStore();
const bus = createEventBus();

// Subscribe to state changes
const unsubscribe = store.subscribe(() => {
  console.log('state changed', store.getState());
});

// Later: unsubscribe();
```

---

## Example: SPA1 + SPA2 in a Micro Frontend setup

Below is a minimal end-to-end example showing:
- Shell creates a single `store` and `bus`
- SPA1 registers `counter` reducer and dispatches actions
- SPA2 registers `todos` reducer, listens to SPA1 events via the bus, and can react or dispatch

### Shell (Host) – exposes store and bus

```ts
// shell/store.ts
import { createDynamicStore, createEventBus } from 'spa-state-management';

export const store = createDynamicStore();
export const bus = createEventBus<'counter/incremented' | 'todos/added'>();

// Example: make them available via global, module federation, or a DI container
(window as any).__APP_STORE__ = store;
(window as any).__APP_BUS__ = bus;
```

### SPA1 – Counter feature

```ts
// spa1/counter.ts
import { Action } from 'spa-state-management';

type CounterState = { value: number };

const initialState: CounterState = { value: 0 };

export const counterReducer = (
  state: CounterState = initialState,
  action: Action
): CounterState => {
  switch (action.type) {
    case 'counter/increment':
      return { value: state.value + 1 };
    case 'counter/decrement':
      return { value: state.value - 1 };
    default:
      return state;
  }
};

export const counterActions = {
  increment: (): Action<'counter/increment'> => ({ type: 'counter/increment' }),
  decrement: (): Action<'counter/decrement'> => ({ type: 'counter/decrement' })
};
```

```ts
// spa1/bootstrap.ts
import { store, bus } from '../shell/store';
import { counterReducer, counterActions } from './counter';

// Register reducer at runtime
store.addReducer('counter', counterReducer);

// Dispatch and publish an event
store.dispatch(counterActions.increment());
bus.publish('counter/incremented', { by: 1 });
```

### SPA2 – Todos feature, listens to SPA1 events

```ts
// spa2/todos.ts
import { Action } from 'spa-state-management';

type Todo = { id: string; title: string; done?: boolean };
type TodosState = { items: Todo[] };

const initialState: TodosState = { items: [] };

export const todosReducer = (
  state: TodosState = initialState,
  action: Action
): TodosState => {
  switch (action.type) {
    case 'todos/add':
      return { items: [...state.items, action.payload as Todo] };
    default:
      return state;
  }
};

export const todosActions = {
  add: (todo: Todo): Action<'todos/add', Todo> => ({ type: 'todos/add', payload: todo })
};
```

```ts
// spa2/bootstrap.ts
import { store, bus } from '../shell/store';
import { todosReducer, todosActions } from './todos';

// Register reducer at runtime
store.addReducer('todos', todosReducer);

// Listen to an event published by SPA1
const unsubscribe = bus.subscribe('counter/incremented', (payload) => {
  console.log('SPA2 saw counter increment:', payload);
  // React if needed, e.g., add a todo note
  store.dispatch(
    todosActions.add({ id: String(Date.now()), title: 'Counter incremented' })
  );
});

// Later: unsubscribe();
```

---

## Namespacing action creators

If multiple MFEs define similar action names, use `namespaceActions` to prevent collisions.

```ts
import { namespaceActions, Action } from 'spa-state-management';

const create = (title: string): Action<'create', { title: string }> => ({
  type: 'create',
  payload: { title }
});

const raw = { create };
const todoActions = namespaceActions('todos')(raw);

// todoActions.create('Read docs') -> { type: 'todos/create', payload: { title: 'Read docs' } }
```

---

## API Reference

### createDynamicStore(preloadedState?, initialReducers?)
Returns a store with runtime reducer management.

```ts
type Store<State = Record<string, unknown>> = {
  getState(): State;
  dispatch(action: Action): void;
  subscribe(listener: () => void): () => void;
  addReducer<Key extends string, S>(key: Key, reducer: (state: S | undefined, action: Action) => S): void;
  removeReducer(key: string): void;
  replaceReducers(reducers: Record<string, Reducer<any, any>>): void;
  destroy(): void;
};
```

- `addReducer(key, reducer)`: Registers a new slice and dispatches `@@init/${key}`
- `removeReducer(key)`: Unregisters and prunes that key from state
- `replaceReducers(map)`: Reconcile to match exactly the provided map
- `subscribe(fn)`: Listen to any state change

### createEventBus<Topics extends string = string>()
Simple pub/sub bus.

```ts
type EventBus<Topics extends string = string> = {
  subscribe(topic: Topics, listener: (payload: unknown) => void): () => void;
  publish(topic: Topics, payload?: unknown): void;
  clear(): void;
};
```

### namespaceActions(namespace)
Wraps action creators so their `type` is automatically prefixed with `namespace/`.

```ts
const wrap = namespaceActions('todos');
const actions = wrap({ create: (title: string) => ({ type: 'create', payload: { title } }) });
// actions.create('x') -> { type: 'todos/create', payload: { title: 'x' } }
```

### Types

```ts
type Action<Type extends string = string, Payload = unknown> = {
  type: Type;
  payload?: Payload;
  meta?: Record<string, unknown>;
  error?: boolean;
};

type Reducer<S = unknown, A extends Action = Action> = (state: S | undefined, action: A) => S;
```

---

## Patterns and Tips

- Use one `createDynamicStore` per application shell; let MFEs register slices on mount.
- Prefer `namespaceActions` for teams to avoid action `type` collisions.
- Use the `EventBus` for cross-MFE communication that is not stateful, e.g., notifications, intents.
- Keep reducers pure; side effects should happen in your app layer or via listeners.

---

## License

MIT


