'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import { Box } from '@mui/material';
import NodeBox from './common/NodeBox';

interface NodeOscilloscopeProps {
  data: {
    label: string;
    size?: number;
    registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
  };
  id: string;
}

const NodeOscilloscope = ({ data, id }: NodeOscilloscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    analyserRef.current = new Tone.Analyser('waveform', data.size || 1024);

    // Tone.jsのオブジェクトを登録
    data.registerAudioNode(id, analyserRef.current);

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;

      if (canvas && analyser) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const values = analyser.getValue() as Float32Array;

          // キャンバスをクリア
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 波形の描画
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
    };
  }, [id, data.size, data.registerAudioNode]);

  return (
    <NodeBox id={id} label={data.label}>
      <Box sx={{ mt: 2 }}>
        <canvas ref={canvasRef} width={200} height={100} style={{ border: '1px solid #ccc' }} />
      </Box>
    </NodeBox>
  );
};

export default NodeOscilloscope;
