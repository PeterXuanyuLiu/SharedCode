import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Card, CardActions, CardContent, Button, Typography, TextField, CardHeader, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, orderBy } from 'firebase/firestore';
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import 'firebase/compat/auth';
import ReactDOM from 'react-dom';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Navigate, useNavigate } from "react-router-dom";
import { where } from 'firebase/firestore';
import { query } from 'firebase/firestore';
import axios from "axios";
import { useLocation } from 'react-router-dom';

const themes = [
  'JDM',
  'American Muscle',
  'Vintage/Classic',
  'Off-Road',
  'Coupe'
];

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
        <Box sx={{ p: 3 }}>
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
      callback(null);
    }
  } catch (error) {
    console.error("Error retrieving coordinates:", error);
    callback(null);
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

// Events()
// Main functoin for the Events page
export default function Events() {
  // Initialize firebase database
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
  const location = useLocation();



  const { eventId} = location.state || {};
useEffect(() => {
  
  const shouldHandleViewEvent = localStorage.getItem("shouldHandleViewEvent")=="true"
  if (shouldHandleViewEvent) {
    localStorage.setItem("shouldHandleViewEvent", "false");
    handleViewEvent(eventId);
  }
 
}, [eventId]);




  // State variable initialization
  const [value, setValue] = React.useState(0);
  const [eventName, setEventName] = React.useState('');
  const [eventDate, setEventDate] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const [eventTime, setEventTime] = React.useState('');
  const [theme, setTheme] = React.useState('');
  const [sortingOption, setSortingOption] = useState('');
  const [items, setItems] = useState([]);
  const [filtered, setItems2] = useState([]);
  const [users, setUsers] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Get current user
  const user = firebase.auth().currentUser;
  const ownerId = user ? user.uid : null;

  // Get user location
  function handleUserLocation(location) {
    console.log("Received user location:", location);
    setUserLoc(location);  // Update the state variable
  }

  useEffect(() => {
    getUserLocation(handleUserLocation);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      const user = firebase.auth().currentUser;
      const ownerId = user.uid;
      const dataRef = collection(db, 'events');

      // Check sorting options
      // Sort according to user request
      if (sortingOption === "Nearest") {
        // Create data reference for query
        const q = query(dataRef);
        const querySnapshot = await getDocs(q);
        if (userLoc) {
          const [userLat, userLng] = userLoc;
          const sortedData = [];
          for (let doc of querySnapshot.docs) {
            const data = doc.data();

            // For each item received calculates distance from user to location
            // and insert into sorted list
            await new Promise(resolve => {
              getCoordinatesForCity(data.location, location => {
                if (location !== null) {  // Check if the location is valid
                  const { latitude, longitude } = location;
                  const distance = calculateDistance(userLat, userLng, latitude, longitude);
                  sortedData.push({
                    id: doc.id,
                    distance: distance,
                    ...data,
                  });
                } else {
                  // If the location is invalid, add the event without a distance
                  sortedData.push({
                    id: doc.id,
                    ...data,
                  });
                }
                resolve();
              });
            });
          }

          // Compile sorted data
          sortedData.sort((a, b) => a.distance - b.distance);
          const filteredItemsData = sortedData.filter(item => item.owner === ownerId || item.participants.includes(ownerId));
          const usersQuerySnapshot = await getDocs(collection(db, 'users'));
          const usersData = usersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Set the list
          setItems(sortedData);
          setItems2(filteredItemsData);
          setUsers(usersData);
        }
      } else if (sortingOption === "Name") {
        // Create data reference for query
        const q = query(dataRef);
        const querySnapshot = await getDocs(q);

        // Create sortedData, for each data sort by name
        const sortedData = [];
        for (let doc of querySnapshot.docs) {
          const data = doc.data();
          await new Promise(resolve => {
            sortedData.push({
              id: doc.id,
              ...data,
            });
            resolve();
          });
        }

        // Compile sorted data
        sortedData.sort((a, b) => a.name - b.name);
        const filteredItemsData = sortedData.filter(item => item.owner === ownerId || item.participants.includes(ownerId));
        const usersQuerySnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Set the list
        setItems(sortedData);
        setItems2(filteredItemsData);
        setUsers(usersData);
      } else if (sortingOption === "Date") {
        // Create data reference for query
        const q = query(dataRef);
        const querySnapshot = await getDocs(q);

        // Create sortedData, for each data sort by date
        const sortedData = [];
        for (let doc of querySnapshot.docs) {
          const data = doc.data();
          await new Promise(resolve => {
            sortedData.push({
              id: doc.id,
              eventDate: new Date(data.date),
              ...data,
            });
            resolve();
          });
        }

        // Compile sorted data
        sortedData.sort((a, b) => a.eventDate - b.eventDate);
        console.log('sortedData', sortedData);
        const filteredItemsData = sortedData.filter(item => item.owner === ownerId || item.participants.includes(ownerId));
        const usersQuerySnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Set the list
        setItems(sortedData);
        setItems2(filteredItemsData);
        setUsers(usersData);
      } else {
        // Create data reference for query
        const q = query(dataRef);
        const querySnapshot = await getDocs(q);

        // Create sortedData, for each data sort by id
        const sortedData = [];
        for (let doc of querySnapshot.docs) {
          const data = doc.data();
          await new Promise(resolve => {
            sortedData.push({
              id: doc.id,
              ...data,
            });
            resolve();
          });
        }

        // Compile sorted data
        sortedData.sort((a, b) => a.id - b.id);
        console.log('sortedData', sortedData);
        const filteredItemsData = sortedData.filter(item => item.owner === ownerId || item.participants.includes(ownerId));
        const usersQuerySnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Set the list
        setItems(sortedData);
        setItems2(filteredItemsData);
        setUsers(usersData);
      }
    };
    firebase.auth().onAuthStateChanged((ownerId) => {
      fetchItems();
    });

  }, [userLoc, sortingOption]);

  // getUsernameByUid()
  // Function to get the username that belongs to an uid
  const getUsernameByUid = (uid) => {
    const user = users.find((user) => user.id === uid);
    return user ? user.username : "Unknown User";
  };

  // handleJoinClick
  // Function to add the user as a participant
  // when the user clicks the join button
  const handleJoinClick = async (eventID) => {
    try {
      const user = firebase.auth().currentUser;
      const ownerId = user.uid;
      const username = getUsernameByUid(ownerId);

      if (!username) {
        navigate("/account");
        alert("Please create a username before joining an event.");
        return;
      }

      console.log("DB event value", eventID);
      const eventRef = doc(db, "events", eventID);
      await updateDoc(eventRef, {
        participants: firebase.firestore.FieldValue.arrayUnion(ownerId),
      });
      window.location.reload(false);
    } catch (error) {
      console.error("Error joining event: ", error);
    }
  };

  // handleCreateEvent()
  // Function to handle all tasks under the Create tab
  const handleCreateEvent = async () => {
    try {
      if (eventName && eventDate && eventLocation) {
        const user = firebase.auth().currentUser;
        const ownerId = user.uid;
        const username = getUsernameByUid(ownerId);
        if (!username) {
          navigate("/account");
          alert("Please create a username before joining an event.");
          return;
        }
        const currentDate = new Date();
        const selectedDate = new Date(eventDate);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

        if (selectedDate < currentDate || selectedDate > oneYearFromNow) {
          alert("Please select a valid event date within the next year.");
          return;
        }

        const eventsRef = collection(db, "events");

        const querySnapshot = await getDocs(query(eventsRef, where("name", "==", eventName), where("date", "==", eventDate), where("location", "==", eventLocation)));

        if (!querySnapshot.empty) {
          alert("Event with the same name, location, and date already exists.");
          return;
        }

        const eventDoc = await addDoc(eventsRef, {
          name: eventName,
          date: eventDate,
          location: eventLocation,
          time: eventTime,
          theme: theme,
          owner: ownerId,
          participants: [ownerId],
        });

        setEventName("");
        setEventDate("");
        setEventLocation("");
        setEventTime("");
        setTheme("");
        window.location.reload(false);
      } else {
        alert("Please fill in all the fields.");
      }
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await deleteDoc(eventRef);
      setItems(items => items.filter(item => item.id !== eventId));
      window.location.reload(false);
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const handleLeaveEvent = async (eventID) => {
    try {
      const user = firebase.auth().currentUser;
      const usr = user.uid;
      console.log("DB event value", eventID);
      console.log(usr);
      const eventRef = doc(db, "events", eventID);
      await updateDoc(eventRef, {
        participants: firebase.firestore.FieldValue.arrayRemove(usr),
      });
      window.location.reload(false);
    } catch (error) {
      console.error("Error leaving event: ", error);
    }
  };



  const handleViewEvent = async (eventId) => {
   
    
    try {
      
      
      
      const closeOverlay = () => {
        document.body.removeChild(overlay);
      };

      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      const event = eventDoc.data();

      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "9999";
      const content = (
        <Card sx={{ maxWidth: "50vw", width: "90vw", maxHeight: "60vh", height: "90vh", background: "white", padding: "16px", position: "relative" }}>
          <CardHeader
            title={<Typography sx={{ textAlign: "center", fontSize: "2rem" }}>{event.name}</Typography>}
          />
          <CardContent sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div sx={{ marginBottom: "1rem", textAlign: "center" }}>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }} variant="body2" component="p">
                Date: {event.date}
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }} variant="body2" component="p">
                Time: {event.time}
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }} variant="body2" component="p">
                Location: {event.location}
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }} variant="body2" component="p">
                Theme: {event.theme}
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }} variant="body2" component="p">
                Owner: {getUsernameByUid(event.participants[0])}
              </Typography>
            </div>
            <div sx={{ marginBottom: "1rem" }}>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "center" }} variant="body2" component="p">
                Participants:
              </Typography>
            </div>
            <div sx={{ marginBottom: "1rem", overflowX: "auto", whiteSpace: "nowrap" }}>
              <Grid container spacing={2} >
                {event.participants.slice(1).map((p, index) => {
                  const participantName = getUsernameByUid(p) ? getUsernameByUid(p) : "Unknown user";
                  return (
                    <Grid item key={p?.id}>
                      <Card>
                        <Card>
                          <Typography>{participantName}</Typography>
                        </Card>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </div>
          </CardContent>
          <Button sx={{ position: "absolute", bottom: "1rem", left: "1rem" }} variant="contained" onClick={closeOverlay}>
            Close
          </Button>
        </Card>
      );


      ReactDOM.render(content, overlay);
      document.body.appendChild(overlay);

      window.closeOverlay = () => {
        ReactDOM.unmountComponentAtNode(overlay);
        document.body.removeChild(overlay);
      };
    } catch (error) {
      console.error("Error viewing event: ", error);
    }

  };

  const handleEditEvent = async (eventId) => {
    try {
      const closeOverlay = () => {
        document.body.removeChild(overlay);
      };

      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      const event = eventDoc.data();

      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "98";

      const EditEventPopup = () => {
        const [updatedEvent, setUpdatedEvent] = useState(event);

        const handleInputChange = (event) => {
          const { name, value } = event.target;
          setUpdatedEvent((prevEvent) => ({
            ...prevEvent,
            [name]: value,
          }));
        };

        const handleSaveEvent = async () => {
          try {
            const currentDate = new Date();
            const selectedDate = new Date(updatedEvent.date);
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

            if (selectedDate < currentDate || selectedDate > oneYearFromNow) {
              alert("Please select a valid event date within the next year.");
              return;
            }

            const eventsRef = collection(db, "events");

            const querySnapshot = await getDocs(
              query(
                eventsRef,
                where("name", "==", updatedEvent.name),
                where("date", "==", updatedEvent.date),
                where("location", "==", updatedEvent.location)
              )
            );

            if (!querySnapshot.empty) {
              alert("Event with the same name, location, and date already exists.");
              return;
            }

            await updateDoc(eventRef, updatedEvent);
            closeOverlay();
            window.location.reload(false);
          } catch (error) {
            console.error("Error saving event: ", error);
          }
        };


        return (
          <Card sx={{ maxWidth: "50vw", width: "90vw", maxHeight: "60vh", height: "90vh", background: "white", padding: "16px", position: "relative", zIndex: "100" }}>
            <CardHeader title={<Typography sx={{ textAlign: "center", fontSize: "2rem" }}>{event.name}</Typography>} />
            <CardContent sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <TextField
                name="name"
                label="Event Name"
                variant="outlined"
                value={updatedEvent.name}
                inputProps={{
                  maxLength: 38,
                }}
                onChange={handleInputChange}
                sx={{ width: "100%", fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }}
              />
              <TextField
                name="date"
                label="Event Date"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
                value={updatedEvent.date}
                onChange={handleInputChange}
                sx={{ width: "100%", fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }}
              />
              <TextField
                name="time"
                label="Event Time in AM/PM"
                variant="outlined"
                value={updatedEvent.time}
                onChange={handleInputChange}
                sx={{ width: "100%", fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }}
              />
              <TextField
                name="location"
                label="Event Location"
                variant="outlined"
                value={updatedEvent.location}
                onChange={handleInputChange}
                sx={{ width: "100%", fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }}
              />
              <FormControl variant="outlined" sx={{ width: "100%", fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left", zIndex: 100 }}>
                <InputLabel id="theme-label">Theme</InputLabel>
                <Select
                  name="theme"
                  labelId="theme-label"
                  value={updatedEvent.theme}
                  onChange={handleInputChange}
                  label="Theme"
                >
                  {themes.map((theme) => (
                    <MenuItem key={theme} value={theme}>
                      {theme}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "left" }} variant="body2" component="p">
                Owner: {getUsernameByUid(event.participants[0])}
              </Typography>
            </CardContent>
            <Button style={{ position: "absolute", bottom: "1rem", left: "1rem" }} variant="contained" onClick={closeOverlay}>
              Close
            </Button>
            <Button
              style={{ position: "absolute", bottom: "1rem", left: "5.5rem", marginLeft: "1rem" }}
              variant="contained"
              onClick={handleSaveEvent}
            >
              Save
            </Button>
          </Card>
        );

      };

      ReactDOM.render(<EditEventPopup />, overlay);
      document.body.appendChild(overlay);

      window.closeOverlay = () => {
        ReactDOM.unmountComponentAtNode(overlay);
        document.body.removeChild(overlay);
      };
    } catch (error) {
      console.error("Error viewing event: ", error);
    }
  };


  const navigate = useNavigate();
  const handleMapView = async (eventId) => {
    try {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      const event = eventDoc.data();
      console.log(event.location);
      // Use Google Geocoding API to get latitude and longitude from event.location
      getGeocode({ address: event.location })
        .then(results => getLatLng(results[0]))
        .then(({ lat, lng }) => {
          navigate("/", {
            state: { eventLocation: { lat, lng } },
          });
        })
        .catch(error => console.log('Geocode Error: ', error));
      console.log(event.location);
      // Use Google Geocoding API to get latitude and longitude from event.location
      getGeocode({ address: event.location })
        .then(results => getLatLng(results[0]))
        .then(({ lat, lng }) => {
          navigate("/", {
            state: { eventLocation: { lat, lng } },
          });
        })
        .catch(error => console.log('Geocode Error: ', error));
    } catch (error) {
      console.error("Error viewing event: ", error);
    }
  };
  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white', width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
        <Tabs value={value} onChange={handleChange} centered variant='fullWidth' sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
          <Tab label="Join" {...a11yProps(0)} />
          <Tab label="Create" {...a11yProps(1)} />
          <Tab label="Manage" {...a11yProps(2)} />
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
              <MenuItem value="Nearest">Nearest</MenuItem>
              <MenuItem value="Name">Name</MenuItem>
              <MenuItem value="Date">Date</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={3}>
            {items.map((item, index) => {
              const eventStartTime = item.startTime; // Assuming you have stored the event start time as 'startTime' in Firestore
              const currentTime = Date.now();
              const isEventStarted = currentTime >= eventStartTime;

              return (
                <Grid key={item.index} item xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ borderRadius: 3, borderWidth: 7, borderColor: '#ffcc66', margin: 3 }}>
                    <CardContent>
                      <Typography variant="h5" component="h2">
                        {item.name}
                      </Typography>
                      <Typography color="textSecondary">
                        {item.location}
                      </Typography>
                      <Typography variant="body2" component="p">
                        {item.date}
                      </Typography>
                      <Typography variant="body2" component="p">
                        {item.time}
                      </Typography>
                      <Typography variant="body2" component="p">
                        {item.theme}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {!isEventStarted && item.owner !== ownerId && !item.participants.includes(ownerId) && (
                        <Button variant="contained" sx={{ bgcolor: '#ff5050', '&:hover': { bgcolor: '#ff5050' } }} onClick={() => handleJoinClick(item.id)}>Join</Button>
                      )}
                      <Button variant="contained" sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1976d2' } }} onClick={() => handleViewEvent(item.id)}>View</Button>
                      <Button variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#4CAF50' } }} onClick={() => handleMapView(item.id)}>Map</Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </div>

      </TabPanel>
      <TabPanel value={value} index={1}>
        <form>
          <Typography variant="h6" gutterBottom>Create Event</Typography>
          <TextField
            label="Event Name"
            variant="outlined"
            value={eventName}
            inputProps={{
                maxLength: 38,
            }}
            onChange={(e) => setEventName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Event Date"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Event Location"
            variant="outlined"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}

          />
          <TextField
            label="Event Time in AM/PM"
            variant="outlined"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}

          />
          <FormControl fullWidth>
            <InputLabel>Theme</InputLabel>
            <Select
              label="Theme"
              variant="outlined"
              value={theme}
              fullWidth
              sx={{ mb: 2 }}
              onChange={(e) => setTheme(e.target.value)}>
              {themes.map((theme) => (
                <MenuItem
                  key={theme}
                  value={theme}
                >
                  {theme}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateEvent}
            fullWidth
          >
            Save Event
          </Button>
        </form>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <div>
          <Grid container spacing={3}>
            {filtered.map(item => (
              <Grid key={item.id} item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderWidth: 7, borderColor: '#ffcc66', margin: 3 }}>
                  <CardContent>
                    <Typography variant="h5" component="h2">
                      {item.name}
                    </Typography>
                    <Typography color="textSecondary">
                      {item.location}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {item.date}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {item.time}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {item.theme}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {item.owner === ownerId && (
                      <>
                        <Button variant="contained" sx={{ bgcolor: '#ff5050', '&:hover': { bgcolor: '#ff5050' }, }} onClick={() => handleDeleteEvent(item.id)}>Delete</Button>
                        <Button variant="contained" sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1976d2' }, }} onClick={() => handleEditEvent(item.id)}>Edit</Button>
                      </>
                    )}
                    {item.owner !== ownerId && item.participants.includes(ownerId) && (
                      <Button variant="contained" sx={{ bgcolor: '#ff5050', '&:hover': { bgcolor: '#ff5050' } }} onClick={() => handleLeaveEvent(item.id)}>Leave</Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>

      </TabPanel>
    </Box>
  );
};