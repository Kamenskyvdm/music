const audio = document.getElementById('audio');
const fileInput = document.getElementById('audioFile');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const volumeSlider = document.getElementById('volumeSlider');
const logDiv = document.getElementById('log');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

let playlist = [];
let currentTrackIndex = 0;

//Canvas для визуализации
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
    const dpr = window.devicePixelRatio;
    const w = window.innerWidth;
    const h = 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr,dpr);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

//AudioContext и анализатор
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
let source = audioCtx.createMediaElementSource(audio); 
source.connect(analyser);
analyser.connect(audioCtx.destination);

let smoothArray = new Float32Array(analyser.frequencyBinCount);
const AMPLIFY = 2;

//Функция логирования
function log(msg){
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    entry.innerText = '> ' + msg;
    if(Math.random() < 0.3) entry.style.opacity = 0.7 + Math.random()*0.3;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
    if(logDiv.childElementCount > 30) logDiv.removeChild(logDiv.firstChild);
}

//Визуализация 
function visualize(){
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw(){
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#2de2e6";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#2de2e6";

        ctx.beginPath();
        const slice = canvas.width/bufferLength;
        let x = 0;
        for(let i=0;i<bufferLength;i++){
            const v = (dataArray[i]/255 - 0.5) * 2 * AMPLIFY;
            smoothArray[i] = smoothArray[i]*0.8 + v*0.2;
            const y = canvas.height/2 - smoothArray[i]*canvas.height/2;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            x += slice;
        }
        ctx.stroke();
    }

    draw();
}

//Загрузка треков
fileInput.addEventListener('change', ()=>{
    const files = Array.from(fileInput.files);
    if(!files.length) return;
    playlist.push(...files);
   if(!audio.src||audio.paused){
    currentTrackIndex = playlist.length - files.length;
    loadTrack(currentTrackIndex);
   }
    log(`Loaded ${files.length} track(s)`);
});

//Загрузка и воспроизведение трека
function loadTrack(index){
    if(!playlist[index]) return;
    audio.src = URL.createObjectURL(playlist[index]);
    audio.play();
    visualize();
    log(`Now playing: ${playlist[index].name}`);
}

//Управление треками
playBtn.addEventListener('click', ()=>{
    audioCtx.resume();
    audio.play();
    if(playlist[currentTrackIndex]) log(`Playing: ${playlist[currentTrackIndex].name}`);
});
pauseBtn.addEventListener('click', ()=>{
    audio.pause();
    log('Music paused');
});
volumeSlider.addEventListener('input', ()=>{
    audio.volume = Math.min(1, Math.max(0, parseFloat(volumeSlider.value)));
});

//Прогресс-бар
audio.addEventListener('loadedmetadata', ()=>{
    progressBar.max = audio.duration;
    durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('timeupdate', ()=>{
    progressBar.value = audio.currentTime;
    currentTimeEl.textContent = formatTime(audio.currentTime);
});
progressBar.addEventListener('input', ()=>{
    audio.currentTime = progressBar.value;
});
function formatTime(sec){
    if(isNaN(sec)) return "0:00";
    const m=Math.floor(sec/60);
    const s=Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
}

//Переключение треков
function nextTrack(){
    if(!playlist.length) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
}
function prevTrack(){
    if(!playlist.length) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
}

nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

//Авто-переход на следующий трек
audio.addEventListener('ended', nextTrack);