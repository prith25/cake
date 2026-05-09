const PALETTES = [
    'linear-gradient(to bottom,#ffb3c6,#ff6b95)',
    'linear-gradient(to bottom,#d4a8e8,#a06ccc)',
    'linear-gradient(to bottom,#fde9a2,#f9c85a)',
    'linear-gradient(to bottom,#b3e8ff,#60c0e8)',
    'linear-gradient(to bottom,#c8f5c0,#78d068)',
    'linear-gradient(to bottom,#ffe0b3,#ffaa60)',
];

document.addEventListener('DOMContentLoaded', () => {
    initPetals();

    const cakeTop   = document.getElementById('cake-top');
    const candlesCt = document.getElementById('candles-container');
    const micBtn    = document.getElementById('mic-btn');
    const resetBtn  = document.getElementById('reset-btn');
    const statusMsg = document.getElementById('status-msg');

    let candles = [], audioCtx = null, analyser = null, rafId = null, blown = false;

    function initPetals() {
        const ct = document.getElementById('petals-container');
        const sym = ['🌸','✿','❀','💮','🌺','💗','✨','⭐','💫'];
        for (let i = 0; i < 28; i++) {
            const p = document.createElement('div');
            p.className = 'petal';
            p.textContent = sym[i % sym.length];
            p.style.cssText = `left:${Math.random()*100}%;font-size:${(Math.random()*.7+.5).toFixed(2)}rem;animation-duration:${(Math.random()*12+10).toFixed(1)}s;animation-delay:${(Math.random()*15).toFixed(1)}s;`;
            ct.appendChild(p);
        }
    }

    // Click on icing top → place candle exactly where clicked
    cakeTop.addEventListener('click', (e) => {
        if (blown) return;

        const rect = cakeTop.getBoundingClientRect();
        // Account for CSS scale transform on parent
        const scaleX = rect.width  / cakeTop.offsetWidth;
        const scaleY = rect.height / cakeTop.offsetHeight;
        // Convert viewport click coords to element's own (unscaled) coords
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top)  / scaleY;

        // Only allow in inner 85% of ellipse (keeps candles away from rim)
        const rx = cakeTop.offsetWidth / 2;
        const ry = cakeTop.offsetHeight / 2;
        const S = 0.85;
        if (((x-rx)**2)/((rx*S)**2) + ((y-ry)**2)/((ry*S)**2) > 1) return;

        placeCandle(x, y);
    });

    function placeCandle(x, y) {
        const wrap = document.createElement('div');
        wrap.className = 'candle-wrap';
        // left/top position the element, then CSS transform:translate(-50%,-100%)
        // moves it so its BOTTOM-CENTER sits exactly at (x, y) on the icing
        wrap.style.left = x + 'px';
        wrap.style.top  = y + 'px';
        wrap.style.zIndex = Math.round(y) + 50;

        const body = document.createElement('div');
        body.className = 'candle-body';
        body.style.background = PALETTES[candles.length % PALETTES.length];
        body.style.animationDelay = (candles.length * 0.03) + 's';

        const wick  = document.createElement('div'); wick.className  = 'wick';
        const flame = document.createElement('div'); flame.className = 'flame';

        body.appendChild(wick);
        body.appendChild(flame);
        wrap.appendChild(body);
        candlesCt.appendChild(wrap);
        candles.push(wrap);

        micBtn.disabled = false;
        setStatus(`${candles.length} candle${candles.length>1?'s':''} lit 🕯️`);
    }

    micBtn.addEventListener('click', async () => {
        if (!candles.length) return;
        micBtn.disabled = true;
        setStatus('Listening… blow gently into your mic! 🌬️');
        try {
            await setupMic();
            micBtn.textContent = '🌬️ Blow now!';
            startBlowDetect();
        } catch {
            setStatus('🎤 Mic access denied. Allow it and try again.');
            micBtn.disabled = false;
        }
    });

    async function setupMic() {
        if (audioCtx) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.8;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
    }

    function startBlowDetect() {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        let streak = 0;
        const loop = () => {
            analyser.getByteFrequencyData(buf);
            const avg = buf.reduce((s,v)=>s+v,0) / buf.length;
            if (avg > 68) { if (++streak >= 3) { blowOut(); return; } }
            else streak = 0;
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
    }

    function blowOut() {
        blown = true; cancelAnimationFrame(rafId);
        candles.forEach(w => {
            setTimeout(() => {
                w.querySelector('.flame').classList.add('out');
                const s = document.createElement('div');
                s.className = 'smoke-puff';
                w.querySelector('.candle-body').appendChild(s);
                s.addEventListener('animationend', () => s.remove());
            }, Math.random() * 450);
        });
        setTimeout(() => { setStatus('🎉 Happy Birthday! Your wish is coming true! 💫'); launchConfetti(); }, 700);
    }

    resetBtn.addEventListener('click', () => {
        blown = false; cancelAnimationFrame(rafId);
        audioCtx = null; analyser = null;
        candlesCt.innerHTML = ''; candles = [];
        micBtn.disabled = true; micBtn.textContent = '🎤 Allow Mic';
        setStatus('Tap the icing to place candles ✨');
    });

    function launchConfetti() {
        const colors = ['#fd79a8','#fdbb2d','#d4a8e8','#fff','#ff6b95','#74b9ff','#ffeaa7'];
        for (let i = 0; i < 180; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            el.style.cssText = `width:${Math.random()*8+4}px;height:${Math.random()*14+5}px;background:${colors[i%colors.length]};top:-20px;left:${Math.random()*100}vw;border-radius:${Math.random()>.5?'50%':'2px'}`;
            document.body.appendChild(el);
            const dur = (Math.random()*3+2)*1000;
            el.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${(Math.random()-.5)*300}px,105vh) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:dur,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'forwards'});
            setTimeout(()=>el.remove(),dur+100);
        }
    }

    function setStatus(msg) { statusMsg.innerHTML = msg; }
});
