import pgPromise from 'pg-promise';
import { DATABASE_URL } from './env';

const pgp = pgPromise();

export const db = pgp(DATABASE_URL);

export async function connectDatabase(): Promise<void> {
  const connection = await db.connect();
  connection.done();
}
