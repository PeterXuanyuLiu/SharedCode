import { Link, useNavigate } from 'react-router-dom';
import app from './firebase';
import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';

function Authentication() {
  const navigate = useNavigate(); // import useNavigate hook
  const [authenticationUser, setauthenticatedUser] = useState('');

  useEffect(() => {
    const auth = getAuth(app);
    const listenAuth = onAuthStateChanged(auth, user => {
      if (user) {
        setauthenticatedUser(user);
      } else {
        setauthenticatedUser(null);
      }
    });
    return () => {
      listenAuth();
    };
  }, []);

  const userSignOut = () => {
    const auth = getAuth(app);
    signOut(auth)
      .then(() => {
        console.log('user signed out');
        navigate('/login'); // navigate to login page after signout
      })
      .catch(error => console.log('error'));
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-start' }}>
      {authenticationUser == null ? (
        <Box>
          <Button component={Link} to="/login" color="inherit">
            Login
          </Button>
          <Button component={Link} to="/signup" color="inherit">
            Sign Up
          </Button>
        </Box>
      ) : (
        <Box>
          <Button component={Link} to="/social" color="inherit">
            Social
          </Button>
          <Button component={Link} to="/events" color="inherit">
            Events
          </Button>
          <Button component={Link} to="/scenic" color="inherit">
            Scenic Routes
          </Button>
          <Button component={Link} to="/account" color="inherit">
            Account
          </Button>
          <Button onClick={userSignOut} color="inherit">
            Sign Out
          </Button>
        </Box>
      )}
    </Box>
  );
}


export default Authentication;
