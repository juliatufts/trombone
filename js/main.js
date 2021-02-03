
(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    const tromboneUrl = "sfx/pffttftft_bflat.wav";
    const masterVolumeControl = document.querySelector('#volume');
    const pitchControl = document.querySelector('#pitch');

    const buffSize = 10;
    const sourceNodes = [];
    const sourceGainNodes = [];
    const masterGainNode = ctx.createGain();

    let currentlyPlayingIndex = -1;
    let currentlyPlayingPromise = null;
    let isBlowing = false;
    let partial = 1;
    const keyboardControls = {
        KeyZ: false,
        KeyX: false,
        KeyC: false
    };

    function init() {
        for(let i = 0; i < buffSize; i++) {
            sourceNodes.push(null);
            sourceGainNodes.push(null);
        }
        masterGainNode.connect(ctx.destination);
    }

    function loadSample(url) {
        return fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => ctx.decodeAudioData(buffer))
            .then(sample => {
                currentlyPlayingIndex = ((currentlyPlayingIndex + 1) % buffSize);
                let newNode = ctx.createBufferSource();
                let newGainNode = ctx.createGain();
                newNode.buffer = sample;
                newNode.playbackRate.value = 1 / (2**(pitchControl.value / 12.0));
                newNode.connect(newGainNode).connect(masterGainNode);

                sourceNodes[currentlyPlayingIndex] = newNode;
                sourceGainNodes[currentlyPlayingIndex] = newGainNode;
            });
    }

    function calculatePitch(position, partial) {
        /*
            1st partial: B flat -> 0 semitones
            2nd partial: F      -> 7 
            3rd partial: B flat -> 12
            4th partial: D      -> 16
            5th partial: F      -> 19
        */
        let semitones = 0.0;
        if (partial == 2) {semitones = 7}
        if (partial == 3) {semitones = 12}
        if (partial == 4) {semitones = 16}
        if (partial == 5) {semitones = 19}
        return 2**((1 - position + semitones) / 12.0);
    }

    function updatePitch() {
        sourceNodes[currentlyPlayingIndex].playbackRate.value = calculatePitch(pitchControl.value, partial);
    }

    function startBlowing() {
        isBlowing = true;

        // check if context is in suspended state (autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        currentlyPlayingPromise = loadSample(tromboneUrl).then(() => {
            sourceNodes[currentlyPlayingIndex].start(0);
            updatePitch();
        });
    }

    function slide() {
        if (isBlowing) {
            updatePitch();
        }
    }

    function stopBlowing() {
        if (isBlowing) {
            isBlowing = false;

            // Make sure current sample has loaded/started playing before
            // stopping it
            currentlyPlayingPromise.then(() => {
                const index = currentlyPlayingIndex;
                let diminuendo = setInterval(() => {
                    if (!sourceGainNodes[index]) {
                        clearInterval(diminuendo);
                        return;
                    }
                    const currentGain = sourceGainNodes[index].gain.value;
                    if (currentGain <= 0.1) {
                        sourceGainNodes[index].gain.value = 0;
                        sourceNodes[index].stop();
                        clearInterval(diminuendo);
                        return;
                    }
                    sourceGainNodes[index].gain.value = (currentGain - 0.1);
                }, 20);
            });

        }
    }

    window.addEventListener('load', () => {
        init();

        masterVolumeControl.addEventListener('input', () => {
            masterGainNode.gain.value = this.value;
        }, false);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyZ') {keyboardControls.KeyZ = true}
            if (e.code === 'KeyX') {keyboardControls.KeyX = true}
            if (e.code === 'KeyC') {keyboardControls.KeyC = true}
            partial = keyboardControls.KeyC ? 4 : (keyboardControls.KeyX ? 3 : (keyboardControls.KeyZ ? 2 : 1));
            updatePitch();
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'KeyZ') {keyboardControls.KeyZ = false}
            if (e.code === 'KeyX') {keyboardControls.KeyX = false}
            if (e.code === 'KeyC') {keyboardControls.KeyC = false}
            partial = keyboardControls.KeyC ? 4 : (keyboardControls.KeyX ? 3 : (keyboardControls.KeyZ ? 2 : 1));
            updatePitch();
        });
        
        pitchControl.addEventListener('mousedown', startBlowing);
        pitchControl.addEventListener('mousemove', slide);
        pitchControl.addEventListener('mouseup', stopBlowing);

        pitchControl.addEventListener('touchstart', startBlowing);
        pitchControl.addEventListener('touchmove', slide);
        pitchControl.addEventListener('touchend', stopBlowing);
    });
})();