# TFW MMA Lifting Program - Agent Guide

## Build/Test Commands
- **Client (React + TypeScript)**: `cd client && npm start` (dev), `npm run build`, `npm test`, `npm run test:coverage`
- **Server (Node.js + Express)**: `cd server && npm run dev`, `npm run build`, `npm start`
- **Test single file**: `npm test -- --testNamePattern="TestName"` or `npm test -- path/to/test.test.ts`
- **Run specific test types**: `npm run test:unit`, `npm run test:integration` (server), `npm run test:a11y` (client)
- **Database**: `npx prisma migrate dev`, `npm run seed`, `npm run ensure-workout-schemes`

## Architecture
- **Full-stack app**: React client (port 3000) + Express server (port 3001)
- **Database**: PostgreSQL with Prisma ORM (see `server/prisma/schema.prisma`)
- **Auth**: JWT tokens with bcrypt, stored in localStorage
- **Key models**: User, Program, WorkoutScheme, Schedule, Booking, SupplementalWorkout
- **API structure**: RESTful endpoints at `/api/{auth,users,workouts,schedule}`

## Code Style
- **TypeScript**: Strict typing, interfaces for data models
- **React**: Functional components with hooks, Tailwind CSS for styling
- **Imports**: Absolute imports from `src/`, grouped (external, internal, relative)
- **Naming**: camelCase for variables/functions, PascalCase for components, kebab-case for files
- **Error handling**: Try-catch blocks, API error interceptors, validation with express-validator
- **Testing**: Jest + React Testing Library (client), Jest + Supertest (server), MSW for mocking

## Task/Issue source
- References to project Issues starting with TS-* are from linear, access these via the Linear MCP server

# Pull Request Guidelines

When creating a pull request, follow these guidelines

- Create a new branch for each user story
- Name the branch with the user story number and a brief description
- Include a link to the user story in the PR description
- Create a PR using the GitHub Cli using the gh commands `gh pr create` 
- When create a GitHub PR be sure to include all the items below - to ensure it's formatted correctly use the flag --body-file with a temp pr-description.md file that isn't commited.
- Reference any relevant issues in the PR description 
- Include a high level summary of the changes made in the PR description for a product manager to understand
- When pushing a branch in GitHub always push to origin and never create a Fork
- Include another summary of the changes made in the PR description for a developer to understand (Technical Notes)
- Include a mermaid digram explain how the new features work in the PR description. This is to help a human quickly get up to speed as to what was changed and why. This is very important.
- Ensure all CI checks pass before merging (unit tests)
- Outline if you added any additional unit tests in the description and include the names of the new tests added and number of tests removed eg (Added 2 tests, removed 1 test) with a summary of the tests added and removed.
- Include Human testing instructions for a human to review with URLS, eg visit / , perform action, expected 1. toggle to do XYZ
- No need to include screenshots in the PR