import {EventEmitter} from '../../utils/EventEmitter.mjs';
import {BoosterSystem} from '../../core/booster/BoosterSystem.mjs';

export class BoosterDisplay {
    #container;
    #boosterSystem;
    #boundEvents = [];

    constructor(containerId = 'booster-container') {
        if (!window.boosterSystem) {
            throw new Error('BoosterSystem must be initialized before BoosterDisplay');
        }

        this.#container = document.getElementById(containerId);
        if (!this.#container) {
            throw new Error('Booster container not found');
        }

        this.#boosterSystem = window.boosterSystem;
    }

    init() {
        this.#bindEvents();
        this.render();
    }

    destroy() {
        this.#boundEvents.forEach(({event, handler}) => {
            this.#boosterSystem.off(event, handler);
        });
        this.#boundEvents = [];

        if (this.#container) {
            this.#container.innerHTML = '';
        }
    }

    #bindEvents() {

        const purchaseHandler = () => this.render();
        this.#boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_PURCHASED, purchaseHandler);
        this.#boundEvents.push({
            event: BoosterSystem.EVENTS.BOOSTER_PURCHASED, handler: purchaseHandler
        });

        const openHandler = () => this.render();
        this.#boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_OPENED, openHandler);
        this.#boundEvents.push({
            event: BoosterSystem.EVENTS.BOOSTER_OPENED, handler: openHandler
        });
    }

    render() {
        const boosters = this.#boosterSystem.getUnusedBoosters();

        this.#container.innerHTML = `
            <div class="boosters-panel">
                <h2 class="boosters-title">Boosters</h2>
                <div class="boosters-grid">
                    ${boosters.map(booster => this.#renderBooster(booster)).join('')}
                </div>
            </div>
        `;
    }

    #renderBooster(booster) {
        const openedClass = booster.opened ? 'booster-opened' : '';
        const openButton = !booster.opened ? `<button class="open-booster-btn" data-id="${booster.id}">Open</button>` : '';

        return `
    <div class="booster-card ${openedClass}" data-id="${booster.id}">
        <div class="booster-type">${booster.type}</div>
        <div class="booster-date">Purchased on: ${new Date(booster.purchaseDate).toLocaleString()}</div>
        ${openButton}
    </div>
    `;
    }

    attachEventListeners() {
        this.#container.addEventListener('click', (event) => {
            const button = event.target.closest('.open-booster-btn');
            if (button) {
                const boosterId = button.dataset.id;
                this.#emitOpenEvent(boosterId);
            }
        });
    }

    #emitOpenEvent(boosterId) {
        console.log('Open booster:', boosterId);
        this.#boosterSystem.openBooster(boosterId);
    }
}
