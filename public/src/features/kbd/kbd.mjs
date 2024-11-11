import {EventEmitter} from "../../utils/EventEmitter.mjs";

class Keyboard extends EventEmitter {
    constructor() {
        super();
        this._init();
    }

    _init() {
        window.addEventListener('keydown', (event) => {
            this._handleKeydown(event);
        });
    }

    _handleKeydown(event) {
        switch (event.key) {
            case '1':
                this.emit('navigate', { route: 'dashboard' });
                break;
            case '2':
                this.emit('navigate', { route: 'shop' });
                break;
            case '3':
                this.emit('navigate', { route: 'boosters' });
                break;
            case '4':
                this.emit('navigate', { route: 'collection' });
                break;
            case '5':
                this.emit('navigate', { route: 'market' });
                break;
            case '6':
                this.emit('navigate', { route: 'autoclickers' });
                break;
            case 't':
                this.emit('tutorial-requested');
                break;
            case 'a':
                this.emit('navigate', { route: 'achievements' });
                break;
            case 's':
                this.emit('navigate', { route: 'statistics' });
                break;

            default:
                console.log(`Touche ${event.key} non gérée`);
        }
    }
}