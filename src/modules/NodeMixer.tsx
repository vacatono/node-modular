'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography, Slider } from '@mui/material';
import * as Tone from 'tone';

interface NodeMixerProps {
  data: {
    label: string;
    volume?: number;
    pan?: number;
  };
}

const NodeMixer = ({ data }: NodeMixerProps) => {
  const mixer = useRef<Tone.Volume | null>(null);
  const panner = useRef<Tone.Panner | null>(null);

  useEffect(() => {
    mixer.current = new Tone.Volume({
      volume: data.volume || 0,
    });
    panner.current = new Tone.Panner({
      pan: data.pan || 0,
    });

    mixer.current.connect(panner.current);
    panner.current.toDestination();

    return () => {
      mixer.current?.dispose();
      panner.current?.dispose();
    };
  }, [data.volume, data.pan]);

  const handleVolumeChange = useCallback((event: Event, value: number | number[]) => {
    if (mixer.current && typeof value === 'number') {
      mixer.current.volume.value = value;
    }
  }, []);

  const handlePanChange = useCallback((event: Event, value: number | number[]) => {
    if (panner.current && typeof value === 'number') {
      panner.current.pan.value = value;
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
        <Typography variant="body2">Volume</Typography>
        <Slider min={-60} max={0} step={0.1} defaultValue={data.volume || 0} onChange={handleVolumeChange} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Pan</Typography>
        <Slider min={-1} max={1} step={0.01} defaultValue={data.pan || 0} onChange={handlePanChange} />
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default NodeMixer;
