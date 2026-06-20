import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import archiver = require('archiver');
import { google } from 'googleapis';
import dotenv from 'dotenv';
import util from 'util';

dotenv.config();
const execPromise = util.promisify(exec);

const BACKUP_DIR = 'backups';
const DRIVE_FOLDER_NAME = 'St_Josephs_Backups_Vault';
const RETENTION_DAYS = 30;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const getDriveService = () => {
  if (!fs.existsSync('token.json')) {
    const tokenB64 = process.env.GOOGLE_TOKEN_BASE64;
    if (tokenB64) {
      console.log('🔑 Found GOOGLE_TOKEN_BASE64. Decoding to token.json...');
      try {
        fs.writeFileSync('token.json', Buffer.from(tokenB64, 'base64'));
      } catch (e: any) {
        console.log(`❌ Error decoding token: ${e.message}`);
      }
    }
  }

  let creds;
  if (fs.existsSync('token.json')) {
    creds = JSON.parse(fs.readFileSync('token.json', 'utf8'));
  }

  if (!creds) {
    console.log('❌ Error: Valid credentials not found.');
    return null;
  }

  const auth = google.auth.fromJSON(creds) as any;
  return google.drive({ version: 'v3', auth });
};

const createLocalBackup = async () => {
  const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
  const backupFilename = `St_Josephs_DB_${timestamp}.zip`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  const dumpFile = 'temp_dump.sql';

  console.log('📦 Creating backup snapshot from PostgreSQL...');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ Error: DATABASE_URL not found in environment variables.');
    return null;
  }

  try {
    await execPromise(`pg_dump "${dbUrl}" -f ${dumpFile}`);

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      // @ts-ignore
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.file(dumpFile, { name: 'St_Josephs_Backup.sql' });
      archive.finalize();
    });

    if (fs.existsSync(dumpFile)) {
      fs.unlinkSync(dumpFile);
    }

    console.log(`✅ Database Zipped Successfully: ${backupPath}`);
    return backupPath;
  } catch (error: any) {
    console.error(`❌ Backup Error: ${error.message}`);
    return null;
  }
};

const getOrCreateDriveFolder = async (service: any, folderName: string) => {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  const results = await service.files.list({ q: query, fields: 'files(id, name)' });
  const items = results.data.files || [];

  if (items.length === 0) {
    console.log(`📂 Creating new Drive folder: ${folderName}...`);
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    const folder = await service.files.create({ requestBody: fileMetadata, fields: 'id' });
    return folder.data.id;
  } else {
    return items[0].id;
  }
};

const uploadToDrive = async (filePath: string) => {
  const service = getDriveService();
  if (!service) return;

  const folderId = await getOrCreateDriveFolder(service, DRIVE_FOLDER_NAME);
  const fileName = path.basename(filePath);

  console.log(`🚀 Uploading ${fileName} to Google Drive...`);

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };
  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(filePath)
  };

  const file = await service.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id'
  });

  console.log(`✅ Upload Complete! File ID: ${file.data.id}`);
};

const cleanupOldBackups = async () => {
  const service = getDriveService();
  if (!service) return;

  const folderId = await getOrCreateDriveFolder(service, DRIVE_FOLDER_NAME);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  const query = `'${folderId}' in parents and trashed=false`;
  const results = await service.files.list({ q: query, fields: 'files(id, name, createdTime)' });
  const files = results.data.files || [];

  console.log(`🧹 Checking ${files.length} files for cleanup (Retention: ${RETENTION_DAYS} days)...`);

  for (const file of files) {
    if (file.createdTime) {
      const createdTime = new Date(file.createdTime);
      if (createdTime < cutoffDate) {
        console.log(`🗑️ Deleting old backup: ${file.name} (Created: ${createdTime})`);
        await service.files.delete({ fileId: file.id as string });
      }
    }
  }
};

const main = async () => {
  console.log('--- 🛡️ STARTING MILITARY GRADE BACKUP ---');
  try {
    const zipPath = await createLocalBackup();

    if (zipPath) {
      await uploadToDrive(zipPath);
      await cleanupOldBackups();
      fs.unlinkSync(zipPath);
      console.log('--- ✅ BACKUP PROCESS COMPLETED SUCCESSFULLY ---');
    }
  } catch (error: any) {
    console.log(`--- ❌ BACKUP FAILED: ${error.message} ---`);
  }
};

if (require.main === module) {
  main();
}
