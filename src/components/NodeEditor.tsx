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
import NodeFrequencyEnvelope from '@/modules/NodeFrequencyEnvelope';

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
  frequencyEnvelope: NodeFrequencyEnvelope,
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
    (nodeId: string, audioNode: Tone.ToneAudioNode) => {
      console.log('registerAudioNode', nodeId);
      audioNodeManager.registerAudioNode(nodeId, audioNode, edges);
    },
    [edges]
  );

  useEffect(() => {
    console.log('edges', edges);
  }, [edges]);

  // エッジが追加されたときの処理
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('onConnect', params);

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            data: {
              targetType: params.targetHandle?.includes('-control') ? 'control' : 'audio',
              targetProperty: params.targetHandle?.split('-').pop() ?? undefined,
              sourceType: params.sourceHandle?.includes('-control') ? 'control' : 'audio',
              sourceProperty: params.sourceHandle?.split('-').pop() ?? undefined,
            },
          },
          eds
        )
      );
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
          label: type.toUpperCase(),
          registerAudioNode: (nodeId: string, audioNode: Tone.ToneAudioNode) => {
            audioNodeManager.registerAudioNode(nodeId, audioNode, edges);
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
            Add Amplitude Envelope
          </Button>
          <Button variant="contained" onClick={() => addNode('frequencyEnvelope')}>
            Add Frequency Envelope
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
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default NodeEditor;
