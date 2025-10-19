# Reverse QR File Share

A production-ready web application that enables secure file sharing through QR codes. The receiver initiates a session and displays a QR code, which the sender scans to upload files directly to cloud storage.

## 🚀 Features

- **Reverse QR Flow**: Receiver creates session, sender scans and uploads
- **Cloud Storage**: Files stored securely in Cloudinary (no local disk usage)
- **Chunked Uploads**: Supports large files with resumable upload capability
- **Real-time Progress**: Server-Sent Events (SSE) for live upload progress
- **Secure Downloads**: Time-limited signed URLs for file access
- **Auto Cleanup**: TTL indexes automatically remove expired sessions
- **Production Ready**: Security headers, rate limiting, error handling

## 🛠️ Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

3. **Configure environment variables**
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

4. **Start the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📱 Usage

### For Receivers (Creating Sessions)
1. Navigate to the application homepage
2. Click "Create Session"
3. A QR code will be generated and displayed
4. Share the QR code with the sender
5. Monitor real-time upload progress

### For Senders (Uploading Files)
1. Scan the QR code with your device
2. You'll be redirected to the upload page
3. Drag and drop files or click to select
4. Monitor upload progress in real-time

## 🏗️ Architecture

- **Backend**: Node.js 18+, Express 4.x
- **Database**: MongoDB Atlas with Mongoose 6.x
- **Storage**: Cloudinary v2 SDK
- **Frontend**: Vanilla JavaScript with modern ES6+
- **Real-time**: Server-Sent Events (SSE)
- **Security**: Helmet, CORS, rate limiting

## 🚀 Deployment

The application supports deployment to multiple platforms:
- Render.com
- Railway
- Fly.io
- AWS EC2
- Docker

See the deployment guide in the docs folder for detailed instructions.

## 🔧 API Endpoints

- `POST /api/session` - Create session and return QR code
- `GET /api/session/:id` - Get session status and files
- `POST /api/upload/init` - Initialize chunked upload
- `PUT /api/upload/part` - Upload file chunks
- `POST /api/upload/complete` - Finalize upload
- `GET /api/session/:id/file/:publicId` - Generate signed download URLs
- `GET /api/events` - SSE endpoint for real-time updates
- `GET /api/health` - Application health check

## 📝 License

MIT License - see LICENSE file for details.
