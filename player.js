const audio = document.getElementById('audio');
const fileInput = document.getElementById('audioFile');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const volumeSlider = document.getElementById('volumeSlider');
const logDiv = document.getElementById('log');

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 200;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

let source = null;
let smoothArray = new Float32Array(analyser.frequencyBinCount);
const AMPLIFY = 2;

// --- Функция логирования ---
function log(msg) {
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    entry.innerText = '> ' + msg;

    if (Math.random() < 0.3) entry.style.opacity = 0.7 + Math.random() * 0.3;

    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;

    if (logDiv.childElementCount > 30) logDiv.removeChild(logDiv.firstChild);
}

// --- Визуализация ---
function visualize() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#2de2e6";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#2de2e6";

        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] / 255 - 0.5) * 2 * AMPLIFY;
            smoothArray[i] = smoothArray[i] * 0.8 + v * 0.2;

            const y = canvas.height / 2 - smoothArray[i] * canvas.height / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
        }
        ctx.stroke();
    }

    draw();
}

// --- Загрузка файла ---
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    audio.src = URL.createObjectURL(file);

    if (source) source.disconnect();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    visualize(); // запускаем визуализацию один раз
    log('File loaded: ' + file.name);
});

// --- Кнопки управления ---
playBtn.addEventListener('click', () => {
    audioCtx.resume(); // чтобы AudioContext заработал
    audio.play();
    if (fileInput.files[0]) log('Playing: ' + fileInput.files[0].name);
});

pauseBtn.addEventListener('click', () => {
    audio.pause();
    log('Music paused');
});

volumeSlider.addEventListener('input', () => {
    // Приводим значение к числу и ограничиваем от 0 до 1
    const volume = Math.min(1, Math.max(0, parseFloat(volumeSlider.value)));
    audio.volume = volume;
});