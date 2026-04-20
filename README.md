# PlaceMate Deployment Guide

This project has two parts:

- `backend/` -> Node/Express API (deploy to Render)
- `client/` -> React + Vite app (deploy to Vercel)

## Backend (Render)

Create a **Web Service** in Render and use these settings:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Set these environment variables in Render:

- `NODE_ENV=production`
- `PORT=10000` (or leave unset; Render injects port automatically)
- `MONGODB_URI=<your-mongodb-connection-string>`
- `JWT_ACCESS_SECRET=<strong-random-secret>`
- `JWT_ACCESS_EXPIRY=1d`
- `JWT_COOKIE_NAME=pm_access_token`
- `ENABLE_IN_MEMORY_MONGO=false`
- `CLIENT_URL=<your-vercel-production-url>`

If you have a custom frontend domain, include it too:

- `CLIENT_URL=https://your-app.vercel.app,https://your-custom-domain.com`

After deployment, verify backend health:

- `GET https://<your-render-service>.onrender.com/api/health`

## Frontend (Vercel)

Import the repo in Vercel and use these settings:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Set frontend environment variable in Vercel:

- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`

`client/vercel.json` is added for SPA route rewrites, so refresh/direct URL access works.

## Notes

- Render free tier may sleep when idle; first API call can be slow.
- `uploads/` on Render is ephemeral. For persistent file storage, use Cloudinary/S3.
- Keep backend and frontend env vars synced whenever you change domains.
