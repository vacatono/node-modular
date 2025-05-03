import { Box, Typography } from '@mui/material';
import { Handle, Position } from 'reactflow';

interface NodeBoxProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

const NodeBox = ({ id, label, children }: NodeBoxProps) => {
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
      <Handle type="source" position={Position.Right} id={`${id}-output`} />
      <Handle type="target" position={Position.Left} id={`${id}-input`} style={{ top: '50%' }} />
      <Typography variant="subtitle1">{label}</Typography>
      {children}
    </Box>
  );
};

export default NodeBox;
