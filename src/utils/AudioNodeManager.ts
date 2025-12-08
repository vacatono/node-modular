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
    
    edges.forEach((edge) => {
      try {
        // このノードがターゲットの場合
        if (edge.target === nodeId) {
          // 接続元
          const sourceNode = this.audioNodes.get(edge.source);
          // 接続先
          const targetNode = audioNode;
          
          // ハンドルIDから信号タイプを抽出
          const getSignalType = (handleId: string | null | undefined): string | null => {
            if (!handleId) return null;
            const parts = handleId.split('-');
            return parts[parts.length - 1] || null;
          };
          
          const sourceType = getSignalType(edge.sourceHandle);
          const targetType = getSignalType(edge.targetHandle);
          const property = edge.data.targetProperty;

          if (!sourceNode || !targetNode) {
            return;
          }

          console.log('Connecting nodes (target):', {
            source: edge.source,
            target: nodeId,
            sourceType,
            targetType,
            property,
          });

          // 信号タイプに基づいて接続処理を分岐
          if (targetType === 'gate') {
            // Gate信号: トリガー接続
            // @ts-ignore
            if (typeof sourceNode.connectTrigger === 'function') {
              // @ts-ignore
              sourceNode.connectTrigger(targetNode);
              console.log('Connected trigger (Gate)', { source: edge.source, target: nodeId });
            } else {
              console.warn('Source node does not support connectTrigger');
            }
          } else if (targetType === 'note' || targetType === 'cv') {
            // Note/CV信号: パラメータへの接続
            if (!property) {
              console.warn('No target property specified for CV/Note connection');
              return;
            }
            
            // ソース側のpropertyが'output'の場合、ターゲット側の処理はスキップ（ソース側で処理される）
            const sourceProperty = edge.data?.sourceProperty;
            if (sourceProperty === 'output') {
              console.log('[DEBUG] Skipping target-side connection for source property "output" (handled on source side)');
              return;
            }
            
            const targetParams = this.nodeParams.get(nodeId);
            const paramDef = targetParams?.[property];
            
            // propertyが'input'の場合、ターゲットノードのinputプロパティに接続
            if (property === 'input') {
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
              const targetParam = targetNode[property];

              console.log('[DEBUG] Target-side connection:', {
                property,
                hasTargetParam: !!targetParam,
                targetParamType: typeof targetParam,
                hasConnect: targetParam && typeof targetParam.connect === 'function',
                paramDef,
              });

              if (targetParam && typeof targetParam.connect === 'function') {
                if (targetType === 'note') {
                  // Note信号: 直接接続（周波数値として）
                  sourceNode.connect(targetParam);
                  console.log(`Connected Note signal directly to ${property}`);
                } else if (paramDef) {
                  // CV信号でパラメータ定義がある場合: Scaleを使用
                  const { min, max } = paramDef;
                  const scale = new Tone.Scale(min, max);
                  
                  sourceNode.connect(scale);
                  scale.connect(targetParam);
                  
                  console.log(`[DEBUG] Connected CV with scale [${min}, ${max}] to ${property}`);
                } else {
                  // CV信号でパラメータ定義がない場合: 直接接続
                  sourceNode.connect(targetParam);
                  console.log(`[DEBUG] Connected CV directly to ${property} (no params defined)`);
                }
              } else {
                console.warn(`[DEBUG] Target property ${property} is not a valid AudioParam`);
              }
            }
          } else if (targetType === 'audio') {
            // Audio信号: 通常のオーディオ接続
            sourceNode.connect(targetNode);
            console.log('Connected audio nodes directly');
          } else {
            console.warn('Unknown signal type:', { sourceType, targetType });
          }
        }
        // このノードがソースの場合
        else if (edge.source === nodeId) {
          // 接続元（このノード）
          const sourceNode = audioNode;
          // 接続先
          const targetNode = this.audioNodes.get(edge.target);
          
          // ハンドルIDから信号タイプを抽出
          const getSignalType = (handleId: string | null | undefined): string | null => {
            if (!handleId) return null;
            const parts = handleId.split('-');
            return parts[parts.length - 1] || null;
          };
          
          const sourceType = getSignalType(edge.sourceHandle);
          const targetType = getSignalType(edge.targetHandle);
          const property = edge.data.targetProperty;

          if (!sourceNode || !targetNode) {
            return;
          }

          console.log('Connecting nodes (source):', {
            source: nodeId,
            target: edge.target,
            sourceType,
            targetType,
            property,
          });

          // 信号タイプに基づいて接続処理を分岐
          if (targetType === 'gate') {
            // Gate信号: トリガー接続
            // @ts-ignore
            if (typeof sourceNode.connectTrigger === 'function') {
              // @ts-ignore
              sourceNode.connectTrigger(targetNode);
              console.log('Connected trigger (Gate) - source re-registered', { source: nodeId, target: edge.target });
            } else {
              console.warn('Source node does not support connectTrigger');
            }
          } else if (targetType === 'note' || targetType === 'cv') {
            // Note/CV信号: パラメータへの接続
            if (!property) {
              console.warn('No target property specified for CV/Note connection');
            } else {
              // propertyが'output'の場合、ソースノードの出力をターゲットに接続
              if (property === 'output') {
                if (targetType === 'cv') {
                  // CV信号: ソースノードの出力をターゲットノードのプロパティに接続
                  // ターゲットプロパティを取得（edge.data.targetPropertyから）
                  const targetProperty = edge.data?.targetProperty;
                  
                  console.log('[DEBUG] CV (output) connection (source side):', {
                    source: nodeId,
                    target: edge.target,
                    targetProperty,
                    edgeData: edge.data,
                  });
                  
                  if (!targetProperty) {
                    console.warn('[DEBUG] No target property specified for CV (output) connection');
                    return;
                  }
                  
                  // @ts-ignore: Dynamic property access
                  const targetProp = targetNode[targetProperty];
                  
                  console.log('[DEBUG] Target property access (source side):', {
                    targetProperty,
                    hasTargetProp: !!targetProp,
                    targetPropType: typeof targetProp,
                    hasConnect: targetProp && typeof targetProp.connect === 'function',
                  });
                  
                  // ターゲットのパラメータ定義を取得
                  const targetParams = this.nodeParams.get(edge.target);
                  const paramDef = targetParams?.[targetProperty];
                  
                  console.log('[DEBUG] Parameter definition (source side):', {
                    targetProperty,
                    paramDef,
                    hasParamDef: !!paramDef,
                    targetPropType: typeof targetProp,
                    targetPropConstructor: targetProp?.constructor?.name,
                  });
                  
                  if (targetProp) {
                    if (paramDef) {
                      // CV信号でパラメータ定義がある場合: Scaleを使用
                      const { min, max } = paramDef;
                      const scale = new Tone.Scale(min, max);
                      
                      // LFOの出力をScaleに接続
                      sourceNode.connect(scale);
                      
                      // Scaleの出力をターゲットプロパティに接続
                      // targetPropがTone.Signalの場合、connectメソッドを使用
                      if (typeof targetProp.connect === 'function') {
                        scale.connect(targetProp);
                        console.log(`[DEBUG] Connected CV (output) with scale [${min}, ${max}] to ${targetProperty} (via connect)`);
                      } else if (targetProp instanceof Tone.Signal) {
                        // Tone.Signalとして扱う
                        scale.connect(targetProp);
                        console.log(`[DEBUG] Connected CV (output) with scale [${min}, ${max}] to ${targetProperty} (as Tone.Signal)`);
                      } else {
                        // その他の場合、直接接続を試みる
                        try {
                          scale.connect(targetProp);
                          console.log(`[DEBUG] Connected CV (output) with scale [${min}, ${max}] to ${targetProperty} (direct)`);
                        } catch (error) {
                          console.error(`[DEBUG] Failed to connect scale to ${targetProperty}:`, error);
                          // フォールバック: 直接接続
                          sourceNode.connect(targetProp);
                          console.log(`[DEBUG] Fallback: Connected CV (output) directly to ${targetProperty}`);
                        }
                      }
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
                    console.log(`[DEBUG] Connected CV (output) directly to target node (target property ${targetProperty} not found)`);
                  }
                } else {
                  console.warn('Note signal cannot connect to output property');
                }
              } else {
                const targetParams = this.nodeParams.get(edge.target);
                const paramDef = targetParams?.[property];
                
                // @ts-ignore: Dynamic property access
                const targetParam = targetNode[property];

                if (targetParam && typeof targetParam.connect === 'function') {
                  if (targetType === 'note') {
                    // Note信号: 直接接続（周波数値として）
                    sourceNode.connect(targetParam);
                    console.log(`Connected Note signal directly to ${property}`);
                  } else if (paramDef) {
                    // CV信号でパラメータ定義がある場合: Scaleを使用
                    const { min, max } = paramDef;
                    const scale = new Tone.Scale(min, max);
                    
                    sourceNode.connect(scale);
                    scale.connect(targetParam);
                    
                    console.log(`Connected CV with scale [${min}, ${max}] to ${property}`);
                  } else {
                    // CV信号でパラメータ定義がない場合: 直接接続
                    sourceNode.connect(targetParam);
                    console.log(`Connected CV directly to ${property} (no params defined)`);
                  }
                } else {
                  console.warn(`Target property ${property} is not a valid AudioParam`);
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
