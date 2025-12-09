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

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Edge, Handle, Position } from 'reactflow';
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
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode, _params?: Record<string, { min: number; max: number }>) => void;
    /** エッジ情報 */
    edges?: Edge[];
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

    return () => {
      filter.current?.dispose();
    };
  }, [id, data.type, data.frequency, data.Q]);

  // オーディオノードの登録
  useEffect(() => {
    if (filter.current) {
      data.registerAudioNode(id, filter.current, {
        frequency: { min: 200, max: 5000 },
        Q: { min: 0.1, max: 20 },
      });
    }
  }, [id, data.registerAudioNode, data.edges]);

  // CV入力が接続されているかチェック
  const isFrequencyControlled = useMemo(() => {
    if (!data.edges) return false;
    return data.edges.some(edge =>
      edge.target === id && (
        edge.data?.targetProperty === 'frequency' ||
        edge.targetHandle?.includes('frequency')
      )
    );
  }, [data.edges, id]);

  const isQControlled = useMemo(() => {
    if (!data.edges) return false;
    return data.edges.some(edge =>
      edge.target === id && (
        edge.data?.targetProperty === 'Q' ||
        edge.targetHandle?.includes('Q')
      )
    );
  }, [data.edges, id]);

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
      hasControl1Handle={false}
      hasControl2Handle={false}
    >
      <div style={{ position: 'relative' }}>
        {/* Custom Handle for Cutoff Frequency (Left Top) */}
        <Handle
          type="target"
          position={Position.Top}
          id={`${id}-controlCustom-frequency-cv`}
          style={{
            background: '#4caf50',
            width: 20,
            height: 20,
            top: -72, // NodeBox padding adjustment
            left: '25%',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -85, // Label position
            left: '25%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            whiteSpace: 'nowrap',
          }}
        >
          CV in(cutoff)
        </Box>

        {/* Custom Handle for Resonance (Right Top) */}
        <Handle
          type="target"
          position={Position.Top}
          id={`${id}-controlCustom-Q-cv`}
          style={{
            background: '#4caf50',
            width: 20,
            height: 20,
            top: -72, // NodeBox padding adjustment
            left: '75%',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -85, // Label position
            left: '75%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            whiteSpace: 'nowrap',
          }}
        >
          CV in(res)
        </Box>
      </div>

      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select defaultValue={data.type || 'lowpass'} onChange={handleTypeChange}>
            <MenuItem value="lowpass">Lowpass</MenuItem>
            <MenuItem value="highpass">Highpass</MenuItem>
            <MenuItem value="bandpass">Bandpass</MenuItem>
            <MenuItem value="notch">Notch</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label={isFrequencyControlled ? "Frequency (Controlled)" : "Frequency"}
          min={20}
          max={2000}
          step={1}
          defaultValue={data.frequency || 1000}
          onChange={handleFrequencyChange}
          disabled={isFrequencyControlled}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <CustomSlider
          label={isQControlled ? "Resonance (Controlled)" : "Resonance"}
          min={0}
          max={20}
          step={0.1}
          defaultValue={data.Q || 1}
          onChange={handleQChange}
          disabled={isQControlled}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeFilter;
