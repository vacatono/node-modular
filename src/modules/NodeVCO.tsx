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

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

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
  private baseFrequency: Tone.Signal<'frequency'>;
  private frequencyInput: Tone.Add;
  private hasCVInput: boolean = false;
  private hasNoteInput: boolean = false;
  private lastConnectedInput: 'cv' | 'note' | null = null;
  private defaultFrequency: number;

  constructor(options: { frequency?: number; type?: Tone.ToneOscillatorType }) {
    super();
    this.defaultFrequency = options.frequency || 440;
    this.oscillator = new Tone.Oscillator(this.defaultFrequency, options.type || 'sine');

    // ベース周波数用のSignal
    this.baseFrequency = new Tone.Signal(this.defaultFrequency);

    // ベース周波数と入力信号を加算するAddノード
    this.frequencyInput = new Tone.Add();

    // ベース周波数をAddノードの入力（デフォルト）に接続
    this.baseFrequency.connect(this.frequencyInput);

    // Addノードの出力をoscillatorのfrequencyに接続
    this.frequencyInput.connect(this.oscillator.frequency);

    console.log('[DEBUG] VCONode constructor - frequencyInput created:', {
      hasAddend: !!this.frequencyInput.addend,
      baseFrequency: this.baseFrequency.value,
      defaultFrequency: this.defaultFrequency,
    });

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
   * 接続されたSignalはAddノードのaddend入力として扱われる
   */
  get frequency(): any {
    // @ts-ignore - Tone.Addのaddendプロパティに接続
    const addend = this.frequencyInput.addend;
    console.log('[DEBUG] VCO frequency getter called:', {
      hasAddend: !!addend,
      addendType: addend?.constructor?.name,
      // @ts-ignore
      hasConnect: typeof addend?.connect === 'function',
      baseFrequencyValue: this.baseFrequency.value,
      hasCVInput: this.hasCVInput,
      hasNoteInput: this.hasNoteInput,
    });
    return addend;
  }

  /**
   * Noteパラメータへのアクセス（frequencyのエイリアス）
   */
  get note(): any {
    // @ts-ignore - Tone.Addのaddendプロパティに接続
    return this.frequencyInput.addend;
  }

  /**
   * ベース周波数の設定（スライダー用）
   * CV InまたはNote Inが接続されている場合は無視される
   */
  setBaseFrequency(value: number): void {
    if (!this.hasCVInput && !this.hasNoteInput) {
      this.baseFrequency.value = value;
      this.defaultFrequency = value;
      console.log('[DEBUG] VCO base frequency set to:', value, '(no external input connected)');
    } else {
      const activeInput = this.lastConnectedInput || (this.hasCVInput ? 'CV' : 'Note');
      console.log('[DEBUG] VCO base frequency ignored:', value, `(${activeInput} In connected)`);
    }
  }

  /**
   * Noteイベントを受信して周波数を設定
   * @param note - ノート名（例: "C4"）または周波数
   */
  setNote(note: string | number): void {
    const frequency = Tone.Frequency(note).toFrequency();
    this.baseFrequency.setValueAtTime(frequency, Tone.now());
    console.log('[DEBUG] VCO received note event:', note, '->', frequency);
  }

  /**
   * CV Inの接続状態を設定
   * CV Inが接続されている場合、ベース周波数を0に設定
   */
  setCVInputConnected(connected: boolean): void {
    this.hasCVInput = connected;
    if (connected) {
      // CV Inが接続されている場合、ベース周波数を0に設定（CV Inの値だけを使う）
      this.baseFrequency.value = 0;
      this.lastConnectedInput = 'cv';
      console.log('[DEBUG] VCO CV Input connected - base frequency set to 0', {
        baseFrequencyValue: this.baseFrequency.value,
        hasCVInput: this.hasCVInput,
        hasNoteInput: this.hasNoteInput,
        lastConnectedInput: this.lastConnectedInput,
        frequencyInputAddend: this.frequencyInput.addend,
      });
    } else {
      // CV Inが切断された場合
      if (this.hasNoteInput) {
        // Note Inがまだ接続されている場合はそのまま
        this.lastConnectedInput = 'note';
        console.log('[DEBUG] VCO CV Input disconnected - Note In still connected');
      } else {
        // 両方切断された場合、デフォルト周波数に戻す
        this.baseFrequency.value = this.defaultFrequency;
        this.lastConnectedInput = null;
        console.log('[DEBUG] VCO CV Input disconnected - base frequency set to:', this.defaultFrequency);
      }
    }
  }

  /**
   * Note Inの接続状態を設定
   * Note Inが接続されている場合、ベース周波数を0に設定
   */
  setNoteInputConnected(connected: boolean): void {
    this.hasNoteInput = connected;
    if (connected) {
      // Note Inが接続されている場合、ベース周波数を0に設定（Note Inの値だけを使う）
      this.baseFrequency.value = 0;
      this.lastConnectedInput = 'note';
      console.log('[DEBUG] VCO Note Input connected - base frequency set to 0');
    } else {
      // Note Inが切断された場合
      if (this.hasCVInput) {
        // CV Inがまだ接続されている場合はそのまま
        this.lastConnectedInput = 'cv';
        console.log('[DEBUG] VCO Note Input disconnected - CV In still connected');
      } else {
        // 両方切断された場合、デフォルト周波数に戻す
        this.baseFrequency.value = this.defaultFrequency;
        this.lastConnectedInput = null;
        console.log('[DEBUG] VCO Note Input disconnected - base frequency set to:', this.defaultFrequency);
      }
    }
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
    const stopTime = typeof startTime === 'number' ? startTime + durationValue : Tone.Time(startTime).toSeconds() + durationValue;
    this.oscillator.stop(stopTime);

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
    this.baseFrequency.dispose();
    this.frequencyInput.dispose();
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
    const previousNode = vcoNode.current;
    const hadCVInput = previousNode ? (previousNode as any).hasCVInput : false;
    const hadNoteInput = previousNode ? (previousNode as any).hasNoteInput : false;

    vcoNode.current = new VCONode({
      frequency: data.frequency || 440,
      type: data.type || 'sine',
    });

    // 以前の接続状態を復元
    if (hadCVInput) {
      vcoNode.current.setCVInputConnected(true);
    }
    if (hadNoteInput) {
      vcoNode.current.setNoteInputConnected(true);
    }

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

  // CV入力またはNote入力が接続されているかチェック
  const isFrequencyControlled = useMemo(() => {
    if (!data.edges) return false;
    return data.edges.some(edge =>
      edge.target === id && (
        edge.data?.targetProperty === 'frequency' ||
        edge.data?.targetProperty === 'note' ||
        // フォールバック: ハンドルIDチェック
        edge.targetHandle?.includes('frequency') ||
        edge.targetHandle?.includes('note')
      )
    );
  }, [data.edges, id]);

  const handleFrequencyChange = useCallback((value: number | number[]) => {
    if (vcoNode.current && typeof value === 'number') {
      // ベース周波数を設定（接続されたSignalはオフセットとして扱われる）
      vcoNode.current.setBaseFrequency(value);
      console.log('[DEBUG] VCO base frequency set to:', value);
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
          label={isFrequencyControlled ? "Frequency (Controlled by CV/Note)" : "Frequency"}
          min={20}
          max={2000}
          step={1}
          defaultValue={data.frequency || 440}
          onChange={handleFrequencyChange}
          disabled={isFrequencyControlled}
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
