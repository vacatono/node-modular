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
    console.log('[DEBUG] AudioNodeManager.registerAudioNode called:', {
      nodeId,
      edgesCount: edges.length,
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
    });

    // パラメータ情報を保存
    if (params) {
      this.nodeParams.set(nodeId, params);
    }

    // 既存のノード更新（切断はしない方針）
    this.audioNodes.set(nodeId, audioNode);

    // このノードに接続している既存のエッジを探して再接続
    const relevantEdges = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
    console.log('[DEBUG] Relevant edges for', nodeId, ':', relevantEdges.length);
    
    relevantEdges.forEach((edge) => {
      this.connect(edge);
    });

    // 出力ノードの場合は、直接Destinationに接続
    if (nodeId === 'toDestination') {
      audioNode.toDestination();
      console.log('Connected to destination');
    }
  }

  /**
   * 2つのノードを接続する
   * @param edge - 接続情報
   */
  public connect(edge: Edge): void {
    try {
      const sourceNode = this.audioNodes.get(edge.source);
      const targetNode = this.audioNodes.get(edge.target);
      
      if (!sourceNode || !targetNode) {
        // 片方のノードがまだ登録されていない場合はスキップ
        return;
      }

      // ハンドルIDから信号タイプを抽出
      const getSignalType = (handleId: string | null | undefined): string | null => {
        if (!handleId) return null;
        const parts = handleId.split('-');
        return parts[parts.length - 1] || null;
      };
      
      const sourceType = getSignalType(edge.sourceHandle);
      const targetType = getSignalType(edge.targetHandle);
      const targetProperty = edge.data?.targetProperty;
      const sourceProperty = edge.data?.sourceProperty;

      console.log('Connecting nodes:', {
        source: edge.source,
        target: edge.target,
        sourceType,
        targetType,
        sourceProperty,
        targetProperty,
      });

      // 信号タイプに基づいて接続処理を分岐
      if (targetType === 'gate') {
        // Gate信号: トリガー接続
        // @ts-ignore
        if (typeof sourceNode.connectTrigger === 'function') {
          // @ts-ignore
          sourceNode.connectTrigger(targetNode);
          console.log('Connected trigger (Gate)', { source: edge.source, target: edge.target });
        } else {
          console.warn('Source node does not support connectTrigger');
        }
      } else if (targetType === 'note' || targetType === 'cv') {
        // Note/CV信号: パラメータへの接続
        // ソースプロパティが 'output' の場合（LFOなど）
        if (sourceProperty === 'output') {
          if (targetType === 'cv') {
             // CV信号: ソースノードの出力をターゲットノードのプロパティに接続
             
             if (!targetProperty) {
               console.warn('[DEBUG] No target property specified for CV (output) connection');
               return;
             }
             
             // @ts-ignore: Dynamic property access
             const targetProp = targetNode[targetProperty];
             
             // VCOの入力接続状態を設定
             if (targetProperty === 'frequency' && typeof (targetNode as any).setCVInputConnected === 'function') {
               (targetNode as any).setCVInputConnected(true);
               console.log('[DEBUG] VCO CV Input connection state set to true');
             } else if (targetProperty === 'note' && typeof (targetNode as any).setNoteInputConnected === 'function') {
               (targetNode as any).setNoteInputConnected(true);
               console.log('[DEBUG] VCO Note Input connection state set to true');
             }
             
             // ターゲットのパラメータ定義を取得
             const targetParams = this.nodeParams.get(edge.target);
             const paramDef = targetParams?.[targetProperty];
             
             if (targetProp) {
               if (paramDef) {
                 // CV信号でパラメータ定義がある場合: Scaleを使用
                 const { min, max } = paramDef;
                 const scale = new Tone.Scale(min, max);
                 
                 // LFOの出力をScaleに接続
                 sourceNode.connect(scale);
                 
                 // Scaleの出力をターゲットプロパティに接続
                 if (typeof targetProp.connect === 'function') {
                   scale.connect(targetProp);
                 } else if (targetProp instanceof Tone.Signal) {
                   scale.connect(targetProp);
                 } else {
                   try {
                     scale.connect(targetProp);
                   } catch (error) {
                     console.error(`[DEBUG] Failed to connect scale to ${targetProperty}:`, error);
                     sourceNode.connect(targetProp);
                   }
                 }
                 console.log(`[DEBUG] Connected CV (output) with scale [${min}, ${max}] to ${targetProperty}`);
               } else {
                 // パラメータ定義がない場合: 直接接続
                 if (typeof targetProp.connect === 'function') {
                   sourceNode.connect(targetProp);
                   console.log(`[DEBUG] Connected CV (output) directly to ${targetProperty} (no params defined)`);
                 } else {
                   console.warn(`[DEBUG] Target property ${targetProperty} does not have connect method`);
                 }
               }
             } else {
               // ターゲットプロパティがない場合、ノード全体に接続
               sourceNode.connect(targetNode);
               console.log(`[DEBUG] Connected CV (output) directly to target node`);
             }
          } else {
             console.warn('Note signal cannot connect to output property');
          }
        } else {
          // ソースプロパティが 'output' 以外、または指定なしの場合
          if (!targetProperty) {
            console.warn('No target property specified for CV/Note connection');
            return;
          }
          
          // propertyが'input'の場合、ターゲットノードのinputプロパティに接続
          if (targetProperty === 'input') {
            // @ts-ignore: Dynamic property access
            const targetInput = targetNode.input;
            // @ts-ignore: input may be ToneAudioNode or Param
            if (targetInput && typeof targetInput.connect === 'function') {
              // 入力ノードに接続
              sourceNode.connect(targetInput);
              console.log(`Connected ${targetType} signal to input`);
            } else {
              // inputプロパティがない場合、ノード全体に接続
              sourceNode.connect(targetNode);
              console.log(`Connected ${targetType} signal to target node`);
            }
          } else {
            // @ts-ignore: Dynamic property access
            const targetParam = targetNode[targetProperty];

            // VCOの入力接続状態を設定
            if (targetProperty === 'frequency' && typeof (targetNode as any).setCVInputConnected === 'function') {
              (targetNode as any).setCVInputConnected(true);
            } else if (targetProperty === 'note' && typeof (targetNode as any).setNoteInputConnected === 'function') {
              (targetNode as any).setNoteInputConnected(true);
            }

            if (targetParam && typeof targetParam.connect === 'function') {
              if (targetType === 'note') {
                // Note信号: 直接接続（周波数値として）
                sourceNode.connect(targetParam);
                console.log(`Connected Note signal directly to ${targetProperty}`);
              } else {
                // CV信号
                const targetParams = this.nodeParams.get(edge.target);
                const paramDef = targetParams?.[targetProperty];
                
                if (paramDef) {
                  // CV信号でパラメータ定義がある場合: Scaleを使用
                  const { min, max } = paramDef;
                  const scale = new Tone.Scale(min, max);
                  
                  sourceNode.connect(scale);
                  scale.connect(targetParam);
                  
                  console.log(`Connected CV with scale [${min}, ${max}] to ${targetProperty}`);
                } else {
                  // CV信号でパラメータ定義がない場合: 直接接続
                  sourceNode.connect(targetParam);
                  console.log(`Connected CV directly to ${targetProperty} (no params defined)`);
                }
              }
            } else {
              console.warn(`Target property ${targetProperty} is not a valid AudioParam`);
            }
          }
        }
      } else if (targetType === 'audio') {
        // Audio信号: 通常のオーディオ接続
        sourceNode.connect(targetNode);
        console.log('Connected audio nodes directly');
      } else {
        console.warn('Unknown signal type:', { sourceType, targetType });
      }
    } catch (error) {
      console.error('Error connecting audio nodes:', error);
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
