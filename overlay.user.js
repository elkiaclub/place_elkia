// ==UserScript==
// @name         Place Elkia
// @namespace    https://elkia.club/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=elkia.club
// @version      0.3
// @description  the sus corner can't withstand us
// @author       Cerx
// @match        https://hot-potato.reddit.com/embed*
// @updateURL    https://github.com/elkiaclub/place_elkia/raw/master/overlay.user.js
// @downloadURL  https://github.com/elkiaclub/place_elkia/raw/master/overlay.user.js
// ==/UserScript==

// author's note: the code is bad and not optimized
// stole the base for this from https://github.com/itchylol742/voidbotcoords/
(function () {
    "use strict";
    // image stored as base64 to prevent CORS issues
    const blueprint = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAGBAMAAABQoYHsAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURf+ZqjaQ6q4btl0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAySURBVBjTZYzBEQAxAAFtB/TfbMjc68LH7ECPCLIdYQMFDIj6A3W0xgXexJs0Z/n3KB1RKgGzzZtijwAAAABJRU5ErkJggg=='
    const placementLocation = {
        x: 1617,
        y: 218
    }
    // stole the mappings from https://github.com/rdeepak2002/reddit-place-script-2022/blob/main/mappings.py
    const colorMap = new Map([
        ["#BE0039", 1],  // dark red
        ["#FF4500", 2],  // red
        ["#FFA800", 3],  // orange
        ["#FFD635", 4],  // yellow
        ["#00A368", 6],  // dark green
        ["#00CC78", 7],  // green
        ["#7EED56", 8],  // light green
        ["#00756F", 9],  // dark teal
        ["#009EAA", 10],  // teal
        ["#2450A4", 12],  // dark blue
        ["#3690EA", 13],  // blue
        ["#51E9F4", 14],  // light blue
        ["#493AC1", 15],  // indigo
        ["#6A5CFF", 16],  // periwinkle
        ["#811E9F", 18],  // dark purple
        ["#B44AC0", 19],  // purple
        ["#FF3881", 22],  // pink
        ["#FF99AA", 23],  // light pink
        ["#6D482F", 24],  // dark brown
        ["#9C6926", 25],  // brown
        ["#000000", 27],  // black
        ["#898D90", 29],  // gray
        ["#D4D7D9", 30],  // light gray
        ["#FFFFFF", 31],  // white
    ])

    async function getInstructionsApi () {
        const image = await new Promise((resolve, reject) => {
            const imageElement = document.createElement("img")
            imageElement.display = "none"
            imageElement.src = blueprint
            imageElement.onload = () => resolve(imageElement)
            imageElement.onerror = () => reject(new Error("Image load failed"))
        })
        const imageBlob = image.src.replace(/^data:image\/[^;]+;base64,/, "")
        const imageBase64 = window.btoa(imageBlob)

        const canvas = document.createElement("canvas")
        canvas.style.display = "none"
        canvas.width = image.width
        canvas.height = image.height
        canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height)

        // returns color of pixel at x,y
        const pixelColor = (x, y) => {
            const data = canvas.getContext('2d').getImageData(x, y, 1, 1).data
            // hex value, or null if pixel is transparent
            return data[3] === 0 ? null : rgbToHex(data[0], data[1], data[2]);
        }

        return {
            width: image.width,
            height: image.height,
            pixelColor
        }
    }

    // this code doesn't look pretty, but it works
    async function runScript(theCanvas) {
        console.log("Placing");
        const place = getPlaceApi(theCanvas);
        const instructions = await getInstructionsApi();
        const { width, height, pixelColor } = instructions;

        // get a random pixel from the placement
        async function findPlaceToColor() {
            let pos = {}
            // selects a random pixel within the placement
            while(true) {
                const x = Math.floor(Math.random() * width)
                const y = Math.floor(Math.random() * height)
                pos = { x, y, color: convertPalette(pixelColor(x, y))}
                const canvasColor = place.getPixel(pos.x + placementLocation.x, pos.y + placementLocation.y)
                // if the color on the canvas does not match the color of the blueprint, we have found a location to place a piece
                if (canvasColor !== pos.color) {
                    console.log(`Found a location to place - color ${pos.color} at ${pos.x + placementLocation.x}, ${pos.y + placementLocation.y}`);
                    return pos;
                }
                // if the colors match, waits a bit and tries again
                await sleep(200); // this also makes sure the code does not hang when the canvas is exactly the same as the blueprint
            }
        }

        const update = async () => {
            console.log("Updating");
            const pos = await findPlaceToColor();
            await place.setPixel(pos.x + placementLocation.x, pos.y + placementLocation.y, pos.color)
            await sleep(5.5 * 60 * 1000)
            update();
        }
        // start the update loop
        setTimeout(update, 1000);
    }

    // maps the image colors to colorMap
    function convertPalette(pixelColor) {
        // the simplest is to take the euclidian distance between the two points in RGB space
        const getDistance = (color1, color2) => {
            const c1 = hexToRgb(color1)
            const c2 = hexToRgb(color2)
            const distance = Math.sqrt(
                Math.pow(c1.r - c2.r, 2) +
                Math.pow(c1.g - c2.g, 2) +
                Math.pow(c1.b - c2.b, 2)
            );
            return distance;
        }

        const availableColors = Array.from(colorMap.keys())
        const closestColor = availableColors.reduce((prev, curr) => {
            const distance = getDistance(pixelColor, curr);
            if (distance < getDistance(pixelColor, prev)) {
                return curr;
            } else {
                return prev;
            }
        });
        return colorMap.get(closestColor);
    }

    // waits for the canvas to be loaded
    const isReadyInterval = setInterval(() => {
        const theCanvas = document
            .querySelector("mona-lisa-embed")
            ?.shadowRoot?.querySelector("mona-lisa-camera")
            ?.querySelector("mona-lisa-canvas")
            ?.shadowRoot?.querySelector("canvas");

        if (theCanvas && document.querySelector("mona-lisa-embed")?.shadowRoot?.querySelector("mona-lisa-overlay")?.shadowRoot.children.length === 0) {
            clearInterval(isReadyInterval);
            runScript(theCanvas);
        }
    }, 500);

    function getPlaceApi(theCanvas) {
        const context = theCanvas.getContext("2d");

        return {
            getPixel: (x, y) => {
                const data = context.getImageData(x, y, 1, 1).data;
                return rgbToHex(data[0], data[1], data[2]);
            },
            setPixel: async (x, y, color) => {
                theCanvas.dispatchEvent(createEvent("click-canvas", { x, y }));
                await sleep(1000);
                theCanvas.dispatchEvent(
                    createEvent("select-color", { color })
                );
                await sleep(1000);
                theCanvas.dispatchEvent(createEvent("confirm-pixel"));
            },
        };
    }

    function createEvent(e, t) {
        return new CustomEvent(e, {
            composed: !0,
            bubbles: !0,
            cancelable: !0,
            detail: t,
        });
    }
    function sleep(ms) {
        return new Promise((response) => setTimeout(response, ms));
    }
    function rgbToHex(r, g, b) {
        return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`.toUpperCase();
    }
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
})();