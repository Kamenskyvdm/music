const audio = document.getElementById('audio');
const fileInput = document.getElementById('audioFile');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const volumeSlider = document.getElementById('volumeSlider');

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 200;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let source = null;

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        audio.src = URL.createObjectURL(file);

        audio.play().then(() => {
            if (source) source.disconnect();
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            analyser.fftSize = 64;
            visualize();
        }).catch(err => console.log(err));
    }
});

playBtn.addEventListener('click', () => {
    audioCtx.resume(); 
    audio.play();
});

pauseBtn.addEventListener('click', () => audio.pause());
volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
});

function visualize() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i];
            ctx.fillStyle = `rgb(${barHeight+100}, 50, ${255-barHeight})`;
            ctx.fillRect(i * 10, canvas.height - barHeight, 8, barHeight);
        }
    }

    draw();
}