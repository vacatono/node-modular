'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import * as Tone from 'tone';
import CustomSlider from './common/CustomSlider';

interface NodeOutputProps {
  data: {
    label: string;
    volume?: number;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeOutput = ({ data, id }: NodeOutputProps) => {
  const output = useRef<Tone.Volume | null>(null);

  useEffect(() => {
    output.current = new Tone.Volume({
      volume: data.volume || 0,
    }).toDestination();

    // Tone.jsのオブジェクトを登録
    data.registerAudioNode(id, output.current);

    return () => {
      output.current?.dispose();
    };
  }, [id, data.volume, data.registerAudioNode]);

  const handleVolumeChange = useCallback((value: number | number[]) => {
    if (output.current && typeof value === 'number') {
      output.current.volume.value = value;
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
      <Handle type="target" position={Position.Left} id={`${id}-input`} style={{ top: '50%' }} />
      <Typography variant="subtitle1">{data.label}</Typography>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Volume"
          min={-60}
          max={0}
          step={0.1}
          defaultValue={data.volume || 0}
          onChange={handleVolumeChange}
        />
      </Box>
    </Box>
  );
};

export default NodeOutput;
