import { Box, Typography } from '@mui/material';
import { Handle, Position } from 'reactflow';

interface NodeBoxProps {
  id: string;
  label: string;
  children: React.ReactNode;
  hasInputHandle?: boolean;
  hasOutputHandle?: boolean;
  hasControlHandle?: boolean;
  controlTargets?: {
    label: string;
    property: string;
  }[];
}

const NodeBox = ({
  id,
  label,
  children,
  hasInputHandle = true,
  hasOutputHandle = true,
  hasControlHandle = false,
  controlTargets = [],
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
      {hasOutputHandle && <Handle type="source" position={Position.Right} id={`${id}-output`} />}
      {hasInputHandle && <Handle type="target" position={Position.Left} id={`${id}-input`} style={{ top: '50%' }} />}
      {hasControlHandle &&
        controlTargets.map((target, index) => (
          <Handle
            key={`${id}-control-${target.property}`}
            type="target"
            position={Position.Top}
            id={`${id}-control-${target.property}`}
            style={{
              top: `${25 + index * 20}%`,
              background: '#ff9800',
            }}
          />
        ))}
      <Typography variant="subtitle1">{label}</Typography>
      {children}
    </Box>
  );
};

export default NodeBox;
