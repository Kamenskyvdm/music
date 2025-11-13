const audio = document.getElementById('audio');
const fileInput = document.getElementById('audioFile');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeSlider = document.getElementById('volumeSlider');
const logDiv = document.getElementById('log');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const playlistDiv = document.getElementById('playlist');

let playlist = [];
let currentTrackIndex = 0;

// --- Canvas ---
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = 150;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- AudioContext и анализатор ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
let source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// Сглаживание для трёх волн
const smoothArray1 = new Float32Array(bufferLength);
const smoothArray2 = new Float32Array(bufferLength);
const smoothArray3 = new Float32Array(bufferLength);

// --- Лог ---
function log(msg) {
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    entry.innerText = '> ' + msg;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
    if (logDiv.childElementCount > 30) logDiv.removeChild(logDiv.firstChild);
}

// --- Визуализация ---
function visualize() {
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const amplitude = 150;

    // Расчёт масштаба по ширине
    const scaleX = centerX / bufferLength;

    // Обновляем сглаживание
    for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] / 255 - 0.5) * 2;
        smoothArray1[i] = smoothArray1[i] * 0.8 + v * 0.2;
        smoothArray2[i] = smoothArray2[i] * 0.8 + v * 0.15;
        smoothArray3[i] = smoothArray3[i] * 0.8 + v * 0.1;
    }

    function drawWave(array, color, width) {
        // Левая часть
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
            const x = centerX - i * scaleX;
            const y = centerY - array[i] * amplitude;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        // Правая часть
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
            const x = centerX + i * scaleX;
            const y = centerY - array[i] * amplitude;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    drawWave(smoothArray1, '#2de2e6', 2);
    drawWave(smoothArray2, '#1ab8b6', 1.5);
    drawWave(smoothArray3, '#0f7c7c', 1);

    requestAnimationFrame(visualize);
}
visualize();

// --- Загрузка треков ---
fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    if (!files.length) return;
    playlist.push(...files);
    if (!audio.src || audio.paused) {
        currentTrackIndex = playlist.length - files.length;
        loadTrack(currentTrackIndex);
    }
    updatePlaylist();
    log(`Loaded ${files.length} track(s)`);
});

// --- Загрузка и воспроизведение ---
function loadTrack(index) {
    if (!playlist[index]) return;
    audio.src = URL.createObjectURL(playlist[index]);
    visualize();
    log(`Now playing: ${playlist[index].name}`);
    updatePlaylist();
}

// --- Обновление плейлиста ---
function updatePlaylist() {
    playlistDiv.innerHTML = '';
    playlist.forEach((track, index) => {
        const trackEl = document.createElement('div');
        trackEl.classList.add('playlist-track');
        trackEl.textContent = track.name;
        if (index === currentTrackIndex) trackEl.classList.add('active');
        trackEl.addEventListener('click', () => {
            currentTrackIndex = index;
            loadTrack(currentTrackIndex);
        });
        playlistDiv.appendChild(trackEl);
    });
}

// --- Управление ---
playPauseBtn.addEventListener('click', async () => {
    await audioCtx.resume();
    if (audio.paused) {
        await audio.play();
        playPauseBtn.textContent = 'Pause';
        log(`Playing ${playlist[currentTrackIndex]?.name || 'No track'}`);
    } else {
        audio.pause();
        playPauseBtn.textContent = 'Play';
        log('Music paused');
    }
});
audio.addEventListener('ended', () => {
    nextTrack();
    playPauseBtn.textContent = 'Play';
});

// --- Громкость ---
volumeSlider.addEventListener('input', () => {
    audio.volume = Math.min(1, Math.max(0, parseFloat(volumeSlider.value)));
});

// --- Прогресс ---
audio.addEventListener('loadedmetadata', () => {
    progressBar.max = audio.duration;
    durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('timeupdate', () => {
    progressBar.value = audio.currentTime;
    currentTimeEl.textContent = formatTime(audio.currentTime);
});
progressBar.addEventListener('input', () => {
    audio.currentTime = progressBar.value;
});
function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// --- Переключение треков ---
function nextTrack() {
    if (!playlist.length) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
}
function prevTrack() {
    if (!playlist.length) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
}
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);