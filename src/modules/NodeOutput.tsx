'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import * as Tone from 'tone';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeOutputProps {
  data: {
    label: string;
    volume?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
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
    <NodeBox id={id} label={data.label} hasOutputHandle={false}>
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
    </NodeBox>
  );
};

export default NodeOutput;
