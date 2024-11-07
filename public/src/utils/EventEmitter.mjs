// src/utils/EventEmitter.mjs
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return this; // Pour le chaînage
    }

    emit(event, data) {
        if (!this.events[event]) {
            return this;
        }
        this.events[event].forEach(callback => callback(data));
        return this; // Pour le chaînage
    }

    off(event, callback) {
        if (!this.events[event]) {
            return this;
        }
        if (!callback) {
            delete this.events[event];
        } else {
            this.events[event] = this.events[event]
                .filter(cb => cb !== callback);
        }
        return this; // Pour le chaînage
    }
}