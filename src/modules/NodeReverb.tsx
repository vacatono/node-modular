'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeReverbProps {
  data: {
    label: string;
    decay?: number;
    preDelay?: number;
    wet?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeReverb = ({ data, id }: NodeReverbProps) => {
  const reverb = useRef<Tone.Reverb | null>(null);

  useEffect(() => {
    const initReverb = async () => {
      reverb.current = new Tone.Reverb({
        decay: data.decay || 1.5,
        preDelay: data.preDelay || 0.01,
        wet: data.wet || 0.5,
      });
      await reverb.current.generate();

      // Tone.jsのオブジェクトを登録
      data.registerAudioNode(id, reverb.current);
    };

    initReverb();

    return () => {
      reverb.current?.dispose();
    };
  }, [id, data.decay, data.preDelay, data.wet, data.registerAudioNode]);

  const handleDecayChange = useCallback((value: number | number[]) => {
    if (reverb.current && typeof value === 'number') {
      reverb.current.decay = value;
    }
  }, []);

  const handlePreDelayChange = useCallback((value: number | number[]) => {
    if (reverb.current && typeof value === 'number') {
      reverb.current.preDelay = value;
    }
  }, []);

  const handleWetChange = useCallback((value: number | number[]) => {
    if (reverb.current && typeof value === 'number') {
      reverb.current.wet.value = value;
    }
  }, []);

  return (
    <NodeBox id={id} label={data.label}>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Decay"
          min={0.1}
          max={10}
          step={0.1}
          defaultValue={data.decay || 1.5}
          onChange={handleDecayChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Pre-Delay"
          min={0}
          max={0.1}
          step={0.001}
          defaultValue={data.preDelay || 0.01}
          onChange={handlePreDelayChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Wet"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.wet || 0.5}
          onChange={handleWetChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeReverb;
