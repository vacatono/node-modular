'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, SelectChangeEvent } from '@mui/material';
import CustomSlider from './CustomSlider';

interface NodeVCOProps {
  data: {
    label: string;
    frequency?: number;
    type?: Tone.ToneOscillatorType;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeVCO = ({ data, id }: NodeVCOProps) => {
  const oscillator = useRef<Tone.Oscillator | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    oscillator.current = new Tone.Oscillator(data.frequency || 440, data.type || 'sine');

    // Tone.jsのオブジェクトを登録
    data.registerAudioNode(id, oscillator.current);

    return () => {
      oscillator.current?.stop();
      oscillator.current?.dispose();
    };
  }, [id, data.frequency, data.type, data.registerAudioNode]);

  const handleFrequencyChange = useCallback((event: Event, value: number | number[]) => {
    if (oscillator.current && typeof value === 'number') {
      oscillator.current.frequency.value = value;
    }
  }, []);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (oscillator.current) {
      oscillator.current.type = event.target.value as Tone.ToneOscillatorType;
    }
  }, []);

  const handlePlayToggle = useCallback(() => {
    if (oscillator.current) {
      if (isPlaying) {
        oscillator.current.stop();
      } else {
        oscillator.current.start();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

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
      <Handle type="source" position={Position.Right} />
      <Typography variant="subtitle1">{data.label}</Typography>
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select defaultValue={data.type || 'sine'} onChange={handleTypeChange}>
            <MenuItem value="sine">Sine</MenuItem>
            <MenuItem value="square">Square</MenuItem>
            <MenuItem value="triangle">Triangle</MenuItem>
            <MenuItem value="sawtooth">Sawtooth</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Frequency"
          min={20}
          max={2000}
          step={1}
          defaultValue={data.frequency || 440}
          onChange={handleFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color={isPlaying ? 'secondary' : 'primary'} onClick={handlePlayToggle} fullWidth>
          {isPlaying ? 'Stop' : 'Start'}
        </Button>
      </Box>
    </Box>
  );
};

export default NodeVCO;
