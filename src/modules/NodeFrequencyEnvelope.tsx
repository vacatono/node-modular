'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, Button } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

interface NodeFrequencyEnvelopeProps {
  data: {
    label: string;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    minFrequency?: number;
    maxFrequency?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

/**
 * 周波数エンベロープノード
 * VCOの周波数をエンベロープで制御します
 */
const NodeFrequencyEnvelope = ({ data, id }: NodeFrequencyEnvelopeProps) => {
  const envelope = useRef<Tone.Envelope | null>(null);
  const signal = useRef<Tone.Signal | null>(null);
  const scale = useRef<Tone.Scale | null>(null);
  const isTriggered = useRef(false);

  useEffect(() => {
    envelope.current = new Tone.Envelope({
      attack: data.attack || 0.1,
      decay: data.decay || 0.2,
      sustain: data.sustain || 0.5,
      release: data.release || 0.3,
    });

    signal.current = new Tone.Signal(0);
    scale.current = new Tone.Scale(data.minFrequency || 440, data.maxFrequency || 880);

    envelope.current.connect(signal.current);
    signal.current.connect(scale.current);

    data.registerAudioNode(id, scale.current);

    return () => {
      envelope.current?.dispose();
      signal.current?.dispose();
      scale.current?.dispose();
    };
  }, [
    id,
    data.attack,
    data.decay,
    data.sustain,
    data.release,
    data.minFrequency,
    data.maxFrequency,
    data.registerAudioNode,
  ]);

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

  const handleMinFrequencyChange = useCallback((value: number | number[]) => {
    if (scale.current && typeof value === 'number') {
      scale.current.min = value;
    }
  }, []);

  const handleMaxFrequencyChange = useCallback((value: number | number[]) => {
    if (scale.current && typeof value === 'number') {
      scale.current.max = value;
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
      hasInputHandle={false}
      hasControl1Handle={true}
      control1Target={{ label: 'Trigger', property: 'trigger' }}
    >
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onMouseDown={handleTriggerStart}
          onMouseUp={handleTriggerEnd}
          onMouseLeave={handleTriggerEnd}
          sx={{ width: '100%' }}
        >
          トリガー
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
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="最小周波数"
          min={20}
          max={2000}
          step={1}
          defaultValue={data.minFrequency || 440}
          onChange={handleMinFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="最大周波数"
          min={20}
          max={2000}
          step={1}
          defaultValue={data.maxFrequency || 880}
          onChange={handleMaxFrequencyChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeFrequencyEnvelope;
