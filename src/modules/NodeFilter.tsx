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

  // フィルターの初期化と設定
  useEffect(() => {
    filter.current = new Tone.Filter({
      frequency: data.frequency || 1000,
      type: data.type || 'lowpass',
      Q: data.Q || 1,
    });

    data.registerAudioNode(id, filter.current);

    return () => {
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
      filter.current.frequency.value = value;
    }
  }, []);

  // Q値変更ハンドラ
  const handleQChange = useCallback((value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      filter.current.Q.value = value;
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasControl1Handle={true}
      control1Target={{ label: 'Cutoff', property: 'frequency' }}
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
          max={2000}
          step={1}
          defaultValue={data.frequency || 1000}
          onChange={handleFrequencyChange}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label="Resonance"
          min={0}
          max={20}
          step={0.1}
          defaultValue={data.Q || 1}
          onChange={handleQChange}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeFilter;
