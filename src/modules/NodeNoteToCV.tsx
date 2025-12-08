/**
 * NodeNoteToCV Component
 *
 * Note信号をCV（Control Voltage）信号に変換するノードです。
 * Sequencerなどから出力されるNote信号を、VCOなどが受け取れるCV信号に変換します。
 *
 * @example
 * ```tsx
 * <NodeNoteToCV
 *   id="note2cv1"
 *   data={{
 *     label: "Note→CV",
 *     octaveOffset: 0,
 *     tuning: 0,
 *     registerAudioNode: (id, node) => { ... }
 *   }}
 * />
 * ```
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Box, Typography } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

/**
 * Note to CV変換ノードのラッパークラス
 * Note信号（周波数値）を受け取り、オクターブオフセットやチューニングを適用してCV信号として出力します
 */
class NoteToCVNode extends Tone.ToneAudioNode {
  private noteInput: Tone.Signal;
  private octaveMultiplier: Tone.Multiply;
  private tuningMultiplier: Tone.Multiply;
  private normalizerSub: Tone.Add;
  private normalizerMult: Tone.Multiply;
  private cvOutput: Tone.Signal;
  private octaveOffset: number;
  private tuning: number;

  constructor(options: { octaveOffset?: number; tuning?: number } = {}) {
    super();

    this.octaveOffset = options.octaveOffset || 0;
    this.tuning = options.tuning || 0;

    // 入力信号（Note）
    this.noteInput = new Tone.Signal(0);

    // オクターブオフセット用の乗算ノード
    const octaveValue = Math.pow(2, this.octaveOffset);
    this.octaveMultiplier = new Tone.Multiply(octaveValue);

    // チューニング用の乗算ノード
    const tuningValue = Math.pow(2, this.tuning / 1200);
    this.tuningMultiplier = new Tone.Multiply(tuningValue);

    // 正規化用のノード (20Hz - 2000Hz -> 0.0 - 1.0)
    // これは受信側のVCOがTone.Scale(20, 2000)を行うことを想定しています
    const min = 20;
    const max = 2000;
    this.normalizerSub = new Tone.Add(-min);
    this.normalizerMult = new Tone.Multiply(1 / (max - min));

    // 出力信号（CV）
    this.cvOutput = new Tone.Signal(0);

    // 信号チェーンを構築: noteInput -> octaveMultiplier -> tuningMultiplier -> normalizerSub -> normalizerMult -> cvOutput
    this.noteInput.connect(this.octaveMultiplier);
    this.octaveMultiplier.connect(this.tuningMultiplier);
    this.tuningMultiplier.connect(this.normalizerSub);
    this.normalizerSub.connect(this.normalizerMult);
    this.normalizerMult.connect(this.cvOutput);
  }

  /**
   * ノードの名前
   */
  get name(): string {
    return 'NoteToCVNode';
  }

  /**
   * 入力ノード
   */
  get input(): Tone.Signal {
    return this.noteInput;
  }

  /**
   * 出力ノード
   */
  get output(): Tone.Signal {
    return this.cvOutput;
  }

  /**
   * Note入力用のエイリアス
   */
  get note(): Tone.Signal {
    return this.noteInput;
  }

  /**
   * CV出力用のエイリアス（VCOのfrequencyに接続するため）
   */
  get frequency(): Tone.Signal {
    return this.cvOutput;
  }

  /**
   * Noteイベントを受信して入力信号を設定
   * @param note - ノート名（例: "C4"）または周波数
   */
  setNote(note: string | number): void {
    const frequency = Tone.Frequency(note).toFrequency();
    this.noteInput.value = frequency;
    console.log('[DEBUG] NoteToCV received note event:', note, '->', frequency);
  }

  /**
   * オクターブオフセットを設定
   * @param offset - オクターブオフセット値（-4 ～ +4）
   */
  setOctaveOffset(offset: number): void {
    this.octaveOffset = offset;
    const octaveValue = Math.pow(2, this.octaveOffset);
    this.octaveMultiplier.factor.value = octaveValue;
  }

