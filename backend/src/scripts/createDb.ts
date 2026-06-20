import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.log("No DATABASE_URL");
    return;
  }
  
  url = url.replace("postgresql+asyncpg://", "postgresql://");
  const parts = url.split("/");
  const dbname = parts.pop();
  const baseUrl = parts.join("/") + "/postgres";
  
  console.log(`Connecting to ${baseUrl} to create database ${dbname}`);
  
  const client = new Client({ connectionString: baseUrl });
  
  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname=$1`, [dbname]);
    
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbname}"`);
      console.log(`Database ${dbname} created successfully.`);
    } else {
      console.log(`Database ${dbname} already exists.`);
    }
  } catch (error: any) {
    console.log(`Failed to create db: ${error.message}`);
  } finally {
    await client.end();
  }
};

if (require.main === module) {
  createDatabase();
}
