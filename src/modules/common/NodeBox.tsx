import { Box, Typography } from '@mui/material';
import { Handle, Position } from 'reactflow';

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
        border: '1px solid #ccc',
        borderRadius: 1,
        backgroundColor: 'white',
        minWidth: 200,
      }}
    >
      {hasOutputHandle && (
        <Handle type="source" position={Position.Right} id={`${id}-output`} style={{ width: 12, height: 12 }} />
      )}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${id}-input`}
          style={{ top: '50%', width: 12, height: 12 }}
        />
      )}
      {hasControl1Handle && control1Target && (
        <Handle
          key={`${id}-control1-${control1Target.property}`}
          type="target"
          position={Position.Top}
          id={`${id}-control1-${control1Target.property}`}
          style={{
            top: '25%',
            background: '#4caf50',
            width: 12,
            height: 12,
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
            bottom: '25%',
            background: '#2196f3',
            width: 12,
            height: 12,
          }}
        />
      )}
      <Typography variant="subtitle1">{label}</Typography>
      {children}
    </Box>
  );
};

export default NodeBox;
