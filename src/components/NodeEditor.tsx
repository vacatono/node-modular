'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow';
import * as Tone from 'tone';
import 'reactflow/dist/style.css';
import { Box, Button, Stack } from '@mui/material';
import NodeVCO from '../modules/NodeVCO';
import NodeFilter from '../modules/NodeFilter';
import NodeDelay from '../modules/NodeDelay';
import NodeReverb from '../modules/NodeReverb';
import NodeOutput from '../modules/NodeOutput';
import NodeLFO from '../modules/NodeLFO';
import NodeOscilloscope from '../modules/NodeOscilloscope';
import TemplateSelector, { FlowTemplate, presetTemplates } from '../modules/TemplateSelector';
import { audioNodeManager } from '../utils/AudioNodeManager';
import ButtonTestVCOModulation from '@/modules/ButtonTestVCOModulation';
import NodeAmplitudeEnvelope from '@/modules/NodeAmplitudeEnvelope';
import NodeSequencer from '@/modules/NodeSequencer';
import NodeNoteToCV from '@/modules/NodeNoteToCV';
import NodeKeyboard from '@/modules/NodeKeyboard';

const debug = true;

// ノードの種類を定義
const nodeTypes: NodeTypes = {
  vco: NodeVCO,
  filter: NodeFilter,
  delay: NodeDelay,
  reverb: NodeReverb,
  toDestination: NodeOutput,
  lfo: NodeLFO,
  oscilloscope: NodeOscilloscope,
  amplitudeEnvelope: NodeAmplitudeEnvelope,
  sequencer: NodeSequencer,
  noteToCV: NodeNoteToCV,
  keyboard: NodeKeyboard,
};

// 初期ノードを定義
const initialNodes: Node[] = presetTemplates[0].nodes.map((node) => ({ ...node, dragHandle: '.custom-drag-handle' }));

// 初期エッジを定義
const initialEdges: Edge[] = presetTemplates[0].edges;

const NodeEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const isApplyingTemplate = useRef(false);
  const templateEdgesToProcess = useRef<Edge[]>([]);

  /**
   * 接続を処理する共通関数
   */
  const processConnection = useCallback((edge: Edge) => {
    const sourceNode = audioNodeManager.getAudioNode(edge.source);
    const targetNode = audioNodeManager.getAudioNode(edge.target);

    if (!sourceNode || !targetNode) {
      console.warn('Source or target node not found for edge:', edge);
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
    const property = edge.data?.targetProperty;

    console.log('Processing connection:', {
      source: edge.source,
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
        console.log('Connected trigger (Gate)', { source: edge.source, target: edge.target });
      } else {
        console.warn('Source node does not support connectTrigger');
      }
    } else if (targetType === 'note' || targetType === 'cv') {
      // Note/CV信号: パラメータへの接続
      if (!property) {
        console.warn('No target property specified for CV/Note connection');
      } else {
        // @ts-ignore: Dynamic property access
        const targetParam = targetNode[property];

        if (targetParam && typeof targetParam.connect === 'function') {
          if (targetType === 'note') {
            // Note信号: 直接接続（周波数値として）
            sourceNode.connect(targetParam);
            console.log(`Connected Note signal directly to ${property}`);
          } else {
            // CV信号: 直接接続
            sourceNode.connect(targetParam);
            console.log(`Connected CV directly to ${property}`);
          }
        } else {
          console.warn(`Target property ${property} is not a valid AudioParam`);
        }
      }
    } else if (targetType === 'audio') {
      // Audio信号: 通常のオーディオ接続
      sourceNode.connect(targetNode);
      console.log('Connected audio nodes directly');
    } else {
      console.warn('Unknown signal type:', { sourceType, targetType });
    }
  }, []);

  // オーディオノード登録用のメモ化された関数
  const registerAudioNode = useCallback(
    (nodeId: string, audioNode: Tone.ToneAudioNode, params?: Record<string, { min: number; max: number }>) => {
      console.log('registerAudioNode', nodeId, params);
      audioNodeManager.registerAudioNode(nodeId, audioNode, edges, params);

      // テンプレート適用中で、まだ処理すべきedgesがある場合
      if (isApplyingTemplate.current && templateEdgesToProcess.current.length > 0) {
        // 少し待ってから接続を処理（全ノードの登録を待つ）
        setTimeout(() => {
          const edgesToProcess = templateEdgesToProcess.current;
          if (edgesToProcess.length > 0) {
            console.log('Processing template edges after node registration:', edgesToProcess.length);
            edgesToProcess.forEach((edge: Edge) => {
              processConnection(edge);
            });
            templateEdgesToProcess.current = [];
            isApplyingTemplate.current = false;
          }
        }, 200);
      }
    },
    [edges, processConnection]
  );

  useEffect(() => {
    console.log('edges', edges);
  }, [edges]);

  // 接続検証: 同じ信号タイプのみ接続可能
  const isValidConnection = useCallback((connection: Connection) => {
    const { sourceHandle, targetHandle } = connection;

    // ハンドルIDから信号タイプを抽出
    const getSignalType = (handleId: string | null | undefined): string | null => {
      if (!handleId) return null;
      const parts = handleId.split('-');
      return parts[parts.length - 1] || null;
    };

    const sourceType = getSignalType(sourceHandle);
    const targetType = getSignalType(targetHandle);

    // 両方のタイプが存在し、一致する場合のみ接続可能
    if (sourceType && targetType && sourceType === targetType) {
      return true;
    }

    console.warn('Invalid connection attempt:', { sourceType, targetType });
    return false;
  }, []);

  // エッジが追加されたときの処理
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('onConnect', params);

      // ハンドルIDからtargetPropertyを抽出する関数
      const extractProperty = (handleId: string | null | undefined): string | undefined => {
        if (!handleId) return undefined;
        const parts = handleId.split('-');
        console.log('[DEBUG] extractProperty - handleId:', handleId, 'parts:', parts);
        // control1, control2, control3の次の部分がproperty
        const controlIndex = parts.findIndex(part => part.startsWith('control'));
        console.log('[DEBUG] extractProperty - controlIndex:', controlIndex);
        if (controlIndex >= 0 && controlIndex + 1 < parts.length) {
          const property = parts[controlIndex + 1];
          console.log('[DEBUG] extractProperty - extracted property:', property);
          return property;
        }
        // controlがない場合は最後の部分（後方互換性のため）
        const fallback = parts[parts.length - 1];
        console.log('[DEBUG] extractProperty - fallback:', fallback);
        return fallback;
      };

      // ハンドルIDから信号タイプを抽出する関数
      const getSignalType = (handleId: string | null | undefined): string | null => {
        if (!handleId) return null;
        const parts = handleId.split('-');
        // 最後の部分が信号タイプ（gate, note, cv, audio）
        return parts[parts.length - 1] || null;
      };

      const targetType = getSignalType(params.targetHandle);
      const sourceType = getSignalType(params.sourceHandle);

      const newEdge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        data: {
          targetType: targetType || 'audio',
          targetProperty: extractProperty(params.targetHandle),
          sourceType: sourceType || 'audio',
          sourceProperty: extractProperty(params.sourceHandle),
        },
      };

      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);

        // 新しい接続を処理するためにAudioNodeManagerを呼び出す
        // AudioNodeManagerのconnectメソッドを使用することで、スケール処理などのロジックを統一
        // 少し遅延させて実行することで、React Flowの状態更新との競合を防ぐ可能性（必要に応じて調整）
        setTimeout(() => {
          console.log('[DEBUG] onConnect calling audioNodeManager.connect', newEdge);
          audioNodeManager.connect(newEdge);
        }, 10);

        return updatedEdges;
      });

      // エッジが更新された後、関連するノードを再登録して接続を確立
      // 特にSequencerNodeなど、再レンダリング時に接続が失われる可能性があるノード
      // setEdgesのコールバック内で処理するため、最新のedgesが利用可能
      const currentTargetType = targetType;
      const currentSource = params.source!;
      const currentTarget = params.target!;

      // エッジが更新された後、最新のedgesでソースノードを再登録
      setTimeout(() => {
        const sourceNode = audioNodeManager.getAudioNode(currentSource);
        const targetNode = audioNodeManager.getAudioNode(currentTarget);

        if (sourceNode && targetNode && currentTargetType === 'gate') {
          // Gate接続の場合、ソースノードを再登録して接続を確立
          console.log('[DEBUG] Re-registering source node to establish connection:', currentSource);
          // 直接接続を確立（registerAudioNodeは次のレンダリング時に呼ばれる）
          // @ts-ignore
          if (typeof sourceNode.connectTrigger === 'function') {
            // @ts-ignore
            sourceNode.connectTrigger(targetNode);
            console.log('[DEBUG] connectTrigger called after edge update');
          }
        }
      }, 100);
    },
    [setEdges]
  );

  // エッジが削除されたときの処理
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach((edge) => {
      const sourceNode = audioNodeManager.getAudioNode(edge.source);
      if (sourceNode) {
        sourceNode.disconnect();
      }
    });
  }, []);

  // ノードが削除されたときの処理
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    nodesToDelete.forEach((node) => {
      audioNodeManager.deleteAudioNode(node.id);
    });
  }, []);

  // ノードを追加する関数
  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,

        dragHandle: '.custom-drag-handle',
        position: { x: 100, y: 100 },
        data: {
          label: type === 'amplitudeEnvelope' ? 'ENVELOPE' : type.toUpperCase(),
          registerAudioNode: (
            nodeId: string,
            audioNode: Tone.ToneAudioNode,
            params?: Record<string, { min: number; max: number }>
          ) => {
            audioNodeManager.registerAudioNode(nodeId, audioNode, edges, params);
          },
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, edges]
  );


  /**
   * テンプレート適用時のハンドラ
   */
  const handleApplyTemplate = useCallback(
    (template: FlowTemplate) => {
      // テンプレート適用時にフラグを設定
      isApplyingTemplate.current = true;
      templateEdgesToProcess.current = template.edges;

      setNodes(template.nodes.map((n) => ({ ...n, dragHandle: '.custom-drag-handle' })));
      setEdges(template.edges);
    },
    [setNodes, setEdges]
  );

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #ccc', backgroundColor: 'white' }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button variant="contained" onClick={() => addNode('vco')}>
            Add VCO
          </Button>
          <Button variant="contained" onClick={() => addNode('filter')}>
            Add Filter
          </Button>
          <Button variant="contained" onClick={() => addNode('delay')}>
            Add Delay
          </Button>
          <Button variant="contained" onClick={() => addNode('reverb')}>
            Add Reverb
          </Button>
          <Button variant="contained" onClick={() => addNode('lfo')}>
            Add LFO
          </Button>
          <Button variant="contained" onClick={() => addNode('oscilloscope')}>
            Add Oscilloscope
          </Button>
          <Button variant="contained" onClick={() => addNode('amplitudeEnvelope')}>
            Add Envelope
          </Button>
          <Button variant="contained" onClick={() => addNode('sequencer')}>
            Add Sequencer
          </Button>
          <Button variant="contained" onClick={() => addNode('noteToCV')}>
            Add Note→CV
          </Button>
          <Button variant="contained" onClick={() => addNode('keyboard')}>
            Add Keyboard
          </Button>
        </Stack>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
          <TemplateSelector onApplyTemplate={handleApplyTemplate} />
        </Box>
        {debug && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                console.log('Nodes:', nodes);
                console.log('Edges:', edges);
              }}
            >
              Debug Nodes/Edges
            </Button>
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            style: { border: '1px solid #ccc', background: 'white', borderRadius: 8 },
            data: {
              ...node.data,
              edges,
              registerAudioNode,
              debug,
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          style={{ width: '100%', height: '100%' }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          isValidConnection={isValidConnection}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default NodeEditor;
