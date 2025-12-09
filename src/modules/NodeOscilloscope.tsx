'use client';

import { useEffect, useRef, useState } from 'react';
import { Edge } from 'reactflow';
import * as Tone from 'tone';
import { Box } from '@mui/material';
import NodeBox from './common/NodeBox';

interface NodeOscilloscopeProps {
  data: {
    label: string;
    size?: number;
    registerAudioNode: (_nodeId: string, _audioNode: Tone.ToneAudioNode) => void;
    edges?: Edge[];
  };
  id: string;
}

/**
 * CV信号を監視するためのラッパークラス
 * Tone.Analyserを使用してCV信号の値を波形として取得
 */
class CVMonitorNode extends Tone.ToneAudioNode {
  private cvInput: Tone.Signal;
  private analyser: Tone.Analyser;

  constructor() {
    super();
    this.cvInput = new Tone.Signal(0);
    // CV信号をAnalyserで監視（波形として取得可能）
    this.analyser = new Tone.Analyser('waveform', 1024);
    this.cvInput.connect(this.analyser);
  }

  get name(): string {
    return 'CVMonitorNode';
  }

  get input(): Tone.ToneAudioNode {
    return this.cvInput;
  }

  get output(): Tone.ToneAudioNode {
    return this.analyser;
  }

  /**
   * 現在のCV値を取得（波形データから平均値を計算）
   */
  getValue(): number {
    const values = this.analyser.getValue() as Float32Array;
    if (values.length === 0) return 0;
    // 波形データの平均値を返す
    const sum = Array.from(values).reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * 波形データを取得
   */
  getWaveform(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  dispose(): this {
    this.cvInput.dispose();
    this.analyser.dispose();
    super.dispose();
    return this;
  }
}

/**
 * オシロスコープノードの統合ラッパークラス
 * Audio入力とCV入力を両方持ちます
 */
class OscilloscopeNode extends Tone.ToneAudioNode {
  public audioAnalyser: Tone.Analyser;
  public cvMonitor: CVMonitorNode;

  constructor(size: number = 1024) {
    super();
    this.audioAnalyser = new Tone.Analyser('waveform', size);
    this.cvMonitor = new CVMonitorNode();
  }

  get name(): string {
    return 'OscilloscopeNode';
  }

  /**
   * Audio入力 (Tone.ToneAudioNode標準)
   * AudioNodeManagerが 'audio' タイプの接続に使用
   */
  get input(): Tone.ToneAudioNode {
    return this.audioAnalyser;
  }

  /**
   * Default output (pass-through audio)
   */
  get output(): Tone.ToneAudioNode {
    return this.audioAnalyser;
  }

  /**
   * CV入力
   * AudioNodeManagerが 'cvInput' プロパティへの接続に使用
   */
  get cvInput(): Tone.ToneAudioNode {
    return this.cvMonitor.input;
  }

  /**
   * Audio波形データを取得
   */
  getAudioWaveform(): Float32Array {
    return this.audioAnalyser.getValue() as Float32Array;
  }

  /**
   * CV波形データを取得
   */
  getCVWaveform(): Float32Array {
    return this.cvMonitor.getWaveform();
  }

  /**
   * CV値を取得
   */
  getCVValue(): number {
    return this.cvMonitor.getValue();
  }

  dispose(): this {
    this.audioAnalyser.dispose();
    this.cvMonitor.dispose();
    super.dispose();
    return this;
  }
}

const NodeOscilloscope = ({ data, id }: NodeOscilloscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const oscilloscopeNode = useRef<OscilloscopeNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [inputMode, setInputMode] = useState<'audio' | 'cv'>('audio');

  // オーディオノードの生成・破棄
  useEffect(() => {
    oscilloscopeNode.current = new OscilloscopeNode(data.size || 1024);

    // 単一のノードとして登録（内部でAudio/CV両方の入力を管理）
    data.registerAudioNode(id, oscilloscopeNode.current);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (oscilloscopeNode.current) {
        if (inputMode === 'audio') {
          // Audio信号の波形を描画
          const values = oscilloscopeNode.current.getAudioWaveform();

          ctx.beginPath();
          ctx.strokeStyle = '#1976d2';
          ctx.lineWidth = 2;

          values.forEach((value: number, i: number) => {
            const x = (i / values.length) * canvas.width;
            const y = ((value + 1) / 2) * canvas.height;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });

          ctx.stroke();
        } else if (inputMode === 'cv') {
          // CV信号の波形を描画
          const values = oscilloscopeNode.current.getCVWaveform();
          const cvValue = oscilloscopeNode.current.getCVValue();

          if (values.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 2;

            values.forEach((value: number, i: number) => {
              const x = (i / values.length) * canvas.width;
              // CV値を0-1の範囲に正規化（-1から1の範囲を0から1に）
              const normalizedValue = (value + 1) / 2;
              const y = (1 - normalizedValue) * canvas.height;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });

            ctx.stroke();
          }

          // CV値のテキスト表示
          ctx.fillStyle = '#4caf50';
          ctx.font = '12px monospace';
          ctx.fillText(`CV: ${cvValue.toFixed(3)}`, 10, 20);
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (oscilloscopeNode.current) {
        oscilloscopeNode.current.dispose();
      }
    };
  }, [id, data.size, data.registerAudioNode, inputMode]);

  // 接続状態によるモード自動切替
  useEffect(() => {
    if (!data.edges) return;

    const incomingEdges = data.edges.filter(edge => edge.target === id);
    if (incomingEdges.length === 0) return;

    // CV接続の検出 (property 'cvInput' または handle IDに 'control')
    const hasCVConnection = incomingEdges.some(edge =>
      edge.data?.targetProperty === 'cvInput' ||
      edge.targetHandle?.includes('control')
    );

    // Audio接続の検出 (handle IDに 'input-audio')
    const hasAudioConnection = incomingEdges.some(edge =>
      edge.targetHandle?.includes('input-audio')
    );

    // 自動切替ロジック
    // - 片方だけ接続されている場合、そのモードに切り替える
    // - 両方または未接続の場合は、ユーザー操作を優先して何もしない
    if (hasCVConnection && !hasAudioConnection) {
      if (inputMode !== 'cv') setInputMode('cv');
    } else if (hasAudioConnection && !hasCVConnection) {
      if (inputMode !== 'audio') setInputMode('audio');
    }
  }, [data.edges, id, inputMode]);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasOutputHandle={false}
      hasInputHandle={true}
      hasControl1Handle={true}
      control1Target={{
        label: 'CV In',
        property: 'cvInput',
      }}
    >
      <Box sx={{ mt: 2 }}>
        <canvas ref={canvasRef} width={200} height={100} style={{ border: '1px solid #ccc' }} />
      </Box>
    </NodeBox >
  );
};

export default NodeOscilloscope;
