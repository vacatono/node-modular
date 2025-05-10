'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Edge } from 'reactflow';
import * as Tone from 'tone';
import { Box, Button, Grid } from '@mui/material';
import CustomSlider from './common/CustomSlider';
import NodeBox from './common/NodeBox';

/**
 * シーケンサーノードのラッパークラス
 * Tone.SequenceをラップしてToneAudioNodeとして機能させます
 */
class SequencerNode extends Tone.ToneAudioNode {
  private sequence: Tone.Sequence;
  private noteOutput: Tone.Gain;
  private gateOutput: Tone.Gain;
  private grid: boolean[][];
  private keys: string[];
  private steps: number;

  constructor(options: { steps?: number; keys?: string[]; tempo?: number }) {
    super();
    this.steps = options.steps || 8;
    this.keys = options.keys || ['A4', 'C4', 'D4', 'E4', 'G4'];
    this.grid = Array(this.keys.length).fill(Array(this.steps).fill(false));

    // 出力ノードの初期化
    this.noteOutput = new Tone.Gain(1);
    this.gateOutput = new Tone.Gain(1);

    // シーケンスの初期化
    this.sequence = new Tone.Sequence(
      (time, step) => {
        this.grid.forEach((row, rowIndex) => {
          if (row[step]) {
            const note = this.keys[rowIndex];
            // ノート出力
            this.noteOutput.gain.setValueAtTime(1, time);
            this.noteOutput.gain.setValueAtTime(0, time + 0.1);
            // ゲート出力
            this.gateOutput.gain.setValueAtTime(1, time);
            this.gateOutput.gain.setValueAtTime(0, time + 0.1);
          }
        });
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
   * グリッドの状態を更新
   */
  setGrid(newGrid: boolean[][]): void {
    this.grid = newGrid;
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
  const [keys] = useState(data.keys || ['A4', 'C4', 'D4', 'E4', 'G4']);
  const [grid, setGrid] = useState<boolean[][]>(Array(keys.length).fill(Array(steps).fill(false)));

  useEffect(() => {
    // シーケンサーの初期化
    sequencer.current = new SequencerNode({
      steps,
      keys,
      tempo,
    });

    // オーディオノードの登録
    data.registerAudioNode(id, sequencer.current);

    return () => {
      sequencer.current?.dispose();
    };
  }, [id, steps, keys, tempo, data.registerAudioNode]);

  // テンポ変更ハンドラ
  const handleTempoChange = useCallback((value: number | number[]) => {
    if (typeof value === 'number') {
      setTempo(value);
      Tone.Transport.bpm.value = value;
    }
  }, []);

  // ステップ数変更ハンドラ
  const handleStepsChange = useCallback(
    (value: number | number[]) => {
      if (typeof value === 'number') {
        setSteps(value);
        setGrid(Array(keys.length).fill(Array(value).fill(false)));
      }
    },
    [keys.length]
  );

  // グリッドセルクリックハンドラ
  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);
      newGrid[rowIndex][colIndex] = !newGrid[rowIndex][colIndex];
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
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <NodeBox id={id} label={data.label}>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <CustomSlider label="Tempo" min={40} max={240} step={1} defaultValue={tempo} onChange={handleTempoChange} />
          </Grid>
          <Grid item xs={12}>
            <CustomSlider label="Steps" min={1} max={32} step={1} defaultValue={steps} onChange={handleStepsChange} />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color={isPlaying ? 'secondary' : 'primary'}
              onClick={handlePlayToggle}
              fullWidth
            >
              {isPlaying ? 'Stop' : 'Play'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {grid.map((row, rowIndex) => (
                <Box key={rowIndex} sx={{ display: 'flex', gap: 1 }}>
                  {row.map((cell, colIndex) => (
                    <Button
                      key={colIndex}
                      variant={cell ? 'contained' : 'outlined'}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      sx={{ minWidth: '40px', height: '40px' }}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </NodeBox>
  );
};

export default NodeSequencer;
