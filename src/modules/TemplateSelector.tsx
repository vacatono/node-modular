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
    name: '基本VCO→出力',
    nodes: [
      {
        id: 'vco1',
        type: 'vco',
        position: { x: 100, y: 100 },
        data: { label: 'VCO', frequency: 440, type: 'sine', registerAudioNode: null },
      },
      {
        id: 'toDestination',
        type: 'toDestination',
        position: { x: 300, y: 100 },
        data: { label: 'Output', volume: -6, registerAudioNode: null },
        deletable: false,
      },
    ],
    edges: [{ id: 'e1-2', source: 'vco1', target: 'toDestination' }],
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
      { id: 'e1-2', source: 'vco1', target: 'filter1' },
      { id: 'e2-3', source: 'filter1', target: 'toDestination' },
    ],
  },
];

interface TemplateSelectorProps {
  onApplyTemplate: (template: FlowTemplate) => void;
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
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>テンプレート</InputLabel>
        <Select value={selectedTemplate} label="テンプレート" onChange={(e) => setSelectedTemplate(e.target.value)}>
          {presetTemplates.map((template) => (
            <MenuItem key={template.name} value={template.name}>
              {template.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleApplyTemplate} disabled={!selectedTemplate}>
        テンプレートを適用
      </Button>
    </Box>
  );
};

export default TemplateSelector;
