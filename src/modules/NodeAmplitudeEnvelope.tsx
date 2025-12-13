'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, Button } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeAmplitudeEnvelopeProps {
  data: {
    label: string;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeAmplitudeEnvelope = ({ data, id }: NodeAmplitudeEnvelopeProps) => {
  const envelope = useRef<Tone.AmplitudeEnvelope | null>(null);
  const isTriggered = useRef(false);

  useEffect(() => {
    envelope.current = new Tone.AmplitudeEnvelope({
      attack: data.attack || 0.1,
      decay: data.decay || 0.2,
      sustain: data.sustain || 0.5,
      release: data.release || 0.3,
    });

    console.log('[DEBUG] AmplitudeEnvelope created:', {
      envelope: envelope.current,
      hasTriggerAttackRelease: typeof envelope.current?.triggerAttackRelease === 'function',
      hasTriggerAttack: typeof envelope.current?.triggerAttack === 'function',
      hasTriggerRelease: typeof envelope.current?.triggerRelease === 'function',
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

  const handleTriggerStart = useCallback(() => {
    if (envelope.current && !isTriggered.current) {
      envelope.current.triggerAttack();
      isTriggered.current = true;
    }
  }, []);

  const handleTriggerEnd = useCallback(() => {
    if (envelope.current && isTriggered.current) {
      envelope.current.triggerRelease();
      isTriggered.current = false;
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasControl1Handle={true}
      control1Target={{ label: 'Trigger', property: 'trigger' }}
    >
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onMouseDown={handleTriggerStart}
          onMouseUp={handleTriggerEnd}
          onMouseLeave={handleTriggerEnd}
          onTouchStart={(e) => {
            e.preventDefault(); // Prevent scrolling/context menu and ghost mouse events
            handleTriggerStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTriggerEnd();
          }}
          sx={{ width: '100%', touchAction: 'none' }}
        >
          Trigger
        </Button>
      </Box>
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

export default NodeAmplitudeEnvelope;
