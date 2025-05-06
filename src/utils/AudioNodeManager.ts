import * as Tone from 'tone';
import { Edge } from 'reactflow';

/**
 * オーディオノードのコントロールスケール情報
 */
const controlScales: Record<string, Record<string, { min: number; max: number }>> = {
  Oscillator: {
    frequency: { min: 20, max: 2000 },
    detune: { min: -100, max: 100 },
  },
  Filter: {
    frequency: { min: 200, max: 5000 },
    Q: { min: 0.1, max: 20 },
  },
  Gain: {
    gain: { min: 0, max: 1 },
  },
  panner: {
    pan: { min: -1, max: 1 },
  },
  Delay: {
    delayTime: { min: 0, max: 1 },
    feedback: { min: 0, max: 1 },
    mix: { min: 0, max: 1 },
  },
};

/**
 * オーディオノードを管理するクラス
 */
export class AudioNodeManager {
  private static instance: AudioNodeManager | null = null;
  private audioNodes: Map<string, Tone.ToneAudioNode>;

  private constructor() {
    this.audioNodes = new Map();
  }

  /**
   * AudioNodeManagerのインスタンスを取得
   * @returns AudioNodeManagerのインスタンス
   */
  public static getInstance(): AudioNodeManager {
    if (!AudioNodeManager.instance) {
      AudioNodeManager.instance = new AudioNodeManager();
    }
    return AudioNodeManager.instance;
  }

  /**
   * オーディオノードを登録し、既存の接続を再構築する
   * @param nodeId - ノードのID
   * @param audioNode - 登録するTone.jsのオーディオノード
   * @param edges - 現在のエッジ情報
   */
  registerAudioNode(nodeId: string, audioNode: Tone.ToneAudioNode, edges: Edge[]): void {
    console.log('registerAudioNode', nodeId, audioNode, edges);

    // 既存の接続を解除
    const existingNode = this.audioNodes.get(nodeId);
    if (existingNode) {
      existingNode.disconnect();
    }

    this.audioNodes.set(nodeId, audioNode);

    // このノードに接続している既存のエッジを探して再接続
    edges.forEach((edge) => {
      try {
        const isTarget = edge.target === nodeId;
        const isSource = edge.source === nodeId;
        if (!isTarget && !isSource) return;

        const sourceNode = isTarget ? this.audioNodes.get(edge.source) : audioNode;
        const targetNode = isTarget ? audioNode : this.audioNodes.get(edge.target);
        const nodeType = isTarget ? edge.data.targetType : edge.data.sourceType;
        const property = isTarget ? edge.data.targetProperty : edge.data.sourceProperty;

        if (!sourceNode || !targetNode) return;

        if (nodeType === 'control' && property && property in targetNode) {
          const targetParam = targetNode[property as keyof typeof targetNode];
          if (targetParam !== undefined && typeof (targetParam as any).connect === 'function') {
            sourceNode.connect(targetParam as Tone.InputNode);
          } else {
            sourceNode.connect(targetNode);
          }
        } else {
          sourceNode.connect(targetNode);
        }
      } catch (error) {
        console.error('Error connecting audio nodes:', error);
      }
    });

    // 出力ノードの場合は、直接Destinationに接続
    if (nodeId === 'toDestination') {
      audioNode.toDestination();
    }
  }

  /**
   * 指定されたノードIDのオーディオノードを取得
   * @param nodeId - ノードのID
   * @returns オーディオノード
   */
  getAudioNode(nodeId: string): Tone.ToneAudioNode | undefined {
    return this.audioNodes.get(nodeId);
  }

  /**
   * 指定されたノードIDのオーディオノードを削除
   * @param nodeId - ノードのID
   */
  deleteAudioNode(nodeId: string): void {
    const audioNode = this.audioNodes.get(nodeId);
    if (audioNode) {
      audioNode.disconnect();
      audioNode.dispose();
      this.audioNodes.delete(nodeId);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const audioNodeManager = AudioNodeManager.getInstance();
