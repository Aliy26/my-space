# Umar — Portfolio

A full-stack portfolio website built with React, TypeScript, Node.js, and MongoDB. Features a dynamic admin panel, multi-language support (English, Korean), and JWT-based authentication.

## Tech Stack

**Frontend** — React 19, TypeScript, Vite, i18next, CSS (custom)
**Backend** — Node.js, Express 5, MongoDB, Mongoose, Multer, JWT

---

## Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## Running in Development

Open two terminals:

**Terminal 1 — Backend:**

```bash
cd server
npm run dev
```

Server runs at `http://localhost:4000`

**Terminal 2 — Frontend:**

```bash
cd client
npm run dev
```

Client runs at `http://localhost:5173`

---

## Building for Production

```bash
cd client
npm run build
```

The built files go to `client/dist/`. The Express server automatically serves them if they exist.

To run in production:

```bash
cd server
npm start
```

Open two terminals:

**Terminal 1 — Backend:**

```bash
cd server
npm run dev
```

Server runs at `http://localhost:4000`

**Terminal 2 — Frontend:**

```bash
cd client
npm run dev
```

Client runs at `http://localhost:5173`

---

## Building for Production

```bash
cd client
npm run build
```

The built files go to `client/dist/`. The Express server automatically serves them if they exist.

To run in production:

```bash
cd server
npm start
```

---

## Admin Panel

Visit `/admin` to access the admin panel.

On first server start, an admin user is automatically created using `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env`.

From the admin panel you can:

- Upload and update your profile image
- Upload and replace your resume (PDF)
- Add, edit, and delete projects
- Set the default site language (English or Korean)

---

## Environment Variables

### Server (`server/.env`)

| Variable         | Description                   | Default                 |
| ---------------- | ----------------------------- | ----------------------- |
| `PORT`           | Server port                   | `4000`                  |
| `MONGODB_URI`    | MongoDB connection string     | —                       |
| `CLIENT_URL`     | Frontend URL for CORS         | `http://localhost:5173` |
| `JWT_SECRET`     | Secret for signing JWT tokens | `changeme`              |
| `ADMIN_USERNAME` | Admin login username          | `admin`                 |
| `ADMIN_PASSWORD` | Admin login password          | `admin123`              |

### Client (`client/.env.local`)

| Variable            | Description          |
| ------------------- | -------------------- |
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Project Structure

```
Port/
├── client/          # React + TypeScript frontend
│   └── src/
│       ├── components/   # UI components
│       ├── i18n/         # Translations (en, ko)
│       ├── lib/          # API client
│       ├── styles/       # CSS files
│       └── types/        # TypeScript types
└── server/          # Node.js + Express backend
    └── src/
        ├── middleware/   # JWT auth middleware
        ├── models/       # Mongoose schemas
        ├── routes/       # API route handlers
        └── utils/        # Serializers
```
