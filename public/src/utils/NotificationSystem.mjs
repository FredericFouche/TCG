import {EventEmitter} from './EventEmitter.mjs';

export class NotificationSystem extends EventEmitter {
    static EVENTS = {
        SHOW_NOTIFICATION: 'notification:show'
    };

    static instance = null;

    static getInstance() {
        console.log('📱 Récupération/Création de l\'instance NotificationSystem');
        if (!NotificationSystem.instance) {
            NotificationSystem.instance = new NotificationSystem();
            console.log('🆕 Nouvelle instance NotificationSystem créée');
        }
        return NotificationSystem.instance;
    }

    showError(message) {
        console.log('❌ Émission notification erreur:', message);
        this.emit(NotificationSystem.EVENTS.SHOW_NOTIFICATION, {
            type: 'error',
            message
        });
    }

    showSuccess(message) {
        console.log('✅ Émission notification succès:', message);
        this.emit(NotificationSystem.EVENTS.SHOW_NOTIFICATION, {
            type: 'success',
            message
        });
    }

    showInfo(message) {
        console.log('ℹ️ Émission notification info:', message);
        this.emit(NotificationSystem.EVENTS.SHOW_NOTIFICATION, {
            type: 'info',
            message
        });
    }
}