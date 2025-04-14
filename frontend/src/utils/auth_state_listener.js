import { onAuthStateChanged } from 'firebase/auth'
import { auth, database } from '@/firebaseConfig'
import { ref, onValue } from 'firebase/database'

onAuthStateChanged(auth, user => {
  if (user) {
    const uid = user.uid
    console.log('User is signed in with UID:', uid)

    const userRef = ref(database, 'users/' + uid)
    onValue(userRef, snapshot => {
      const data = snapshot.val()
      console.log('User data:', data)
    })
  } else {
    console.log('User is signed out.')
  }
})