  /**
   * チューニングを設定
   * @param cents - セント単位のチューニング値（-100 ～ +100）
   */
  setTuning(cents: number): void {
    this.tuning = cents;
    const tuningValue = Math.pow(2, this.tuning / 1200);
    this.tuningMultiplier.factor.value = tuningValue;
  }

  /**
   * リソースの解放
   */
  dispose(): this {
    this.noteInput.dispose();
    this.octaveMultiplier.dispose();
    this.tuningMultiplier.dispose();
    this.normalizerSub.dispose();
    this.normalizerMult.dispose();
    this.cvOutput.dispose();
    super.dispose();
    return this;
  }
}

interface NodeNoteToCVProps {
  /** ノードの一意の識別子 */
  id: string;
  /** ノードの設定データ */
  data: {
    /** ノードの表示ラベル */
    label: string;
    /** オクターブオフセット（デフォルト: 0） */
    octaveOffset?: number;
    /** チューニング（セント単位、デフォルト: 0） */
    tuning?: number;
    /** オーディオノードの登録関数 */
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
}

/**
 * Note to CV変換ノード
 * @param props - NodeNoteToCVProps
 * @returns NodeNoteToCVコンポーネント
 */
const NodeNoteToCV = ({ data, id }: NodeNoteToCVProps) => {
  const noteToCVNode = useRef<NoteToCVNode | null>(null);
  const [octaveOffset, setOctaveOffset] = useState(data.octaveOffset || 0);
  const [tuning, setTuning] = useState(data.tuning || 0);
  const [currentFrequency, setCurrentFrequency] = useState(0);

  useEffect(() => {
    // Note to CVノードの初期化
    noteToCVNode.current = new NoteToCVNode({
      octaveOffset: data.octaveOffset || 0,
      tuning: data.tuning || 0,
    });

    // オーディオノードの登録
    data.registerAudioNode(id, noteToCVNode.current);

    // 周波数モニタリング（デバッグ用）
    const interval = setInterval(() => {
      if (noteToCVNode.current) {
        const freq = noteToCVNode.current.output.value;
        setCurrentFrequency(freq);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      noteToCVNode.current?.dispose();
    };
  }, [id, data]);

  // オクターブオフセット変更ハンドラ
  const handleOctaveOffsetChange = useCallback((value: number | number[]) => {
    if (noteToCVNode.current && typeof value === 'number') {
      const roundedValue = Math.round(value);
      setOctaveOffset(roundedValue);
      noteToCVNode.current.setOctaveOffset(roundedValue);
    }
  }, []);

  // チューニング変更ハンドラ
  const handleTuningChange = useCallback((value: number | number[]) => {
    if (noteToCVNode.current && typeof value === 'number') {
      setTuning(value);
      noteToCVNode.current.setTuning(value);
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasInputHandle={false}
      hasOutputHandle={false}
      hasControl1Handle={true}
      control1Target={{
        label: 'Note In',
        property: 'note',
      }}
      hasControl2Handle={true}
      control2Target={
        {
          label: 'CV Out',
          property: 'frequency',
          isSource: true,
        } as { label: string; property: string; isSource?: boolean }
      }
    >
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Octave Offset"
          min={-4}
          max={4}
          step={1}
          defaultValue={octaveOffset}
          value={octaveOffset}
          onChange={handleOctaveOffsetChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Tuning (cents)"
          min={-100}
          max={100}
          step={1}
          defaultValue={tuning}
          value={tuning}
          onChange={handleTuningChange}
        />
      </Box>
      <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
        <Typography variant="caption" display="block">
          Output: {currentFrequency > 0 ? `${currentFrequency.toFixed(2)} Hz` : 'No signal'}
        </Typography>
        <Typography variant="caption" display="block">
          Octave: {octaveOffset >= 0 ? '+' : ''}
          {octaveOffset}
        </Typography>
        <Typography variant="caption" display="block">
          Tuning: {tuning >= 0 ? '+' : ''}
          {tuning} cents
        </Typography>
      </Box>
    </NodeBox>
  );
};

export default NodeNoteToCV;
