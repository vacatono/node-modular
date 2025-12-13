'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import NodeBox from './common/NodeBox';

class NoiseSynthNode extends Tone.ToneAudioNode {
  private synth: Tone.NoiseSynth;

  constructor(options: {
    noiseType?: Tone.NoiseType;
  } = {}) {
    super();
    this.synth = new Tone.NoiseSynth({
      noise: {
        type: options.noiseType || 'white'
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0,
      }
    });
  }

  get name(): string {
    return 'NoiseSynthNode';
  }

  get input(): Tone.ToneAudioNode {
    return this.synth;
  }

  get output(): Tone.ToneAudioNode {
    return this.synth;
  }

  triggerAttack(time?: Tone.Unit.Time, velocity?: number): this {
    this.synth.triggerAttack(time, velocity);
    return this;
  }

  triggerRelease(time?: Tone.Unit.Time): this {
    this.synth.triggerRelease(time);
    return this;
  }

  triggerAttackRelease(duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number): this {
    this.synth.triggerAttackRelease(duration, time, velocity);
    return this;
  }

  // Noise synth doesn't have pitch, so we ignore setNote but implement it for interface compatibility
  setNote(_note: Tone.Unit.Frequency, _time?: Tone.Unit.Time): void {
    // Noise synth does not support setting notes
  }

  setNoiseType(type: Tone.NoiseType): void {
    this.synth.noise.type = type;
  }

  dispose(): this {
    this.synth.dispose();
    super.dispose();
    return this;
  }
}

interface NodeNoiseSynthProps {
  data: {
    label: string;
    noiseType?: Tone.NoiseType;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeNoiseSynth = ({ data, id }: NodeNoiseSynthProps) => {
  const synthNode = useRef<NoiseSynthNode | null>(null);

  useEffect(() => {
    synthNode.current = new NoiseSynthNode({
      noiseType: data.noiseType,
    });

    data.registerAudioNode(id, synthNode.current);

    return () => {
      synthNode.current?.dispose();
    };
  }, [id, data.registerAudioNode]);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (synthNode.current) {
      synthNode.current.setNoiseType(event.target.value as Tone.NoiseType);
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label || 'Noise Synth'}
      hasInputHandle={false}
      hasOutputHandle={true}
      hasControl1Handle={true}
      control1Target={{ label: 'Trigger In', property: 'trigger', isSource: false }}
    // Note input removed as it's not useful for NoiseSynth
    >
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Noise Type</InputLabel>
          <Select defaultValue={data.noiseType || 'white'} onChange={handleTypeChange}>
            <MenuItem value="white">White</MenuItem>
            <MenuItem value="pink">Pink</MenuItem>
            <MenuItem value="brown">Brown</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </NodeBox>
  );
};

export default NodeNoiseSynth;
