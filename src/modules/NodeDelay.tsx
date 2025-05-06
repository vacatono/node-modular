'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Edge } from 'reactflow';
import { Box } from '@mui/material';
import * as Tone from 'tone';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeDelayProps {
  data: {
    label: string;
    delayTime?: number;
    feedback?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
    edges?: Edge[];
  };
  id: string;
}

const NodeDelay = ({ data, id }: NodeDelayProps) => {
  const delay = useRef<Tone.FeedbackDelay | null>(null);

  // オーディオノードの生成・破棄
  useEffect(() => {
    delay.current = new Tone.FeedbackDelay({
      delayTime: data.delayTime || 0.25,
      feedback: data.feedback || 0.5,
    });

    return () => {
      delay.current?.dispose();
    };
  }, [id, data.delayTime, data.feedback]);

  // オーディオノードの登録
  useEffect(() => {
    if (delay.current) {
      data.registerAudioNode(id, delay.current);
    }
  }, [id, data.registerAudioNode, data.edges]);

  const handleDelayTimeChange = useCallback((value: number | number[]) => {
    if (delay.current && typeof value === 'number') {
      delay.current.delayTime.value = value;
    }
  }, []);

  const handleFeedbackChange = useCallback((value: number | number[]) => {
    if (delay.current && typeof value === 'number') {
      delay.current.feedback.value = value;
    }
  }, []);

  return (
    <NodeBox id={id} label={data.label}>
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
    </NodeBox>
  );
};

export default NodeDelay;
