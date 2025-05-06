'use client';

import { useEffect, useRef } from 'react';
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

const NodeOscilloscope = ({ data, id }: NodeOscilloscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const gainNodeRef = useRef<Tone.Gain | null>(null);

  // オーディオノードの生成・破棄
  useEffect(() => {
    // アナライザーの設定
    analyserRef.current = new Tone.Analyser('waveform', data.size || 1024);

    // ゲインノードの作成（信号をそのまま通過させる）
    gainNodeRef.current = new Tone.Gain(1);

    // アナライザーとゲインノードを接続
    gainNodeRef.current.connect(analyserRef.current);

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;

      if (canvas && analyser) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const values = analyser.getValue() as Float32Array;
          const width = canvas.width;
          const height = canvas.height;

          // キャンバスをクリア
          ctx.clearRect(0, 0, width, height);

          // 背景を描画
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(0, 0, width, height);

          // グリッドを描画
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i < width; i += 20) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
          }
          for (let i = 0; i < height; i += 20) {
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
          }
          ctx.stroke();

          // 波形を描画
          ctx.beginPath();
          ctx.strokeStyle = '#1976d2';
          ctx.lineWidth = 2;

          const sliceWidth = width / values.length;
          let x = 0;

          for (let i = 0; i < values.length; i++) {
            const y = ((values[i] + 1) / 2) * height;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
        }
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
      if (gainNodeRef.current) {
        gainNodeRef.current.dispose();
      }
    };
  }, [id, data.size]);

  // オーディオノードの登録
  useEffect(() => {
    if (gainNodeRef.current) {
      data.registerAudioNode(id, gainNodeRef.current);
    }
  }, [id, data.registerAudioNode, data.edges]);

  return (
    <NodeBox id={id} label={data.label} hasInputHandle={true} hasOutputHandle={true}>
      <Box sx={{ mt: 2, width: '100%', height: '100px', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={100}
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </Box>
    </NodeBox>
  );
};

export default NodeOscilloscope;
