import PDFDocument from 'pdfkit';
import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';
import path from 'path';

export const createCertificatePdf = async (studentName: string, courseName: string, dateStr: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Styling
    const BRAND_BLUE = '#005EB8';
    
    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(5).stroke(BRAND_BLUE);

    // Title
    doc.font('Helvetica-Bold').fontSize(40).fillColor(BRAND_BLUE).text('CERTIFICATE', 0, 180, { align: 'center' });
    
    // Subtitle
    doc.font('Helvetica').fontSize(16).fillColor('black').text('OF COMPLETION', 0, 230, { align: 'center' });

    // Student Name
    doc.font('Helvetica-Oblique').fontSize(32).text(studentName, 0, 310, { align: 'center' });

    // Course Name
    doc.font('Helvetica-Bold').fontSize(24).fillColor(BRAND_BLUE).text(courseName, 0, 400, { align: 'center' });

    doc.end();
  });
};

export const uploadFileToDrive = async (fileBuffer: Buffer, filename: string, folderLink: string) => {
  try {
    let folderId = folderLink;
    if (folderLink.includes('drive.google.com')) {
      const match = folderLink.match(/folders\/([^?]+)/);
      if (match) folderId = match[1];
    }

    const tokenPath = path.resolve(process.cwd(), 'token.json');
    if (!fs.existsSync(tokenPath)) {
      console.error('❌ Google Drive credentials token.json not found');
      return null;
    }

    const credentials = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const auth = google.auth.fromJSON(credentials) as any;

    const drive = google.drive({ version: 'v3', auth });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };
    const media = {
      mimeType: 'application/pdf',
      body: bufferStream
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });

    return file.data.id;
  } catch (error) {
    console.error(`Drive Error: ${error}`);
    return null;
  }
};
