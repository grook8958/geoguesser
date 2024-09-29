import HTMLSelectMenu from "./static/scripts/HTMLSelectMenu.js";
import * as Util from "./static/scripts/utils.js";
import cities from "./static/cities.json" with {type: 'json'};

const modeSelector = new HTMLSelectMenu('mode-selector', ['Pin', 'Type', 'Type (Hard)'], onModeSelect);

function onModeSelect(item) {
    clear()
    init(modeSelector.data.selected)
}

/**
 * PAGE INITIALISATION
 */
let gameStarted = 0 //0 = not started; 1 = started; -1 = game over
let score = 0;
let progress = 0;
let timer = null;

/**
 * @type {Array<City>}
 */
let remainingCities = [...cities];
let instructionCity = randomCity(remainingCities).name
init(modeSelector.data.selected)

/**
 * @typedef {Object} City
 * @property {string} name
 * @property {[number, number]} coordinates
 */

/**
 * Returns a random city and removes it from the list
 * @param {Array<City>} cities 
 * @returns 
 */
function randomCity(cities) {
    const i = Util.getRandomNumber(0, cities.length-1);
    const city = cities[i];
    cities.splice(i,1);
    return city;
}

function clear() {
    const parent = document.getElementById('map-container');
    const pins = parent.querySelectorAll(".pin");
    for (const pin of pins) {
        if (pin.id !== "pin-template") {
            parent.removeChild(pin)
        }
    }
}

function placePins() {
    const parent = document.getElementById('map-container');
    const template = document.getElementById('pin-template');
    for (const city of cities) {
        const clone = template.cloneNode(true);
        clone.removeAttribute("id")
        clone.setAttribute('name', city.name)
        parent.appendChild(clone);
        const pin = parent.querySelector(`[name="${city.name}"]`);
        pin.style.bottom = `${city.coordinates[0]}px`
        pin.style.right = `${city.coordinates[1]}px`
        pin.children[1].innerHTML = city.name;
        pin.addEventListener('click', pinOnClick)
    }
}

function init(gamemode) {
    const instructions = document.getElementById('map-instructions-instruction');
    const score = document.getElementById('map-instructions-score');
    const number = document.getElementById('map-instructions-progress');
    const time = document.getElementById('map-instructions-time');
    clearInterval(timer);
    placePins();
    switch(gamemode) {
        case('Pin'):
            instructions.innerHTML = `Click on <strong>${instructionCity}</strong>`;
            break;
        case('Type'):
            instructions.innerText = 'Type the name of the city in the box';
            break;
    }
    number.innerText = `0/${cities.length}`;
    time.innerHTML = '0:00';
    score.innerHTML = '0%';
}


/**
 * Failed pin state (attempts > 3)
 * @param {Element} pin 
 */
function failedPin(pin) {
    pin.classList.add('failed');
    pin.classList.remove('neutral', 'show-mistake-circle', 'show-mistake');
}

/**
 * Correct pin state (failedAttempts = 0)
 * @param {Element} pin 
 */
function correctPin(pin) {
    pin.classList.add('correct');
    pin.classList.remove('neutral');
}

/**
 * Wrong pin state (0 < failedAttempts < 3)
 * @param {Element} pin 
 */
function wrongPin(pin) {
    pin.classList.add('wrong');
    pin.classList.remove('neutral');
}

/**
 * Show the mistake (failedAttempts = 3)
 * @param {Element} pin 
 */
async function showMistakePin(pin) {
    pin.classList.add('show-mistake', 'show-mistake-circle');
    pin.classList.remove('neutral');
    await Util.wait(2000)
    pin.classList.remove('show-mistake-circle');
}

/**
 * Peak the name of the pin
 * @param {Element} pin 
 */
function peak(pin) {
    if (pin.classList.contains('neutral')) return;
    pin.classList.add('peak');
}

function startTimer() {
    const time = document.getElementById("map-instructions-time")
    let seconds = 0
    let minutes = 0
    return setInterval(() => {
        if (seconds === 59) {
            minutes += 1;
            seconds = 0;
        } else {
            seconds += 1;
        }
        time.innerText = `${minutes}:${seconds < 10 ? 0 : ''}${seconds}`
    }, 1000)
}

