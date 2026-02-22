
https://chattr-x.onrender.com/
![Chattr](chattr.png)
# Chattr 💬✨
A modern, real-time chat application with a sleek UI/UX, featuring a distinctive C-shaped Pac-Man logo. Built with React, Node.js, Socket.io, and MongoDB.

## ✨ Features

### 🤖 Kira AI (The God-Level Polymath)
- **OpenRouter Integration**: Powered primarily by Gemini 2.0 Flash for maximum speed and reliability.
- **Fail-safe Logic**: Automatic fallback to direct Google Gemini SDK if primary provider fails.
- **Two-Mode Personality**: Switch between Casual (vibe-check) and Tech (expert) modes.
- **Interactive Commands**: `/kira status`, `/kira roast`, `/kira recap`, and more.
- **Random Join-in**: Kira intelligently jumps into tech discussions.


### 🎯 Core Features
- **Anonymous Public Chat**: No signup required, just pick a username and start chatting
- **Real-time Messaging**: Instant message delivery with Socket.io
- **Ephemeral Messages**: Messages auto-delete after 24 hours
- **Multiple Message Types**: Text, images, voice messages, and stickers etc
- **Emoji Reactions**: React to messages with emojis
- @@Message Pinning**: Pin important messages for everyone to see
- **Online Users**: See who's currently active in the chat
- @@Typing Indicators**: Know when someone is typing

### 🎨 UI/UX Features
- **Easter Eggs**: Global animations triggered by secret phrases (`let it snow`, `glitch`, etc.).
- **Dark/Light Mode**: Toggle between themes.
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop (optimized with `h-dvh`).
- **Smooth Animations**: Framer Motion powered animations
- **Modern Design**: Clean, vibrant interface with Tailwind CSS
- **Voice Waveforms**: Visual waveform display for voice messages
- **Interactive Elements**: Hover effects, transitions, and micro-interactions

### 🛡️ Admin Panel
- **Secure Login**: JWT-based authentication
- **User Management**: View, kick, and ban users
- **Message Moderation**: Delete messages and manage pins
- **Real-time Statistics**: Active users, message counts, and more
- **Broadcast Announcements**: Send messages to all users
- **Settings Control**: Configure chat features and limits

## 🛠️ Tech Stack

### Backend
- **Node.js 18+** with Express.js
- **Socket.io** for real-time communication
- **MongoDB Atlas** for database
- **OpenRouter API** (Primary AI - Gemini 2.0 Flash)
- **Google Gemini SDK** (Fallback AI)
- **Cloudinary** for persistent media & file storage
- **JWT** for admin authentication
- **Bcryptjs** for password security

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io Client**
- **Lucide React** for icons
- **Canvas API** for global animations (snow, etc.)

## 🚀 Quick Start

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v5.0 or higher)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Priyanshu-x/Chattr.git
cd Chattr
```

2. **Set up the Backend**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create uploads directories
mkdir -p uploads/images uploads/voice

# Create .env file
cp .env.example .env
# Edit .env file with your configurations
```

3. **Set up the Frontend**
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

4. **Start MongoDB**
```bash
# On macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# On Windows/Linux
mongod
```

5. **Start the Application**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

6. **Access the Application**
- **Main Chat**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Admin Credentials**: username: `admin`, password: `admin123`

## 📁 Project Structure

```
anonymous-chat-app/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── chat/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
└── README.md
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://...

# Kira AI Configuration
KIRA_ENABLED=true
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIzaSyA...

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# JWT Secret (Change in production!)
JWT_SECRET=your-super-secret-key

# Default Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Frontend Configuration

The frontend is configured to connect to the backend at `http://localhost:5000`. If you change the backend port, update the Socket.io and Axios configurations in:
- `src/context/SocketContext.js`
- `src/utils/api.js` (if created)

## 🎮 Usage

### For Users
1. **Join the Chat**: Visit the main page and choose a username
2. **Send Messages**: Type and send text messages
3. **Upload Images**: Click the image icon to share photos
4. **Record Voice**: Hold the mic button to record voice messages
5. **Use Stickers**: Click the smile icon to access stickers
6. **React to Messages**: Double-click a message or use the reaction button
7. **View Online Users**: Check the sidebar to see who's online

### For Admins
1. **Access Admin Panel**: Go to `/admin` and login
2. **View Statistics**: Monitor real-time chat statistics
3. **Manage Users**: View, kick, or ban problematic users
4. **Moderate Messages**: Delete inappropriate messages or pin important ones
5. **Send Announcements**: Broadcast messages to all users
6. **Configure Settings**: Adjust chat features and limits

