import { Action } from './types';

export function namespaceActions<N extends string>(namespace: N) {
	return function wrap<T extends Record<string, (...args: any[]) => Action>>(creators: T): T {
		const wrapped = {} as T;
		for (const key of Object.keys(creators) as Array<keyof T>) {
			const orig = creators[key];
			wrapped[key] = ((...args: any[]) => {
				const a = orig(...args);
				return { ...a, type: `${namespace}/${a.type}` };
			}) as T[typeof key];
		}
		return wrapped;
	};
}
