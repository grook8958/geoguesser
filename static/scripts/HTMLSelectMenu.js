/**
 * For the select menu to properly work, it must be organized in the following way:
 *  <div id="[select-menu-id]" class="select-menu" style="width:100px;" value="">
 *      <button class="select-menu-button" type="button">
 *          <span class="selected">DEFAULT ITEM</span>
 *          <svg class="select-menu-arrow" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" width="1.2em" height="1.2em"><path class="select-menu-arrow-path" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15l7-7l7 7"></path></svg>
 *      </button>
 *  </div>
 */
/**
 * HTMLSelectMenu Handler
 */
class HTMLSelectMenu {
    /**
     * @typedef {Object} HTMLSelectMenuOptions
     * @property {string} [facingUpArrowData=m5 15l7-7l7 7] Data code for the up arrow symbol.
     * @property {string} [facingDownArrowData=m19 9l-7 7l-7-7] Data code for the down arrow symbol.
     * @property {boolean} [skipValidation=false] Wether validation should be skipped
     * @property {string} [selectMenuButtonSelector=.select-menu-button] Selector to the menu button
     * @property {string} [selectMenuArrowPathSelector=.select-menu-arrow-path] Selector to the arrow path element
     * @property {number} [defaultValueIndex=0] The index at which the default value is
     * @property {number} [defaultValue=null] The default value
     * @property {(selectMenu: HTMLSelectMenu) => void} [onInit=null] A function to run when the selectmenu is initialised
     */

    /**
     * A custom HTML Select Menu.
     * @param {string} containerId The id of the div in which the select menu is (eg: select-menu-id) 
     * @param {Array<string>} data The options of this select menu
     * @param {(item: HTMLElement) => {}} onSelected The function to execute when an item is selected (default nothing)
     * @param {HTMLSelectMenuOptions} options 
     */
    constructor(containerId, data, onSelected = (item) => { return undefined }, options = {}) {
        /**
         * Raw arguments passed into the constructor.
         */
        this.rawArgs = { containerId, data, onSelected, options };
    
        /**
         * The container 
         */
        this.container = document.getElementById(containerId);

        /**
         * The default value
         * @type {any}
         */
        this.defaultValue = options.defaultValue ?? null;

        /**
         * The index at which the default value is
         * @type {number}
         */
        this.defaultValueIndex = options.defaultValueIndex ?? data.indexOf(this.defaultValue) != -1 ? data.indexOf(this.defaultValue) : 0;
        
        /**
         * @typedef {Object} HTMLSelectMenuData
         * @property {string} selected The current selected item
         * @property {Array<string>} stored The other items currently stored
         */

        /**
         * The parsed SelectMenuData
         * @type {HTMLSelectMenuData}
         */
        this.data = this._parseData(data);

        /**
         * The function to run when an item is selected
         * @type {(item: HTMLElement) => {}}
         */
        this.onSelected = onSelected;

        /**
         * The child elements bound to the select menu
         */
        this.childElements = {
            itemContainer: null,
            button: this.container.querySelector(options.selectMenuButtonSelector ?? '.select-menu-button'),
            arrowPath: this.container.querySelector(options.selectMenuButtonSelector ?? '.select-menu-arrow-path'),
        }

        /**
         * Data code for the up arrow symbol.
         * @type {string}
         * @readonly
         */
        this.facingUpArrowData = options.facingUpArrowData ?? 'm5 15l7-7l7 7';

        /**
         * Data code for the down arrow symbol.
         * @type {string}
         * @readonly
         */
        this.facingDownArrowData = options.facingUpArrowData ?? 'm19 9l-7 7l-7-7';

        /**
         * A function to run when the selectmenu is initialised
         * @type {(selectMenu: HTMLSelectMenu) => void}
         */
        this.onInit = options.onInit ?? (() => {});

        //Validate the options
        this._validate(options.skipValidation ?? false);

        //Initialize the function
        this.init();
    }

    /**
     * Initialize the SelectMenu
     * @private
     */
    init() {
        this.container.querySelector('.select-menu-button').addEventListener('click', () => {
            this._toggleArrow()
            const state = this.getState();
            if (state === 0) this.closeSelectMenu();
            else if (state === 1) this.openSelectMenu();
        });
        this.setSelected(this.data.selected);
        this.onInit(this);
    }

    /**
     * Open the SelectMenu
     */
    openSelectMenu() {
        const newSelectMenuItemsContainer = document.createElement('div');
        newSelectMenuItemsContainer.classList.add('select-menu-items-container');
        this.container.append(newSelectMenuItemsContainer);
        this.childElements.itemContainer = newSelectMenuItemsContainer;

        //Add the items
        this.setSelected(this.data.selected);
        for (const item of this.data.stored) {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = item;
            newSelectMenuItemsContainer.append(itemDiv);
            itemDiv.addEventListener('click', () => this.handleClick(itemDiv));
        }
    }

    /**
     * Handle the event of a click on an item.
     * @param {HTMLElement} element 
     */
    handleClick(element) {
        this.data.selected = element.innerHTML;
        this.closeSelectMenu();
        this._toggleArrow();
        this.setSelected(this.data.selected);
        this.onSelected(element);
    }

    /**
     * Close the SelectMenu
     */
    closeSelectMenu() {
        return this.childElements.itemContainer.remove(); 
    }

    /**
     * Set the selected value.
     * @param {string} value 
     * @returns 
     */
    setSelected(value) {
        const selected = this.childElements.button.querySelector('.selected');
        selected.innerHTML = value;
        this.container.setAttribute('value', value);
        return selected;
    }

    /**
     * Get the state of the SelectMenu
     * * `0` : **Closed**
     * * `1` : **Opened**
     * @param {HTMLElement} arrowPathElement 
     * @returns 
     */
    getState(arrowPathElement = this.container.querySelector('.select-menu-arrow-path')) {
        if (arrowPathElement.getAttribute('d') === this.facingDownArrowData) return 1;
        else if (arrowPathElement.getAttribute('d') === this.facingUpArrowData) return 0;
    }

    /**
     * Toggle the arrow
     * @param {HTMLElement} arrowPathElement 
     */
    _toggleArrow(arrowPathElement = this.container.querySelector('.select-menu-arrow-path')) {
        if (arrowPathElement.getAttribute('d') === this.facingDownArrowData) arrowPathElement.setAttribute('d', this.facingUpArrowData);
        else if (arrowPathElement.getAttribute('d') === this.facingUpArrowData) arrowPathElement.setAttribute('d', this.facingDownArrowData);
    }

    /**
     * Parse raw data.
     * @param {Array<string>} data 
     * @returns 
     */
    _parseData(data = this.data) {
        console.log(this)
        return { selected: data[this.defaultValueIndex], stored: data};
    }

    /**
     * Validate the options.
     */
    _validate(skipValidation = false) {
        if (skipValidation) return;
        if (typeof this.rawArgs.onSelected !== 'function') throw new TypeError('[INVALID_TYPE] The "onSelected" option must be a function.');
        if (typeof this.rawArgs.containerId !== 'string') throw new TypeError('[INVALID_TYPE] The "containerId" option must be a string.');
        if (!Array.isArray(this.rawArgs.data)) throw new TypeError('[INVALID_TYPE] The "data" option must be an Array of strings.');
        if (!this.container) throw new RangeError('[INVALID_ID] The id passed to the constructor is invalid.');
        for (const key in this.childElements) {
            if (key === 'itemContainer') continue;
            if (!this.childElements[key]) throw new RangeError(`[MISSING_ELEMENT] The "${key}" element is missing.`);
        }
    }
}

export default HTMLSelectMenu;