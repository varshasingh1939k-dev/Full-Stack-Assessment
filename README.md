# Team Task Manager

A full-stack web application for managing team tasks and projects.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT, bcrypt

## Setup

### Prerequisites
- Node.js installed
- PostgreSQL database available

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Setup Database
- Create a `.env` file in the `server` directory and add your `DATABASE_URL` and `JWT_SECRET`.
- Run Prisma migrations:
```bash
cd server
npx prisma db push
```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment
This project is configured to be deployed on Railway. The backend Express server handles API requests and serves the static production build of the React frontend.
