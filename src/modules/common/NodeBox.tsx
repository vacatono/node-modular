import { Box, Typography } from '@mui/material';
import { Handle, Position } from 'reactflow';
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
  };
  control2Target?: {
    label: string;
    property: string;
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
          id={`${id}-output`}
          style={{ width: 20, height: 20, background: 'red', borderStyle: 'none', right: -10 }}
        />
      )}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${id}-input`}
          style={{ width: 20, height: 20, background: 'blue', borderStyle: 'none', left: -10 }}
        />
      )}
      {hasControl1Handle && control1Target && (
        <Handle
          key={`${id}-control1-${control1Target.property}`}
          type="target"
          position={Position.Top}
          id={`${id}-control1-${control1Target.property}`}
          style={{
            background: 'lightgreen',
            width: 20,
            height: 20,
            top: -10,
          }}
        />
      )}
      {hasControl2Handle && control2Target && (
        <Handle
          key={`${id}-control2-${control2Target.property}`}
          type="target"
          position={Position.Bottom}
          id={`${id}-control2-${control2Target.property}`}
          style={{
            background: 'lightblue',
            borderStyle: 'none',
            width: 20,
            height: 20,
            bottom: -10,
          }}
        />
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
        <Typography variant="subtitle1">{label}</Typography>
      </Box>
      {children}
    </Box>
  );
};

export default NodeBox;
