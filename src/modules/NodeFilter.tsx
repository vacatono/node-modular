/**
 * NodeFilter Component
 *
 * オーディオフィルターを実装するノードコンポーネントです。
 * 入力信号に対して、選択したタイプのフィルター処理を適用し、出力します。
 *
 * 主な機能：
 * - フィルタータイプの選択（Lowpass, Highpass, Bandpass, Notch）
 * - カットオフ周波数の制御
 * - レゾナンス（Q値）の制御
 * - LFOによるカットオフ周波数のモジュレーション
 *
 * @example
 * ```tsx
 * <NodeFilter
 *   id="filter1"
 *   data={{
 *     label: "Filter",
 *     type: "lowpass",
 *     frequency: 1000,
 *     Q: 1,
 *     registerAudioNode: (id, node) => { ... }
 *   }}
 * />
 * ```
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Box, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

/**
 * NodeFilterのプロパティを定義するインターフェース
 */
interface NodeFilterProps {
  /** ノードの一意の識別子 */
  id: string;
  /** ノードの設定データ */
  data: {
    /** ノードの表示ラベル */
    label: string;
    /** フィルターのタイプ（デフォルト: 'lowpass'） */
    type?: BiquadFilterType;
    /** カットオフ周波数（Hz）（デフォルト: 1000） */
    frequency?: number;
    /** レゾナンス（Q値）（デフォルト: 1） */
    Q?: number;
    /** オーディオノードの登録関数 */
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
  };
}

/**
 * オーディオフィルターを実装するノードコンポーネント
 *
 * @param props - NodeFilterProps
 * @returns NodeFilterコンポーネント
 */
const NodeFilter = ({ data, id }: NodeFilterProps) => {
  const filter = useRef<Tone.Filter | null>(null);
  const baseFrequency = useRef<number>(data.frequency || 1000);
  const modulationSignal = useRef<Tone.Signal | null>(null);

  // フィルターの初期化と設定
  useEffect(() => {
    filter.current = new Tone.Filter({
      frequency: baseFrequency.current,
      type: data.type || 'lowpass',
      Q: data.Q || 1,
    });

    // 変調用のSignalを作成
    modulationSignal.current = new Tone.Signal(0);
    // 変調信号を周波数に加算
    modulationSignal.current.connect(filter.current.frequency);

    data.registerAudioNode(id, filter.current);

    return () => {
      modulationSignal.current?.dispose();
      filter.current?.dispose();
    };
  }, [id, data.type, data.Q, data.registerAudioNode]);

  // フィルタータイプ変更ハンドラ
  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (filter.current) {
      filter.current.type = event.target.value as BiquadFilterType;
    }
  }, []);

  // 周波数変更ハンドラ
  const handleFrequencyChange = useCallback((value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      baseFrequency.current = value;
      filter.current.frequency.value = value;
    }
  }, []);

  // Q値変更ハンドラ
  const handleQChange = useCallback((value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      filter.current.Q.value = value;
    }
  }, []);

  // control入力の処理
  useEffect(() => {
    if (modulationSignal.current) {
      // control入力の値を-1から1の範囲で受け取り、周波数を変調
      const modulationAmount = 0; // 初期値は0
      if (modulationSignal.current) {
        modulationSignal.current.value = modulationAmount;
      }
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasControlHandle={true}
      controlTargets={[{ label: 'Cutoff', property: 'frequency' }]}
    >
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select value={data.type || 'lowpass'} onChange={handleTypeChange} label="Type">
            <MenuItem value="lowpass">Lowpass</MenuItem>
            <MenuItem value="highpass">Highpass</MenuItem>
            <MenuItem value="bandpass">Bandpass</MenuItem>
            <MenuItem value="notch">Notch</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Frequency"
          min={20}
          max={20000}
          step={1}
          defaultValue={baseFrequency.current}
          onChange={handleFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider label="Q" min={0.1} max={10} step={0.1} defaultValue={data.Q || 1} onChange={handleQChange} />
      </Box>
    </NodeBox>
  );
};

export default NodeFilter;
