import session from 'express-session';
import MongoStore from 'connect-mongo';

// Wrapped in a function so MongoStore.create() only runs when explicitly called from server.js —
// AFTER dotenv has loaded the .env file. This avoids relying on import-order timing.
const createSessionConfig = () => {
  return session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
};

export default createSessionConfig;