import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Handle, Position, useReactFlow } from 'reactflow';
import { green } from '@mui/material/colors';

interface NodeBoxProps {
  id: string;
  label: string;
  children: React.ReactNode;
  hasInputHandle?: boolean;
  hasOutputHandle?: boolean;
  hasControl1Handle?: boolean;
  hasControl2Handle?: boolean;
  control1Target?: {
    label: string;
    property: string;
    isSource?: boolean;
  };
  control2Target?: {
    label: string;
    property: string;
    isSource?: boolean;
  };
  draggable?: boolean;
}

const NodeBox = ({
  id,
  label,
  children,
  hasInputHandle = true,
  hasOutputHandle = true,
  hasControl1Handle = false,
  hasControl2Handle = false,
  control1Target,
  control2Target,
}: NodeBoxProps) => {
  const { setNodes } = useReactFlow();

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <Box
      sx={{
        padding: 2,
        minWidth: 200,
      }}
    >
      {hasOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-output-audio`}
          style={{ width: 20, height: 20, background: '#2196f3', borderStyle: 'none', right: -10 }}
        />
      )}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${id}-input-audio`}
          style={{ width: 20, height: 20, background: '#2196f3', borderStyle: 'none', left: -10 }}
        />
      )}
      {hasControl1Handle && control1Target && (
        <>
          <Handle
            key={`${id}-control1-${control1Target.property}`}
            type={control1Target.isSource ? 'source' : 'target'}
            position={Position.Top}
            id={`${id}-control1-${control1Target.property}-${
              control1Target.property === 'trigger' ? 'gate' : control1Target.property === 'note' ? 'note' : 'cv'
            }`}
            style={{
              background:
                control1Target.property === 'trigger'
                  ? '#e91e63'
                  : control1Target.property === 'note'
                  ? '#ff9800'
                  : '#4caf50',
              width: 20,
              height: 20,
              top: -10,
            }}
          />
          {control1Target.label && (
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                whiteSpace: 'nowrap',
              }}
            >
              {control1Target.label}
            </Box>
          )}
        </>
      )}
      {hasControl2Handle && control2Target && (
        <>
          <Handle
            key={`${id}-control2-${control2Target.property}`}
            type={control2Target.isSource ? 'source' : 'target'}
            position={Position.Bottom}
            id={`${id}-control2-${control2Target.property}-${
              control2Target.property === 'note' ? 'note' : control2Target.property === 'frequency' ? 'cv' : 'cv'
            }`}
            style={{
              background: control2Target.property === 'note' ? '#ff9800' : '#4caf50',
              borderStyle: 'none',
              width: 20,
              height: 20,
              bottom: -10,
            }}
          />
          {control2Target.label && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                whiteSpace: 'nowrap',
              }}
            >
              {control2Target.label}
            </Box>
          )}
        </>
      )}
      <Box
        sx={{
          backgroundColor: green[50],
          color: green[900],
          px: 2,
          py: 1,
          borderRadius: '4px',
          userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">{label}</Typography>
          <IconButton size="small" onClick={handleDelete} sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      {children}
    </Box>
  );
};

export default NodeBox;
