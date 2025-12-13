'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Edge, Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import { Box, Button, Grid, TextField } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';
import { PlayCircle, StopCircle } from '@mui/icons-material';
import Stack from '@mui/material/Stack';

/**
 * キー名が有効かどうかをチェック
 * @param value - チェックするキー名
 * @returns 有効な場合はtrue
 */
const isValidKey = (value: string): boolean => {
  // 数値（Hz）の場合
  if (!isNaN(Number(value)) && Number(value) > 0) {
    return true;
  }
  // Tone.jsのノート表記の場合
  try {
    Tone.Frequency(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * シーケンサーノードのラッパークラス
 * Tone.SequenceをラップしてToneAudioNodeとして機能させます
 */
class SequencerNode extends Tone.ToneAudioNode {
  private sequence: Tone.Sequence;
  private noteOutput: Tone.Signal; // Changed from Gain to Signal
  private gateOutput: Tone.Gain;
  private grid: boolean[][];
  private keys: string[];
  private steps: number;
  private connectedTriggers: any[] = []; // List of connected envelope triggers
  private connectedNotes: any[] = []; // List of connected Note event targets

  private onStep?: (step: number) => void;

  constructor(options: { steps?: number; keys?: string[]; tempo?: number; onStep?: (step: number) => void }) {
    super();
    this.steps = options.steps || 8;
    this.keys = options.keys || ['A4', 'C4', 'D4', 'E4', 'G4'];
    this.onStep = options.onStep;
    this.grid = Array(this.keys.length).fill(Array(this.steps).fill(false));

    // 出力ノードの初期化
    this.noteOutput = new Tone.Signal(0); // Initialize with 0 frequency
    this.gateOutput = new Tone.Gain(1);

    // シーケンスの初期化
    this.sequence = new Tone.Sequence(
      (time, step) => {
        this.grid.forEach((row, rowIndex) => {
          if (row[step]) {
            const note = this.keys[rowIndex];

            // Note Event Emission
            this.connectedNotes.forEach((target) => {
              if (typeof target.setNote === 'function') {
                target.setNote(note, time);
              }
            });

            // Gate Delay (50ms) to avoid overlapping with note change
            const gateTime = time + 0.05;

            // ゲート出力
            this.gateOutput.gain.setValueAtTime(1, gateTime);
            this.gateOutput.gain.setValueAtTime(0, gateTime + 0.1);

            // トリガー接続
            this.connectedTriggers.forEach((target) => {
              if (target && typeof target.triggerAttackRelease === 'function') {
                target.triggerAttackRelease('16n', gateTime);
              }
            });
          }
        });

        Tone.Draw.schedule(() => {
          if (this.onStep) {
            this.onStep(step);
          }
        }, time);
      },
      Array.from({ length: this.steps }, (_, i) => i),
      '4n'
    );

    // シーケンスを常にトランスポートに同期して開始状態にする
    // 実際の再生/停止はTone.Transport.start()/stop()で制御する
    this.sequence.start(0);

    // テンポの設定
    if (options.tempo) {
      Tone.Transport.bpm.value = options.tempo;
    }
  }

  /**
   * ノードの名前
   */
  get name(): string {
    return 'SequencerNode';
  }

  /**
   * 入力ノード
   */
  get input(): Tone.ToneAudioNode {
    return this.noteOutput;
  }

  /**
   * 出力ノード
   */
  get output(): Tone.ToneAudioNode {
    return this.gateOutput;
  }

  /**
   * Note出力ノードへのアクセス
   */
  get note(): Tone.Signal {
    return this.noteOutput;
  }

  /**
   * Gate出力ノードへのアクセス
   */
  get gate(): Tone.Gain {
    return this.gateOutput;
  }

  /**
   * ノート出力に接続
   */
  connectNote(target: any): void {
    if (!this.connectedNotes.includes(target)) {
      this.connectedNotes.push(target);
    }
  }

  /**
   * ゲート出力に接続
   */
  connectGate(target: Tone.ToneAudioNode): void {
    this.gateOutput.connect(target);
  }

  /**
   * トリガー出力先として登録
   */
  connectTrigger(target: any): void {
    if (!this.connectedTriggers.includes(target)) {
      this.connectedTriggers.push(target);
    }
  }

  /**
   * グリッドの状態を更新
   */
  setGrid(newGrid: boolean[][]): void {
    this.grid = newGrid;
  }

  /**
   * キー名の設定
   */
  setKeys(newKeys: string[]): void {
    this.keys = newKeys;
    this.grid = Array(this.keys.length).fill(Array(this.steps).fill(false));
  }

  /**
   * シーケンスの開始 (Transport制御に委譲するため何もしない)
   */
  start(): void {
    // this.sequence.start(0); // Constructorで開始済み
  }

  /**
   * シーケンスの停止 (Transport制御に委譲するため何もしない)
   */
  stop(): void {
    // this.sequence.stop(); 
  }

  /**
   * リソースの解放
   */
  dispose(): this {
    this.sequence.dispose();
    this.noteOutput.dispose();
    this.gateOutput.dispose();
    this.connectedTriggers = [];
    super.dispose();
    return this;
  }
}

interface NodeSequencerProps {
  data: {
    label: string;
    tempo?: number;
    steps?: number;
    keys?: string[];
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
    edges?: Edge[];
  };
  id: string;
}

/**
 * シーケンサーノードコンポーネント
 */
const NodeSequencer = ({ data, id }: NodeSequencerProps) => {
  // useRefではなくuseStateを使用して、インスタンス再作成時に再レンダリングとEffect発火を確実にする
  const [sequencerNode, setSequencerNode] = useState<SequencerNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(data.tempo || 120);
  const [steps, setSteps] = useState(data.steps || 8);
  const [keys, setKeys] = useState(data.keys || ['A4', 'C4', 'D4', 'E4', 'G4']);
  const [grid, setGrid] = useState<boolean[][]>(Array(keys.length).fill(Array(steps).fill(false)));
  const [editingKeyIndex, setEditingKeyIndex] = useState<number | null>(null);
  const [editingKeyValue, setEditingKeyValue] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(-1);

  // SequencerNodeの参照を保持するためのRef (イベントハンドラ内でのアクセス用)
  const sequencerRef = useRef<SequencerNode | null>(null);

  useEffect(() => {
    sequencerRef.current = sequencerNode;
  }, [sequencerNode]);

  useEffect(() => {
    console.log('[DEBUG] NodeSequencer useEffect - creating new instance:', {
      id,
      steps,
      keysLength: keys.length,
      tempo,
    });

    // シーケンサーの初期化
    const newSequencer = new SequencerNode({
      steps,
      keys,
      tempo,
      onStep: (step) => setCurrentStep(step),
    });

    setSequencerNode(newSequencer);

    return () => {
      console.log('[DEBUG] NodeSequencer useEffect cleanup - disposing instance');
      newSequencer.dispose();
    };
  }, [id, steps, keys, tempo]);

  // グリッドの状態をシーケンサー・ノードに同期するEffect
  // これにより、gridの変更でシーケンサー全体が再作成されるのを防ぐ
  useEffect(() => {
    if (sequencerNode) {
      sequencerNode.setGrid(grid);
    }
  }, [sequencerNode, grid]);

  // オーディオノードの登録
  useEffect(() => {
    if (sequencerNode) {
      console.log('[DEBUG] NodeSequencer - registering audio node');
      data.registerAudioNode(id, sequencerNode);
    }
  }, [id, data.registerAudioNode, sequencerNode]); // sequencerNodeを依存配列に追加

  // キー名変更ハンドラ
  const handleKeyChange = useCallback((index: number, newKey: string) => {
    setEditingKeyIndex(index);
    setEditingKeyValue(newKey);
  }, []);

  // キー名確定ハンドラ
  const handleKeyBlur = useCallback(
    (index: number) => {
      if (editingKeyIndex === null) return;

      if (isValidKey(editingKeyValue)) {
        setKeys((prevKeys) => {
          const newKeys = [...prevKeys];
          newKeys[index] = editingKeyValue;
          if (sequencerRef.current) {
            sequencerRef.current.setKeys(newKeys);
          }
          return newKeys;
        });
      }
      setEditingKeyIndex(null);
      setEditingKeyValue('');
    },
    [editingKeyIndex, editingKeyValue]
  );

  // キー名入力中のEnterキーハンドラ
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === 'Enter') {
        handleKeyBlur(index);
      }
    },
    [handleKeyBlur]
  );

  // テンポ変更ハンドラ
  const handleTempoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 40 && value <= 240) {
      setTempo(value);
      Tone.Transport.bpm.value = value;
    }
  }, []);

  // ステップ数変更ハンドラ
  const handleStepsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 32) {
        setSteps(value);
        setGrid(Array(keys.length).fill(Array(value).fill(false)));
      }
    },
    [keys.length]
  );

  // ノート行数変更ハンドラ
  const handleNoteRowsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 16) {
        const newKeys = [...keys];
        // 行数が増えた場合、新しい行のデフォルトキーを設定
        while (newKeys.length < value) {
          newKeys.push('C4');
        }
        // 行数が減った場合、配列を切り詰める
        newKeys.length = value;
        setKeys(newKeys);
        setGrid(Array(value).fill(Array(steps).fill(false)));
      }
    },
    [keys, steps]
  );

  // グリッドセルクリックハンドラ
  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => {
        // 同じステップの他のキーをすべてオフにする
        const newRow = [...row];
        newRow[colIndex] = false;
        return newRow;
      });
      // クリックされたセルがオンの場合はオフに、オフの場合はオンにする
      newGrid[rowIndex][colIndex] = !prevGrid[rowIndex][colIndex];
      if (sequencerRef.current) {
        sequencerRef.current.setGrid(newGrid);
      }
      return newGrid;
    });
  }, []);

  // 再生/停止ハンドラ
  const handlePlayToggle = useCallback(async () => {
    if (!isPlaying) {
      console.log('[DEBUG] Starting sequencer (Transport Global)...');
      await Tone.start();

      // Transportをリセットして開始
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      Tone.Transport.start();
    } else {
      console.log('[DEBUG] Stopping sequencer (Transport Global)...');

      // Transportを停止してリセット
      Tone.Transport.stop();
      Tone.Transport.position = 0;

      setCurrentStep(-1);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <NodeBox id={id} label={data.label} hasOutputHandle={false}>
      <Box sx={{ p: 2, position: 'relative' }}>
        {/* Note Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-note-note`}
          style={{ width: 20, height: 20, background: '#ff9800', borderStyle: 'none', right: -25, top: 40 }}
        />
        <Box sx={{ position: 'absolute', right: -55, top: 40, transform: 'translateY(-25%)', fontSize: '10px' }}>
          Note Out
        </Box>

        {/* Gate Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-gate-gate`}
          style={{ width: 20, height: 20, background: '#e91e63', borderStyle: 'none', right: -25, top: 80 }}
        />
        <Box sx={{ position: 'absolute', right: -55, top: 80, transform: 'translateY(-25%)', fontSize: '10px' }}>
          Gate Out
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            label="Tempo"
            type="number"
            value={tempo}
            onChange={handleTempoChange}
            inputProps={{
              min: 40,
              max: 240,
              step: 1,
              sx: { p: 1 },
            }}
            sx={{ width: '100px' }}
          />
          <TextField
            label="Steps"
            type="number"
            value={steps}
            onChange={handleStepsChange}
            inputProps={{
              min: 1,
              max: 32,
              step: 1,
              sx: { p: 1 },
            }}
            sx={{ width: '100px' }}
          />
          <TextField
            label="Note Rows"
            type="number"
            value={keys.length}
            onChange={handleNoteRowsChange}
            inputProps={{
              min: 1,
              max: 20,
              step: 1,
              sx: { p: 1 },
            }}
            sx={{ width: '100px' }}
          />
          <Button
            variant="contained"
            color={isPlaying ? 'secondary' : 'primary'}
            onClick={handlePlayToggle}
            startIcon={isPlaying ? <StopCircle /> : <PlayCircle />}
            sx={{ ml: 1, minWidth: 120 }}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </Button>
        </Stack>
        <Box sx={{ overflowX: 'auto', width: 'fit-content', minWidth: 0 }}>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {grid.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={editingKeyIndex === rowIndex ? editingKeyValue : keys[rowIndex]}
                  onChange={(e) => handleKeyChange(rowIndex, e.target.value)}
                  onBlur={() => handleKeyBlur(rowIndex)}
                  onKeyPress={(e) => handleKeyPress(e, rowIndex)}
                  error={editingKeyIndex === rowIndex && !isValidKey(editingKeyValue)}
                  helperText={editingKeyIndex === rowIndex && !isValidKey(editingKeyValue) ? '無効なキー名' : ''}
                  sx={{ width: '80px' }}
                  inputProps={{ sx: { p: 1 } }}
                />
                {row.map((cell, colIndex) => (
                  <Button
                    key={colIndex}
                    variant={cell ? 'contained' : 'outlined'}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    sx={{
                      minWidth: '40px',
                      height: '40px',
                      backgroundColor: colIndex === currentStep ? 'rgba(233, 30, 99, 0.2)' : undefined,
                      borderColor: colIndex === currentStep ? '#e91e63' : undefined,
                      '&.MuiButton-contained': {
                        backgroundColor: cell ? (colIndex === currentStep ? '#c2185b' : 'primary.main') : undefined,
                        '&:hover': {
                          backgroundColor: cell ? (colIndex === currentStep ? '#c2185b' : 'primary.dark') : undefined,
                        }
                      },
                      '&.MuiButton-outlined': {
                        borderColor: colIndex === currentStep ? '#e91e63' : undefined,
                        color: colIndex === currentStep ? '#e91e63' : undefined,
                      }
                    }}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </NodeBox>
  );
};

export default NodeSequencer;
