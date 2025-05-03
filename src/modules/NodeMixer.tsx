'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import * as Tone from 'tone';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeMixerProps {
  data: {
    label: string;
    volume?: number;
    pan?: number;
  };
  id: string;
}

const NodeMixer = ({ data, id }: NodeMixerProps) => {
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

  const handleVolumeChange = useCallback((value: number | number[]) => {
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
    <NodeBox id={id} label={data.label}>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Volume"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.volume || 0.5}
          onChange={handleVolumeChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeMixer;
