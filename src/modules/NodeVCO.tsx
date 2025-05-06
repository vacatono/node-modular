/**
 * NodeVCO Component
 *
 * 電圧制御発振器（Voltage Controlled Oscillator）ノードです。
 * 波形タイプと周波数を制御できます。
 *
 * @example
 * ```tsx
 * <NodeVCO
 *   id="vco1"
 *   data={{
 *     label: "VCO",
 *     frequency: 440,
 *     type: "sine",
 *     registerAudioNode: (id, node) => { ... }
 *   }}
 * />
 * ```
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import * as Tone from 'tone';
import { Box, Select, MenuItem, FormControl, InputLabel, Button, SelectChangeEvent, Typography } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';
import { Edge } from 'reactflow';

const debug = true;

interface NodeVCOProps {
  /** ノードの一意の識別子 */
  id: string;
  /** ノードの設定データ */
  data: {
    /** ノードの表示ラベル */
    label: string;
    /** 周波数（Hz）（デフォルト: 440） */
    frequency?: number;
    /** 波形タイプ（デフォルト: 'sine'） */
    type?: Tone.ToneOscillatorType;
    /** オーディオノードの登録関数 */
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
    /** エッジのデータ */
    edges: Edge[];
  };
}

/**
 * 電圧制御発振器（VCO）ノード
 * @param props - NodeVCOProps
 * @returns NodeVCOコンポーネント
 */
const NodeVCO = ({ data, id }: NodeVCOProps) => {
  const oscillator = useRef<Tone.Oscillator | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    //console.log('NodeVCO useEffect', data);
    oscillator.current = new Tone.Oscillator(data.frequency || 440, data.type || 'sine');
    return () => {
      oscillator.current?.stop();
      oscillator.current?.dispose();
    };
  }, [id, data.frequency, data.type]);

  useEffect(() => {
    if (oscillator.current) {
      data.registerAudioNode(id, oscillator.current);
    }
  }, [id, data.registerAudioNode, data.edges]);

  const handleFrequencyChange = useCallback((value: number | number[]) => {
    if (oscillator.current && typeof value === 'number') {
      oscillator.current.frequency.value = value;
    }
  }, []);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (oscillator.current) {
      oscillator.current.type = event.target.value as Tone.ToneOscillatorType;
    }
  }, []);

  const handlePlayToggle = useCallback(async () => {
    if (oscillator.current) {
      if (isPlaying) {
        oscillator.current.stop();
      } else {
        // Tone.jsのコンテキストを開始
        //await Tone.start();
        oscillator.current.start();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasInputHandle={false}
      hasOutputHandle={true}
      hasControl1Handle={true}
      control1Target={{
        label: 'Frequency',
        property: 'frequency',
      }}
    >
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select defaultValue={data.type || 'sine'} onChange={handleTypeChange}>
            <MenuItem value="sine">Sine</MenuItem>
            <MenuItem value="square">Square</MenuItem>
            <MenuItem value="triangle">Triangle</MenuItem>
            <MenuItem value="sawtooth">Sawtooth</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Frequency"
          min={20}
          max={2000}
          step={1}
          defaultValue={data.frequency || 440}
          onChange={handleFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handlePlayToggle} fullWidth>
          {isPlaying ? 'Stop' : 'Start'}
        </Button>
        {debug && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Frequency: {oscillator.current?.frequency.value}
              Type: {oscillator.current?.type}
            </Typography>
            <Button variant="contained" onClick={() => console.log(oscillator.current)}>
              DEBUG
            </Button>
          </Box>
        )}
      </Box>
    </NodeBox>
  );
};

export default NodeVCO;
