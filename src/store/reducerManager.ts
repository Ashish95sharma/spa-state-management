import { Action, AnyState, Reducer, ReducerMap, ReducerManager } from '../types';

function combineReducers(map: ReducerMap): Reducer<AnyState, Action> {
	return (state: AnyState = {}, action: Action) => {
		let hasChanged = false;
		const nextState: AnyState = {};
		for (const key of Object.keys(map)) {
			const reducer = map[key];
			const previousForKey = (state as AnyState)[key];
			const nextForKey = reducer(previousForKey, action);
			nextState[key] = nextForKey;
			hasChanged ||= nextForKey !== previousForKey;
		}
		for (const key of Object.keys(state)) {
			if (!(key in map)) {
				nextState[key] = (state as AnyState)[key];
			}
		}
		return hasChanged ? nextState : state;
	};
}

export function createReducerManager(initialReducers: ReducerMap = {}): ReducerManager {
	let reducers: ReducerMap = { ...initialReducers };
	let combined: Reducer<AnyState, Action> = combineReducers(reducers);

	return {
		getReducerMap() {
			return { ...reducers };
		},
		add(key: string, reducer: Reducer) {
			if (!key || reducers[key]) return;
			reducers = { ...reducers, [key]: reducer };
			combined = combineReducers(reducers);
		},
		remove(key: string) {
			if (!key || !reducers[key]) return;
			const { [key]: _removed, ...rest } = reducers;
			reducers = rest;
			combined = combineReducers(reducers);
		},
		reduce(state: AnyState | undefined, action: Action) {
			return combined(state, action);
		}
	};
}
