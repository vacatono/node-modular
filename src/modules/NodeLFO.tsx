'use client';

import { useCallback, useEffect, useRef } from 'react';

import { Box, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import * as Tone from 'tone';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeLFOProps {
  data: {
    label: string;
    frequency?: number;
    type?: Tone.ToneOscillatorType;
    amplitude?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeLFO = ({ data, id }: NodeLFOProps) => {
  const lfo = useRef<Tone.LFO | null>(null);
  const outputSignal = useRef<Tone.Signal | null>(null);

  useEffect(() => {
    lfo.current = new Tone.LFO({
      frequency: data.frequency || 1,
      type: data.type || 'sine',
      amplitude: data.amplitude || 1,
      //min: 0,
      // max: 880,
    });

    // 出力用のSignalを作成
    outputSignal.current = new Tone.Signal(0);

    // LFOの出力をSignalに接続
    lfo.current.connect(outputSignal.current);

    // LFOを開始
    lfo.current.start();

    // Tone.jsのオブジェクトを登録
    data.registerAudioNode(id, outputSignal.current);

    return () => {
      lfo.current?.stop();
      lfo.current?.dispose();
      outputSignal.current?.dispose();
    };
  }, [id, data.frequency, data.type, data.amplitude, data.registerAudioNode]);

  const handleFrequencyChange = useCallback((value: number | number[]) => {
    if (lfo.current && typeof value === 'number') {
      lfo.current.frequency.value = value;
    }
  }, []);

  const handleAmplitudeChange = useCallback((value: number | number[]) => {
    if (lfo.current && typeof value === 'number') {
      lfo.current.amplitude.value = value;
    }
  }, []);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (lfo.current) {
      lfo.current.type = event.target.value as Tone.ToneOscillatorType;
    }
  }, []);

  return (
    <NodeBox id={id} label={data.label}>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Frequency"
          min={0.1}
          max={20}
          step={0.1}
          defaultValue={data.frequency || 1}
          onChange={handleFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Amplitude"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.amplitude || 0.5}
          onChange={handleAmplitudeChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Wave Type</InputLabel>
          <Select defaultValue={data.type || 'sine'} onChange={handleTypeChange}>
            <MenuItem value="sine">Sine</MenuItem>
            <MenuItem value="square">Square</MenuItem>
            <MenuItem value="triangle">Triangle</MenuItem>
            <MenuItem value="sawtooth">Sawtooth</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </NodeBox>
  );
};

export default NodeLFO;
