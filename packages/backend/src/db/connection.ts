// Database connection configuration

import knex from 'knex';
import config from '../../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment as keyof typeof config]);

export default db;
