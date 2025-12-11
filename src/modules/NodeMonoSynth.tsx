'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import NodeBox from './common/NodeBox';

class MonoSynthNode extends Tone.ToneAudioNode {
  private synth: Tone.MonoSynth;
  private currentNote: Tone.Unit.Frequency = 'C4';

  constructor(options: {
    oscillatorType?: Tone.ToneOscillatorType;
  } = {}) {
    super();
    this.synth = new Tone.MonoSynth({
      oscillator: {
        type: (options.oscillatorType || 'sine') as any
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8
      },
      filterEnvelope: {
        attack: 0.06,
        decay: 0.2,
        sustain: 0.5,
        release: 2,
        baseFrequency: 200,
        octaves: 7,
        exponent: 2
      }
    });
  }

  get name(): string {
    return 'MonoSynthNode';
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

  setOscillatorType(type: Tone.ToneOscillatorType): void {
    this.synth.oscillator.type = type;
  }

  dispose(): this {
    this.synth.dispose();
    super.dispose();
    return this;
  }
}

interface NodeMonoSynthProps {
  data: {
    label: string;
    oscillatorType?: Tone.ToneOscillatorType;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeMonoSynth = ({ data, id }: NodeMonoSynthProps) => {
  const synthNode = useRef<MonoSynthNode | null>(null);

  useEffect(() => {
    synthNode.current = new MonoSynthNode({
      oscillatorType: data.oscillatorType,
    });

    data.registerAudioNode(id, synthNode.current);

    return () => {
      synthNode.current?.dispose();
    };
  }, [id, data.registerAudioNode]);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (synthNode.current) {
      synthNode.current.setOscillatorType(event.target.value as Tone.ToneOscillatorType);
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label || "Mono Synth"}
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
    </NodeBox>
  );
};

export default NodeMonoSynth;
