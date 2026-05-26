# PinSphere Backend

Node.js + Express + MongoDB Atlas backend server.

## Installation
```bash
npm install --legacy-peer-deps
```

## Running Dev Server
```bash
npm run dev
```

## Running Production Start
```bash
npm start
```

## Environment Variables (.env)
Create a `.env` file in the root of the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pinsphere
JWT_SECRET=super_secret_jwt_key_pinsphere_2026
CLOUDINARY_CLOUD_NAME=placeholder
CLOUDINARY_API_KEY=placeholder
CLOUDINARY_API_SECRET=placeholder
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
If you don't supply valid Cloudinary credentials, the application will fallback to saving files locally in `backend/uploads/` on the server disk.
