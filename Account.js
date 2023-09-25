import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Button, Typography, TextField, Box, IconButton } from '@mui/material';
import { Select, MenuItem, Tabs, Tab } from '@mui/material';
import { Fab, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import firebase from "firebase/compat/app";
import carData from "./carData.json";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import 'firebase/firestore';
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import 'firebase/compat/storage';
import { useDocument } from 'react-firebase-hooks/firestore';
import { CloudUpload, Edit, PhotoCamera } from '@mui/icons-material';
import CardMedia from '@mui/material/CardMedia';


// Function to generate accessibility props for tab components
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Account = () => {
  // State variables for cars and events add/display
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [filteredModels, setFilteredModels] = useState([]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [username, setUsername] = useState('');
  const [discord, setDiscord] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const isFormValid = name !== "" && year !== "" && make !== "" && model !== "";
  const [submitted, setSubmitted] = useState(false);

  // profile pic variable setup
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const userId = currentUser ? currentUser.uid : null;
  const [userRef, loading] = useDocument(firebase.firestore().doc(`users/${userId}`));  // gets refrence to the current user to get picture url
  const [editMode, setEditMode] = useState(false);

  // Car pic display variable
  const [carVisibility, setCarVisibility] = useState({}); // State variable to track car visibility

  // Firebase credentials 
  const firebaseConfig = useMemo(() => {
    return {
        apiKey: "AIzaSyCFo15vpFh9wYryHDo0zRfHjiIHeU59irQ",
        authDomain: "vroomers-351fe.firebaseapp.com",
        databaseURL: "https://vroomers-351fe-default-rtdb.firebaseio.com",
        projectId: "vroomers-351fe",
        storageBucket: "vroomers-351fe.appspot.com",
        messagingSenderId: "514797662897",
        appId: "1:514797662897:web:74e037a6e9597d21866890",
        measurementId: "G-19SFJ9V17N"
    };
  }, []);  

  // Function to handle form submission when user wants to add a car
  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (submitted) {
      return; // Prevent multiple submissions
    }
  
    // Sets the current user
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser.uid; // Uses that current user object to get the user id
  
    // Checks that firebase is not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  
    // Gets firebase database reference then go into the user collection then to the specific
    // user document that matches the userId, then gets the ref for that user's car collection
    const db = firebase.firestore();
    const userDocRef = db.collection('users').doc(userId);
    const subcollectionRef = userDocRef.collection('userCars');
  
    // Upload image to Firebase Storage if an image is selected
    const imageFile = document.getElementById('imageInput').files[0];
  
    if (imageFile) {
      // If there is an image selected
      if (/\.(jpg|png|gif)$/i.test(imageFile.name)) {
        // If the selected image has a valid extension, upload it to Firebase Storage
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`${userId}/${imageFile.name}`);
        const uploadTask = imageRef.put(imageFile);
  
        // Listen for upload completion
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress updates, if needed
          },
          (error) => {
            console.error('Error uploading image to Firebase Storage: ', error);
          },
          () => {
            // Image upload completed, get the download URL
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
              // Add car details to Firestore
              subcollectionRef
                .add({
                  name,
                  year,
                  make,
                  model,
                  userId,
                  imageUrl: downloadURL, // Save the image download URL
                })
                .then(() => {
                  console.log('Data sent to Firebase!');
                  window.location.reload();
                })
                .catch((error) => {
                  console.error('Error sending data to Firebase: ', error);
                });
            });
          }
        );
        setSubmitted(true); // Prevents multiple submissions if button spammed
      } else {
        // If the selected image has an invalid extension, display an alert
        alert('Please select a valid image file (JPG, PNG, or GIF).');
      }
    } else {
      // No image selected, proceed without imageUrl
      subcollectionRef
        .add({
          name,
          year,
          make,
          model,
          userId,
        })
        .then(() => {
          console.log('Data sent to Firebase!');
          window.location.reload();
        })
        .catch((error) => {
          console.error('Error sending data to Firebase: ', error);
        });
        setSubmitted(true); // Prevents multiple submissions if button spammed
    }
  };
  
  

  // Filters the car makes for the dropdown
  const filteredMakes = carData.reduce((uniqueMakes, car) => {
    if (!uniqueMakes.includes(car.MAKER)) {
      uniqueMakes.push(car.MAKER);
    }
    return uniqueMakes;
  }, []);

  // Filters the car models for the dropdown
  const filterModelsByMakeAndYear = useCallback(() => {
    const filteredModels = carData
      .filter((car) => car.MAKER === make && car.YEAR === year)
      .map((car) => `${car.MODEL} - ${car.FULLMODELNAME}`)
      .sort();
    setFilteredModels(filteredModels);
  }, [make, year]);

  // Based on the previous dropdown inputs it filters the remaining dropdown options 
  // (i.e. if you choose year:2012 it will display car makes/models from that year) 
  useEffect(() => {
    if (make !== "" && year !== "") {
      filterModelsByMakeAndYear();
    }
  }, [make, year, filterModelsByMakeAndYear]);

  // Sorts years from car data
  const sortedYears = Array.from(
    new Set(carData.map((car) => car.YEAR))
  ).sort((a, b) => b - a);

  // This useEffect hook fetches user-specific car data and event data from Firestore
  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    const fetchData = async () => {
      const currentUser = firebase.auth().currentUser;
      
      if (currentUser) {
        const userId = currentUser.uid;  
        const userDocRef = db.collection('users').doc(userId);
    
        const carData = await userDocRef.collection("userCars").get();
        setData(carData.docs.map(doc => ({...doc.data(), id: doc.id})));
    
        const eventData = await db.collection('events').get();
        // setEvents(eventData.docs.map(doc => ({...doc.data(), id: doc.id})));
        const itemsData = eventData.docs.map(doc => ({...doc.data(), id: doc.id}));
        const filteredItemsData = itemsData.filter(item => item.owner === userId || item.participants.includes(userId));
        setEvents(filteredItemsData);
      } else {
        console.log('No logged-in user');
      }
    };

    firebase.auth().onAuthStateChanged((user) => {
      fetchData();
    });

  }, [firebaseConfig]);

  // This hook displays the cars unique to the current user
  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser?.uid;
    
    setFilteredData(data.filter((item) => item.userId === userId));
  }, [data, firebaseConfig]);

  // This handels the deletion of a car
  const handleDelete = (carId) => {
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser.uid;
    
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.firestore();
    const userDocRef = db.collection('users').doc(userId);
    const subcollectionRef = userDocRef.collection('userCars');
    
    subcollectionRef.doc(carId)
      .delete()
      .then(() => {
        console.log("Car deleted successfully!");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error deleting car: ", error);
      });
  };

  //----------- END OF CAR ADDITION CODE -------------------------------------------------------------------

  // Username/Discord/Cell#/Email display and save code:

  // Sets the vars for the user fields for display 
  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      const db = firebase.firestore();
      const currentUser = firebase.auth().currentUser;
    
      const unsubscribe = db
        .collection('users')
        .doc(currentUser.uid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            setUsername(data.username);
            setDiscord(data.discord);
            setPhoneNumber(data.phoneNumber);
            setEmail(data.email);
          }
        });
        return () => unsubscribe();
    
    });
  }, []);

  // Handels a change to the fields and saves them to firebase
  const handleSave = async () => {
    const db = firebase.firestore();
    const currentUser = firebase.auth().currentUser;
    const usersRef = db.collection("users");
  
    if (!username) {
      alert("Username cannot be empty");
      return;
    } 
  
    try {
      const querySnapshot = await usersRef.get();
      let duplicateFound = false;
  
      querySnapshot.forEach((doc) => {
        const usernameToCheck = doc.data().username;
        if (username === usernameToCheck && doc.id !== currentUser.uid) {
          duplicateFound = true;
          alert("Username already exists!");
          return;
        }
      });
  
      if (!duplicateFound) {
        const userDoc = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
      
        if (!userSnapshot.exists()) {
          await setDoc(userDoc, {
            username: username,
            discord: discord,
            email: email,
            phoneNumber: phoneNumber,
          }).then(() => {
            // Refresh the page after the upload is completed
            window.location.reload();
          });
        } else {
          const fieldUpdate = await updateDoc(userDoc, {
            username: username,
            discord: discord,
            email: email,
            phoneNumber: phoneNumber,
          }).then(() => {
            // Refresh the page after the upload is completed
            window.location.reload();
          });
        }
      }
      
    } catch (error) {
      console.log("Error checking for duplicate username: ", error);
    }
  };
  

  const [tabIndex, setTabIndex] = useState(0);
  

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


  // Profile pic upload and display functions
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && userRef && userRef.exists) {
      const user = userRef.data();
      if (user.profilePictureUrl) {
        setImageUrl(user.profilePictureUrl);
      }
    }
  }, [userRef, loading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid image file (JPG, PNG, or GIF).");
    }
  };

  const handleUpload = () => {
    if (imageFile) {
      const storageRef = firebase.storage().ref(`profilePictures/${userId}`);
      const uploadTask = storageRef.put(imageFile);

      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          console.error('Error uploading image:', error);
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // Save the image URL to the database
            firebase.firestore().doc(`users/${userId}`).update({ profilePictureUrl: downloadURL }).then(() => {
              // Refresh the page after the upload is completed
              window.location.reload();
            });
          });
        }
      );
    }
  };

  //----------------------------

  // Car image display

  const toggleCarVisibility = (carId) => {
    setCarVisibility((prevVisibility) => ({
      ...prevVisibility,
      [carId]: !prevVisibility[carId], // Toggle the visibility for the specified car
    }));
  };

  return (
    <Box sx={{ flexGrow: 1, mt: "1rem" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, ml: "1rem" }}>      
        <div>
          {imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={imageUrl} alt="Profile Picture" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
              {editMode && (
                <IconButton
                  aria-label="Edit Profile Picture"
                  style={{ position: 'absolute', top: '4px', left: '4px' }}
                  onClick={() => setEditMode(false)}
                >
                  <Edit />
                </IconButton>
              )}
            </div>
          ) : (
            <div className="profile-picture">
              <span className="placeholder">No profile picture selected</span>
            </div>
          )}
          {editMode ? (
            <div style={{ marginTop: '16px' }}>
              <input type="file" accept="image/*" id="upload-input" style={{ display: 'none' }} onChange={handleImageChange} />
              <label htmlFor="upload-input">
                <Button variant="contained" component="span" startIcon={<PhotoCamera />}>
                  Choose File
                </Button>
              </label>
              <Button variant="contained" startIcon={<CloudUpload />} onClick={handleUpload} style={{ marginLeft: '16px' }}>
                Upload
              </Button>
            </div>
          ) : (
            <IconButton
              aria-label="Edit Profile Picture"
              style={{ position: 'absolute', top: '65px', left: '4px' }}
              onClick={() => setEditMode(true)}
            >
              <Edit />
            </IconButton>
          )}
        </div>
        <Box sx={{ mx: "3rem"}} display="flex" justifyContent="center" alignItems="center">
          <TextField sx={{ mr: "1rem"}}
            label="Username"
            variant="outlined"
            value={username}
            inputProps={{
                  maxLength: 25,
            }}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField sx={{ mr: "1rem"}}
            label="Discord"
            variant="outlined"
            value={discord}
            inputProps={{
                  maxLength: 25,
            }}
            onChange={(e) => setDiscord(e.target.value)}
          />
          <TextField sx={{ mr: "1rem"}}
            label="Phone Number"
            variant="outlined"
            value={phoneNumber}
            inputProps={{
                  maxLength: 12,
            }}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <TextField
            label="Email"
            variant="outlined"
            value={email}
            inputProps={{
                  maxLength: 25,
            }}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button sx={{ left:"1rem"}} color="success" variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white', width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} centered variant='fullWidth' sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
            <Tab label="Cars" {...a11yProps(0)} />
            <Tab label="Events" {...a11yProps(1)} />
          </Tabs>
        </Box>
      </Box>

      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add Car</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Name"
              type="text"
              fullWidth
              onChange={(e) => setName(e.target.value)}
              value={name}
              inputProps={{
                maxLength: 50,
              }}
            />
            <Select
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <MenuItem value="">
                <em>Select year</em>
              </MenuItem>
              {sortedYears.map((year) => (
                <MenuItem value={year} key={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
            <Select
              fullWidth
              value={make}
              onChange={(e) => setMake(e.target.value)}
            >
              <MenuItem value="">
                <em>Select make</em>
              </MenuItem>
              {filteredMakes.map((make) => (
                <MenuItem value={make} key={make}>
                  {make}
                </MenuItem>
              ))}
            </Select>
            <Select
              fullWidth
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {filteredModels.length === 0 && (
                <MenuItem value="">
                  <em>Select model</em>
                </MenuItem>
              )}
              {filteredModels.length !== 0 &&
                filteredModels.map((model) => (
                  <MenuItem value={model} key={model}>
                    {model}
                  </MenuItem>
                ))}
            </Select>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button disabled={!isFormValid} onClick={handleSubmit}>Add</Button>
        </DialogActions>
      </Dialog>
    
      {tabIndex === 0 && (
        <Box>
          {data.map((item) => (
            <Card key={item.id} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.year} {item.make} {item.model}
                </Typography>
              </CardContent>
              {carVisibility[item.id] && item.imageUrl && ( // Check if the car is visible and has an imageUrl
                <CardMedia
                  component="img"
                  height="700"
                  image={item.imageUrl}
                  alt={item.name}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
                <Button size="small" color="error" onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>
              </div>
              {item.imageUrl && ( // Show the "Show Image" button only if there is an image uploaded
                <Button onClick={() => toggleCarVisibility(item.id)}>
                  {carVisibility[item.id] ? 'Hide Image' : 'Show Image'} {/* Toggle the button label based on car visibility */}
                </Button>
              )}
            </Card>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, mb: "1rem" }}>
            <Fab color="primary" aria-label="add" onClick={handleClickOpen}>
              <AddIcon />
            </Fab>
          </Box>
        </Box>
      )}
      {tabIndex === 1 && (
        <Box>
          {events.map((event) => (
            <Card key={event.id} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {event.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.date} {event.location}
                </Typography>
              </CardContent>
            </Card>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, mb:'1rem' }}>
            <Fab color="primary" aria-label="add" onClick={() => navigate('/events')} sx={{ ml: 2 }}>
              <AddIcon />
            </Fab>
          </Box>
        </Box>
      )}
    </Box>
  );
}  
export default Account;

