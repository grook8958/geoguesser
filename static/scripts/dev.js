/**
 * Enter dev mode:
 * 
 * var script = document.createElement('script');
 * script.type = 'module';
 * script.src = './static/scripts/dev.js';
 * document.head.appendChild(script);
 */


/**
 * Point Coordinates Placer
 */
let points = "[\n";
let enabled = true

document.getElementById('map-container').addEventListener('mousemove', async function (event) {
    if (!enabled) return;
    const divRect = this.getBoundingClientRect();
    const pin = document.getElementById('pin-template');
    pin.style.visibility = "visible";

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
    pin.style.visibility = "visible";
    const name = prompt('Name: ');
    if (name === "end()") {
        points += '\n]'
        console.log(points);
        pin.style.visibility = "hidden";
        enabled = false;
        return;
    }
    const relBottom = Number(pin.style.bottom.replace('px', ''));
    const relRight = Number(pin.style.right.replace('px', ''));
    points += `    {name: "${name}", coordinates: [${relBottom}, ${relRight}]},\n`;
    console.log(points);
})