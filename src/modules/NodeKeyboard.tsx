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
  private connectedTriggers: any[] = []; // 接続されたTriggerイベントターゲットのリスト
  private _dummyInput = new Tone.Gain(); // Abstractクラスの要件を満たすためのダミー入力

  private isPressed: boolean = false;
  private isHold: boolean = false;
  private lastGateState: boolean = false;

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
   * ホールド状態の設定
   */
  setHold(enabled: boolean) {
    this.isHold = enabled;
    this.updateGate();
  }

  /**
   * ゲート状態の更新
   */
  private updateGate() {
    const isGateActive = this.isPressed || this.isHold;

    if (isGateActive !== this.lastGateState) {
      this.lastGateState = isGateActive;
      const now = Tone.now();

      if (isGateActive) {
        // Gate High
        this.gateOutput.gain.cancelScheduledValues(now);
        this.gateOutput.gain.setValueAtTime(1, now);

        // Trigger Attack on connected targets
        this.connectedTriggers.forEach((target) => {
          if (typeof target.triggerAttack === 'function') {
            target.triggerAttack(now);
          }
        });
      } else {
        // Gate Low
        this.gateOutput.gain.cancelScheduledValues(now);
        this.gateOutput.gain.setValueAtTime(0, now);

        // Trigger Release on connected targets
        this.connectedTriggers.forEach((target) => {
          if (typeof target.triggerRelease === 'function') {
            target.triggerRelease(now);
          }
        });
      }
    }
  }

  /**
   * ノートオン (Attack)
   * @param note ノート名 (例: "C4")
   */
  triggerAttack(note: string) {
    // Noteイベントの発行
    console.log(`[DEBUG] Keyboard triggerAttack: ${note}. Targets: ${this.connectedNotes.length}`);
    this.connectedNotes.forEach((target) => {
      if (typeof target.setNote === 'function') {
        target.setNote(note);
      }
    });

    this.isPressed = true;
    this.updateGate();
  }

  /**
   * ノートオフ (Release)
   */
  triggerRelease() {
    this.isPressed = false;
    this.updateGate();
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

  /**
   * トリガー出力先として登録
   * AudioNodeManagerから呼び出される
   */
  connectTrigger(target: any): void {
    if (!this.connectedTriggers.includes(target)) {
      this.connectedTriggers.push(target);
      console.log('[DEBUG] Keyboard connected Trigger event target:', target);
    }
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
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isHold, setIsHold] = useState(false);

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
    setActiveKey(note);
    if (keyboardNode.current) {
      keyboardNode.current.triggerAttack(note);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isHold) {
      setActiveKey(null);
    }
    if (keyboardNode.current) {
      keyboardNode.current.triggerRelease();
    }
  }, [isHold]);

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
        variant={isHold ? 'contained' : 'outlined'}
        color={isHold ? 'secondary' : 'primary'}
        onClick={() => {
          const newHold = !isHold;
          setIsHold(newHold);
          if (!newHold) {
            setActiveKey(null);
          }
          if (keyboardNode.current) {
            keyboardNode.current.setHold(newHold);
          }
        }}
        sx={{ mt: 2, width: '100%' }}
      >
        HOLD
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
              const isActive = activeKey === key.note;

              let style: React.CSSProperties = {
                width: isBlack ? 24 : 36,
                height: isBlack ? 70 : 120,
                backgroundColor: isActive
                  ? '#c2185b' // Pinkish color for active state
                  : (isBlack ? '#333' : '#fff'),
                color: isActive ? '#fff' : (isBlack ? '#fff' : '#000'),
                border: isActive ? '1px solid #e91e63' : '1px solid #999',
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
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleMouseDown(key.note);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleMouseUp();
                  }}
                  style={{ ...style, touchAction: 'none' }}
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
