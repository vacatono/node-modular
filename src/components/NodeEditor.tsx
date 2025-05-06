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
//import ButtonTestVCOModulation from '@/modules/ButtonTestVCOModulation';

// Tone.jsのオブジェクトを保持するためのマップ
const audioNodes = new Map();

const debug = false;

// ノードの種類を定義
const nodeTypes: NodeTypes = {
  vco: NodeVCO,
  filter: NodeFilter,
  delay: NodeDelay,
  reverb: NodeReverb,
  toDestination: NodeOutput,
  lfo: NodeLFO,
  oscilloscope: NodeOscilloscope,
};

// controlに送信される信号(0-1)のスケール情報
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

// 初期ノードを定義
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
      //console.log('registerAudioNode', nodeId, audioNode);
      //console.log('edges', edges);

      audioNodes.set(nodeId, audioNode);

      // このノードに接続している既存のエッジを探して再接続
      edges.forEach((edge) => {
        try {
          if (edge.target === nodeId) {
            const sourceNode = audioNodes.get(edge.source);

            console.log('nodeId', nodeId);
            // targetからsource
            if (sourceNode) {
              if (edge.targetHandle?.includes('-control')) {
                const nodeType = audioNode.name;
                const property = edge.targetHandle?.split('-').pop();

                if (property && property in audioNode) {
                  // NodeTypeとpropertyからcontrolScalesからスケール情報を取得
                  const scaleInfo = controlScales[nodeType]?.[property];
                  if (scaleInfo) {
                    console.log('scaleInfo', scaleInfo);
                    const targetParam = audioNode[property as keyof typeof audioNode];
                    const scaleNode = new Tone.Scale(scaleInfo.min, scaleInfo.max);
                    sourceNode.connect(scaleNode);
                    if (targetParam !== undefined && typeof (targetParam as any).connect === 'function') {
                      scaleNode.connect(targetParam as Tone.InputNode);
                    } else {
                      sourceNode.connect(audioNode);
                    }
                  } else {
                    sourceNode.connect(audioNode[property as keyof typeof audioNode]);
                  }
                }
              } else {
                sourceNode.connect(audioNode);
              }
            }
          }

          // sourceからtarget
          if (edge.source === nodeId) {
            const targetNode = audioNodes.get(edge.target);
            if (targetNode) {
              // controlパターン
              if (edge.sourceHandle?.includes('-control')) {
                const nodeType = targetNode.name;
                const property = edge.sourceHandle?.split('-').pop();
                if (property && property in targetNode) {
                  // NodeTypeとpropertyからcontrolScalesからスケール情報を取得
                  const scaleInfo = controlScales[nodeType]?.[property];
                  if (scaleInfo) {
                    // スケールノードを作成
                    const scaleNode = new Tone.Scale(scaleInfo.min, scaleInfo.max);
                    audioNode.connect(scaleNode);
                    scaleNode.connect(targetNode[property as keyof typeof targetNode]);
                  } else {
                    audioNode.connect(targetNode[property as keyof typeof targetNode]);
                  }
                }
              } else {
                audioNode.connect(targetNode);
              }
            }
          }
        } catch (error) {
          console.error('Error connecting audio nodes:', error);
        }
      });

      // 出力ノードの場合は、直接Destinationに接続
      if (nodeId === 'toDestination') {
        audioNode.toDestination();
      }
    },
    [edges]
  );

  /*
  const getAudioNode = useCallback((nodeId: string) => {
    return audioNodes.get(nodeId);
  }, []);
  */
  // エッジが追加されたときの処理
  const onConnect = useCallback(
    (params: Connection) => {
      // onConnectのログ
      console.log('onConnect', params);

      //const sourceNode = audioNodes.get(params.source);
      //const targetNode = audioNodes.get(params.target);
      const isControlConnection = params.targetHandle?.includes('-control');

      /*
      if (sourceNode && targetNode) {
        // 既存の接続を解除
        sourceNode.disconnect();

        // 新しい接続を作成
        if (isControlConnection) {
          // control用Handleへの接続の場合、ノードのcontrolTargetsに基づいて接続
          // 例：NodeFilterの場合は、LFOからの信号がmodulationSignalに接続される
          const property = params.targetHandle?.split('-').pop();
          if (property && targetNode[property]) {
            sourceNode.connect(targetNode[property]);
          }
        } else {
          // 通常の接続
          sourceNode.connect(targetNode);
        }
      }
      */

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
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach((edge) => {
      const sourceNode = audioNodes.get(edge.source);
      if (sourceNode) {
        sourceNode.disconnect();
      }
    });
  }, []);

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

  // ノードを追加する関数
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
    background: selectedNodeId === node.id ? '#f3f9ff' : 'white',
    borderRadius: 8,
    boxShadow: selectedNodeId === node.id ? '0 0 0 3px #b0daf9' : 'none',
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
          {debug && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                console.log('AudioNodes:', audioNodes);
                console.log('Edges:', edges);
              }}
            >
              Debug Nodes/Edges
            </Button>
          )}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            style: getNodeStyle(node),
            data: { ...node.data, registerAudioNode },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          fitView
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
