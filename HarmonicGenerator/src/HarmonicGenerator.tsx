import React, { useState, useEffect, useCallback, useRef } from 'react';

const noteFrequencies: { [key: string]: number } = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
};

interface Harmonic {
  amplitude: number;
  enabled: boolean;
}

const HarmonicGenerator: React.FC = () => {
  const [fundamental, setFundamental] = useState<number>(440);
  const [harmonics, setHarmonics] = useState<Harmonic[]>([
    { amplitude: 1, enabled: true },
    { amplitude: 0.5, enabled: true },
    { amplitude: 0.25, enabled: true },
    { amplitude: 0.125, enabled: true },
    { amplitude: 0.0625, enabled: true },
  ]);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(newAudioContext);

    return () => {
      if (newAudioContext) {
        newAudioContext.close();
      }
    };
  }, []);

  const createOscillator = useCallback(() => {
    if (audioContext) {
      const newOscillator = audioContext.createOscillator();
      const newGainNode = audioContext.createGain();
      
      updateOscillator(newOscillator);
      
      newOscillator.connect(newGainNode);
      newGainNode.connect(audioContext.destination);

      newOscillator.start();
      setOscillator(newOscillator);
      setGainNode(newGainNode);

      return () => {
        newOscillator.stop();
        newOscillator.disconnect();
        newGainNode.disconnect();
      };
    }
  }, [audioContext, fundamental, harmonics]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (audioContext && isPlaying) {
      cleanup = createOscillator();
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [audioContext, createOscillator, isPlaying]);

  const updateOscillator = (osc: OscillatorNode = oscillator!) => {
    if (osc && audioContext) {
      const real = new Float32Array([0, ...harmonics.map(h => h.enabled ? h.amplitude : 0)]);
      const imag = new Float32Array(real.length).fill(0);
      const wave = audioContext.createPeriodicWave(real, imag, { disableNormalization: true });
      osc.setPeriodicWave(wave);
      osc.frequency.setValueAtTime(fundamental, audioContext.currentTime);
      drawWaveform(real, imag);
    }
  };
  
  const handlePlayStop = () => {
    if (isPlaying) {
      oscillator?.stop();
      setOscillator(null);
      setGainNode(null);
    }
    setIsPlaying(!isPlaying);
  };

  const handleFundamentalChange = (newValue: string) => {
    setFundamental(parseFloat(newValue));
    updateOscillator();
  };

  const handleHarmonicChange = (index: number, newValue: number) => {
    const newHarmonics = harmonics.map((h, i) => 
      i === index ? { ...h, amplitude: newValue } : h
    );
    setHarmonics(newHarmonics);
    updateOscillator();
  };
  
  const handleHarmonicToggle = (index: number) => {
    const newHarmonics = harmonics.map((h, i) => 
      i === index ? { ...h, enabled: !h.enabled } : h
    );
    setHarmonics(newHarmonics);
    updateOscillator();
  };
  
  const setPresetWaveform = (type: string) => {
    let newHarmonics: Harmonic[];
    switch (type) {
      case 'sine':
        newHarmonics = [{ amplitude: 1, enabled: true }, ...Array(4).fill({ amplitude: 0, enabled: false })];
        break;
      case 'square':
        newHarmonics = [
          { amplitude: 1, enabled: true },
          { amplitude: 0, enabled: false },
          { amplitude: 1/3, enabled: true },
          { amplitude: 0, enabled: false },
          { amplitude: 1/5, enabled: true }
        ];
        break;
      case 'sawtooth':
        newHarmonics = [
          { amplitude: 1, enabled: true },
          { amplitude: 1/2, enabled: true },
          { amplitude: 1/3, enabled: true },
          { amplitude: 1/4, enabled: true },
          { amplitude: 1/5, enabled: true }
        ];
        break;
      default:
        return;
    }
    setHarmonics(newHarmonics);
    updateOscillator();
  };

const drawWaveform = (real: Float32Array, imag: Float32Array) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(0, height / 2);

  for (let i = 0; i < width; i++) {
    let t = i / width * Math.PI * 2;
    let y = 0;
    for (let n = 0; n < real.length; n++) {
      y += real[n] * Math.cos(n * t) - imag[n] * Math.sin(n * t);
    }
    y = -y * height / 4 + height / 2;
    ctx.lineTo(i, y);
  }

  ctx.strokeStyle = 'blue';
  ctx.stroke();
};

  return (
    <div className="container">
      <h2>高級互動式泛音生成器</h2>
      <div>
        <button onClick={handlePlayStop}>
          {isPlaying ? "停止" : "播放"}
        </button>
        <select onChange={(e) => handleFundamentalChange(e.target.value)} value={fundamental}>
          {Object.entries(noteFrequencies).map(([note, freq]) => (
            <option key={note} value={freq.toString()}>{note} ({freq} Hz)</option>
          ))}
        </select>
      </div>
      <div>
        <button onClick={() => setPresetWaveform('sine')}>正弦波</button>
        <button onClick={() => setPresetWaveform('square')}>方波</button>
        <button onClick={() => setPresetWaveform('sawtooth')}>鋸齒波</button>
      </div>
      {harmonics.map((harmonic, index) => (
        <div key={index}>
          <label>
            第 {index} 泛音 ({(index + 1) * fundamental} Hz): {harmonic.amplitude.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={harmonic.amplitude}
            onChange={(e) => handleHarmonicChange(index, parseFloat(e.target.value))}
            disabled={!harmonic.enabled}
            className="slider"
          />
          <input
            type="checkbox"
            checked={harmonic.enabled}
            onChange={() => handleHarmonicToggle(index)}
          />
        </div>
      ))}
      <canvas ref={canvasRef} width={400} height={200} />
    </div>
  );
};

export default HarmonicGenerator;
