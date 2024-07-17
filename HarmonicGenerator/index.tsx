import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause } from 'lucide-react';

const noteFrequencies = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
};

const HarmonicGenerator = () => {
  const [fundamental, setFundamental] = useState(440);
  const [harmonics, setHarmonics] = useState([
    { amplitude: 1, enabled: true },
    { amplitude: 0.5, enabled: true },
    { amplitude: 0.25, enabled: true },
    { amplitude: 0.125, enabled: true },
    { amplitude: 0.0625, enabled: true },
  ]);
  const [audioContext, setAudioContext] = useState(null);
  const [oscillator, setOscillator] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    let cleanup;
    if (audioContext && isPlaying) {
      cleanup = createOscillator();
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [audioContext, createOscillator, isPlaying]);

  const updateOscillator = (osc = oscillator) => {
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
      oscillator.stop();
      setOscillator(null);
      setGainNode(null);
    }
    setIsPlaying(!isPlaying);
  };

  const handleFundamentalChange = (newValue) => {
    setFundamental(parseFloat(newValue));
    updateOscillator();
  };

  const handleHarmonicChange = (index, newValue) => {
    const newHarmonics = harmonics.map((h, i) => 
      i === index ? { ...h, amplitude: newValue[0] } : h
    );
    setHarmonics(newHarmonics);
    updateOscillator();
  };

  const handleHarmonicToggle = (index) => {
    const newHarmonics = harmonics.map((h, i) => 
      i === index ? { ...h, enabled: !h.enabled } : h
    );
    setHarmonics(newHarmonics);
    updateOscillator();
  };

  const setPresetWaveform = (type) => {
    let newHarmonics;
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

  const drawWaveform = (real, imag) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < width; i++) {
      let t = i / width * Math.PI * 2;
      let y = 0;
      for (let n = 1; n < real.length; n++) {
        y += real[n] * Math.cos(n * t) - imag[n] * Math.sin(n * t);
      }
      y = -y * height / 4 + height / 2;
      ctx.lineTo(i, y);
    }

    ctx.strokeStyle = 'blue';
    ctx.stroke();
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">高級互動式泛音生成器</h2>
      <div className="mb-4 flex items-center space-x-4">
        <Button onClick={handlePlayStop}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Select onValueChange={handleFundamentalChange} value={fundamental.toString()}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="選擇音高" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(noteFrequencies).map(([note, freq]) => (
              <SelectItem key={note} value={freq.toString()}>{note} ({freq} Hz)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <Button onClick={() => setPresetWaveform('sine')} className="mr-2">正弦波</Button>
        <Button onClick={() => setPresetWaveform('square')} className="mr-2">方波</Button>
        <Button onClick={() => setPresetWaveform('sawtooth')}>鋸齒波</Button>
      </div>
      {harmonics.map((harmonic, index) => (
        <div key={index} className="mb-4 flex items-center">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">
              第 {index} 泛音 ({(index + 1) * fundamental} Hz): {harmonic.amplitude.toFixed(2)}
            </label>
            <Slider
              value={[harmonic.amplitude]}
              onValueChange={(newValue) => handleHarmonicChange(index, newValue)}
              max={1}
              min={0}
              step={0.01}
              className="mt-1"
              disabled={!harmonic.enabled}
            />
          </div>
          <Switch
            checked={harmonic.enabled}
            onCheckedChange={() => handleHarmonicToggle(index)}
            className="ml-2"
          />
        </div>
      ))}
      <canvas ref={canvasRef} width="400" height="200" className="border border-gray-300" />
    </div>
  );
};

export default HarmonicGenerator;