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
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
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
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
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
  }, [id, data.frequency, data.type, data.Q, data.registerAudioNode]);

  // フィルタータイプ変更ハンドラ
  const handleTypeChange = useCallback((event: SelectChangeEvent) => {
    if (filter.current) {
      filter.current.type = event.target.value as BiquadFilterType;
    }
  }, []);

  // 周波数変更ハンドラ
  const handleFrequencyChange = useCallback((event: Event, value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      filter.current.frequency.value = value;
    }
  }, []);

  // Q値変更ハンドラ
  const handleQChange = useCallback((event: Event, value: number | number[]) => {
    if (filter.current && typeof value === 'number') {
      filter.current.Q.value = value;
    }
  }, []);

  return (
    <NodeBox id={id} label={data.label} hasControlHandle={true}>
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
          defaultValue={data.frequency || 1000}
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
