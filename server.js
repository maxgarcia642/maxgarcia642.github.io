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
<<<<<<< HEAD

// Load environment variables for security
// In production, these MUST be set via environment variables
const SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using insecure default. Set JWT_SECRET environment variable in production!');
}

if (!ADMIN_PASSWORD) {
  console.warn('⚠️  WARNING: ADMIN_PASSWORD not set. Using insecure default. Set ADMIN_PASSWORD environment variable in production!');
}

=======
// Load environment variables for security
const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Websiteadmin12';
>>>>>>> origin/main
// Content storage path (JSON based CMS)
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
    projects: [],
    adminPassword: bcrypt.hashSync(ADMIN_PASSWORD || 'Websiteadmin12', 10)
  };
  
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  } else {
    // Ensure adminPassword exists in existing data file
    const existingData = readData();
    if (existingData && !existingData.adminPassword) {
      existingData.adminPassword = bcrypt.hashSync(ADMIN_PASSWORD || 'Websiteadmin12', 10);
      writeData(existingData);
    }
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
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  if (!SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.admin = decoded;
    next();
  } catch (e) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Routes
app.get('/api/content', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Server configuration error' });
  
  if (!data.adminPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
<<<<<<< HEAD
  // Only use bcrypt comparison for security
  const match = bcrypt.compareSync(password, data.adminPassword);
  if (!match) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  if (!SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
=======
  const match = bcrypt.compareSync(password, data.adminPassword) || password === ADMIN_PASSWORD;
  if (!match) return res.status(401).json({ error: 'Invalid password' });
>>>>>>> origin/main
  
  const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logged out' });
});

app.put('/api/content', verifyToken, (req, res) => {
  const { section, field, value } = req.body;
  
  if (!section || !field) {
    return res.status(400).json({ error: 'Section and field are required' });
  }
  
  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'Value is required' });
  }
  
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Server error' });
  
  if (section === 'intro') {
    if (!data.intro) data.intro = {};
    data.intro[field] = value;
  } else if (data.sections[section]) {
    data.sections[section][field] = value;
  } else {
    return res.status(400).json({ error: 'Invalid section' });
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

// Resume upload endpoint (removed duplicate - using the one below that handles old file deletion)

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
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old and new passwords are required' });
  }
  
  if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Passwords must be strings' });
  }
  
  // Validate new password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }
  
  const data = readData();
  if (!data || !data.adminPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  const match = bcrypt.compareSync(oldPassword, data.adminPassword);
  if (!match) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  data.adminPassword = bcrypt.hashSync(newPassword, 10);
  writeData(data);
  
  res.json({ success: true, message: 'Password changed successfully' });
});

// Project management endpoints
app.post('/api/projects', verifyToken, (req, res) => {
  const { title, description } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  
  if (typeof title !== 'string' || typeof description !== 'string') {
    return res.status(400).json({ error: 'Title and description must be strings' });
  }
  
  // Validate length
  if (title.length > 200 || description.length > 1000) {
    return res.status(400).json({ error: 'Title or description too long' });
  }
  
  const data = readData();
  if (!data) return res.status(500).json({ error: 'Server error' });
  
  if (!data.projects) data.projects = [];
  
  const newProject = {
    id: data.projects.length > 0 ? Math.max(...data.projects.map(p => p.id)) + 1 : 1,
    title: title.trim(),
    description: description.trim(),
    file: null
  };
  
  data.projects.push(newProject);
  writeData(data);
  
  res.json(newProject);
});

app.put('/api/projects/:id', verifyToken, (req, res) => {
  const { title, description } = req.body;
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  
  if (typeof title !== 'string' || typeof description !== 'string') {
    return res.status(400).json({ error: 'Title and description must be strings' });
  }
  
  if (title.length > 200 || description.length > 1000) {
    return res.status(400).json({ error: 'Title or description too long' });
  }
  
  const data = readData();
  if (!data || !data.projects) return res.status(500).json({ error: 'Server error' });
  
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  project.title = title.trim();
  project.description = description.trim();
  writeData(data);
  
  res.json(project);
});

app.delete('/api/projects/:id', verifyToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }
  
  const data = readData();
  if (!data || !data.projects) return res.status(500).json({ error: 'Server error' });
  
  const project = data.projects.find(p => p.id === projectId);
  if (project && project.file) {
    // Delete associated file
    const filepath = path.join(UPLOADS_DIR, project.file);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (e) {
        console.error('Error deleting project file:', e);
      }
    }
  }
  
  data.projects = data.projects.filter(p => p.id !== projectId);
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
    
    if (typeof title !== 'string' || typeof description !== 'string') {
      return res.status(400).json({ error: 'Title and description must be strings' });
    }
    
    if (title.length > 200 || description.length > 1000) {
      return res.status(400).json({ error: 'Title or description too long' });
    }
    
    if (!file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }
    
    // Validate file
    let buffer;
    try {
      const base64Data = file.includes(',') ? file.split(',')[1] : file;
      buffer = Buffer.from(base64Data, 'base64');
      
      // Validate PDF format
      if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== '%PDF') {
        return res.status(400).json({ error: 'Invalid file format. Only PDF files are allowed.' });
      }
      
      // Limit file size to 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid file data' });
    }
    
    const data = readData();
    if (!data) return res.status(500).json({ error: 'Server error' });
    
    if (!data.projects) data.projects = [];
    
    // Create new project
    const newProject = {
      id: data.projects.length > 0 ? Math.max(...data.projects.map(p => p.id)) + 1 : 1,
      title: title.trim(),
      description: description.trim(),
      file: null
    };
    
    // Upload PDF file
    const filename = `project${newProject.id}.pdf`;
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

// Upload resume endpoint
app.post('/api/upload/resume', verifyToken, (req, res) => {
  try {
    const { file } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    // Validate file is base64 encoded
    let buffer;
    try {
      const base64Data = file.includes(',') ? file.split(',')[1] : file;
      buffer = Buffer.from(base64Data, 'base64');
      
      // Basic validation: check if it's a PDF (starts with %PDF)
      if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== '%PDF') {
        return res.status(400).json({ error: 'Invalid file format. Only PDF files are allowed.' });
      }
      
      // Limit file size to 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid file data' });
    }
    
    const data = readData();
    if (!data) return res.status(500).json({ error: 'Server error' });
    
    // Delete old resume if it exists
    if (data.resumeFile) {
      const oldPath = path.join(UPLOADS_DIR, data.resumeFile);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const newFilename = 'resume.pdf';
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
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    // Validate file
    let buffer;
    try {
      const base64Data = file.includes(',') ? file.split(',')[1] : file;
      buffer = Buffer.from(base64Data, 'base64');
      
      // Validate PDF format
      if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== '%PDF') {
        return res.status(400).json({ error: 'Invalid file format. Only PDF files are allowed.' });
      }
      
      // Limit file size to 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid file data' });
    }
    
    const data = readData();
    if (!data || !data.projects) return res.status(500).json({ error: 'Server error' });
    
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Delete old file if it exists
    if (project.file) {
      const oldPath = path.join(UPLOADS_DIR, project.file);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const filename = `project${project.id}.pdf`;
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
