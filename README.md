# 🗄️ GSpace — Personal Cloud Storage (Node + Express + React + SQLite)

A modern, high-performance personal cloud storage web application converted from Java Spring Boot + Hibernate to a full-stack **MERN-style architecture using SQLite** (`mydrive.db`).

---

## ⚡ Tech Stack

- **Frontend**: React 18 (Vite), Glassmorphism modern UI styling, Lucide icons, multi-media preview modal, drag-and-drop file uploader, search & sort.
- **Backend**: Node.js, Express.js, JWT authentication, Multer file upload handling.
- **Database**: SQLite (`mydrive.db`) with `better-sqlite3` / `sqlite3` driver — **100% compatible with existing Java Spring Boot schema and BCrypt user accounts**.
- **Storage**: Local filesystem storage in `./uploads` with unique UUID prefixed naming.

---

## ✨ Features

- 🔐 **JWT Authentication & Security**: Register and log in securely with password hashing (`bcryptjs`) compatible with Java Spring Security.
- 📂 **Drag & Drop Uploads**: Support for images, videos, PDFs, archives, and documents up to 500MB per file.
- 👁️ **Multi-Media Preview Modal**: In-browser image viewer with zoom, HTML5 video player, embedded PDF viewer.
- 📊 **Storage Meter**: Visual storage breakdown showing total files, bytes used, free-tier capacity, and category breakdown.
- 🔍 **Real-Time Search & Sorting**: Filter files by name and sort by date, name, or file size.
- 🌗 **Dark / Light Mode**: Dynamic glassmorphism design system supporting theme switching.
- 📱 **Responsive Grid & List View**: Switch between visual image grid and compact list layout.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running

1. **Install Dependencies** (Root, Server, and Client):
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd server && npm install && cd ..

   # Install frontend dependencies
   cd client && npm install && cd ..
   ```

2. **Build & Start Full Application**:
   ```bash
   # Build React frontend
   npm run build

   # Start Express server (Serves API + Frontend on port 5000)
   npm start
   ```

3. Open your browser and visit: **`http://localhost:5000`**

### Development Mode
To run client and server concurrently with hot reloading:
```bash
npm run dev
```

---

## 📑 API Endpoints

### Authentication
- `POST /api/auth/signup` — Create a new account
- `POST /api/auth/login` — Authenticate user & return JWT token
- `GET /api/auth/me` — Get current logged in user profile

### File Management
- `GET /api/files` — List files owned by authenticated user
- `POST /api/files/upload` — Upload file (multipart/form-data)
- `GET /api/files/download/:storedName` — Stream/download file content
- `DELETE /api/files/:id` — Delete file from database and disk
- `GET /api/files/stats` — Get total files count and storage space used

---

## 🗄️ Database Schema (`mydrive.db`)

### `users` Table
| Column | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `username` | TEXT | UNIQUE, NOT NULL |
| `password` | TEXT | NOT NULL (BCrypt Hash) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `files` Table
| Column | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `original_name` | TEXT | NOT NULL |
| `stored_name` | TEXT | NOT NULL |
| `mimetype` | TEXT | |
| `size` | INTEGER | |
| `uploaded_by` | INTEGER | FOREIGN KEY -> `users(id)` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## 📦 Repository
- Repository: [https://github.com/Abhinavan2004/GSpace](https://github.com/Abhinavan2004/GSpace)
