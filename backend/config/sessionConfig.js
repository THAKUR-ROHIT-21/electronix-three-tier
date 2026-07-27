import session from 'express-session';
import SequelizeStoreInit from 'connect-session-sequelize';
import { getSequelize } from '../config/database.js'; 

const SequelizeStore = SequelizeStoreInit(session.Store);

const createSessionConfig = () => {
  const sequelize = getSequelize();

  const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000, 
    expiration: 7 * 24 * 60 * 60 * 1000,      
  });

  sessionStore.sync(); 

  return session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      domain: '.biharibabu.online', 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
};

export default createSessionConfig;