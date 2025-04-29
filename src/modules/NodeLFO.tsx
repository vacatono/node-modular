'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography, Slider } from '@mui/material';
import * as Tone from 'tone';

interface NodeLFOProps {
  data: {
    label: string;
    frequency?: number;
    type?: Tone.ToneOscillatorType;
    amplitude?: number;
  };
}

const NodeLFO = ({ data }: NodeLFOProps) => {
  const lfo = useRef<Tone.LFO | null>(null);

  useEffect(() => {
    lfo.current = new Tone.LFO({
      frequency: data.frequency || 1,
      type: data.type || 'sine',
      amplitude: data.amplitude || 1,
    });

    return () => {
      lfo.current?.dispose();
    };
  }, [data.frequency, data.type, data.amplitude]);

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

  const handleTypeChange = useCallback((type: Tone.ToneOscillatorType) => {
    if (lfo.current) {
      lfo.current.type = type;
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
        <Typography variant="body2">Wave Type</Typography>
        <select
          onChange={(e) => handleTypeChange(e.target.value as Tone.ToneOscillatorType)}
          defaultValue={data.type || 'sine'}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default NodeLFO;
