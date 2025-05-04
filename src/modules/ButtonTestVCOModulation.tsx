/**
 * OcillatorのfrequencyにLFOの信号を接続して、LFOの信号でVCOの音程を変化させるテストボタン
 */

import React, { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { Button, Slider, Typography, Box } from '@mui/material';

const ButtonTestVCOModulation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [vco, setVCO] = useState<Tone.Oscillator | null>(null);
  const [lfo, setLFO] = useState<Tone.LFO | null>(null);
  const [lfoFrequency, setLfoFrequency] = useState(1);
  const [lfoDepth, setLfoDepth] = useState(100);

  useEffect(() => {
    // コンポーネントのアンマウント時に音を停止
    return () => {
      if (vco) {
        vco.stop();
        vco.dispose();
      }
      if (lfo) {
        lfo.stop();
        lfo.dispose();
      }
    };
  }, [vco, lfo]);

  const handlePlay = async () => {
    if (isPlaying) {
      if (vco) {
        vco.stop();
        vco.dispose();
        setVCO(null);
      }
      if (lfo) {
        lfo.stop();
        lfo.dispose();
        setLFO(null);
      }
      setIsPlaying(false);
      return;
    }

    await Tone.start();

    // LFOの作成と設定
    const newLFO = new Tone.LFO({
      frequency: lfoFrequency,
      min: 440 - lfoDepth,
      max: 440 + lfoDepth,
    });
    setLFO(newLFO);

    // VCOの作成と設定
    const newVCO = new Tone.Oscillator(440, 'sine');
    newVCO.frequency.setValueAtTime(440, Tone.now());

    // LFOをVCOのfrequencyに接続
    newLFO.connect(newVCO.frequency);

    // VCOを出力に接続
    newVCO.toDestination();

    // 音の開始
    newLFO.start();
    newVCO.start();

    setVCO(newVCO);
    setIsPlaying(true);
  };

  const handleLfoFrequencyChange = (event: Event, newValue: number | number[]) => {
    const frequency = newValue as number;
    setLfoFrequency(frequency);
    if (lfo) {
      lfo.frequency.value = frequency;
    }
  };

  const handleLfoDepthChange = (event: Event, newValue: number | number[]) => {
    const depth = newValue as number;
    setLfoDepth(depth);
    if (lfo) {
      lfo.min = 440 - depth;
      lfo.max = 440 + depth;
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, backgroundColor: 'white' }}>
      <Button variant="contained" onClick={handlePlay} sx={{ mb: 2 }}>
        {isPlaying ? 'Stop' : 'Play'}
      </Button>

      <Box sx={{ width: 300 }}>
        <Typography gutterBottom>LFO Frequency: {lfoFrequency} Hz</Typography>
        <Slider value={lfoFrequency} onChange={handleLfoFrequencyChange} min={0.1} max={20} step={0.1} />

        <Typography gutterBottom sx={{ mt: 2 }}>
          LFO Depth: {lfoDepth} Hz
        </Typography>
        <Slider value={lfoDepth} onChange={handleLfoDepthChange} min={1} max={200} step={1} />
      </Box>
    </Box>
  );
};

export default ButtonTestVCOModulation;
