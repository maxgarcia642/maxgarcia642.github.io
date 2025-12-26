import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Websiteadmin12';
const DATA_FILE = path.join(__dirname, 'content.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize data file if it doesn't exist
function initializeData() {
  const defaultData = {
    intro: {
      title: 'Hello and Welcome to my Website!',
      description: 'This is my personal portfolio where I share programming projects, articles, useful finance tools, and a small pixel art studio. Scroll to explore my work — my resume is embedded below for quick viewing and is available to download.'
    },
    resumeFile: null,
    sections: {
      programming: { title: 'Programming Works', description: 'Code examples from school and site sources' },
      posts: { title: 'Articles & Projects', description: 'Project reports and updates' },
      utilities: { title: 'Investment Vehicle Valuations', description: 'Live market data & quick redirects' },
      game: { title: 'Pixel Art Studio Max', description: 'A fun 16×16 Pixel Art Studio' },
      connect: { title: 'Connect', description: 'Find my social links and projects' }
    },
    projects: [
      { id: 1, title: 'Project Report 1', description: 'Short description for Project 1.', file: 'project1.pdf' }
    ],
    adminPassword: bcrypt.hashSync(ADMIN_PASSWORD, 10)
  };
  
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
}

// Read content data
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Write content data
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.admin = decoded;
    next();
  } catch (e) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Routes
app.get('/api/content', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const data = readData();
  
  if (!data) return res.status(500).json({ error: 'Server error' });
  
  const match = bcrypt.compareSync(password, data.adminPassword) || password === ADMIN_PASSWORD;
  if (!match) return res.status(401).json({ error: 'Invalid password' });
  
  const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logged out' });
});

app.put('/api/content', verifyToken, (req, res) => {
  const { section, field, value } = req.body;
  const data = readData();
  
  if (section === 'intro') {
    data.intro[field] = value;
  } else if (data.sections[section]) {
    data.sections[section][field] = value;
  }
  
  writeData(data);
  res.json({ success: true });
});

app.post('/api/content/section', verifyToken, (req, res) => {
  const { section, title, description } = req.body;
  const data = readData();
  
  if (!data.sections[section]) {
    data.sections[section] = {};
  }
  data.sections[section].title = title;
  data.sections[section].description = description;
  
  writeData(data);
  res.json({ success: true });
});

// Resume upload endpoint
app.post('/api/upload/resume', verifyToken, (req, res) => {
  try {
    const { file, filename } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    const buffer = Buffer.from(file.split(',')[1] || file, 'base64');
    const filepath = path.join(UPLOADS_DIR, 'resume.pdf');
    fs.writeFileSync(filepath, buffer);
    
    const data = readData();
    data.resumeFile = 'resume.pdf';
    writeData(data);
    
    res.json({ success: true, file: 'resume.pdf' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to upload' });
  }
});

// Get resume file
app.get('/api/resume', (req, res) => {
  try {
    const data = readData();
    if (data.resumeFile) {
      const filepath = path.join(UPLOADS_DIR, data.resumeFile);
      if (fs.existsSync(filepath)) {
        return res.sendFile(filepath);
      }
    }
    res.status(404).json({ error: 'Resume not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve resume' });
  }
});

// Change password
app.post('/api/change-password', verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const data = readData();
  
  const match = bcrypt.compareSync(oldPassword, data.adminPassword);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
  
  data.adminPassword = bcrypt.hashSync(newPassword, 10);
  writeData(data);
  
  res.json({ success: true, message: 'Password changed successfully' });
});

// Project management endpoints
app.post('/api/projects', verifyToken, (req, res) => {
  const { title, description } = req.body;
  const data = readData();
  
  if (!data.projects) data.projects = [];
  
  const newProject = {
    id: Math.max(0, ...data.projects.map(p => p.id)) + 1,
    title,
    description,
    file: null
  };
  
  data.projects.push(newProject);
  writeData(data);
  
  res.json(newProject);
});

app.put('/api/projects/:id', verifyToken, (req, res) => {
  const { title, description } = req.body;
  const data = readData();
  const project = data.projects.find(p => p.id === parseInt(req.params.id));
  
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  project.title = title;
  project.description = description;
  writeData(data);
  
  res.json(project);
});

app.delete('/api/projects/:id', verifyToken, (req, res) => {
  const data = readData();
  data.projects = data.projects.filter(p => p.id !== parseInt(req.params.id));
  writeData(data);
  
  res.json({ success: true });
});

// Quick document upload - create project with PDF in one request
app.post('/api/projects/quick-upload', verifyToken, (req, res) => {
  try {
    const { title, description, file } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    if (!file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }
    
    const data = readData();
    if (!data.projects) data.projects = [];
    
    // Create new project
    const newProject = {
      id: Math.max(0, ...data.projects.map(p => p.id)) + 1,
      title,
      description,
      file: null
    };
    
    // Upload PDF file
    const filename = `project${newProject.id}.pdf`;
    const buffer = Buffer.from(file.split(',')[1] || file, 'base64');
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    newProject.file = filename;
    data.projects.push(newProject);
    writeData(data);
    
    res.json(newProject);
  } catch (e) {
    console.error('Quick upload error:', e);
    res.status(500).json({ error: 'Failed to upload document: ' + e.message });
  }
});

// Upload resume
app.post('/api/upload/resume', verifyToken, (req, res) => {
  try {
    const { file, filename } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    const data = readData();
    
    // Delete old resume if it exists
    if (data.resumeFile) {
      const oldPath = path.join(UPLOADS_DIR, data.resumeFile);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const newFilename = 'resume.pdf';
    const buffer = Buffer.from(file.split(',')[1] || file, 'base64');
    const filepath = path.join(UPLOADS_DIR, newFilename);
    fs.writeFileSync(filepath, buffer);
    
    data.resumeFile = newFilename;
    writeData(data);
    
    res.json({ success: true, file: newFilename });
  } catch (e) {
    console.error('Resume upload error:', e);
    res.status(500).json({ error: 'Failed to upload resume: ' + e.message });
  }
});

app.post('/api/upload/project/:id', verifyToken, (req, res) => {
  try {
    const { file } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    const data = readData();
    const project = data.projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const filename = `project${project.id}.pdf`;
    const buffer = Buffer.from(file.split(',')[1] || file, 'base64');
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    project.file = filename;
    writeData(data);
    
    res.json({ success: true, file: filename });
  } catch (e) {
    console.error('Project upload error:', e);
    res.status(500).json({ error: 'Failed to upload project: ' + e.message });
  }
});

app.post('/api/delete-resume', verifyToken, (req, res) => {
  try {
    const data = readData();
    if (data.resumeFile) {
      const filepath = path.join(UPLOADS_DIR, data.resumeFile);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      data.resumeFile = null;
      writeData(data);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

app.delete('/api/delete-project-file/:id', verifyToken, (req, res) => {
  try {
    const data = readData();
    const project = data.projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.file) {
      const filepath = path.join(UPLOADS_DIR, project.file);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      project.file = null;
      writeData(data);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

initializeData();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
