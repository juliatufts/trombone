
(() => {
    const pitchControl = document.querySelector('#pitch');
    window.addEventListener('load', () => {
        pitchControl.addEventListener('input', e => {
            pitchControl.style.setProperty('--val', pitchControl.value);
        }, false);
    });
})();
