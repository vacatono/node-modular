'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography, Slider } from '@mui/material';
import * as Tone from 'tone';

interface NodeEnvelopeProps {
  data: {
    label: string;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  };
}

const NodeEnvelope = ({ data }: NodeEnvelopeProps) => {
  const envelope = useRef<Tone.Envelope | null>(null);

  useEffect(() => {
    envelope.current = new Tone.Envelope({
      attack: data.attack || 0.1,
      decay: data.decay || 0.2,
      sustain: data.sustain || 0.5,
      release: data.release || 0.8,
    });

    return () => {
      envelope.current?.dispose();
    };
  }, [data.attack, data.decay, data.sustain, data.release]);

  const handleAttackChange = useCallback((event: Event, value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.attack = value;
    }
  }, []);

  const handleDecayChange = useCallback((event: Event, value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.decay = value;
    }
  }, []);

  const handleSustainChange = useCallback((event: Event, value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.sustain = value;
    }
  }, []);

  const handleReleaseChange = useCallback((event: Event, value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.release = value;
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
        <Typography variant="body2">Attack</Typography>
        <Slider min={0.001} max={2} step={0.001} defaultValue={data.attack || 0.1} onChange={handleAttackChange} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Decay</Typography>
        <Slider min={0.001} max={2} step={0.001} defaultValue={data.decay || 0.2} onChange={handleDecayChange} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Sustain</Typography>
        <Slider min={0} max={1} step={0.01} defaultValue={data.sustain || 0.5} onChange={handleSustainChange} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Release</Typography>
        <Slider min={0.001} max={2} step={0.001} defaultValue={data.release || 0.8} onChange={handleReleaseChange} />
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default NodeEnvelope;
