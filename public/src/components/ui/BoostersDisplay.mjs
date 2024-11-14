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

        this.attachEventListeners();
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

    async #handleBoosterOpen(boosterId) {
        const cards = this.#boosterSystem.openBooster(boosterId);
        if (!cards) return;

        const existingOverlays = document.querySelectorAll('.booster-opening-overlay');
        existingOverlays.forEach(overlay => overlay.remove());

        const overlay = document.createElement('div');
        overlay.className = 'booster-opening-overlay';

        const backdropBlur = document.createElement('div');
        backdropBlur.className = 'backdrop-blur';

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-reveal-container';

        overlay.appendChild(backdropBlur);
        overlay.appendChild(cardsContainer);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        const boosterCard = document.querySelector(`.booster-card[data-id="${boosterId}"]`);
        if (boosterCard) {
            boosterCard.classList.add('opening');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `revealed-card ${card.rarity}`;
            cardElement.innerHTML = `
            <div class="card-content">
            <div class="card ${card.rarity}" data-card-id="${card.id}">
                            <div class="card-image-container">
                                <img src="${card.image}" alt="${card.name}" class="card-image" />
                                <div class="card-rarity-badge card-rarity">${card.rarity}</div>
                                ${card.isLocked ? '<div class="card-locked">🔒</div>' : ''}
                                <div class="card-overlay">
                                    <div class="card-header">
                                        <h3>${card.name}</h3>
                                        <span class="card-amount">x${card.amount}</span>
                                    </div>
                                    <div class="card-content">
                                        <p class="card-value">¤ ${card.getCurrentValue()}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="card-details">
                                <p class="card-description">${card.description}</p>
                            </div>
         </div>
        `;

            cardsContainer.appendChild(cardElement);

            requestAnimationFrame(() => {
                cardElement.offsetHeight;
                setTimeout(() => {
                    cardElement.classList.add('show');
                }, index * 200);
            });
        });

        const skipButton = document.createElement('div');
        skipButton.className = 'skip-hint';
        skipButton.innerHTML = `
                Click to skip or use <div class="kbd"><div class="kbd-text">Esc</div></div>`;
        skipButton.addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                this.render();
            }, 300);
        });
        cardsContainer.appendChild(skipButton);

        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                this.render();
            }, 300);
        });
    }

    attachEventListeners() {
        this.#container.addEventListener('click', (event) => {
            const button = event.target.closest('.open-booster-btn');
            if (button) {
                const boosterId = button.dataset.id;
                this.#handleBoosterOpen(boosterId).then(r => 'Cartes affichées');
            }
        });
    }

    #emitOpenEvent(boosterId) {
        console.log('Émission de l\'événement d\'ouverture:', boosterId);
        this.#boosterSystem.emit(BoosterSystem.EVENTS.BOOSTER_OPEN_REQUESTED, {boosterId});
    }
}
