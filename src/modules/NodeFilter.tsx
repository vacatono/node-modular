'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import CustomSlider from './CustomSlider';

interface NodeFilterProps {
  data: {
    label: string;
    frequency?: number;
    type?: BiquadFilterType;
    Q?: number;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeFilter = ({ data, id }: NodeFilterProps) => {
  const filter = useRef<Tone.Filter | null>(null);

  useEffect(() => {
    filter.current = new Tone.Filter({
      frequency: data.frequency || 1000,
      type: data.type || 'lowpass',
      Q: data.Q || 1,
    });

    // Tone.jsのオブジェクトを登録
    data.registerAudioNode(id, filter.current);

    return () => {
      filter.current?.dispose();
    };
  }, [id, data.frequency, data.type, data.Q, data.registerAudioNode]);

  const handleFrequencyChange = useCallback((event: Event, value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      filter.current.frequency.value = value;
    }
  }, []);

  const handleQChange = useCallback((event: Event, value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      filter.current.Q.value = value;
    }
  }, []);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (filter.current) {
      filter.current.type = event.target.value as BiquadFilterType;
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
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select defaultValue={data.type || 'lowpass'} onChange={handleTypeChange}>
            <MenuItem value="lowpass">Lowpass</MenuItem>
            <MenuItem value="highpass">Highpass</MenuItem>
            <MenuItem value="bandpass">Bandpass</MenuItem>
            <MenuItem value="notch">Notch</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Frequency"
          min={20}
          max={20000}
          step={1}
          defaultValue={data.frequency || 1000}
          onChange={handleFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Resonance (Q)"
          min={0.1}
          max={10}
          step={0.1}
          defaultValue={data.Q || 1}
          onChange={handleQChange}
        />
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default NodeFilter;
