// src/store/reducerManager.ts
function combineReducers(map) {
  return (state = {}, action) => {
    let hasChanged = false;
    const nextState = {};
    for (const key of Object.keys(map)) {
      const reducer = map[key];
      const previousForKey = state[key];
      const nextForKey = reducer(previousForKey, action);
      nextState[key] = nextForKey;
      hasChanged || (hasChanged = nextForKey !== previousForKey);
    }
    for (const key of Object.keys(state)) {
      if (!(key in map)) {
        nextState[key] = state[key];
      }
    }
    return hasChanged ? nextState : state;
  };
}
function createReducerManager(initialReducers = {}) {
  let reducers = { ...initialReducers };
  let combined = combineReducers(reducers);
  return {
    getReducerMap() {
      return { ...reducers };
    },
    add(key, reducer) {
      if (!key || reducers[key]) return;
      reducers = { ...reducers, [key]: reducer };
      combined = combineReducers(reducers);
    },
    remove(key) {
      if (!key || !reducers[key]) return;
      const { [key]: _removed, ...rest } = reducers;
      reducers = rest;
      combined = combineReducers(reducers);
    },
    reduce(state, action) {
      return combined(state, action);
    }
  };
}

// src/store/createDynamicStore.ts
function createDynamicStore(preloadedState = {}, initialReducers = {}) {
  const reducerManager = createReducerManager(initialReducers);
  let currentState = { ...preloadedState };
  let isDispatching = false;
  const listeners = /* @__PURE__ */ new Set();
  let destroyed = false;
  function assertNotDestroyed() {
    if (destroyed) throw new Error("Store has been destroyed");
  }
  function getState() {
    assertNotDestroyed();
    return currentState;
  }
  function subscribe(listener) {
    assertNotDestroyed();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  function dispatch(action) {
    assertNotDestroyed();
    if (typeof action?.type !== "string") {
      throw new Error("Action must be an object with a string type");
    }
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions");
    }
    try {
      isDispatching = true;
      currentState = reducerManager.reduce(currentState, action);
    } finally {
      isDispatching = false;
    }
    for (const l of Array.from(listeners)) l();
  }
  function addReducer(key, reducer) {
    assertNotDestroyed();
    reducerManager.add(String(key), reducer);
    dispatch({ type: `@@init/${key}` });
  }
  function removeReducer(key) {
    assertNotDestroyed();
    reducerManager.remove(key);
    if (key in currentState) {
      const { [key]: _removed, ...rest } = currentState;
      currentState = rest;
      for (const l of Array.from(listeners)) l();
    }
  }
  function replaceReducers(reducers) {
    assertNotDestroyed();
    const keys = Object.keys(reducers);
    for (const existing of Object.keys(reducerManager.getReducerMap())) {
      if (!keys.includes(existing)) removeReducer(existing);
    }
    for (const key of keys) {
      addReducer(key, reducers[key]);
    }
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    listeners.clear();
    currentState = {};
  }
  dispatch({ type: "@@dynamic-store/INIT" });
  return {
    getState,
    dispatch,
    subscribe,
    addReducer,
    removeReducer,
    replaceReducers,
    destroy
  };
}

// src/eventBus.ts
function createEventBus() {
  const topicToListeners = /* @__PURE__ */ new Map();
  function subscribe(topic, listener) {
    const set = topicToListeners.get(topic) ?? /* @__PURE__ */ new Set();
    set.add(listener);
    topicToListeners.set(topic, set);
    return () => set.delete(listener);
  }
  function publish(topic, payload) {
    const set = topicToListeners.get(topic);
    if (!set) return;
    for (const l of Array.from(set)) l(payload);
  }
  function clear() {
    topicToListeners.clear();
  }
  return { subscribe, publish, clear };
}

// src/namespace.ts
function namespaceActions(namespace) {
  return function wrap(creators) {
    const wrapped = {};
    for (const key of Object.keys(creators)) {
      const orig = creators[key];
      wrapped[key] = ((...args) => {
        const a = orig(...args);
        return { ...a, type: `${namespace}/${a.type}` };
      });
    }
    return wrapped;
  };
}
export {
  createDynamicStore,
  createEventBus,
  createReducerManager,
  namespaceActions
};
