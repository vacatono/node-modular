'use client';

import { Box, Container, Typography } from '@mui/material';
import NodeEditor from '@/components/NodeEditor';

export default function NodeModularPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Node Modular Editor
        </Typography>
        <NodeEditor />
      </Box>
    </Container>
  );
}
