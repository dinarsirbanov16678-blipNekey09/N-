import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import multer from "multer";
import { Readable } from "stream";

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: "gen-lang-client-0728357967.firebasestorage.app"
    });
}
const bucket = admin.storage().bucket();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for voice upload
  app.post("/api/upload-voice", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded.");
        
        const file = req.file;
        const bucketFile = bucket.file(`chats/${req.body.chatId}/audio/${Date.now()}.webm`);
        
        const stream = Readable.from(file.buffer);
        stream.pipe(bucketFile.createWriteStream({
            metadata: { contentType: file.mimetype }
        })).on('error', (err) => {
            res.status(500).send(err.message);
        }).on('finish', async () => {
            await bucketFile.makePublic();
            const url = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
            res.json({ url });
        });
    } catch (error) {
        res.status(500).send("Error uploading file.");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
