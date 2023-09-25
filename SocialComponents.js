import { Card, CardActions, CardContent, CardHeader, Button, Typography, TextField, CardMedia } from '@mui/material';
import React, { useState } from 'react';

export function SocialFriendCard(props) {
  const { user, handleViewProfile, handleDeleteFriend } = props;

  return (
    <>
      <Card key={user.id} variant="outlined" sx={{ borderRadius: 3, borderWidth: 7, borderColor: '#ffcc66', margin: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2">
            {user.username}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => handleViewProfile(user._userId)}>View Profile</Button>
          <Button size="small" onClick={() => handleDeleteFriend(user._userId)}>Delete Friend</Button>
        </CardActions>
      </Card>
    </>
  );
}

export function SocialUsersCard(props) {
  const { user, handleAddFriend } = props;
  return (
    <Card key={user.id} variant="outlined" sx={{ borderRadius: 3, borderWidth: 7, borderColor: '#ffcc66', margin: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2">
          {user.username}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => handleAddFriend(user._userId)}>Add Friend</Button>
      </CardActions>
    </Card>
  );
}

export function SocialSearchBarCard(props) {
  const { searchQuery, handleSearch } = props;
  return (
    <TextField
      value={searchQuery}
      onChange={handleSearch}
      label="Search"
      variant="outlined"
      fullWidth
      sx={{ marginLeft: '2rem', marginTop: '1rem', marginRight: '2rem', maxWidth: '100rem', width: '100%' }}
    />
  );
}

export function SocialProfileOverlayCard(props) {
  const { data, closeOverlay } = props;
  const cars = data.cars;
  const [carVisibility, setCarVisibility] = useState({});

  const toggleCarVisibility = (carId) => {
    setCarVisibility((prevState) => ({
      ...prevState,
      [carId]: !prevState[carId],
    }));
  };

  return (
    <Card sx={{ maxWidth: '53vw', width: '90vw', maxHeight: '85vh', height: '90vh', background: 'white', padding: '16px', position: 'relative', overflow: 'auto' }}>
      <CardHeader
        title={<Typography sx={{ textAlign: 'center', fontSize: '2rem' }}>{data.username}</Typography>}
      />
      {data.profilePictureUrl && (
        <CardMedia
          component="img"
          image={data.profilePictureUrl}
          alt="Profile Picture"
          sx={{ objectFit: 'cover', margin: 'auto', width: '350px', height: '350px' }}
        />
      )}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div sx={{ marginBottom: '1rem', textAlign: 'center' }}>
          {data.discord && (
            <Typography sx={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'left' }} variant="body2" component="p">
              <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Discord:</span> {data.discord}
            </Typography>
          )}
          {data.email && (
            <Typography sx={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'left' }} variant="body2" component="p">
              <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Email:</span> {data.email}
            </Typography>
          )}
          {data.phoneNumber && (
            <Typography sx={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'left' }} variant="body2" component="p">
              <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Phone Number:</span> {data.phoneNumber}
            </Typography>
          )}
          {cars.length > 0 && (
            <Typography sx={{fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'left' }} variant="body2" component="p">
              <div>
              <Typography sx={{fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'left', fontWeight: 'bold' }}>Cars:</Typography> {cars.map((car) => (
                  <div key={car.id}>
                    {car.make} {car.model} ({car.year})
                    {car.imageUrl && (
                      <Button onClick={() => toggleCarVisibility(car.id)}>
                        {carVisibility[car.id] ? 'Hide Image' : 'Show Image'}
                      </Button>
                    )}
                    {carVisibility[car.id] && car.imageUrl && (
                      <CardMedia
                        component="img"
                        image={car.imageUrl}
                        alt={`${car.make} ${car.model}`}
                        sx={{ objectFit: 'cover', margin: 'auto', width: '700px', height: '400px' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Typography>
          )}
        </div>
      </CardContent>
      <Button sx={{ position: 'sticky', bottom: '1rem', right: '1rem' }} variant="contained" onClick={closeOverlay}>
        Close
      </Button>
    </Card>
  );
}

