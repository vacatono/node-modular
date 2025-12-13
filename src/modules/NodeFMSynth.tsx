'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography, Grid } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

class FMSynthNode extends Tone.ToneAudioNode {
  private synth: Tone.FMSynth;
  private currentNote: Tone.Unit.Frequency = 'C4';

  constructor(options: {
    harmonicity?: number;
    modulationIndex?: number;
    detune?: number;
    oscillatorType?: Tone.ToneOscillatorType;
    modulationType?: Tone.ToneOscillatorType;
  } = {}) {
    super();
    this.synth = new Tone.FMSynth({
      harmonicity: options.harmonicity || 3,
      modulationIndex: options.modulationIndex || 10,
      detune: options.detune || 0,
      oscillator: {
        type: (options.oscillatorType || 'sine') as any
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 1.0,
        release: 0.8
      },
      modulation: {
        type: (options.modulationType || 'square') as any
      },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0,
        sustain: 1,
        release: 0.5
      }
    });
  }

  get name(): string {
    return 'FMSynthNode';
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

  triggerAttackRelease(duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number): this {
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

  setModulationIndex(value: number): void {
    this.synth.modulationIndex.value = value;
  }

  setOscillatorType(type: Tone.ToneOscillatorType): void {
    this.synth.oscillator.type = type;
  }

  setModulationType(type: Tone.ToneOscillatorType): void {
    this.synth.modulation.type = type;
  }

  // Envelope Setters
  setEnvelopeAttack(value: number): void {
    this.synth.envelope.attack = value;
  }
  setEnvelopeDecay(value: number): void {
    this.synth.envelope.decay = value;
  }
  setEnvelopeSustain(value: number): void {
    this.synth.envelope.sustain = value;
  }
  setEnvelopeRelease(value: number): void {
    this.synth.envelope.release = value;
  }

  // Modulation Envelope Setters
  setModEnvelopeAttack(value: number): void {
    this.synth.modulationEnvelope.attack = value;
  }
  setModEnvelopeDecay(value: number): void {
    this.synth.modulationEnvelope.decay = value;
  }
  setModEnvelopeSustain(value: number): void {
    this.synth.modulationEnvelope.sustain = value;
  }
  setModEnvelopeRelease(value: number): void {
    this.synth.modulationEnvelope.release = value;
  }

  dispose(): this {
    this.synth.dispose();
    super.dispose();
    return this;
  }
}

interface NodeFMSynthProps {
  data: {
    label: string;
    harmonicity?: number;
    modulationIndex?: number;
    oscillatorType?: Tone.ToneOscillatorType;
    modulationType?: Tone.ToneOscillatorType;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeFMSynth = ({ data, id }: NodeFMSynthProps) => {
  const synthNode = useRef<FMSynthNode | null>(null);

  useEffect(() => {
    synthNode.current = new FMSynthNode({
      harmonicity: data.harmonicity,
      modulationIndex: data.modulationIndex,
      oscillatorType: data.oscillatorType,
      modulationType: data.modulationType,
    });

    data.registerAudioNode(id, synthNode.current);

    return () => {
      synthNode.current?.dispose();
    };
  }, [id, data.registerAudioNode]);

  // Oscillator Handlers
  const handleOscTypeChange = useCallback((event: SelectChangeEvent) => {
    if (synthNode.current) {
      synthNode.current.setOscillatorType(event.target.value as Tone.ToneOscillatorType);
    }
  }, []);

  const handleHarmonicityChange = useCallback((value: number | number[]) => {
    if (synthNode.current && typeof value === 'number') {
      synthNode.current.setHarmonicity(value);
    }
  }, []);

  const handleModIndexChange = useCallback((value: number | number[]) => {
    if (synthNode.current && typeof value === 'number') {
      synthNode.current.setModulationIndex(value);
    }
  }, []);

  // Modulation Type Handler
  const handleModTypeChange = useCallback((event: SelectChangeEvent) => {
    if (synthNode.current) {
      synthNode.current.setModulationType(event.target.value as Tone.ToneOscillatorType);
    }
  }, []);

  // Envelope Handlers
  const handleEnvAttackChange = useCallback((v: number | number[]) => synthNode.current?.setEnvelopeAttack(v as number), []);
  const handleEnvDecayChange = useCallback((v: number | number[]) => synthNode.current?.setEnvelopeDecay(v as number), []);
  const handleEnvSustainChange = useCallback((v: number | number[]) => synthNode.current?.setEnvelopeSustain(v as number), []);
  const handleEnvReleaseChange = useCallback((v: number | number[]) => synthNode.current?.setEnvelopeRelease(v as number), []);

  // Modulation Envelope Handlers
  const handleModEnvAttackChange = useCallback((v: number | number[]) => synthNode.current?.setModEnvelopeAttack(v as number), []);
  const handleModEnvDecayChange = useCallback((v: number | number[]) => synthNode.current?.setModEnvelopeDecay(v as number), []);
  const handleModEnvSustainChange = useCallback((v: number | number[]) => synthNode.current?.setModEnvelopeSustain(v as number), []);
  const handleModEnvReleaseChange = useCallback((v: number | number[]) => synthNode.current?.setModEnvelopeRelease(v as number), []);

  return (
    <NodeBox
      id={id}
      label={data.label || 'FM Synth'}
      width={460} // doubled width
      hasInputHandle={false}
      hasOutputHandle={true}
      hasControl1Handle={true}
      control1Target={{ label: 'Trigger In', property: 'trigger', isSource: false }}
      hasControl2Handle={true}
      control2Target={{ label: 'Note In', property: 'note', isSource: false }}
    >
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Left Column: Oscillator (Carrier) */}
        <Grid item xs={6}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
            Oscillator (Carrier)
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select defaultValue={data.oscillatorType || 'sine'} onChange={handleOscTypeChange} label="Type">
              <MenuItem value="sine">Sine</MenuItem>
              <MenuItem value="square">Square</MenuItem>
              <MenuItem value="triangle">Triangle</MenuItem>
              <MenuItem value="sawtooth">Sawtooth</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="caption" sx={{ display: 'block', mb: 1, mt: 2, fontWeight: 'bold' }}>
            Envelope
          </Typography>
          <CustomSlider label="Attack" min={0} max={2} step={0.01} defaultValue={0.1} onChange={handleEnvAttackChange} />
          <CustomSlider label="Decay" min={0} max={2} step={0.01} defaultValue={0.2} onChange={handleEnvDecayChange} />
          <CustomSlider label="Sustain" min={0} max={1} step={0.01} defaultValue={1.0} onChange={handleEnvSustainChange} />
          <CustomSlider label="Release" min={0} max={5} step={0.01} defaultValue={0.8} onChange={handleEnvReleaseChange} />
        </Grid>

        {/* Right Column: Modulation (Modulator) */}
        <Grid item xs={6}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
            Modulation
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select defaultValue={data.modulationType || 'square'} onChange={handleModTypeChange} label="Type">
              <MenuItem value="sine">Sine</MenuItem>
              <MenuItem value="square">Square</MenuItem>
              <MenuItem value="triangle">Triangle</MenuItem>
              <MenuItem value="sawtooth">Sawtooth</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="caption" sx={{ display: 'block', mb: 1, mt: 2, fontWeight: 'bold' }}>
            Mod Envelope
          </Typography>
          <CustomSlider label="Attack" min={0} max={2} step={0.01} defaultValue={0.5} onChange={handleModEnvAttackChange} />
          <CustomSlider label="Decay" min={0} max={2} step={0.01} defaultValue={0} onChange={handleModEnvDecayChange} />
          <CustomSlider label="Sustain" min={0} max={1} step={0.01} defaultValue={1} onChange={handleModEnvSustainChange} />
          <CustomSlider label="Release" min={0} max={5} step={0.01} defaultValue={0.5} onChange={handleModEnvReleaseChange} />

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
            <CustomSlider
              label="Harmonicity"
              min={0}
              max={10}
              step={0.1}
              defaultValue={data.harmonicity || 3}
              onChange={handleHarmonicityChange}
            />
            <CustomSlider
              label="Mod Index"
              min={0}
              max={100}
              step={1}
              defaultValue={data.modulationIndex || 10}
              onChange={handleModIndexChange}
            />
          </Box>
        </Grid>
      </Grid>
    </NodeBox>
  );
};

export default NodeFMSynth;
