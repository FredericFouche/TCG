import { EventEmitter } from './EventEmitter.mjs';

export class NotificationSystem extends EventEmitter {
    static EVENTS = {
        SHOW_NOTIFICATION: 'notification:show'
    };

    static instance = null;

    static getInstance() {
        if (!NotificationSystem.instance) {
            NotificationSystem.instance = new NotificationSystem();
        }
        return NotificationSystem.instance;
    }

    showError(message) {
        this.emit(NotificationSystem.EVENTS.SHOW_NOTIFICATION, {
            type: 'error',
            message
        });
    }

    showSuccess(message) {
        this.emit(NotificationSystem.EVENTS.SHOW_NOTIFICATION, {
            type: 'success',
            message
        });
    }

    showInfo(message) {
        this.emit(NotificationSystem.EVENTS.SHOW_NOTIFICATION, {
            type: 'info',
            message
        });
    }
}