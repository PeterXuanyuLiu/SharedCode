import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Navigate, useLocation,useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import React, { useEffect } from 'react';
import markerIcon from "../images/userMarker.png";
import eventIcon from "../images/carlogo.png"
import { collection, getDocs } from "firebase/firestore";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import 'firebase/compat/auth';





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




export default function Home() {
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBfO7KFDFephJni_NtcYZxODWZ-pQcIuOg",
  });

  const location = useLocation();

  const [directions, setDirections] = useState(null);
  
  const onLoad = async (map, maps) => {
    if (!location.state) return;
      const { start, destination, waypoints = [] } = location.state;

    try {
      const result = await fetchDirections(start, destination, waypoints, map, maps);
      setDirections(result);
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  };
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const eventsCol = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCol);
      const eventList = eventSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      const geocoder = new window.google.maps.Geocoder();
      const promises = eventList.map(event => {
        return new Promise((resolve, reject) => {
          geocoder.geocode({ address: event.location }, (results, status) => {
            if (status === "OK") {
              const location = results[0].geometry.location;
              resolve({ ...event, location: { lat: location.lat(), lng: location.lng() }});
            } else {
              reject(status);
            }
          });
        });
      });

      Promise.all(promises).then(eventsWithGeocodes => {
        setEvents(eventsWithGeocodes);
      });
    };

    fetchEvents();
  }, []);
  if (!isLoaded) return <div>Loading...</div>;
  return <Map directions={directions} onLoad={onLoad} events={events} />;
  
}

//function fo fetch direction --M
async function fetchDirections(start, destination, waypoints, map, maps) {
  const directionsService = new maps.DirectionsService();
  const request = {
    origin: start,
    destination: destination,
    waypoints: waypoints.map(location => ({location, stopover: true})),
    travelMode: maps.TravelMode.DRIVING,
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status === maps.DirectionsStatus.OK) {
        resolve(result);
      } else {
        reject(new Error("Error fetching directions."));
      }
    });
  });
}

const containerStyle = {
  height: '100%',
  width: '100%'
};



// Map Component --M
function Map({ directions, onLoad,events }) {
  const location = useLocation();
  const [userLocation, setUserLocation] = useState(null);
  const [eventLocation, setEventLocation] = useState(null);
  const [center, setCenter] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setCenter({ lat: latitude, lng: longitude });
        },
        error => console.error(error)
      );
    }
    if (location.state?.eventLocation) {
      setEventLocation(location.state.eventLocation);
      setCenter(location.state.eventLocation);
    }
  }, [location.state]);
  

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={10}
        center={eventLocation || userLocation}
        options={{
          zoomControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: "greedy",
        }}
        onLoad={(map) => {
          const maps = window.google.maps;
          onLoad(map, maps);
        }}
      >
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={{
              url: markerIcon,
              scaledSize: new window.google.maps.Size(50, 50),
              anchor: new window.google.maps.Point(25, 50),
            }}
          />
        )}
        {eventLocation && (
          <Marker 
            position={eventLocation}
            icon={{
              url: eventIcon,
              scaledSize: new window.google.maps.Size(50, 50),
              anchor: new window.google.maps.Point(25, 50),
            }}
          />
        )}
        {/* Add this to render markers for each event */}
        {events.map((event, index) => (
          <Marker 
            key={index}
            position={event.location}
            icon={{
              url: eventIcon,
              scaledSize: new window.google.maps.Size(50, 50),
              anchor: new window.google.maps.Point(25, 50),
            }}
            onClick={()=>{
              localStorage.setItem("shouldHandleViewEvent", "true");

              navigate("/events", { state: { eventId: event.id} });


            
            
            }}

          />
        ))}

        <Marker position={center} />
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  );
}