import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

function findFriendById(friendsSnapshot, friendId) {
    const found = friendsSnapshot.docs.find((doc) => {
        if (doc.data().friendId === friendId) {
            return true;
        } else {
            return false;
        }
    });
    return found;
}

// gets friends from db to map
export async function getFriendsFromDatabase(currentUserId) {
    const userCollection = collection(db, "users", currentUserId, "friends");
    const friendsSnapshot = await getDocs(userCollection);
    const friendsList = friendsSnapshot.docs.map((doc) => doc.data());
    console.log("friends list: ", friendsList);
    return friendsList;
}

// adds a friend into the db
export async function addFriend(userId, friendId) {
    const friendCollection = collection(db, "users", userId, "friends");
    const friendsSnapshot = await getDocs(friendCollection);
    const alreadyFriend = findFriendById(friendsSnapshot, friendId);

    if (!alreadyFriend) {
        await addDoc(friendCollection, { friendId: friendId });
        return true;
    } else {
        return false;
    }
}

export async function deleteFriend(userId, friendId) {
    const friendCollection = collection(db, "users", userId, "friends");
    const friendsSnapshot = await getDocs(friendCollection);
    const toDelete = findFriendById(friendsSnapshot, friendId);
    await deleteDoc(doc(friendCollection, toDelete.id));
}

/**
 * Function to remove user from user tab panel
 * @param {*} users the array of users
 * @param {*} userToDelete user to delete from user list
 * @returns the new array of users to display
 */
export function filterUsers(users, friendsList, currentUserId) {
    let newUsersArray = users.filter((user) => !friendsList.includes(user) && user._userId !== currentUserId);
    console.log("new users array: ", newUsersArray);
    return newUsersArray;
}

export async function viewProfile(userId) {
    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDocRef);

    const carCollection = collection(db, "users", userId, "userCars");
    const carData = await getDocs(carCollection);
    const cars = carData.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const data = {
        ...userSnapshot.data(),
        cars,
    };

    // Return the fetched data
    return data;
}

export function createOverlay(document) {
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

    return overlay;
}
