import { Box, Typography } from '@mui/material';
import { Handle, Position } from 'reactflow';

interface NodeBoxProps {
  id: string;
  label: string;
  children: React.ReactNode;
  hasInputHandle?: boolean;
  hasOutputHandle?: boolean;
  hasControlHandle?: boolean;
}

const NodeBox = ({
  id,
  label,
  children,
  hasInputHandle = true,
  hasOutputHandle = true,
  hasControlHandle = false,
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
      {hasControlHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id={`${id}-control`}
          style={{
            top: '25%',
            background: '#ff9800', // コントロール用ハンドルをオレンジ色で区別
          }}
        />
      )}
      <Typography variant="subtitle1">{label}</Typography>
      {children}
    </Box>
  );
};

export default NodeBox;
