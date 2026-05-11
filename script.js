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
        setTimeout(() => { launchConfetti(); setTimeout(showKnife, 2500); }, 700);
    }

    resetBtn.addEventListener('click', () => {
        blown = false; cancelAnimationFrame(rafId);
        audioCtx = null; analyser = null;
        candlesCt.style.opacity = '1';
        candlesCt.innerHTML = ''; candles = [];
        micBtn.disabled = true; micBtn.textContent = '🎤 Allow Mic';
        setStatus('Tap the icing to place candles ✨');

        cutIndex = 0;
        const cakeScene = document.querySelector('.cake-scene');
        cakeScene.style.clipPath = '';
        const knife = document.getElementById('knife');
        if (knife) knife.remove();
        // Remove any residual slices
        document.querySelectorAll('.cake-scene:not(:first-child)').forEach(s => s.remove());
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

    // --- CAKE CUTTING LOGIC ---
    let cutIndex = 0;
    let isDraggingKnife = false;

    const REMAINING_CLIP_PATHS = [
        '',
        'polygon(160px 50px, 420px 164px, 420px -64px, 420px -100px, 160px -100px, -100px -100px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, 420px -64px, 420px -100px, 160px -100px, -100px -100px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, 160px -100px, -100px -100px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, 160px 50px, 160px 50px)' // empty
    ];

    const SLICE_CLIP_PATHS = [
        'polygon(160px 50px, 160px 350px, 420px 350px, 420px 164px)',
        'polygon(160px 50px, 420px 164px, 420px -64px)',
        'polygon(160px 50px, 420px -64px, 420px -100px, 160px -100px)',
        'polygon(160px 50px, 160px -100px, -100px -100px, -100px -64px)',
        'polygon(160px 50px, -100px -64px, -100px 164px)',
        'polygon(160px 50px, -100px 164px, -100px 350px, 160px 350px)'
    ];

    const SLICE_ANIM_TRANSFORMS = [
        'translate(50px, 30px) rotate(10deg)',
        'translate(60px, -10px) rotate(15deg)',
        'translate(30px, -40px) rotate(5deg)',
        'translate(-30px, -40px) rotate(-5deg)',
        'translate(-60px, -10px) rotate(-15deg)',
        'translate(-50px, 30px) rotate(-10deg)'
    ];

    function showKnife() {
        candlesCt.style.transition = 'opacity 1s';
        candlesCt.style.opacity = '0';
        setTimeout(() => candlesCt.innerHTML = '', 1000);

        const knife = document.createElement('div');
        knife.id = 'knife';
        knife.className = 'knife';
        knife.innerHTML = `<svg width="40" height="120" viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M 15 0 L 25 0 L 23 40 L 17 40 Z" fill="#2c3e50"/>
          <rect x="12" y="38" width="16" height="4" rx="2" fill="#f9c85a"/>
          <path d="M 16 42 L 24 42 L 35 90 C 38 110, 20 120, 20 120 C 20 120, 2 110, 5 90 Z" fill="#e0e0e0"/>
          <path d="M 20 42 L 24 42 L 35 90 C 38 110, 20 120, 20 120 L 20 42 Z" fill="#ffffff"/>
        </svg>`;
        document.body.appendChild(knife);

        const rect = document.querySelector('.cake-container').getBoundingClientRect();
        knife.style.left = (rect.right + 10) + 'px';
        knife.style.top = (rect.top - 20) + 'px';
        knife.style.transform = 'rotate(30deg)';

        setStatus('Drag the knife to cut a slice 🔪');

        const drag = (e) => {
            if (!isDraggingKnife) return;
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            if(x && y) {
                knife.style.left = (x - 20) + 'px';
                knife.style.top = (y - 20) + 'px';
                e.preventDefault();
            }
        };

        const endDrag = () => {
            if (!isDraggingKnife) return;
            isDraggingKnife = false;
            
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);

            const kRect = knife.getBoundingClientRect();
            const cRect = document.querySelector('.cake-container').getBoundingClientRect();

            if (kRect.left < cRect.right + 50 && kRect.right > cRect.left - 50 &&
                kRect.top < cRect.bottom + 100 && kRect.bottom > cRect.top - 50) {
                performCut();
            } else {
                knife.style.transition = 'all 0.3s';
                knife.style.left = (cRect.right + 10) + 'px';
                knife.style.top = (cRect.top - 20) + 'px';
                knife.style.transform = 'rotate(30deg)';
                setTimeout(() => knife.style.transition = 'transform 0.1s', 300);
            }
        };

        const startDrag = (e) => {
            if(knife.classList.contains('cutting')) return;
            isDraggingKnife = true;
            e.preventDefault();
            document.addEventListener('mousemove', drag, {passive: false});
            document.addEventListener('touchmove', drag, {passive: false});
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        };

        knife.addEventListener('mousedown', startDrag);
        knife.addEventListener('touchstart', startDrag, {passive: false});
    }

    function performCut() {
        if (cutIndex >= 6) return;
        const knife = document.getElementById('knife');
        const cakeContainer = document.querySelector('.cake-container');
        const cakeScene = document.querySelector('.cake-scene'); // Get the main remaining cake
        const cRect = cakeContainer.getBoundingClientRect();
        
        knife.classList.add('cutting');
        knife.style.left = (cRect.left + cRect.width/2 - 20) + 'px';
        knife.style.top = (cRect.top - 60) + 'px';
        knife.style.transform = 'rotate(0deg)';

        setTimeout(() => {
            knife.style.top = (cRect.bottom + 20) + 'px';
            
            setTimeout(() => {
                const slice = cakeScene.cloneNode(true);
                slice.style.clipPath = SLICE_CLIP_PATHS[cutIndex];
                slice.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                cakeContainer.appendChild(slice);
                
                cutIndex++;
                cakeScene.style.clipPath = REMAINING_CLIP_PATHS[cutIndex];
                
                setTimeout(() => {
                    slice.style.transform = SLICE_ANIM_TRANSFORMS[cutIndex - 1];
                    slice.style.opacity = '0';
                    setTimeout(() => slice.remove(), 1200);
                }, 50);
                
                knife.classList.remove('cutting');
                if (cutIndex < 6) {
                    setStatus(`Cut ${cutIndex}/6! Keep going 🔪`);
                    knife.style.left = (cRect.right + 10) + 'px';
                    knife.style.top = (cRect.top - 20) + 'px';
                    knife.style.transform = 'rotate(30deg)';
                } else {
                    setStatus('All gone! Hope you enjoyed the cake 🎉');
                    knife.style.opacity = '0';
                    setTimeout(() => knife.remove(), 500);
                }
            }, 400);
        }, 50);
    }
});
