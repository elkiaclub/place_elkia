// ==UserScript==
// @name         Place Elkia
// @namespace    https://elkia.club/
// @version      0.1
// @description  the sus corner can't withstand us
// @author       /u/irate_kalypso, modified for Elkia by Cerx
// @match        https://hot-potato.reddit.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=elkia.club
// @updateURL    https://github.com/elkiaclub/place_elkia/raw/master/overlay.user.js
// @downloadURL  https://github.com/elkiaclub/place_elkia/raw/master/overlay.user.js
// @grant        none
// ==/UserScript==
if (window.top !== window.self) {
    window.addEventListener('load', () => {
        document.getElementsByTagName("mona-lisa-embed")[0].shadowRoot.children[0].getElementsByTagName("mona-lisa-canvas")[0].shadowRoot.children[0].appendChild(
            (function () {
                const i = document.createElement("img");
                i.src = "https://imgur.com/x1bmz7p.png";
                i.style = "position: absolute;left: 0;top: 0;image-rendering: pixelated;width: 1000px;height: 1000px;";
                console.log(i);
                return i;
            })())
    }, false);
}