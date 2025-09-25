type AnyState = Record<string, unknown>;
type Action<Type extends string = string, Payload = unknown> = {
    type: Type;
    payload?: Payload;
    meta?: Record<string, unknown>;
    error?: boolean;
};
type Reducer<S = unknown, A extends Action = Action> = (state: S | undefined, action: A) => S;
type ReducerMap = Record<string, Reducer<any, any>>;
interface Unsubscribe$1 {
    (): void;
}
interface Store<State extends AnyState = AnyState> {
    getState(): State;
    dispatch(action: Action): void;
    subscribe(listener: () => void): Unsubscribe$1;
    addReducer<Key extends string, S>(key: Key, reducer: Reducer<S>): void;
    removeReducer(key: string): void;
    replaceReducers(reducers: ReducerMap): void;
    destroy(): void;
}
interface ReducerManager {
    getReducerMap(): ReducerMap;
    add(key: string, reducer: Reducer): void;
    remove(key: string): void;
    reduce(state: AnyState | undefined, action: Action): AnyState;
}

declare function createDynamicStore<State extends AnyState = AnyState>(preloadedState?: Partial<State>, initialReducers?: ReducerMap): Store<State>;

declare function createReducerManager(initialReducers?: ReducerMap): ReducerManager;

type Unsubscribe = () => void;
type EventBus<Topics extends string = string> = {
    subscribe(topic: Topics, listener: (payload: unknown) => void): Unsubscribe;
    publish(topic: Topics, payload?: unknown): void;
    clear(): void;
};
declare function createEventBus<Topics extends string = string>(): EventBus<Topics>;

declare function namespaceActions<N extends string>(namespace: N): <T extends Record<string, (...args: any[]) => Action>>(creators: T) => T;

export { type Action, type AnyState, type Reducer, type ReducerManager, type ReducerMap, type Store, createDynamicStore, createEventBus, createReducerManager, namespaceActions };
