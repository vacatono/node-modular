import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import TemplateSelector, { FlowTemplate } from '../modules/TemplateSelector';

interface NodeMenuProps {
  onAddNode: (type: string) => void;
  onApplyTemplate: (template: FlowTemplate) => void;
  debug?: boolean;
  onDebugLog?: () => void;
}

const NodeMenu: React.FC<NodeMenuProps> = ({
  onAddNode,
  onApplyTemplate,
  debug = false,
  onDebugLog
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddNode = (type: string) => {
    onAddNode(type);
    // handleClose(); // Keep menu open for multiple adds? Or close? usually close.
    // User might want to add multiple nodes. Let's keep it open or provide a way. 
    // Stick to standard behavior: close on select.
    handleClose();
  };

  const nodeTypes = [
    { label: 'VCO', type: 'vco', category: 'Source' },
    { label: 'LFO', type: 'lfo', category: 'Source' },
    { label: 'Noise', type: 'noiseSynth', category: 'Source' },
    { label: 'Keyboard', type: 'keyboard', category: 'Control' },
    { label: 'Sequencer', type: 'sequencer', category: 'Control' },
    { label: 'Note→CV', type: 'noteToCV', category: 'Control' },
    { label: 'Filter', type: 'filter', category: 'Effect' },
    { label: 'Delay', type: 'delay', category: 'Effect' },
    { label: 'Reverb', type: 'reverb', category: 'Effect' },
    { label: 'AM Synth', type: 'amSynth', category: 'Synth' },
    { label: 'FM Synth', type: 'fmSynth', category: 'Synth' },
    { label: 'Mono Synth', type: 'monoSynth', category: 'Synth' },
    { label: 'Membrane', type: 'membraneSynth', category: 'Synth' },
    { label: 'Envelope', type: 'amplitudeEnvelope', category: 'Utils' },
    { label: 'Oscilloscope', type: 'oscilloscope', category: 'Utils' },
  ];

  // Group by category if we want nested menus, but flat for now with dividers?
  // Or just a simple list. A simple list is fine for < 20 items.

  return (
    <AppBar position="static" color="default" sx={{ borderBottom: '1px solid #e0e0e0', boxShadow: 'none', bgcolor: 'background.paper' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
          Node Modular (v0.0.3)
        </Typography>

        {/* Template Selector - Always visible or hidden on very small screens? */}
        <Box sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
          <TemplateSelector onApplyTemplate={onApplyTemplate} />
        </Box>

        {/* Add Node Button */}
        <Button
          id="add-node-button"
          aria-controls={open ? 'add-node-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)' }}
        >
          Add Node
        </Button>
        <Menu
          id="add-node-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'add-node-button',
            dense: true,
          }}
          PaperProps={{
            sx: { maxHeight: 400, width: 200 }
          }}
        >
          {/* We could add headers for categories here */}
          {nodeTypes.map((node) => (
            <MenuItem key={node.type} onClick={() => handleAddNode(node.type)}>
              {node.label}
            </MenuItem>
          ))}
        </Menu>

        {/* Mobile Template Selector Fallback (if needed, but for now we hide it on xs)
            Actually, let's just let it wrap or show it. The Box above hides it on xs.
            If on mobile, maybe we want an icon button for settings/templates?
        */}

        {debug && onDebugLog && (
          <Button onClick={onDebugLog} color="error" size="small" variant="outlined" sx={{ ml: 1 }}>
            Debug
          </Button>
        )}

      </Toolbar>
    </AppBar>
  );
};

export default NodeMenu;
