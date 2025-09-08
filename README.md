# Reverse QR File Share System

A revolutionary file sharing system where the **receiver generates a QR code** and the **sender scans it** to upload files directly to the receiver's device. Built with the MERN stack and WebSocket for real-time communication.

## 🌟 How It Works

### Traditional vs Reverse QR Sharing

**Traditional QR Sharing:**
1. Sender uploads files → generates QR code
2. Receiver scans QR code → downloads files

**Reverse QR Sharing (Our System):**
1. **Receiver** creates session → generates QR code
2. **Sender** scans QR code → uploads files 
3. **Receiver** automatically gets files downloaded

## 🚀 Key Features

### Core Functionality
- **Reverse QR Workflow**: Receiver-initiated file sharing sessions
- **Real-time Communication**: WebSocket integration for instant notifications
- **Auto-download**: Files automatically download to receiver's device
- **Cross-device**: Works on any device with camera and browser
- **No Apps Required**: Pure web-based solution

### Security & Control
- **Session Expiry**: Configurable time limits (30min - 2hrs)
- **File Size Limits**: 100MB per file, 500MB per session
- **File Type Validation**: Support for common file types
- **Session Management**: Unique session IDs with cleanup

### User Experience
- **Drag & Drop Upload**: Modern file selection interface
- **Progress Tracking**: Real-time upload progress
- **Mobile Responsive**: Works on all screen sizes
- **Status Updates**: Live session status notifications

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.IO** - Real-time communication
- **Multer** - File upload handling
- **QRCode** - QR code generation

### Frontend
- **React 18** - UI framework
- **Socket.IO Client** - Real-time updates
- **Styled Components** - Styling
- **React Router** - Navigation
- **React Dropzone** - File upload UI
- **QRCode.react** - QR code display

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud)
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd reverse-qr-share
```

2. **Backend Setup**
```bash
cd server
npm install

# Configure environment
cp .env .env.local
# Edit .env with your MongoDB URI and settings

# Start server
npm run dev
```

3. **Frontend Setup**
```bash
cd ../client
npm install

# Start React app
npm start
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎯 Usage Flow

### For File Receiver
1. Go to http://localhost:3000
2. Click "Receive Files"
3. Show the generated QR code to sender
4. Files will auto-download when received

### For File Sender  
1. Scan the receiver's QR code with phone camera
2. Upload opens in browser
3. Select and upload files
4. Files transfer directly to receiver

## 🏗️ System Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Receiver      │ ←────────────→  │     Server      │
│   (Device 2)    │                 │   (Node.js)     │
└─────────────────┘                 └─────────────────┘
        ↑                                     ↑
        │ QR Code Display                     │ File Upload
        │                                     │
        └─────────────────────────────────────┘
                    Sender (Device 1)
```

### Key Components

**Server Side:**
- `/api/session` - Session management
- `/api/upload` - File upload handling
- Socket.IO - Real-time notifications
- MongoDB - Session and file metadata

**Client Side:**
- `ReceivePage` - QR code generation & file monitoring
- `SendPage` - File upload interface
- Socket service - Real-time updates
- Auto-download - Automatic file retrieval

## 🔧 Configuration

### Environment Variables

**Server (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/reverse-qr-share
CLIENT_URL=http://localhost:3000
DEFAULT_SESSION_EXPIRY_MINUTES=30
MAX_FILE_SIZE=104857600
MAX_SESSION_SIZE=524288000
```

**Client (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### File Upload Limits
- **Max file size**: 100MB per file
- **Max files**: 20 files per session
- **Max session size**: 500MB total
- **Session expiry**: 30 minutes - 2 hours

## 🚀 Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Configure MongoDB connection
3. Deploy using platform CLI or Git

### Frontend (Netlify/Vercel)
1. Build: `npm run build`
2. Deploy `build` folder
3. Set `REACT_APP_API_URL` environment variable

### Docker Deployment
```bash
# Build and run with Docker Compose (coming soon)
docker-compose up --build
```

## 🔍 API Documentation

### Session Management
```http
POST /api/session/create
GET /api/session/:sessionId
GET /api/session/:sessionId/download
GET /api/session/:sessionId/file/:filename
```

### File Upload
```http
POST /api/upload/:sessionId
POST /api/upload/:sessionId/complete
```

### WebSocket Events
```javascript
// Client to Server
join-session
leave-session

// Server to Client  
files-uploaded
session-completed
```

## 🔐 Security Features

- **Session-based**: Unique session IDs prevent unauthorized access
- **Time-limited**: Automatic session expiry
- **File validation**: Type and size restrictions
- **Rate limiting**: Prevents abuse
- **CORS protection**: Secure cross-origin requests

## 🎨 Screenshots

*Screenshots would be inserted here showing:*
- Home page with action buttons
- QR code generation page
- File upload interface
- Real-time notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check if server is running on correct port
- Verify CORS configuration

**Files Not Auto-downloading**
- Check browser pop-up blocker
- Verify file permissions

**Session Expired**
- Sessions expire after 30 minutes by default
- Create a new session if needed

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- [ ] Bulk ZIP download
- [ ] File preview before download  
- [ ] User accounts and history
- [ ] Mobile app versions
- [ ] Enhanced security options
- [ ] Cloud storage integration
- [ ] File sharing analytics

## 🙋‍♂️ Support

For support, please open an issue on GitHub or contact the development team.

---

**Reverse QR File Share** - Revolutionizing file sharing with receiver-initiated QR codes! 🚀
