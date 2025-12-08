'use client';

import { useCallback, useEffect, useState } from 'react';
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
};

// 初期ノードを定義
const initialNodes: Node[] = presetTemplates[0].nodes;

// 初期エッジを定義
const initialEdges: Edge[] = presetTemplates[0].edges;

const NodeEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [panOnDrag, setPanOnDrag] = useState(true);

  // オーディオノード登録用のメモ化された関数
  const registerAudioNode = useCallback(
    (nodeId: string, audioNode: Tone.ToneAudioNode, params?: Record<string, { min: number; max: number }>) => {
      console.log('registerAudioNode', nodeId, params);
      audioNodeManager.registerAudioNode(nodeId, audioNode, edges, params);
    },
    [edges]
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

      const newEdge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        data: {
          targetType: params.targetHandle?.includes('-control') ? 'control' : 'audio',
          targetProperty: params.targetHandle?.split('-').pop() ?? undefined,
          sourceType: params.sourceHandle?.includes('-control') ? 'control' : 'audio',
          sourceProperty: params.sourceHandle?.split('-').pop() ?? undefined,
        },
      };

      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);

        // 新しい接続を処理するためにAudioNodeManagerを呼び出す
        const sourceNode = audioNodeManager.getAudioNode(params.source!);
        const targetNode = audioNodeManager.getAudioNode(params.target!);

        if (sourceNode && targetNode) {
          // ハンドルIDから信号タイプを抽出
          const getSignalType = (handleId: string | null | undefined): string | null => {
            if (!handleId) return null;
            const parts = handleId.split('-');
            return parts[parts.length - 1] || null;
          };

          const sourceType = getSignalType(params.sourceHandle);
          const targetType = getSignalType(params.targetHandle);
          const property = newEdge.data.targetProperty;

          console.log('Processing new connection:', {
            source: params.source,
            target: params.target,
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
              console.log('Connected trigger (Gate)', { source: params.source, target: params.target });
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
        }

        return updatedEdges;
      });
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
        position: { x: 100, y: 100 },
        data: {
          label: type === 'amplitudeEnvelope' ? 'ENVELOPE' : type.toUpperCase(),
          registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode, params?: Record<string, { min: number; max: number }>) => {
            audioNodeManager.registerAudioNode(nodeId, audioNode, edges, params);
          },
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, edges]
  );

  // ノードクリック時のハンドラ
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setPanOnDrag(false);
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, draggable: false } : { ...n, draggable: true })));
    },
    [setNodes]
  );

  // ノード外クリック時のハンドラ
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setPanOnDrag(true);
    setNodes((nds) => nds.map((n) => ({ ...n, draggable: true })));
  }, [setNodes]);

  // ノードの色を選択状態で変える
  const getNodeStyle = (node: Node) => ({
    border: selectedNodeId === node.id ? '2px solid #1976d2' : '1px solid #ccc',
    background: selectedNodeId === node.id ? '#f3f9ff' : 'white',
    borderRadius: 8,
    boxShadow: selectedNodeId === node.id ? '0 0 0 3px #b0daf9' : 'none',
  });

  /**
   * テンプレート適用時のハンドラ
   */
  const handleApplyTemplate = useCallback(
    (template: FlowTemplate) => {
      setNodes(template.nodes);
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
            style: getNodeStyle(node),
            data: {
              ...node.data,
              edges,
              draggable: selectedNodeId !== node.id,
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
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          panOnDrag={panOnDrag}
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
