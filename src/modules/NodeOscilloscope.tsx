'use client';

import { useEffect, useRef, useState } from 'react';
import { Edge } from 'reactflow';
import * as Tone from 'tone';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
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

const NodeOscilloscope = ({ data, id }: NodeOscilloscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const cvMonitorRef = useRef<CVMonitorNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [inputMode, setInputMode] = useState<'audio' | 'cv'>('audio');

  // オーディオノードの生成・破棄
  useEffect(() => {
    analyserRef.current = new Tone.Analyser('waveform', data.size || 1024);
    cvMonitorRef.current = new CVMonitorNode();

    // 入力モードに応じて登録
    if (inputMode === 'audio') {
    data.registerAudioNode(id, analyserRef.current);
    } else {
      data.registerAudioNode(id, cvMonitorRef.current);
    }

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

        const ctx = canvas.getContext('2d');
      if (!ctx) return;

          // キャンバスをクリア
          ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (inputMode === 'audio' && analyserRef.current) {
        // Audio信号の波形を描画
        const values = analyserRef.current.getValue() as Float32Array;

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
      } else if (inputMode === 'cv' && cvMonitorRef.current) {
        // CV信号の波形を描画
        const values = cvMonitorRef.current.getWaveform();
        const cvValue = cvMonitorRef.current.getValue();

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

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (analyserRef.current) {
        analyserRef.current.dispose();
      }
      if (cvMonitorRef.current) {
        cvMonitorRef.current.dispose();
      }
    };
  }, [id, data.size, data.registerAudioNode, inputMode]);

  // 入力モード変更ハンドラ
  const handleInputModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'audio' | 'cv' | null
  ) => {
    if (newMode !== null) {
      setInputMode(newMode);
    }
  };

  return (
    <NodeBox 
      id={id} 
      label={data.label} 
      hasOutputHandle={false}
      hasInputHandle={inputMode === 'audio'}
      hasControl1Handle={inputMode === 'cv'}
      control1Target={inputMode === 'cv' ? {
        label: 'CV In',
        property: 'input',
      } : undefined}
    >
      <Box sx={{ mt: 2 }}>
        <ToggleButtonGroup
          value={inputMode}
          exclusive
          onChange={handleInputModeChange}
          aria-label="input mode"
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton value="audio" aria-label="audio input">
            Audio
          </ToggleButton>
          <ToggleButton value="cv" aria-label="cv input">
            CV
          </ToggleButton>
        </ToggleButtonGroup>
        <canvas ref={canvasRef} width={200} height={100} style={{ border: '1px solid #ccc' }} />
      </Box>
    </NodeBox>
  );
};

export default NodeOscilloscope;
