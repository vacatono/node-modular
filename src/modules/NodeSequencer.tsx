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
            const frequency = Tone.Frequency(note).toFrequency();

            // ノート出力（周波数値を送信）
            this.noteOutput.setValueAtTime(frequency, time);

            // ゲート出力
            this.gateOutput.gain.setValueAtTime(1, time);
            this.gateOutput.gain.setValueAtTime(0, time + 0.1);

            // トリガー接続（Envelope等をトリガー）
            this.connectedTriggers.forEach(target => {
              if (target && typeof target.triggerAttackRelease === 'function') {
                // 16分音符分の長さでトリガー
                target.triggerAttackRelease("16n", time);
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
   * ノート出力に接続
   */
  connectNote(target: Tone.ToneAudioNode): void {
    this.noteOutput.connect(target);
  }

  /**
   * ゲート出力に接続
   */
  connectGate(target: Tone.ToneAudioNode): void {
    this.gateOutput.connect(target);
  }

  /**
   * トリガー出力先として登録
   * AudioNodeManagerから呼び出される
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
   * シーケンスの開始
   */
  start(): void {
    this.sequence.start(0);
  }

  /**
   * シーケンスの停止
   */
  stop(): void {
    this.sequence.stop();
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
  const sequencer = useRef<SequencerNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(data.tempo || 120);
  const [steps, setSteps] = useState(data.steps || 8);
  const [keys, setKeys] = useState(data.keys || ['A4', 'C4', 'D4', 'E4', 'G4']);
  const [grid, setGrid] = useState<boolean[][]>(Array(keys.length).fill(Array(steps).fill(false)));
  const [editingKeyIndex, setEditingKeyIndex] = useState<number | null>(null);
  const [editingKeyValue, setEditingKeyValue] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(-1);

  useEffect(() => {
    // シーケンサーの初期化
    sequencer.current = new SequencerNode({
      steps,
      keys,
      tempo,
      onStep: (step) => setCurrentStep(step),
    });

    // オーディオノードの登録
    data.registerAudioNode(id, sequencer.current);

    return () => {
      sequencer.current?.dispose();
    };
  }, [id, steps, keys, tempo, data.registerAudioNode]);

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
          if (sequencer.current) {
            sequencer.current.setKeys(newKeys);
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
      if (sequencer.current) {
        sequencer.current.setGrid(newGrid);
      }
      return newGrid;
    });
  }, []);

  // 再生/停止ハンドラ
  const handlePlayToggle = useCallback(async () => {
    if (!isPlaying) {
      await Tone.start();
      Tone.Transport.start();
      sequencer.current?.start();
    } else {
      Tone.Transport.stop();
      sequencer.current?.stop();
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
          id={`${id}-note`}
          style={{ width: 20, height: 20, background: 'orange', borderStyle: 'none', right: -25, top: 40 }}
        />
        <Box sx={{ position: 'absolute', right: -55, top: 40, transform: 'translateY(-25%)', fontSize: '10px' }}>
          Note
        </Box>

        {/* Gate Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-gate`}
          style={{ width: 20, height: 20, background: 'red', borderStyle: 'none', right: -25, top: 80 }}
        />
        <Box sx={{ position: 'absolute', right: -55, top: 80, transform: 'translateY(-25%)', fontSize: '10px' }}>
          Gate
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
