import { Client } from 'pg';

const passwords = ["postgres", "root", "admin", "1234", "password", ""];

const testPasswords = async () => {
  for (const pwd of passwords) {
    try {
      const url = `postgresql://postgres:${pwd}@localhost:5432/postgres`;
      const client = new Client({ connectionString: url });
      await client.connect();
      console.log(`SUCCESS: The password is '${pwd}'`);
      await client.end();
      return pwd;
    } catch (error: any) {
      if (error.message.includes('password authentication failed')) {
        // Invalid password
      } else {
        console.log(`Other error with '${pwd}': ${error.message}`);
      }
    }
  }
  console.log("FAILED: Could not guess the password.");
  return null;
};

if (require.main === module) {
  testPasswords();
}
