'use client';

import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { Box, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

/**
 * ノードとエッジのテンプレート型
 */
export type FlowTemplate = {
  name: string;
  nodes: Node[];
  edges: Edge[];
};

/**
 * プリセットテンプレート
 */
export const presetTemplates: FlowTemplate[] = [
  {
    name: 'VCO->Envelope->Out',
    nodes: [
      {
        id: 'vco1',
        type: 'vco',
        position: { x: 100, y: 100 },
        data: { label: 'VCO', frequency: 440, type: 'sine', registerAudioNode: null },
      },
      {
        id: 'envelope1',
        type: 'amplitudeEnvelope',
        position: { x: 300, y: 100 },
        data: {
          label: 'ENVELOPE',
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: 0.3,
          registerAudioNode: null,
        },
      },
      {
        id: 'toDestination',
        type: 'toDestination',
        position: { x: 500, y: 100 },
        data: { label: 'Output', volume: -6, registerAudioNode: null },
        deletable: false,
      },
    ],
    edges: [
      { id: 'e1-2', source: 'vco1', target: 'envelope1', sourceHandle: 'vco1-output-audio', targetHandle: 'envelope1-input-audio', data: { targetType: 'audio', sourceType: 'audio' } },
      { id: 'e2-3', source: 'envelope1', target: 'toDestination', sourceHandle: 'envelope1-output-audio', targetHandle: 'toDestination-input-audio', data: { targetType: 'audio', sourceType: 'audio' } },
    ],
  },
  {
    name: 'LFO->VCO->OUT',
    nodes: [
      {
        id: 'vco1',
        type: 'vco',
        position: { x: 300, y: 200 },
        data: { label: 'VCO', frequency: 440, type: 'sine', registerAudioNode: null },
      },
      {
        id: 'lfo1',
        type: 'lfo',
        position: { x: 10, y: 100 },
        data: { label: 'LFO', frequency: 1, type: 'sine', registerAudioNode: null },
      },
      {
        id: 'toDestination',
        type: 'toDestination',
        position: { x: 500, y: 10 },
        data: { label: 'Output', volume: -6, registerAudioNode: null },
        deletable: false,
      },
    ],
    edges: [
      { id: 'e1-2', source: 'vco1', target: 'toDestination', data: { targetType: 'audio', sourceType: 'audio' } },
    ],
  },
  {
    name: 'VCO→フィルター→出力',
    nodes: [
      {
        id: 'vco1',
        type: 'vco',
        position: { x: 100, y: 100 },
        data: { label: 'VCO', frequency: 440, type: 'sine', registerAudioNode: null },
      },
      {
        id: 'filter1',
        type: 'filter',
        position: { x: 300, y: 100 },
        data: { label: 'Filter', frequency: 1000, Q: 1, registerAudioNode: null },
      },
      {
        id: 'toDestination',
        type: 'toDestination',
        position: { x: 500, y: 100 },
        data: { label: 'Output', volume: -6, registerAudioNode: null },
        deletable: false,
      },
    ],
    edges: [
      { id: 'e1-2', source: 'vco1', target: 'filter1', data: { targetType: 'audio', sourceType: 'audio' } },
      { id: 'e2-3', source: 'filter1', target: 'toDestination', data: { targetType: 'audio', sourceType: 'audio' } },
    ],
  },
  {
    name: 'Sequencer Test',
    nodes: [
      { id: 'seq-1', type: 'sequencer', position: { x: 50, y: 50 }, data: { label: 'Sequencer', registerAudioNode: null } },
      { id: 'vco-1', type: 'vco', position: { x: 350, y: 50 }, data: { label: 'VCO', registerAudioNode: null } },
      { id: 'env-1', type: 'amplitudeEnvelope', position: { x: 350, y: 300 }, data: { label: 'ENVELOPE', registerAudioNode: null } },
      { id: 'out-1', type: 'toDestination', position: { x: 650, y: 300 }, data: { label: 'Output', registerAudioNode: null } },
    ],
    edges: [
      // Sequencer Output(Gate) -> Envelope Trigger
      {
        id: 'e-seq-gate-env-trig',
        source: 'seq-1',
        target: 'env-1',
        sourceHandle: 'seq-1-gate-gate',
        targetHandle: 'env-1-control1-trigger-gate',
        data: { targetType: 'gate', targetProperty: 'trigger' }
      },
      // Sequencer Input(Note) -> VCO Frequency
      {
        id: 'e-seq-note-vco-freq',
        source: 'seq-1',
        target: 'vco-1',
        sourceHandle: 'seq-1-note-note',
        targetHandle: 'vco-1-control2-note-note',
        data: { targetType: 'note', targetProperty: 'note' }
      },
      // VCO -> Envelope
      {
        id: 'e-vco-env',
        source: 'vco-1',
        target: 'env-1',
        sourceHandle: 'vco-1-output-audio',
        targetHandle: 'env-1-input-audio',
        data: { targetType: 'audio' }
      },
      // Envelope -> Output
      {
        id: 'e-env-out',
        source: 'env-1',
        target: 'out-1',
        sourceHandle: 'env-1-output-audio',
        targetHandle: 'out-1-input-audio',
        data: { targetType: 'audio' }
      },
    ],
  },
];

interface TemplateSelectorProps {
  onApplyTemplate: (_template: FlowTemplate) => void;
}

/**
 * テンプレート選択・適用コンポーネント
 */
const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onApplyTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  /**
   * テンプレート適用時のハンドラ
   */
  const handleApplyTemplate = useCallback(() => {
    const template = presetTemplates.find((t) => t.name === selectedTemplate);
    if (template) {
      onApplyTemplate(template);
    }
  }, [selectedTemplate, onApplyTemplate]);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel size="small">TEMPLATES</InputLabel>
        <Select size="small" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
          {presetTemplates.map((template) => (
            <MenuItem key={template.name} value={template.name}>
              {template.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleApplyTemplate} disabled={!selectedTemplate}>
        Apply Template
      </Button>
    </Box>
  );
};

export default TemplateSelector;
