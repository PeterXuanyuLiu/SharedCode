import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;
