import * as Tone from 'tone';
import { Edge } from 'reactflow';

/**
 * オーディオノードのコントロールスケール情報
 */
/**
 * オーディオノードを管理するクラス
 */
export class AudioNodeManager {
  private static instance: AudioNodeManager | null = null;
  private audioNodes: Map<string, Tone.ToneAudioNode>;
  private nodeParams: Map<string, Record<string, { min: number; max: number }>>;

  private constructor() {
    this.audioNodes = new Map();
    this.nodeParams = new Map();
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
   * @param params - (Optional) コントロールパラメータの最小・最大値情報
   */
  registerAudioNode(
    nodeId: string,
    audioNode: Tone.ToneAudioNode,
    edges: Edge[],
    params?: Record<string, { min: number; max: number }>
  ): void {
    //console.log('registerAudioNode', nodeId, audioNode, edges, params);

    // パラメータ情報を保存
    if (params) {
      this.nodeParams.set(nodeId, params);
    }

    // 既存のノード更新（切断はしない方針）
    this.audioNodes.set(nodeId, audioNode);

    // このノードに接続している既存のエッジを探して再接続
    edges.forEach((edge) => {
      try {
        // このノードがターゲットの場合のみ処理
        if (edge.target !== nodeId) return;
        
        // 接続元
        const sourceNode = this.audioNodes.get(edge.source);
        // 接続先
        const targetNode = audioNode;
        // 接続タイプとプロパティ
        const nodeType = edge.data.targetType;
        const property = edge.data.targetProperty;

        if (!sourceNode || !targetNode) {
          // console.log('Missing source or target node:', { sourceNode, targetNode });
          return;
        }

        console.log('Connecting nodes:', {
          source: edge.source,
          target: nodeId,
          type: nodeType,
          property,
        });

        if (nodeType === 'control' && property) {
          // ターゲットのパラメータ定義を取得
          const targetParams = this.nodeParams.get(nodeId);
          const paramDef = targetParams?.[property];
          
          // Tone.jsのAudioParamに接続できるか確認
          // @ts-ignore: Dynamic property access
          const targetParam = targetNode[property];

          if (targetParam && typeof targetParam.connect === 'function') {
            if (paramDef) {
              // パラメータ定義がある場合、Scaleを使用して接続
              const { min, max } = paramDef;
              const scale = new Tone.Scale(min, max);
              
              // ソース -> Scale -> ターゲットパラメータ
              sourceNode.connect(scale);
              scale.connect(targetParam);
              
              console.log(`Connected with scale [${min}, ${max}] to ${property}`);
            } else {
              // 定義がない場合は直接接続（Audio -> Audio Modulationなど）
              sourceNode.connect(targetParam);
              console.log(`Connected directly to ${property} (no params defined)`);
            }
          } else {
            console.warn(`Target property ${property} is not a valid AudioParam`);
          }

        } else if (nodeType === 'trigger') {
          // トリガー接続（Sequencer -> Envelopeなど）
          // @ts-ignore
          if (typeof sourceNode.connectTrigger === 'function') {
            // @ts-ignore
            sourceNode.connectTrigger(targetNode);
            console.log('Connected trigger', { source: edge.source, target: nodeId });
          } else {
             console.warn('Source node does not support connectTrigger');
          }
        } else {
          // 通常のオーディオ接続
          sourceNode.connect(targetNode);
          console.log('Connected audio nodes directly');
        }
      } catch (error) {
        console.error('Error connecting audio nodes:', error);
      }
    });

    // 出力ノードの場合は、直接Destinationに接続
    if (nodeId === 'toDestination') {
      audioNode.toDestination();
      console.log('Connected to destination');
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
