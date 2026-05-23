import pgPromise from 'pg-promise';
import { DATABASE_URL } from './env';

const pgp = pgPromise();
pgp.pg.types.setTypeParser(1700, (value: string) => Number.parseFloat(value));

export const db = pgp(DATABASE_URL);

export async function connectDatabase(): Promise<void> {
  const connection = await db.connect();
  connection.done();
}
