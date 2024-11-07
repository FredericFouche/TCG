import { EventEmitter } from '../../utils/EventEmitter.mjs';

export class Sidebar extends EventEmitter {
    #isCollapsed = false;
    #activeRoute = 'dashboard';
    #elements = {};
    #eventHandlers = new Map();

    constructor(containerId = 'sidebar') {
        super();
        this.#elements.sidebar = document.getElementById(containerId);
        if (!this.#elements.sidebar) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        this.#init();
    }

    #init() {
        this.#createStructure();
        this.#bindEvents();
    }

    #createStructure() {
        this.#elements.sidebar.innerHTML = `
            <div class="sidebar-header">
                <span class="sidebar-title">TCG Game</span>
                <button class="toggle-btn">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
            <ul class="menu-list">
                <li class="menu-item active" data-route="dashboard">
                    <i class="fas fa-home"></i>
                    <span class="menu-text">Dashboard</span>
                </li>
                <li class="menu-item" data-route="shop">
                    <i class="fas fa-store"></i>
                    <span class="menu-text">Boutique</span>
                </li>
                <li class="menu-item" data-route="boosters">
                    <i class="fas fa-box-open"></i>
                    <span class="menu-text">Boosters</span>
                </li>
                <li class="menu-item" data-route="collection">
                    <i class="fas fa-layer-group"></i>
                    <span class="menu-text">Collection</span>
                </li>
                <li class="menu-item" data-route="market">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="menu-text">Marché</span>
                </li>
                <li class="menu-item" data-route="autoclickers">
                    <i class="fas fa-robot"></i>
                    <span class="menu-text">Auto Clickers</span>
                </li>
                <li class="menu-item" data-route="achievements">
                    <i class="fas fa-trophy"></i>
                    <span class="menu-text">Achievements</span>
                </li>
                <li class="menu-item" data-route="stats">
                    <i class="fas fa-chart-line"></i>
                    <span class="menu-text">Statistiques</span>
                </li>
            </ul>
        `;

        // Cache DOM elements for better performance
        this.#elements.toggleBtn = this.#elements.sidebar.querySelector('.toggle-btn');
        this.#elements.menuItems = this.#elements.sidebar.querySelectorAll('.menu-item');
        this.#elements.mainContent = document.getElementById('mainContent');
    }

    #bindEvents() {
        // Toggle sidebar
        this.#eventHandlers.set('toggle', () => this.toggle());
        this.#elements.toggleBtn.addEventListener('click',
            this.#eventHandlers.get('toggle'));

        // Navigation
        this.#elements.menuItems.forEach(item => {
            const route = item.dataset.route;
            this.#eventHandlers.set(`navigate_${route}`, () => this.navigateTo(route));
            item.addEventListener('click', this.#eventHandlers.get(`navigate_${route}`));
        });
    }

    #unbindEvents() {
        this.#elements.toggleBtn.removeEventListener('click',
            this.#eventHandlers.get('toggle'));

        this.#elements.menuItems.forEach(item => {
            const route = item.dataset.route;
            item.removeEventListener('click',
                this.#eventHandlers.get(`navigate_${route}`));
        });

        this.#eventHandlers.clear();
    }

    toggle() {
        this.#isCollapsed = !this.#isCollapsed;
        this.#elements.sidebar.classList.toggle('collapsed');
        this.#elements.mainContent?.classList.toggle('expanded');

        // Émet un événement personnalisé
        const event = new CustomEvent('sidebar:toggle', {
            detail: { isCollapsed: this.#isCollapsed }
        });
        document.dispatchEvent(event);
    }

    navigateTo(route) {
        this.#activeRoute = route;

        // Met à jour la classe active
        this.#elements.menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });

        // Émet l'événement de navigation
        this.emit('navigate', { route: this.#activeRoute });
    }

    getState() {
        return {
            isCollapsed: this.#isCollapsed,
            activeRoute: this.#activeRoute
        };
    }

    destroy() {
        this.#unbindEvents();
        this.#elements = {};
    }
}