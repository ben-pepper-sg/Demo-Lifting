# AGENT.md - TFW MMA Lifting Program

## Build & Testing Commands
- **Client**: `cd client && npm run build` | Test: `npm test` | Single test: `npm test -- --testNamePattern="test name"`
- **Server**: `cd server && npm run build` | Test: `npm test` | Single test: `npm test -- --testNamePattern="test name"`
- **Test types**: `npm run test:unit`, `npm run test:integration`, `npm run test:coverage`, `npm run test:watch`
- **Dev servers**: Client: `cd client && npm start` (port 3000) | Server: `cd server && npm run dev` (port 3001)

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS client app
- **Backend**: Node.js Express server with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt hashing
- **Testing**: Jest for unit/integration tests, Cypress for E2E

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Imports**: ES6 imports, prefer named imports over default
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error handling**: Use try/catch blocks, return proper HTTP status codes
- **Testing**: Describe blocks for test groups, `it()` for individual tests
- **File structure**: `/client/src` for React code, `/server/src` for API code

When addressing a Sentry issue, follow these guidelines

- Create a new branch for each Sentry issue
- Name the branch with the Sentry issue number and a brief description
- Write a failing unit test to show you understands the issue.
- apply the fix without changing the test. You can NOT change the test to make it passing. 
- Include a link to the Sentry issue in the PR description
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