/**
 * Clear the classes of the pin
 * @param {Element} pin 
 */
function clearPin(pin) {
    if (!pin) return;
    pin.classList.remove(pin.classList.remove('peak', 'show-mistake-circle', 'show-mistake'))
}


let lastClickedPin = null;
let failedAttempts = 0;
/**
 * 
 * @param {Event} event 
 */
async function pinOnClick(event) {
    //Check gamemode
    if (modeSelector.data.selected !== 'Pin') return;
    if (gameStarted == -1) return;

    //Start timer + game
    if (gameStarted == 0){timer = startTimer();}
    gameStarted = 1

    // Get the corrent pin
    const answerPin = document.querySelector(`[name="${instructionCity}"]`);

    /**
     * The pin that was clicked
     * @type {Element}
     */
    const pin = event.target;
    const pinName = pin.getAttribute("name");

    //Clear last pin && correct pin
    clearPin(lastClickedPin);
    //clearPin(answerPin)
    lastClickedPin = pin;

    

    // Clicked wrong pin
    if (pinName != instructionCity) {
        failedAttempts++;   
        if (failedAttempts >= 3) {
            showMistakePin(answerPin);
            return;
        } else {
            return;
        }
    }

    /**
     * Score Calculations:
     * - Each city worth 30pts
     * - Correct = 30pts
     * - 1 failed attempt = 20pts
     * - 2 failed attempts = 10pts
     * - 3+ failed attemps = 0pts
     */

    // Clicked correct pin
    switch(failedAttempts) {
        case(0):
            correctPin(answerPin);
            score += 30;
            break;
        case(1):
            wrongPin(answerPin);
            score += 20;
            break;
        case(2):
            wrongPin(answerPin);
            score += 10;
            break;
        default:
            failedPin(answerPin);
            break;
    }

    progress++;
    failedAttempts = 0;
    updateProgress();
    updateInstruction();
    updateScore();
}

function updateProgress() {
    const number = document.getElementById('map-instructions-progress');
    number.innerHTML = `${progress}/${cities.length}`;
}

function updateInstruction() {
    if (remainingCities.length == 0) {
        gameOver();
        return;
    }
    instructionCity = randomCity(remainingCities).name
    const instructions = document.getElementById('map-instructions-instruction');
    instructions.innerHTML = `Click on <strong>${instructionCity}</strong>`;
}

function updateScore() {
    const scorePerc = (score / (progress * 30) ) * 100;
    const scoreElement = document.getElementById('map-instructions-score');
    scoreElement.innerHTML = `${Math.round(scorePerc)}%`;
}

function gameOver() {
    clearInterval(timer);
    const instructions = document.getElementById('map-instructions-instruction');
    instructions.innerHTML = `Gamer Over`;
    gameStarted = -1;
}





/**
 * ----------------------------------------------------------------------------------------------------------
 * ==========================================================================================================
 * ----------------------------------------------------------------------------------------------------------
 */




/**
 * Point Coordinates Placer
 */
let points = "[";
const enabled = false
document.getElementById('map-container').addEventListener('mousemove', async function (event) {
    if (!enabled) return;
    const divRect = this.getBoundingClientRect();
    const pin = document.getElementById('pin-template');
    pin.style.visibility = "visible"

    // Calculate the relative left coordinate
    const relativeRight = divRect.width - (event.clientX - divRect.left) - 10;

    // Calculate the relative bottom coordinate (div height - relativeTop)
    const relativeBottom = divRect.height - (event.clientY - divRect.top)// - pin.offsetHeight;

    // Log the relative top and bottom coordinates
    console.log('Relative left: ', relativeRight);
    console.log('Relative Bottom: ', relativeBottom);

    pin.style.bottom = `${relativeBottom}px`;
    pin.style.right = `${relativeRight}px`;

})

document.getElementById('map-container').addEventListener('click', async function (event) {
    if (!enabled) return;
    const pin = document.getElementById('pin-template');
    pin.style.visibility = "visible"
    const name = prompt('Name: ');
    const relBottom = Number(pin.style.bottom.replace('px', ''))
    const relRight = Number(pin.style.right.replace('px', ''))
    points += `{name: "${name}", coordinates: [${relBottom}, ${relRight}]},`;
    console.log(points)
})


