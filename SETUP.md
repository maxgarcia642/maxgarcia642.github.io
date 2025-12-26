# Setup Instructions

## Installation
1. `npm install` - Install all dependencies
2. `npm start` - Start the server on port 5000

## Default Admin Credentials
- **Password**: `admin123`
- **Admin URL**: `http://localhost:5000/admin.html`

## Change Admin Password
Set the `ADMIN_PASSWORD` environment variable:
```bash
export ADMIN_PASSWORD="your-new-password"
npm start
```

## Using the Admin Panel
1. Click the **⚙️ Admin** button in the top navigation
2. Enter the admin password (`admin123` by default)
3. Edit any section title or description
4. Click "Save" to update content in real-time
5. Changes appear instantly on the main portfolio

## Features
- ✨ Frutiger Aero design with smooth animations
- 🔐 Admin authentication with JWT tokens
- 📝 Editable content stored in `content.json`
- 🎨 Pixel art 16x16 editor
- 📊 Investment utility links
- 📱 Fully responsive design

## Environment Variables (Optional)
- `JWT_SECRET` - Change JWT signing key (default: unsafe, change in production)
- `ADMIN_PASSWORD` - Set admin password (default: admin123)
- `PORT` - Server port (default: 5000)
