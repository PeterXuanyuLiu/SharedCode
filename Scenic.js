import * as React from 'react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { FormControl, InputLabel, Select, MenuItem, Card, CardActions, CardContent, Button, Typography, TextField, Box, Tab, Tabs, Grid } from '@mui/material';
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import 'firebase/compat/auth';
import { useNavigate } from "react-router-dom";
import axios from "axios";

// TabPanel setup
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}


// Function to get user location
function getUserLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User location:", latitude, longitude);
        callback([latitude, longitude]);
      },
      (error) => {
        console.error("Error getting user location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
};

// Function to get the location of a city
const getCoordinatesForCity = async (city, callback) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        city
      )}&key=AIzaSyBfO7KFDFephJni_NtcYZxODWZ-pQcIuOg`
    );

    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      callback({ latitude: lat, longitude: lng });
    } else {
      console.error("No results found for the city:", city);
    }
  } catch (error) {
    console.error("Error retrieving coordinates:", error);
  }
};

// Function to calculate the distance between two locations
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};


// Scenic page function
export default function Scenic() {
  // Database setup
  const firebaseConfig = {
    apiKey: "AIzaSyCFo15vpFh9wYryHDo0zRfHjiIHeU59irQ",
    authDomain: "vroomers-351fe.firebaseapp.com",
    databaseURL: "https://vroomers-351fe-default-rtdb.firebaseio.com",
    projectId: "vroomers-351fe",
    storageBucket: "vroomers-351fe.appspot.com",
    messagingSenderId: "514797662897",
    appId: "1:514797662897:web:74e037a6e9597d21866890",
    measurementId: "G-19SFJ9V17N"
  };
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  const navigate = useNavigate();

  // Create scenic route
  const [value, setValue] = React.useState(0);
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState(['']);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Create scenic route form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!start || !destination || waypoints.some(wp => !wp)) {
      console.log('Please enter a starting point, destination, and all waypoints');
      return;
    }
    const db = getFirestore();
    const scenicRoutesCollection = collection(db, 'scenicRoutes');

    const querySnapshot = await getDocs(
      query(scenicRoutesCollection, where('start', '==', start), where('destination', '==', destination))
    );
    if (!querySnapshot.empty) {
      console.log('This pair already exists');
      return;
    }

    try {
      const newPair = await addDoc(scenicRoutesCollection, {
        start,
        destination,
        waypoints,
      });

      console.log(`Pair with ID ${newPair.id} added to the database`);
    } catch (error) {
      console.error('Error adding pair: ', error);
    }

    setStart('');
    setDestination('');
    setWaypoints(['']);
    window.location.reload(false);
  };

  // Add waypoint field
  const handleAddWaypoint = () => {
    setWaypoints(waypoints.concat(''));
  };

  // Change waypoint field
  const handleChangeWaypoint = (index, value) => {
    setWaypoints(waypoints.map((wp, i) => i === index ? value : wp));
  };

  // Remove waypoint field
  const handleRemoveWaypoint = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  // Scenic route list
  const [items, setItems] = useState([]);

  // Holds the selected sorting option
  const [sortingOption, setSortingOption] = useState('');

  // Get user location
  const [userLoc, setUserLoc] = useState(null);

  function handleUserLocation(location) {
    console.log("Received user location:", location);
    setUserLoc(location);  // Update the state variable
  }

  useEffect(() => {
    getUserLocation(handleUserLocation);
  }, []);

  // Pull data from db
  useEffect(() => {
    const fetchItems = async () => {
      // Initialize dataRef
      const dataRef = collection(db, 'scenicRoutes')
      let sortedRef;

      // Check sorting options
      // Sort according to user request
      if (sortingOption === 'Nearest (Start)') {
        // Create data reference for query
        const q = query(dataRef);
        const querySnapshot = await getDocs(q);

        if (userLoc) { // Check if userLoc is not null
          const [userLat, userLng] = userLoc;
          const sortedData = [];

          // Iterate through all routes
          for (let doc of querySnapshot.docs) {
            const data = doc.data();
            await new Promise(resolve => {
              getCoordinatesForCity(data.start, ({ latitude, longitude }) => {
                // Calculate the distance between the user's location and the document's location
                const distance = calculateDistance(userLat, userLng, latitude, longitude);
                sortedData.push({
                  id: doc.id,
                  distance: distance,
                  ...data,
                });
                resolve();
              });
            });
          }

          // Sort data
          sortedData.sort((a, b) => a.distance - b.distance);
          setItems(sortedData);
        }
      }
      else if (sortingOption === 'Nearest (Destination)') {
        // Create data reference for query
        const q = query(dataRef);
        const querySnapshot = await getDocs(q);

        if (userLoc) { // Check if userLoc is not null
          const [userLat, userLng] = userLoc;
          const sortedData = [];

          // Iterate through all routes
          for (let doc of querySnapshot.docs) {
            const data = doc.data();
            await new Promise(resolve => {
              getCoordinatesForCity(data.destination, ({ latitude, longitude }) => {
                // Calculate the distance between the user's location and the document's location
                const distance = calculateDistance(userLat, userLng, latitude, longitude);
                sortedData.push({
                  id: doc.id,
                  distance: distance,
                  ...data,
                });
                resolve();
              });
            });
          }

          // Sort data
          sortedData.sort((a, b) => a.distance - b.distance);
          setItems(sortedData);
        }
      }
      else {
        sortedRef = dataRef;
        const snapshot = await getDocs(sortedRef);
        const sortedData = snapshot.docs.map((doc) => doc.data());
        setItems(sortedData);
      }
    };

    fetchItems();
  }, [userLoc, sortingOption]);

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white', width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
        <Tabs value={value} onChange={handleChange} centered variant='fullWidth' sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
          <Tab label="Browse" {...a11yProps(0)} />
          <Tab label="Create" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <div>
          <InputLabel sx={{ fontSize: '20px' }} id="sorting-option-label">Sort By...</InputLabel>
          <FormControl style={{ width: '220px' }}>
            <Select
              labelId="sorting-option-label"
              value={sortingOption}
              onChange={(e) => setSortingOption(e.target.value)}
            >
              <MenuItem value="">-- Select Sorting Option --</MenuItem>
              <MenuItem value="Nearest (Start)">Nearest (Start)</MenuItem>
              <MenuItem value="Nearest (Destination)">Nearest (Destination)</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={3}>
            {items.map(item => (
              <Grid key={item.index} item xs={12} sm={6} md={4}>
                <Card key={item.id} variant="outlined" sx={{ borderRadius: 3, borderWidth: 7, borderColor: '#ffcc66', margin: 3 }}>
                  <CardContent>
                    <Typography variant="h5" component="h2">
                      {item.start}
                    </Typography>
                    <Typography variant="h4" component="h2">
                      ⬇
                    </Typography>
                    <Typography variant="h5" component="h2">
                      {item.destination}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: '#ff5050', '&:hover': { bgcolor: '#ff5050' } }}
                      onClick={() => {
                        navigate("/", {
                          state: {
                            start: item.start,
                            destination: item.destination,
                            waypoints: item.waypoints
                          }
                        });
                      }}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Create Route
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="Starting Point"
              label="Starting Point"
              type="Starting Point"
              id="Starting Point"
              inputProps={{
                maxLength: 50,
              }}
              onChange={(e) => setStart(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="Destination"
              label="Destination"
              type="Destination"
              id="Destination"
              inputProps={{
                maxLength: 50,
              }}
              onChange={(e) => setDestination(e.target.value)}
            />
            {waypoints.map((wp, i) => (
              <div key={i}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name={`Waypoint ${i + 1}`}
                  label={`Waypoint ${i + 1}`}
                  type="Waypoint"
                  id={`Waypoint${i + 1}`}
                  value={wp}
                  inputProps={{
                    maxLength: 50,
                  }}
                  onChange={(e) => handleChangeWaypoint(i, e.target.value)}
                />
                {waypoints.length > 1 && (
                  <Button onClick={() => handleRemoveWaypoint(i)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={handleAddWaypoint}>
              Add Waypoint
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </TabPanel>
    </Box>
  );
}