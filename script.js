document.addEventListener("DOMContentLoaded", function () {

  /* ── Starfield ── */
  const starsContainer = document.getElementById("stars");
  for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.className = "star";
    const size = Math.random() * 3 + 1;
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      --d: ${(Math.random() * 3 + 1.5).toFixed(2)}s;
      animation-delay: ${(Math.random() * 4).toFixed(2)}s;
    `;
    starsContainer.appendChild(star);
  }

  /* ── Cake & candle logic ── */
  const cake  = document.querySelector(".cake");
  const icing = document.querySelector(".icing");
  const candleCountDisplay = document.getElementById("candleCount");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    candleCountDisplay.textContent = activeCandles;
  }

  function addCandle(leftInCake, topInCake) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = leftInCake + "px";
    candle.style.top  = topInCake  + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  icing.addEventListener("click", function (event) {
    event.stopPropagation();

    /* Check click is inside the icing ellipse */
    const icingRect = icing.getBoundingClientRect();
    const cx = icingRect.left + icingRect.width  / 2;
    const cy = icingRect.top  + icingRect.height / 2;
    const rx = icingRect.width  / 2 * 0.92; /* slight inset so edge candles don't spill */
    const ry = icingRect.height / 2 * 0.85;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) return; /* outside ellipse */

    /* Convert click to cake-relative coordinates */
    const cakeRect = cake.getBoundingClientRect();
    const leftInCake = event.clientX - cakeRect.left;
    const topInCake  = event.clientY - cakeRect.top;
    addCandle(leftInCake, topInCake);
  });

  function isBlowing() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    return (sum / bufferLength) > 100;
  }

  function blowOutCandles() {
    let blownOut = 0;
    if (isBlowing()) {
      candles.forEach((candle) => {
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
        }
      });
    }
    if (blownOut > 0) updateCandleCount();
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        setInterval(blowOutCandles, 200);
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
});
