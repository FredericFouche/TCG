export class EventEmitter {
    constructor() {
        this._events = new Map();
    }

    on(eventName, listener) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, new Set());
        }
        this._events.get(eventName).add(listener);
    }

    off(eventName, listener) {
        if (this._events.has(eventName)) {
            this._events.get(eventName).delete(listener);
        }
    }

    emit(eventName, data) {
        if (this._events.has(eventName)) {
            for (const listener of this._events.get(eventName)) {
                listener(data);
            }
        }
    }

    listenerCount(eventName) {
        return this._events.get(eventName)?.size || 0;
    }

    clearAllListeners() {
        this._events.clear();
    }
}