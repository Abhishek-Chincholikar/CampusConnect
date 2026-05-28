# CampusConnect

A premium MERN stack portal for SIESCOMS student committees, clubs, and applicant selection workflows.

## Structure

- `backend` - Express, Mongoose, JWT-protected routes, and MongoDB models.
- `frontend` - React, Vite, and Tailwind CSS dashboard.

## Local Setup

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Create `backend/.env` from `backend/.env.example` and set `MONGO_URI` and `JWT_SECRET`.

3. Start the backend:

   ```bash
   npm run dev:backend
   ```

4. Start the frontend:

   ```bash
   npm run dev:frontend
   ```

The frontend reads `VITE_API_BASE_URL`; if unset, it uses `http://localhost:5000/api`.

## Deployment

- Render uses `render.yaml` to deploy the backend API from the `backend` folder.
- Vercel uses `vercel.json` to build and publish the React app from `frontend`.
- Set `MONGO_URI` in Render using your MongoDB Atlas connection string.
- Set `VITE_API_BASE_URL` in Vercel to your Render API URL with `/api` appended.
