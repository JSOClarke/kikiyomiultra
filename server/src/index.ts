import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up external Directories (Decoupled from Repo)
const KIKIYOMI_DATA_ROOT = process.env.KIKIYOMI_DATA_ROOT || path.join(os.homedir(), 'Documents', 'KikiyomiUltraData');
const UPLOADS_DIR = path.join(KIKIYOMI_DATA_ROOT, 'uploads');
const DATA_DIR = path.join(KIKIYOMI_DATA_ROOT, 'data');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a clean UUID-like filename alongside original extension
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

import { db } from './db';

// API Endpoints
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Kikiyomi Ultra Backend Online' });
});

// Library Listing
app.get('/api/books', (req, res) => {
  // Return the books minus massive blob payloads (strip coverBlob & audioBlob bytes from payload)
  const books = db.getBooks();
  
  // Clean heavy arrays from overview endpoint
  const manifest = books.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    type: b.type,
    coverUrl: b.coverUrl,
    duration: b.duration,
    splitByCommas: b.splitByCommas,
    createdAt: b.createdAt,
    savedIndex: b.savedIndex,
    savedTime: b.savedTime,
    totalSubtitles: b.subtitles ? b.subtitles.length : 0
  }));
  res.json(manifest);
});

// Specific Book Extraction
app.get('/api/books/:id', (req, res) => {
  const book = db.getBooks().find((b: any) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// Progress Sync
app.post('/api/sync/records', (req, res) => {
  const payload = req.body;
  if (!payload || !payload.date) return res.status(400).json({ error: 'Invalid daily record payload' });
  
  db.updateDailyRecord(payload);
  res.json({ success: true, timestamp: Date.now() });
});

app.get('/api/sync/records', (req, res) => {
  res.json(db.getDailyRecords());
});

// Single file upload endpoint (EPUB, Audiobook, SRT)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Generate clean relative metadata map payload
  const pathUrl = `/uploads/${req.file.filename}`;
  
  res.json({ 
    message: 'File successfully uploaded', 
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: pathUrl,
    size: req.file.size
  });
});

// Complete Book Creation Payload (from worker)
app.post('/api/books', (req, res) => {
  const parsedBook = req.body;
  if (!parsedBook.id) return res.status(400).json({ error: 'Invalid book schema payload' });
  
  db.addBook(parsedBook);
  res.json({ success: true, bookId: parsedBook.id });
});

app.delete('/api/books/:id', (req, res) => {
  db.deleteBook(req.params.id);
  res.json({ success: true });
});

app.put('/api/books/:id/progress', (req, res) => {
  db.updateBookProgress(req.params.id, req.body);
  res.json({ success: true });
});

// Centralized User Analytics (Goals & History)
app.get('/api/user', (req, res) => {
  res.json(db.getUserData());
});

app.put('/api/user/goals', (req, res) => {
  db.updateGoals(req.body);
  res.json({ success: true });
});

app.put('/api/user/history', (req, res) => {
  db.addMiningHistory(req.body);
  res.json({ success: true });
});

app.put('/api/user/last-goal-date', (req, res) => {
  db.updateLastGoalMetDate(req.body.date);
  res.json({ success: true });
});

app.get('/api/user/timeline/dates', (req, res) => {
  res.json(db.getTimelineDates());
});

app.get('/api/user/timeline/:date', (req, res) => {
  res.json(db.getTimelineForDate(req.params.date));
});

// Bookmark Hub Integration
app.get('/api/user/bookmarks', (req, res) => {
  res.json(db.getBookmarks());
});

app.post('/api/user/bookmarks', (req, res) => {
  db.addBookmark(req.body);
  res.json({ success: true });
});

app.delete('/api/user/bookmarks/:id', (req, res) => {
  db.removeBookmark(req.params.id);
  res.json({ success: true });
});

// Static Media Serving - crucial for serving raw `.mp3` tracks
app.use('/uploads', express.static(UPLOADS_DIR));


// Start Engine
app.listen(PORT, () => {
  console.log(`[SERVER] Kikiyomi Ultra API running on http://localhost:${PORT}`);
});
