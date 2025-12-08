import { useEffect, useRef, useState, useCallback } from 'react';
import { Edge, Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import { Box, Button } from '@mui/material';
import NodeBox from './common/NodeBox';

interface NodeProps {
  data: {
    label: string;
    registerAudioNode: (id: string, node: Tone.ToneAudioNode) => void;
  };
  id: string;
}

/**
 * キーボードノードクラス
 * NoteイベントとGate信号を出力します
 */
class KeyboardNode extends Tone.ToneAudioNode {
  public gateOutput: Tone.Gain;
  private connectedNotes: any[] = []; // 接続されたNoteイベントターゲットのリスト
  private _dummyInput = new Tone.Gain(); // Abstractクラスの要件を満たすためのダミー入力

  constructor() {
    super();
    // ゲート出力: 押されている間は1、離すと0
    this.gateOutput = new Tone.Gain(0);
  }

  get name(): string {
    return 'KeyboardNode';
  }

  get input(): Tone.ToneAudioNode {
    return this._dummyInput;
  }

  get output(): Tone.ToneAudioNode {
    return this.gateOutput;
  }

  /**
   * ノートオン (Attack)
   * @param note ノート名 (例: "C4")
   */
  triggerAttack(note: string) {
    // Noteイベントの発行
    console.log(`[DEBUG] Keyboard triggerAttack: ${note}. Targets: ${this.connectedNotes.length}, Target IDs: ${this.connectedNotes.map(t => t.constructor.name).join(', ')}`);
    this.connectedNotes.forEach((target) => {
      if (typeof target.setNote === 'function') {
        target.setNote(note);
      }
    });

    // GateをHighにする
    // ランプを防ぐために即座に設定
    this.gateOutput.gain.cancelScheduledValues(Tone.now());
    this.gateOutput.gain.setValueAtTime(1, Tone.now());
  }

  /**
   * ノートオフ (Release)
   */
  triggerRelease() {
    // GateをLowにする
    this.gateOutput.gain.cancelScheduledValues(Tone.now());
    this.gateOutput.gain.setValueAtTime(0, Tone.now());
  }

  /**
   * ノート出力に接続 (イベントベース)
   */
  connectNote(target: any): void {
    if (!this.connectedNotes.includes(target)) {
      this.connectedNotes.push(target);
      console.log('[DEBUG] Keyboard connected Note event target:', target);
    }
  }

  /**
   * ゲート出力に接続
   */
  connectGate(target: Tone.ToneAudioNode): void {
    this.gateOutput.connect(target);
  }

  dispose(): this {
    this.gateOutput.dispose();
    this._dummyInput.dispose();
    super.dispose();
    return this;
  }
}

const KEYS = [
  { note: 'C4', color: 'white', label: 'C' },
  { note: 'C#4', color: 'black', label: '' },
  { note: 'D4', color: 'white', label: 'D' },
  { note: 'D#4', color: 'black', label: '' },
  { note: 'E4', color: 'white', label: 'E' },
  { note: 'F4', color: 'white', label: 'F' },
  { note: 'F#4', color: 'black', label: '' },
  { note: 'G4', color: 'white', label: 'G' },
  { note: 'G#4', color: 'black', label: '' },
  { note: 'A4', color: 'white', label: 'A' },
  { note: 'A#4', color: 'black', label: '' },
  { note: 'B4', color: 'white', label: 'B' },
  { note: 'C5', color: 'white', label: 'C' },
];

const NodeKeyboard = ({ data, id }: NodeProps) => {
  const keyboardNode = useRef<KeyboardNode | null>(null);

  useEffect(() => {
    keyboardNode.current = new KeyboardNode();
    data.registerAudioNode(id, keyboardNode.current);

    return () => {
      if (keyboardNode.current) {
        keyboardNode.current.dispose();
      }
    };
  }, [id, data.registerAudioNode]);

  const handleMouseDown = useCallback((note: string) => {
    if (keyboardNode.current) {
      keyboardNode.current.triggerAttack(note);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (keyboardNode.current) {
      keyboardNode.current.triggerRelease();
    }
  }, []);

  return (
    <NodeBox
      id={id}
      label={data.label}
      hasInputHandle={false}
      hasOutputHandle={false} // Default audio output disabled, using custom Gate handle below
      hasControl1Handle={true}
      control1Target={{
        label: 'Note Out',
        property: 'note',
        isSource: true,
      }}
    >
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          console.log('[DEBUG] Manual Trigger C4');
          if (keyboardNode.current) {
            keyboardNode.current.triggerAttack('C4');
            setTimeout(() => keyboardNode.current?.triggerRelease(), 500);
          }
        }}
        sx={{ mb: 1, fontSize: '10px', py: 0 }}
      >
        Test C4
      </Button>
      <Box sx={{ position: 'relative' }}>
        {/* Gate Out Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-gate-gate`}
          style={{ width: 20, height: 20, background: '#e91e63', borderStyle: 'none', right: -26, top: '50%' }}
        />
        <Box sx={{ position: 'absolute', right: -65, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', whiteSpace: 'nowrap' }}>
          Gate Out
        </Box>

        <Box
          sx={{
            display: 'flex',
            position: 'relative',
            height: 120,
            mt: 2,
            userSelect: 'none',
          }}
          onMouseLeave={handleMouseUp}
        >
          {(() => {
            let whiteKeyIndex = 0;
            return KEYS.map((key) => {
              const isBlack = key.color === 'black';
              let style: React.CSSProperties = {
                width: isBlack ? 24 : 36,
                height: isBlack ? 70 : 120,
                backgroundColor: isBlack ? '#333' : '#fff',
                color: isBlack ? '#fff' : '#000',
                border: '1px solid #999',
                borderRadius: '0 0 4px 4px',
                zIndex: isBlack ? 10 : 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 8,
                fontSize: 10,
                cursor: 'pointer',
                boxSizing: 'border-box', // Ensure width includes border
              };

              if (isBlack) {
                const leftPos = whiteKeyIndex * 36 - 12;
                style = {
                  ...style,
                  position: 'absolute',
                  left: `${leftPos}px`,
                  top: 0,
                };
              } else {
                style = {
                  ...style,
                  position: 'relative',
                };
                whiteKeyIndex++;
              }

              return (
                <div
                  key={key.note}
                  onMouseDown={() => handleMouseDown(key.note)}
                  onMouseUp={handleMouseUp}
                  style={style}
                >
                  {!isBlack && key.label}
                </div>
              );
            });
          })()}
        </Box>
      </Box>
    </NodeBox>
  );
};

export default NodeKeyboard;
