import HTMLSelectMenu from "./static/scripts/HTMLSelectMenu.js";
import * as Util from "./static/scripts/utils.js";
import cities from "./static/cities.json" with {type: 'json'};

const modeSelector = new HTMLSelectMenu('mode-selector', ['Pin', 'Type', 'Type (Hard)'], onModeSelect);

function onModeSelect(item) {
    clear()
    init(modeSelector.data.selected)
}

//Close end popup
const endPopup = document.querySelector('.end-popup');
document.querySelector('.end-popup .btn.close').addEventListener('click', closeEndPopup);
function showEndPopup(score, time) {
    if (!score) score = '100%'
    else if (!time) time = '1:00'
    endPopup.classList.add('show');
    const scoreEl = endPopup.querySelector('.end-popup .body span.score');
    const timeEl = endPopup.querySelector('.end-popup .body span.time');
    endPopup.setAttribute('data-score', score);
    endPopup.setAttribute('data-time', time);
    scoreEl.innerHTML = `Score: <strong>${score}</strong>`;
    timeEl.innerHTML = `Time: <strong>${time}</strong>`;
}

function closeEndPopup() {
    endPopup.classList.remove('show');
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
        pin.children[2].addEventListener('keypress', pinOnEnter);
    }
}

function init(gamemode) {
    gameStarted = 0;
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
            const cityPin = document.querySelector(`[name="${instructionCity}"]`)
            showInput(cityPin);
            break;
        case('Type (Hard)'):
            instructions.innerText = 'Type the name of the city in the box';
            const cityPin2 = document.querySelector(`[name="${instructionCity}"]`)
            showInput(cityPin2);
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
 * Show the input of a pin
 * @param {Element} pin
 */
function showInput(pin) {
    pin.classList.add('show-input');
    const input = pin.children[2].children[1];
    input.select();
    return;
}

/**
 * Hide the input of a pin
 * @param {Element} pin
 */
function hideInput(pin) {
    pin.classList.remove('show-input');
    return;
}

/**
 * Peak the name of the pin
 * @param {Element} pin 
 */
function peak(pin) {
    pin.classList.add('peak');
}

function clearInput(pin) {
    pin.children[2].value = '';
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

/**
 * Hint answer
 * @param {Element} pin
 */
function hintAnswer(pin, failedAttempts) {
    pin.classList.add('show-hint')
    const answer = pin.getAttribute('name');
    const hintElement = pin.querySelector('.hint');
    const answerArray = answer.split('');
    let hintArray = [...answerArray]
    hintArray.forEach((e, i) => hintArray[i] = '*');
    console.log(failedAttempts)
    switch (failedAttempts) {
        case 1:
            break;
        case 2:
            hintArray[hintArray.length-1] = answer[answer.length-1];
            break;
        case 3:
            hintArray[hintArray.length-1] = answer[answer.length-1];
            hintArray[0] = answer[0];
            break;
        case 4:
            hintArray[hintArray.length-1] = answer[answer.length-1];
            hintArray[0] = answer[0];
            hintArray[hintArray.length-2] = answer[answer.length-2];
            hintArray[1] = answer[1];
            break;
        default:
            hintArray = answerArray;
            break;
    }
    hintElement.innerHTML = `Hint: ${hintArray.join('')}`;
}

/**
 * Wrong answer input
 * @param {Element} pin
 */
function wrongAnswer(pin) {
    pin.classList.add('wrong-answer');
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
    lastClickedPin = pin;

    // Clicked wrong pin
    if (pinName != instructionCity) {
        failedAttempts++;
        peak(pin);
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
    updatePinInstruction();
    updateScore();
}

/**
 * 
 * @param {Event} event 
 */
async function pinOnEnter(event) {
    //Check gamemode
    if (modeSelector.data.selected !== 'Type' && modeSelector.data.selected !== 'Type (Hard)') return;
    if (gameStarted == -1) return;
    event.target.parentElement.parentElement.classList.remove('wrong-answer')
    if (event.key !== 'Enter') return;
    if (event.target.value.length <= 0) return;
    if (gameStarted == 0) { timer = startTimer(); }
    gameStarted = 1;

    /**
     * The pin that was typed in
     * @type {HTMLInputElement}
     */ 
    const input = event.target;   
    const userEntry = input.value;

    if (modeSelector.data.selected === 'Type') {
        if (Util.removeDiacritics(userEntry).toLowerCase() !== Util.removeDiacritics(instructionCity).toLowerCase()) {
            failedAttempts++
            wrongAnswer(input.parentElement.parentElement)
            console.log(failedAttempts)
            hintAnswer(input.parentElement.parentElement, failedAttempts);
            return;
        }
    } else if (modeSelector.data.selected === 'Type (Hard)') {
        if (userEntry !== instructionCity) {
            failedAttempts++
            wrongAnswer(input.parentElement.parentElement)
            return;
        }
    }
    /**
     * Score Calculations:
     * - Each city worth 30pts
     * - Correct = 30pts
     * - 1 failed attempt = 25pts
     * - 2 failed attempts = 20pts
     * - 3 failed attempts = 15pts
     * - 4 failed attemps = 10pts
     * - 5+ failed attemps = 0pts
     */

    // Clicked correct pin
    switch(failedAttempts) {
        case(0):
            correctPin(input.parentElement.parentElement);
            score += 30;
            break;
        case(1):
            wrongPin(input.parentElement.parentElement);
            score += 25;
            break;
        case(2):
            wrongPin(input.parentElement.parentElement);
            score += 15;
            break;
        case(3):
            wrongPin(input.parentElement.parentElement)
            score += 10;
            break;
        case(4):
            failedPin(input.parentElement.parentElement)
            score += 5;
            break;
        default:
            failedPin(input.parentElement.parentElement);
            break;
    }

    progress++;
    failedAttempts = 0;
    hideInput(input.parentElement.parentElement);
    updateProgress();
    updateTypeInstruction();
    updateScore();
} 

function updateProgress() {
    const number = document.getElementById('map-instructions-progress');
    number.innerHTML = `${progress}/${cities.length}`;
}

function updatePinInstruction() {
    if (remainingCities.length == 0) {
        gameOver();
        return;
    }
    instructionCity = randomCity(remainingCities).name
    const instructions = document.getElementById('map-instructions-instruction');
    instructions.innerHTML = `Click on <strong>${instructionCity}</strong>`;
}

function updateTypeInstruction() {
    if (remainingCities.length == 0) {
        gameOver();
        return;
    }
    instructionCity = randomCity(remainingCities).name
    const cityPin = document.querySelector(`[name="${instructionCity}"]`)
    showInput(cityPin);
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
    showEndPopup(document.getElementById('map-instructions-score').innerText, document.getElementById('map-instructions-time').innerText);
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


