import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import Authentication from './Authentication';

function Navbar() {
  return (
    <AppBar position="static" sx ={{background: "#333"}}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Button component={Link} to="/" color="inherit" sx={{ fontSize: '24px' }}>
            Vroomers
          </Button>
        </Box>
        <Box sx={{ flexGrow: 0, justifyContent: 'flex-end' }}>
          <Authentication />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
