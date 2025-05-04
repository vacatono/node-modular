'use client';

import { Box, Container, Typography } from '@mui/material';
import NodeEditor from '@/components/NodeEditor';

export default function NodeModularPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Node Modular <small>(v0.0.1)</small>
        </Typography>
        <NodeEditor />
      </Box>
    </Container>
  );
}
