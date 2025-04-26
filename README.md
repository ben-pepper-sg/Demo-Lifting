# TFW MMA Lifting Program

A full-stack web application for managing an 8-week weightlifting program. The application allows users to sign up for lifting sessions, track their progress, and view their workout plans.

## Features

- User authentication with admin privileges
- 8-week progressive lifting program
- Scheduling system for workout sessions
- Weight calculation based on user's max lifts
- Mobile-friendly responsive design

## Tech Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt

## Project Structure

- `/server`: Backend API and database connection
- `/client`: Frontend React application

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file based on .env.example:
   ```bash
   cp .env.example .env
   ```

4. Update the `DATABASE_URL` in the .env file to point to your PostgreSQL database

5. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Seed the database with workout programs and initial data:
   ```bash
   npm run seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user's information

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (admin only)

### Workouts
- `GET /api/workouts` - Get user's workout logs
- `POST /api/workouts` - Log a new workout
- `PUT /api/workouts/max-lifts` - Update max lift values
- `GET /api/workouts/scheme` - Get workout scheme for a specific week
- `GET /api/workouts/calculate` - Calculate weights based on percentages

### Schedule
- `GET /api/schedule` - Get all schedules
- `POST /api/schedule` - Create a new schedule (admin/coach only)
- `POST /api/schedule/:scheduleId/book` - Book a time slot
- `DELETE /api/schedule/:scheduleId/book` - Cancel a booking
- `GET /api/schedule/class` - Get class details for the next hour

## License

This project is licensed under the MIT License - see the LICENSE file for details.