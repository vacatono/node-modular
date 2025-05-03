'use client';

import { useCallback, useState } from 'react';
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

// Tone.jsのオブジェクトを保持するためのマップ
const audioNodes = new Map();

const nodeTypes: NodeTypes = {
  vco: NodeVCO,
  filter: NodeFilter,
  delay: NodeDelay,
  reverb: NodeReverb,
  toDestination: NodeOutput,
  lfo: NodeLFO,
  oscilloscope: NodeOscilloscope,
};

const initialNodes: Node[] = [
  {
    id: 'lfo1',
    type: 'lfo',
    position: { x: 50, y: 50 },
    data: { label: 'LFO', frequency: 1, type: 'sine', amplitude: 1, registerAudioNode: null },
  },
  {
    id: 'vco1',
    type: 'vco',
    position: { x: 400, y: 100 },
    data: { label: 'VCO', frequency: 440, type: 'sine', registerAudioNode: null },
  },
  {
    id: 'oscilloscope1',
    type: 'oscilloscope',
    position: { x: 50, y: 400 },
    data: { label: 'Oscilloscope', registerAudioNode: null },
  },
  {
    id: 'toDestination',
    type: 'toDestination',
    position: { x: 500, y: 400 },
    data: { label: 'Output', volume: -6, registerAudioNode: null },
    deletable: false,
  },
];

const initialEdges: Edge[] = [
  { id: 'e2-3', source: 'vco1', target: 'oscilloscope1' },
  { id: 'e3-4', source: 'oscilloscope1', target: 'toDestination' },
];

const NodeEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [panOnDrag, setPanOnDrag] = useState(true);

  // Tone.jsのオブジェクトを登録する関数
  const registerAudioNode = useCallback(
    (nodeId: string, audioNode: Tone.ToneAudioNode) => {
      // 既存の接続を解除
      const existingNode = audioNodes.get(nodeId);
      if (existingNode) {
        existingNode.disconnect();
      }

      audioNodes.set(nodeId, audioNode);

      // このノードに接続している既存のエッジを探して再接続
      edges.forEach((edge) => {
        if (edge.target === nodeId) {
          const sourceNode = audioNodes.get(edge.source);
          if (sourceNode) {
            sourceNode.connect(audioNode);
          }
        }
        if (edge.source === nodeId) {
          const targetNode = audioNodes.get(edge.target);
          if (targetNode) {
            audioNode.connect(targetNode);
          }
        }
      });

      // 出力ノードの場合は、直接Destinationに接続
      if (nodeId === 'toDestination') {
        audioNode.toDestination();
      }
    },
    [edges]
  );

  const getAudioNode = useCallback((nodeId: string) => {
    return audioNodes.get(nodeId);
  }, []);

  // エッジが追加されたときの処理
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = audioNodes.get(params.source);
      const targetNode = audioNodes.get(params.target);
      const isControlConnection = params.targetHandle?.includes('-control');

      if (sourceNode && targetNode) {
        // 既存の接続を解除
        sourceNode.disconnect();

        // 新しい接続を作成
        if (isControlConnection) {
          // control用Handleへの接続の場合、ノードのcontrolTargetsに基づいて接続
          const property = params.targetHandle?.split('-').pop();
          if (property && targetNode[property]) {
            sourceNode.connect(targetNode[property]);
          }
        } else {
          // 通常の接続
          sourceNode.connect(targetNode);
        }
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            data: {
              type: isControlConnection ? 'control' : 'audio',
              targetProperty: isControlConnection ? params.targetHandle?.split('-').pop() : undefined,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // エッジが削除されたときの処理
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        const sourceNode = audioNodes.get(edge.source);
        if (sourceNode) {
          sourceNode.disconnect();

          // 残っているエッジを再接続
          edges.forEach((remainingEdge) => {
            if (remainingEdge.source === edge.source && remainingEdge !== edge) {
              const targetNode = audioNodes.get(remainingEdge.target);
              if (targetNode) {
                sourceNode.connect(targetNode);
              }
            }
          });
        }
      });
    },
    [edges]
  );

  // ノードが削除されたときの処理
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    nodesToDelete.forEach((node) => {
      const audioNode = audioNodes.get(node.id);
      if (audioNode) {
        audioNode.disconnect();
        audioNode.dispose();
        audioNodes.delete(node.id);
      }
    });
  }, []);

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: 100, y: 100 },
        data: { label: type.toUpperCase(), registerAudioNode },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, registerAudioNode]
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
    background: selectedNodeId === node.id ? '#e3f2fd' : 'white',
    borderRadius: 8,
    boxShadow: selectedNodeId === node.id ? '0 0 0 2px #90caf9' : 'none',
  });

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
        </Stack>
      </Box>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            style: getNodeStyle(node),
            data: { ...node.data, registerAudioNode, getAudioNode },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 0.8 }}
          style={{ width: '100%', height: '100%' }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          minZoom={0.1}
          maxZoom={2}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          panOnDrag={panOnDrag}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default NodeEditor;
