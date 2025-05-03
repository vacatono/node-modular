'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography, Slider, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import * as Tone from 'tone';

interface NodeLFOProps {
  data: {
    label: string;
    frequency?: number;
    type?: Tone.ToneOscillatorType;
    amplitude?: number;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
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

  const handleFrequencyChange = useCallback((event: Event, value: number | number[]) => {
    if (lfo.current && typeof value === 'number') {
      lfo.current.frequency.value = value;
    }
  }, []);

  const handleAmplitudeChange = useCallback((event: Event, value: number | number[]) => {
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
    <Box
      sx={{
        padding: 2,
        border: '1px solid #ccc',
        borderRadius: 1,
        backgroundColor: 'white',
        minWidth: 200,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Typography variant="subtitle1">{data.label}</Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Frequency</Typography>
        <Slider min={0.1} max={20} step={0.1} defaultValue={data.frequency || 1} onChange={handleFrequencyChange} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Amplitude</Typography>
        <Slider min={0} max={1} step={0.01} defaultValue={data.amplitude || 1} onChange={handleAmplitudeChange} />
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
      <Handle type="source" position={Position.Right} id="output" />
    </Box>
  );
};

export default NodeLFO;
