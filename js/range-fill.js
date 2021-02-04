
(() => {
    const pitchControl = document.querySelector('#pitch');
    const pitchMin = pitchControl.getAttribute("min");
    const pitchMax = pitchControl.getAttribute("max");
    const sliderMax = 140;
    const svgSlider = document.querySelector('svg.slider');

    window.addEventListener('load', () => {
        pitchControl.addEventListener('input', e => {
            pitchControl.style.setProperty('--val', pitchControl.value);
            let pitchNormalized = (pitchControl.value - pitchMin) / (pitchMax - pitchMin);
            svgSlider.style.setProperty('--left', (pitchNormalized * sliderMax) + "px");
        }, false);
    });
})();
