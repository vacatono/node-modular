'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

class MembraneSynthNode extends Tone.ToneAudioNode {
  private synth: Tone.MembraneSynth;
  private currentNote: Tone.Unit.Frequency = 'C2';

  constructor(options: {
    pitchDecay?: number;
    octaves?: number;
    oscillatorType?: Tone.ToneOscillatorType;
  } = {}) {
    super();
    this.synth = new Tone.MembraneSynth({
      pitchDecay: options.pitchDecay || 0.05,
      octaves: options.octaves || 6,
      oscillator: {
        type: (options.oscillatorType || 'sine') as any
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    });
  }

  get name(): string {
    return 'MembraneSynthNode';
  }

  get input(): Tone.ToneAudioNode {
    return this.synth;
  }

  get output(): Tone.ToneAudioNode {
    return this.synth;
  }

  triggerAttack(time?: Tone.Unit.Time, velocity?: number): this {
    this.synth.triggerAttack(this.currentNote, time, velocity);
    return this;
  }

  triggerRelease(time?: Tone.Unit.Time): this {
    this.synth.triggerRelease(time);
    return this;
  }

  triggerAttackRelease(duration: Tone.Unit.Time | Tone.Unit.Time[], time?: Tone.Unit.Time, velocity?: number): this {
    this.synth.triggerAttackRelease(this.currentNote, duration, time, velocity);
    return this;
  }

  setNote(note: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
    this.currentNote = note;
    this.synth.setNote(note, time);
  }

  setPitchDecay(value: number): void {
    this.synth.pitchDecay = value;
  }

  setOctaves(value: number): void {
    this.synth.octaves = value;
  }

  setOscillatorType(type: Tone.ToneOscillatorType): void {
    this.synth.oscillator.type = type;
  }

  dispose(): this {
    this.synth.dispose();
    super.dispose();
    return this;
  }
}

interface NodeMembraneSynthProps {
  data: {
    label: string;
    pitchDecay?: number;
    octaves?: number;
    oscillatorType?: Tone.ToneOscillatorType;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeMembraneSynth = ({ data, id }: NodeMembraneSynthProps) => {
  const synthNode = useRef<MembraneSynthNode | null>(null);

  useEffect(() => {
    synthNode.current = new MembraneSynthNode({
      pitchDecay: data.pitchDecay,
      octaves: data.octaves,
      oscillatorType: data.oscillatorType,
    });

    data.registerAudioNode(id, synthNode.current);

    return () => {
      synthNode.current?.dispose();
    };
  }, [id, data.registerAudioNode]);

  const handlePitchDecayChange = useCallback((value: number | number[]) => {
    if (synthNode.current && typeof value === 'number') {
      synthNode.current.setPitchDecay(value);
    }
  }, []);

  const handleOctavesChange = useCallback((value: number | number[]) => {
    if (synthNode.current && typeof value === 'number') {
      synthNode.current.setOctaves(value);
    }
  }, []);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (synthNode.current) {
      synthNode.current.setOscillatorType(event.target.value as Tone.ToneOscillatorType);
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label || "Membrane Synth"}
      hasInputHandle={false}
      hasOutputHandle={true}
      hasControl1Handle={true}
      control1Target={{ label: 'Trigger In', property: 'trigger', isSource: false }}
      hasControl2Handle={true}
      control2Target={{ label: 'Note In', property: 'note', isSource: false }}
    >
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Osc Type</InputLabel>
          <Select defaultValue={data.oscillatorType || 'sine'} onChange={handleTypeChange}>
            <MenuItem value="sine">Sine</MenuItem>
            <MenuItem value="square">Square</MenuItem>
            <MenuItem value="triangle">Triangle</MenuItem>
            <MenuItem value="sawtooth">Sawtooth</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Pitch Decay"
          min={0}
          max={0.5}
          step={0.01}
          defaultValue={data.pitchDecay || 0.05}
          onChange={handlePitchDecayChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Octaves"
          min={0}
          max={8}
          step={1}
          defaultValue={data.octaves || 6}
          onChange={handleOctavesChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeMembraneSynth;
