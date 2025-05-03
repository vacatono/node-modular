/**
 * NodeFilter0 Component
 *
 * シンプルなVCF（Voltage Controlled Filter）ノードです。
 * コントロール入力は持たず、手動でカットオフ周波数・Q値・タイプを設定できます。
 *
 * @example
 * ```tsx
 * <NodeFilter0
 *   id="filter0"
 *   data={{
 *     label: "VCF",
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
 * NodeFilter0のプロパティを定義するインターフェース
 */
interface NodeFilter0Props {
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
 * シンプルなVCFノード（コントロール入力なし）
 * @param props - NodeFilter0Props
 * @returns NodeFilter0コンポーネント
 */
const NodeFilter0 = ({ data, id }: NodeFilter0Props) => {
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
  }, [id, data.type, data.Q, data.frequency, data.registerAudioNode]);

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
    <NodeBox id={id} label={data.label}>
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

export default NodeFilter0;
