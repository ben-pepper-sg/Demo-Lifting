# TFW MMA Lifting Program

A full-stack web application for managing an 8-week weightlifting program. The application allows users to sign up for lifting sessions, track their progress, and view their workout plans.

## Features

- User authentication with admin privileges
- 8-week progressive lifting program
- Scheduling system for workout sessions
- Weight calculation based on user's max lifts
- Mobile-friendly responsive design
- Class view to display current participants and weights

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

### Database Setup

1. Install PostgreSQL if you don't already have it
2. Create a new database for the application:
   ```sql
   CREATE DATABASE tfwmma_lifting;
   ```

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

4. Update the `DATABASE_URL` in the .env file to point to your PostgreSQL database:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/tfwmma_lifting"
   ```
   (Replace with your PostgreSQL username, password and port if different)

5. Run Prisma migrations to create the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Seed the database with workout programs and initial data:
   ```bash
   npm run seed
   ```
   This will create an admin user with:
   - Email: admin@example.com
   - Password: admin123

7. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start on http://localhost:3001

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure the .env.development file has the correct API URL:
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm start
   ```
   The React app will start on http://localhost:3000

## Using the Application

### User Registration and Login
1. Visit http://localhost:3000 in your browser
2. Register a new account or login with the admin credentials

### Admin Features
- Create workout schedules
- Manage users
- Set up class times

### User Features
- Update personal max lifts
- Book workout sessions
- View your workout schedule and weights
- Track progress over time

### Class View
- The `/class` page displays participants for the upcoming class
- Shows each user's name and calculated weights for the current workout

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

## Development and Testing

### Server Tests
```bash
cd server
npm test
```

### Client Tests
```bash
cd client
npm test
```

## Deployment

For production deployment:

### Backend
```bash
cd server
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
```
Then serve the static files from the `build` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.