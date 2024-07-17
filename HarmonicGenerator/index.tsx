import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';

const HarmonicGenerator = () => {
  const [fundamental, setFundamental] = useState(440);
  const [harmonics, setHarmonics] = useState([1, 0.5, 0.25, 0.125, 0.0625]);
  const [audioContext, setAudioContext] = useState(null);
  const [oscillator, setOscillator] = useState(null);

  useEffect(() => {
    const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(newAudioContext);

    return () => {
      if (newAudioContext) {
        newAudioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioContext) {
      if (oscillator) {
        oscillator.stop();
      }

      const newOscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      newOscillator.type = 'custom';
      const real = new Float32Array([0, ...harmonics]);
      const imag = new Float32Array(real.length).fill(0);
      const wave = audioContext.createPeriodicWave(real, imag);
      newOscillator.setPeriodicWave(wave);

      newOscillator.frequency.setValueAtTime(fundamental, audioContext.currentTime);
      newOscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      newOscillator.start();
      setOscillator(newOscillator);

      return () => {
        newOscillator.stop();
      };
    }
  }, [audioContext, fundamental, harmonics]);

  const handleFundamentalChange = (newValue) => {
    setFundamental(newValue[0]);
  };

  const handleHarmonicChange = (index, newValue) => {
    const newHarmonics = [...harmonics];
    newHarmonics[index] = newValue[0];
    setHarmonics(newHarmonics);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">互動式泛音生成器</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          基頻: {fundamental.toFixed(2)} Hz
        </label>
        <Slider
          value={[fundamental]}
          onValueChange={handleFundamentalChange}
          max={1000}
          min={20}
          step={1}
          className="mt-1"
        />
      </div>
      {harmonics.map((harmonic, index) => (
        <div key={index} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            第 {index + 1} 泛音: {harmonic.toFixed(2)}
          </label>
          <Slider
            value={[harmonic]}
            onValueChange={(newValue) => handleHarmonicChange(index, newValue)}
            max={1}
            min={0}
            step={0.01}
            className="mt-1"
          />
        </div>
      ))}
    </div>
  );
};

export default HarmonicGenerator;