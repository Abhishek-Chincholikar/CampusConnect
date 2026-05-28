# SIESCOMS Committees & Clubs Portal

A premium MERN stack portal for SIESCOMS student clubs, committees, and applicant selection workflows.

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
