export type Unsubscribe = () => void;

export type EventBus<Topics extends string = string> = {
	subscribe(topic: Topics, listener: (payload: unknown) => void): Unsubscribe;
	publish(topic: Topics, payload?: unknown): void;
	clear(): void;
};

export function createEventBus<Topics extends string = string>(): EventBus<Topics> {
	const topicToListeners = new Map<string, Set<(payload: unknown) => void>>();

	function subscribe(topic: Topics, listener: (payload: unknown) => void): Unsubscribe {
		const set = topicToListeners.get(topic) ?? new Set();
		set.add(listener);
		topicToListeners.set(topic, set);
		return () => set.delete(listener);
	}

	function publish(topic: Topics, payload?: unknown) {
		const set = topicToListeners.get(topic);
		if (!set) return;
		for (const l of Array.from(set)) l(payload);
	}

	function clear() {
		topicToListeners.clear();
	}

	return { subscribe, publish, clear };
}