## 🔧 API Documentation

### Public Endpoints

#### User Management
- `GET /api/user/username` - Generate random username
- `GET /api/user/avatar` - Generate random avatar

#### Chat
- `GET /api/chat/messages` - Get recent messages (with pagination)
- `GET /api/chat/pinned` - Get pinned messages
- `POST /api/chat/upload/image` - Upload image file
- `POST /api/chat/upload/voice` - Upload voice file

### Admin Endpoints (Requires JWT)

#### Authentication
- `POST /api/admin/login` - Admin login

#### Statistics
- `GET /api/admin/stats` - Get chat statistics

#### User Management
- `GET /api/admin/users` - Get all active users
- `POST /api/admin/users/:id/kick` - Kick a user
- `POST /api/admin/users/:id/ban` - Ban a user

#### Message Management
- `DELETE /api/admin/messages/:id` - Delete a message
- `PATCH /api/admin/messages/:id/pin` - Toggle message pin
- `POST /api/admin/announcement` - Send announcement

## 🔌 Socket.io Events

### Client to Server
- `join-chat` - User joins the chat
- `new-message` - Send a new message
- `toggle-reaction` - Add/remove reaction to message
- `typing-start` - User starts typing
- `typing-stop` - User stops typing

### Server to Client
- `message-received` - New message broadcast
- `recent-messages` - Initial message history
- `user-joined` - User joined notification
- `user-left` - User left notification
- `online-users` - Updated online users list
- `user-typing` - Typing indicator
- `reaction-updated` - Message reaction updated
- `message-deleted` - Message deleted by admin
- `message-pin-updated` - Message pin status changed
- `admin-announcement` - Admin broadcast message
- `user-banned` - User banned notification
- `user-kicked` - User kicked notification

## 🔒 Security Features

### Authentication
- JWT-based admin authentication
- Secure password hashing with bcryptjs
- Protected admin routes

### Rate Limiting
- Message sending limits
- File upload restrictions
- API endpoint protection

### Input Validation
- XSS prevention
- File type validation
- Content sanitization
- Maximum file size limits

## 🚀 Deployment

### Production Environment Variables

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-mongo-connection-string
JWT_SECRET=your-very-secure-jwt-secret-key
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password
```

### Backend Deployment (Heroku Example)

1. **Install Heroku CLI**
2. **Create Heroku App**
```bash
heroku create your-app-name
```

3. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongo-uri
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=secure-password
```

4. **Deploy**
```bash
git push heroku main
```

### Frontend Deployment (Netlify/Vercel)

1. **Build the frontend**
```bash
cd frontend
npm run build
```

2. **Update API URLs** in your frontend code to point to your deployed backend

3. **Deploy** the `dist` folder to your hosting service

### Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your environment variables

## 🎨 Customization

### Adding New Message Types
1. **Backend**: Update the Message model and add handling in socket events
2. **Frontend**: Create new message bubble component and update MessageInput

### Custom Stickers
1. Add sticker images to `frontend/public/stickers/`
2. Update `StickerPicker.jsx` with new sticker data
3. Consider using a sticker API for dynamic content

### Themes
1. Add new color schemes to `tailwind.config.js`
2. Update `ThemeContext.js` to support multiple themes
3. Add theme selection UI in settings

### File Storage
For production, consider using cloud storage:
- **AWS S3**: For scalable file storage
- **Cloudinary**: For image optimization and management
- **Firebase Storage**: For easy integration

## 📊 Performance Optimization

### Backend
- MongoDB indexing for faster queries
- Connection pooling
- Message pagination
- File compression
- CDN for static assets

### Frontend
- Component lazy loading
- Virtual scrolling for large message lists
- Image lazy loading
- Bundle splitting
- Service workers for offline support

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongosh
# If not installed, install MongoDB Community Edition
```

**Port Already in Use**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env file
```

**Socket.io Connection Issues**
- Check if backend server is running
- Verify CORS configuration
- Check browser console for errors

**File Upload Fails**
- Check uploads directory exists and has write permissions
- Verify file size limits
- Check supported file types

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Commit your changes**
```bash
git commit -m 'Add some amazing feature'
```

4. **Push to the branch**
```bash
git push origin feature/amazing-feature
```

5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Socket.io** for real-time communication
- **Tailwind CSS** for the amazing utility-first CSS framework
- **Lucide React** for beautiful icons
- **Framer Motion** for smooth animations
- **MongoDB** for the flexible database
- **React** for the powerful frontend framework

## 📞 Support

If you have any questions or need help:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Happy Chatting! 💬✨**