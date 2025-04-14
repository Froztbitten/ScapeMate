import { initializeApp } from 'firebase/app'
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth'
import { Database, getDatabase } from 'firebase/database'
import { Analytics, getAnalytics } from 'firebase/analytics'

declare const auth: Auth
declare const provider: GoogleAuthProvider
declare const database: Database
declare const analytics: Analytics

export { auth, provider, database, analytics }
