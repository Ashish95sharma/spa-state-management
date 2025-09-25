export type AnyState = Record<string, unknown>;

export type Action<Type extends string = string, Payload = unknown> = {
	type: Type;
	payload?: Payload;
	meta?: Record<string, unknown>;
	error?: boolean;
};

export type Reducer<S = unknown, A extends Action = Action> = (state: S | undefined, action: A) => S;

export type ReducerMap = Record<string, Reducer<any, any>>;

export interface Unsubscribe {
	(): void;
}

export interface Store<State extends AnyState = AnyState> {
	getState(): State;
	dispatch(action: Action): void;
	subscribe(listener: () => void): Unsubscribe;
	addReducer<Key extends string, S>(key: Key, reducer: Reducer<S>): void;
	removeReducer(key: string): void;
	replaceReducers(reducers: ReducerMap): void;
	destroy(): void;
}

export interface ReducerManager {
	getReducerMap(): ReducerMap;
	add(key: string, reducer: Reducer): void;
	remove(key: string): void;
	reduce(state: AnyState | undefined, action: Action): AnyState;
}

