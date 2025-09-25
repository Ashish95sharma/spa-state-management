import { Action, AnyState, ReducerMap, Store } from '../types';
import { createReducerManager } from './reducerManager';

export function createDynamicStore<State extends AnyState = AnyState>(
	preloadedState: Partial<State> = {},
	initialReducers: ReducerMap = {}
): Store<State> {
	const reducerManager = createReducerManager(initialReducers);
	let currentState: AnyState = { ...preloadedState } as AnyState;
	let isDispatching = false;
	const listeners = new Set<() => void>();
	let destroyed = false;

	function assertNotDestroyed() {
		if (destroyed) throw new Error('Store has been destroyed');
	}

	function getState(): State {
		assertNotDestroyed();
		return currentState as State;
	}

	function subscribe(listener: () => void) {
		assertNotDestroyed();
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	function dispatch(action: Action) {
		assertNotDestroyed();
		if (typeof action?.type !== 'string') {
			throw new Error('Action must be an object with a string type');
		}
		if (isDispatching) {
			throw new Error('Reducers may not dispatch actions');
		}
		try {
			isDispatching = true;
			currentState = reducerManager.reduce(currentState, action);
		} finally {
			isDispatching = false;
		}
		for (const l of Array.from(listeners)) l();
	}

	function addReducer<Key extends string, S>(key: Key, reducer: (state: S | undefined, action: Action) => S) {
		assertNotDestroyed();
		reducerManager.add(String(key), reducer as any);
		dispatch({ type: `@@init/${key}` });
	}

	function removeReducer(key: string) {
		assertNotDestroyed();
		reducerManager.remove(key);
		if (key in currentState) {
			const { [key]: _removed, ...rest } = currentState;
			currentState = rest;
			for (const l of Array.from(listeners)) l();
		}
	}

	function replaceReducers(reducers: ReducerMap) {
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

	dispatch({ type: '@@dynamic-store/INIT' });

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
