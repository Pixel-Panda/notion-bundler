import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs, readFile} from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
 try {   const controller = new AbortController();   const { signal } = controller;   const promise = readFile(fileName, { signal });    // Abort the request before the promise settles.   controller.abort();    await promise; } catch (err) {   // When a request is aborted - err is an AbortError   console.error(err); }

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = async (req: NextApiRequest) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const processDirectory = async (dirPath: string): Promise<string> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let textBundleContent = '';

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      textBundleContent += await processDirectory(fullPath);
    } else if (entry.isFile() && path.extname(entry.name) === '.md') {
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      textBundleContent += `\n\n# ${entry.name}\n\n${fileContent}`;
    }
  }

  return textBundleContent;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = await parseForm(req);
    const uploadDir = path.join(process.cwd(), 'uploads', uuidv4());

    await fs.mkdir(uploadDir, { recursive: true });
    const zipPath = path.join(uploadDir, 'upload.zip');

    await fs.writeFile(zipPath, data);

    // Unzip the file
    const unzipper = require('unzipper');
    await fs.readFile(zipPath).pipe(unzipper.Extract({ path: uploadDir })).promise();

    // Process the unzipped directory
    const textBundleContent = await processDirectory(uploadDir);

    const textBundleDir = path.join(uploadDir, 'textbundle');
    await fs.mkdir(textBundleDir);
    await fs.writeFile(path.join(textBundleDir, 'text.md'), textBundleContent);

    res.status(200).json({ message: 'Directory processed and converted to textbundle' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing the directory' });
  }
};

export default handler;