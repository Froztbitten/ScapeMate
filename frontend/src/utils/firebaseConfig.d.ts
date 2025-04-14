import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getAnalytics } from 'firebase/analytics'

declare const auth: Auth
declare const provider: GoogleAuthProvider

export { auth, provider, database, analytics }
