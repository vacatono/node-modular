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

/**
 * VCOノードのラッパークラス
 * Tone.OscillatorをラップしてToneAudioNodeとして機能させます
 */
class VCONode extends Tone.ToneAudioNode {
  private oscillator: Tone.Oscillator;

  constructor(options: { frequency?: number; type?: Tone.ToneOscillatorType }) {
    super();
    this.oscillator = new Tone.Oscillator(options.frequency || 440, options.type || 'sine');
    
    // @ts-ignore - Add note as alias to frequency for Note signal connections
    this.oscillator.note = this.oscillator.frequency;
  }

  /**
   * ノードの名前
   */
  get name(): string {
    return 'VCONode';
  }

  /**
   * 入力ノード
   */
  get input(): Tone.ToneAudioNode {
    return this.oscillator;
  }

  /**
   * 出力ノード
   */
  get output(): Tone.ToneAudioNode {
    return this.oscillator;
  }

  /**
   * 周波数パラメータへのアクセス
   */
  get frequency(): Tone.Signal<'frequency'> {
    return this.oscillator.frequency;
  }

  /**
   * Noteパラメータへのアクセス（frequencyのエイリアス）
   */
  get note(): Tone.Signal<'frequency'> {
    return this.oscillator.frequency;
  }

  /**
   * 波形タイプ
   */
  get type(): Tone.ToneOscillatorType {
    return this.oscillator.type;
  }

  set type(value: Tone.ToneOscillatorType) {
    this.oscillator.type = value;
  }

  /**
   * triggerAttackReleaseメソッド（現在は未使用、将来の拡張用）
   */
  triggerAttackRelease(duration: string | number, time?: Tone.Unit.Time): this {
    const startTime = time || Tone.now();
    const durationValue = typeof duration === 'string' ? Tone.Time(duration).toSeconds() : duration;
    
    // オシレーターを開始
    if (this.oscillator.state !== 'started') {
      this.oscillator.start(startTime);
    }
    
    // 指定時間後に停止
    this.oscillator.stop(startTime + durationValue);
    
    return this;
  }

  /**
   * オシレーターの開始
   */
  start(time?: Tone.Unit.Time): this {
    this.oscillator.start(time);
    return this;
  }

  /**
   * オシレーターの停止
   */
  stop(time?: Tone.Unit.Time): this {
    this.oscillator.stop(time);
    return this;
  }

  /**
   * リソースの解放
   */
  dispose(): this {
    this.oscillator.dispose();
    super.dispose();
    return this;
  }
}

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
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode, _params?: Record<string, { min: number; max: number }>) => void;
    /** エッジのデータ */
    edges?: Edge[];
    debug?: boolean;
  };
}

/**
 * 電圧制御発振器（VCO）ノード
 * @param props - NodeVCOProps
 * @returns NodeVCOコンポーネント
 */
const NodeVCO = ({ data, id }: NodeVCOProps) => {
  const vcoNode = useRef<VCONode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    //console.log('NodeVCO useEffect', data);
    vcoNode.current = new VCONode({
      frequency: data.frequency || 440,
      type: data.type || 'sine',
    });
    return () => {
      vcoNode.current?.stop();
      vcoNode.current?.dispose();
    };
  }, [id, data.frequency, data.type]);

  useEffect(() => {
    if (vcoNode.current) {
      data.registerAudioNode(id, vcoNode.current, {
        frequency: { min: 20, max: 2000 },
        detune: { min: -100, max: 100 },
      });
    }
  }, [id, data.registerAudioNode, data.edges]);

  const handleFrequencyChange = useCallback((value: number | number[]) => {
    if (vcoNode.current && typeof value === 'number') {
      vcoNode.current.frequency.value = value;
    }
  }, []);

  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (vcoNode.current) {
      vcoNode.current.type = event.target.value as Tone.ToneOscillatorType;
    }
  }, []);

  const handlePlayToggle = useCallback(async () => {
    if (vcoNode.current) {
      if (isPlaying) {
        vcoNode.current.stop();
      } else {
        // Tone.jsのコンテキストを開始
        await Tone.start();
        console.log('Audio Context State:', Tone.context.state);
        vcoNode.current.start();
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
        label: 'CV In',
        property: 'frequency',
      }}
      hasControl2Handle={true}
      control2Target={{
        label: 'Note In',
        property: 'note',
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
        {data.debug && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Frequency: {vcoNode.current?.frequency.value}
              Type: {vcoNode.current?.type}
            </Typography>
            <Button variant="contained" onClick={() => console.log(vcoNode.current)}>
              DEBUG
            </Button>
          </Box>
        )}
      </Box>
    </NodeBox>
  );
};

export default NodeVCO;
