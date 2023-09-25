import * as React from 'react';
import ReactDOM from 'react-dom';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import firebase from "firebase/compat/app";
import { collection, getDocs } from 'firebase/firestore';
import "firebase/compat/firestore";
import 'firebase/compat/auth';
import { addFriend, getFriendsFromDatabase, deleteFriend, filterUsers, viewProfile, createOverlay } from './SocialUtils';
import { SocialFriendCard, SocialProfileOverlayCard, SocialSearchBarCard, SocialUsersCard } from './SocialComponents';

// Assume you have a function getUsersFromDatabase() that retrieves the user data from the database
// and returns an array of user objects

/**
 * const getUsersFromDatabase()
 * @returns an array of all users in the database
 */
const getUsersFromDatabase = async () => {
  try {
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

    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore();
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);

    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      userData._userId = doc.id;
      console.log(userData);
      users.push(userData);
    });

    return users;
  } catch (error) {
    console.error('Error getting users from database:', error);
    return [];
  }
};

/**
 * function TabPanel(props)
 * @param {*} props tab panel props
 * @returns component with children
 */
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

export default function Social() {
  const [users, setUsers] = React.useState([]);
  const [value, setValue] = React.useState(0);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [friendsList, setFriendsList] = React.useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    // Fetch the user data from the database
    const fetchData = async () => {
      try {
        const userData = await getUsersFromDatabase();

        // find current user
        const currentUser = firebase.auth().currentUser;
        // get current user id
        const userId = currentUser.uid;
        // set the currentUserId to use globally
        setCurrentUserId(userId);

        const friends = await getCurrentFriends(userData, userId);
        setFriendsList(friends);
        setUsers(filterUsers(userData, friends, userId));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, []);

  /**
   * const handleAddFriend
   * @param {*} userId id of the user to add
   */
  const handleAddFriend = async (userId) => {
    try {
      const added = await addFriend(currentUserId, userId);
      if (added === true) {
        console.log("friend added");
      } else {
        console.log("friend already added");
      }
      window.location.reload(false);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  }

  const handleDeleteFriend = async (userId) => {
    try {
      await deleteFriend(currentUserId, userId);
      console.log("friend deleted");
      window.location.reload(false);
    } catch (error) {
      console.error('Error deleting friend: ', error);
    }
  }

  /**
   * 
   * @param {*} userID ID of current user to display
   */
  const handleViewProfile = async (userId) => {
    try {
      const data = await viewProfile(userId);

      const closeOverlay = () => {
        document.body.removeChild(overlay);
      }

      const overlay = createOverlay(document);
      const content = (
        <SocialProfileOverlayCard 
          data={data} 
          closeOverlay={closeOverlay} />
      );

      ReactDOM.render(content, overlay);
      console.log("user: ", data.username);
      console.log("user cars: ", data.cars);
      document.body.appendChild(overlay);
      window.closeOverlay = () => {
        ReactDOM.unmountComponentAtNode(overlay);
        document.body.removeChild(overlay);
      };
    } catch (error) {
      console.error('Error viewing profile: ', error);
    }
  }
  

  /**
   * getCurrentFriends(userData, currentUser)
   * @param {*} userData all current users
   * @param {*} currentUser the current user
   * @returns the current friend list
   */
  async function getCurrentFriends(userData, currentUser) {
    const friends = await getFriendsFromDatabase(currentUser);
    console.log("after getting from db");
    console.log(friends);

    const friendList = userData.filter((user) => {
      if (friends.find((friend) => friend.friendId === user._userId)) {
        return true;
      } else {
        return false;
      }
    });
    console.log(friendList);
    return friendList;
  }

  const [searchQuery, setSearchQuery] = useState(''); 
  const filteredUsers = searchQuery ? users.filter(user => user.username && user._userId !== currentUserId && user.username.toLowerCase().includes(searchQuery.toLowerCase())) : users;
  const filteredFriends = searchQuery ? friendsList.filter(friend => friend.username && friend.username.toLowerCase().includes(searchQuery.toLowerCase())) : friendsList;


  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white', width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
        <Tabs value={value} onChange={handleChange} centered variant='fullWidth' sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
          <Tab label="Users" {...a11yProps(0)} />
          <Tab label="Friends" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <SocialSearchBarCard searchQuery={searchQuery} handleSearch={handleSearch} />
        <div>
          {filteredUsers.map(user => (
            <SocialUsersCard user={user} handleAddFriend={handleAddFriend} handleViewProfile={handleViewProfile}/>
          ))}
        </div>
      </TabPanel>
      <TabPanel value={value} index={1}>
      <SocialSearchBarCard searchQuery={searchQuery} handleSearch={handleSearch} />
        <div>
          {filteredFriends.map(user => (
            <SocialFriendCard user={user} handleViewProfile={handleViewProfile} handleDeleteFriend={handleDeleteFriend} />
          ))}
        </div>
      </TabPanel>
    </Box>
  );
}
