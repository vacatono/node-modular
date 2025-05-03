'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeEnvelopeProps {
  data: {
    label: string;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeEnvelope = ({ data, id }: NodeEnvelopeProps) => {
  const envelope = useRef<Tone.AmplitudeEnvelope | null>(null);

  useEffect(() => {
    envelope.current = new Tone.AmplitudeEnvelope({
      attack: data.attack || 0.1,
      decay: data.decay || 0.2,
      sustain: data.sustain || 0.5,
      release: data.release || 0.3,
    });

    data.registerAudioNode(id, envelope.current);

    return () => {
      envelope.current?.dispose();
    };
  }, [id, data.attack, data.decay, data.sustain, data.release, data.registerAudioNode]);

  const handleAttackChange = useCallback((value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.attack = value;
    }
  }, []);

  const handleDecayChange = useCallback((value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.decay = value;
    }
  }, []);

  const handleSustainChange = useCallback((value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.sustain = value;
    }
  }, []);

  const handleReleaseChange = useCallback((value: number | number[]) => {
    if (envelope.current && typeof value === 'number') {
      envelope.current.release = value;
    }
  }, []);

  return (
    <NodeBox id={id} label={data.label}>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Attack"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.attack || 0.1}
          onChange={handleAttackChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Decay"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.decay || 0.2}
          onChange={handleDecayChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Sustain"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.sustain || 0.5}
          onChange={handleSustainChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Release"
          min={0}
          max={1}
          step={0.01}
          defaultValue={data.release || 0.3}
          onChange={handleReleaseChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeEnvelope;
