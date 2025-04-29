'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import * as Tone from 'tone';
import CustomSlider from './CustomSlider';

interface NodeDelayProps {
  data: {
    label: string;
    delayTime?: number;
    feedback?: number;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeDelay = ({ data, id }: NodeDelayProps) => {
  const delay = useRef<Tone.FeedbackDelay | null>(null);

  useEffect(() => {
    delay.current = new Tone.FeedbackDelay({
      delayTime: data.delayTime || 0.25,
      feedback: data.feedback || 0.5,
    });

    // Tone.jsのオブジェクトを登録
    data.registerAudioNode(id, delay.current);

    return () => {
      delay.current?.dispose();
    };
  }, [id, data.delayTime, data.feedback, data.registerAudioNode]);

  const handleDelayTimeChange = useCallback((event: Event, value: number | number[]) => {
    if (delay.current && typeof value === 'number') {
      delay.current.delayTime.value = value;
    }
  }, []);

  const handleFeedbackChange = useCallback((event: Event, value: number | number[]) => {
    if (delay.current && typeof value === 'number') {
      delay.current.feedback.value = value;
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
        <CustomSlider
          label="Delay Time"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.delayTime || 0.25}
          onChange={handleDelayTimeChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Feedback"
          min={0}
          max={0.99}
          step={0.01}
          defaultValue={data.feedback || 0.5}
          onChange={handleFeedbackChange}
        />
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default NodeDelay;
