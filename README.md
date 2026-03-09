# TaskFlow

A MERN stack application for task management.

## Project Structure

```
taskflow/
├── client/          # React frontend with Vite + Tailwind CSS
├── server/          # Express backend with MongoDB
└── README.md
```

## Setup Instructions

### Frontend (client)
```bash
cd client
npm install
npm run dev
```

### Backend (server)
```bash
cd server
npm install
# Create .env file with MONGODB_URI
npm run dev
```

## Environment Variables

Create a `.env` file in the server directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
```

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Development**: Nodemon
