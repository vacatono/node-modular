'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';
import { Edge } from 'reactflow';

class AMSynthNode extends Tone.ToneAudioNode {
  private synth: Tone.AMSynth;
  private currentNote: Tone.Unit.Frequency = 'C4';

  constructor(options: {
    harmonicity?: number;
    detune?: number;
    oscillatorType?: Tone.ToneOscillatorType;
    envelope?: Partial<Tone.EnvelopeOptions>
  } = {}) {
    super();
    this.synth = new Tone.AMSynth({
      harmonicity: options.harmonicity || 3,
      detune: options.detune || 0,
      oscillator: {
        type: (options.oscillatorType || 'sine') as any
      },
      envelope: options.envelope || {
        attack: 0.1,
        decay: 0.2,
        sustain: 1.0,
        release: 0.8
      }
    });
  }

  get name(): string {
    return 'AMSynthNode';
  }

  get input(): Tone.ToneAudioNode {
    return this.synth;
  }

  get output(): Tone.ToneAudioNode {
    return this.synth;
  }

  // Interface for Trigger connections
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

  // Interface for Note connections
  setNote(note: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
    this.currentNote = note;
    this.synth.setNote(note, time);
  }

  setHarmonicity(value: number): void {
    this.synth.harmonicity.value = value;
  }

  setDetune(value: number): void {
    this.synth.detune.value = value;
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

interface NodeAMSynthProps {
  data: {
    label: string;
    harmonicity?: number;
    detune?: number;
    oscillatorType?: Tone.ToneOscillatorType;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeAMSynth = ({ data, id }: NodeAMSynthProps) => {
  const synthNode = useRef<AMSynthNode | null>(null);

  useEffect(() => {
    synthNode.current = new AMSynthNode({
      harmonicity: data.harmonicity,
      detune: data.detune,
      oscillatorType: data.oscillatorType,
    });

    data.registerAudioNode(id, synthNode.current);

    return () => {
      synthNode.current?.dispose();
    };
  }, [id, data.registerAudioNode]);

  const handleHarmonicityChange = useCallback((value: number | number[]) => {
    if (synthNode.current && typeof value === 'number') {
      synthNode.current.setHarmonicity(value);
    }
  }, []);

  const handleDetuneChange = useCallback((value: number | number[]) => {
    if (synthNode.current && typeof value === 'number') {
      synthNode.current.setDetune(value);
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
      label={data.label || "AM Synth"}
      hasInputHandle={false} // No audio input
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
          label="Harmonicity"
          min={0}
          max={10}
          step={0.1}
          defaultValue={data.harmonicity || 3}
          onChange={handleHarmonicityChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Detune"
          min={-100}
          max={100}
          step={1}
          defaultValue={data.detune || 0}
          onChange={handleDetuneChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeAMSynth;
