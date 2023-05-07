# TypeScript Node Express Prisma

Express boilerplate with TypeScript and Prisma to quickly create RESTful APIs.

## Getting Started

Clone this repository:

```bash
git clone https://github.com/joagaloppo/ts-node-express.git
```

Install dependencies:

```bash
cd ts-node-express
npm install
```

Set up environment variables in a `.env` file:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

Access the server at `http://localhost:3000`

## Features

- Relational Database: MySQL integrated with Prisma ORM
- Robust Authentication: Passport.js for secure authentication
- Secure Tokens: JSON Web Tokens with rotating refresh tokens
- Error Handling: Middleware for consistent error handling and responses
- Advanced Logging: Comprehensive logging using Winston and Morgan
- Code Quality: Linting and formatting with ESLint and Prettier
- Containerization: Docker support for simplified deployment

## Functionalities

### Authentication:
- Register: Sign up using email/password or a Google account
- Login: Sign in using email/password or a Google account
- Logout: Revoke the current refresh token and end the session
- Token Management: Refresh access tokens when they expire
- Password Recovery: Reset password through email verification

### User Management:

#### For users:
- Account Details: View personal account information
- Account Updates: Edit personal account information
- Account Deletion: Delete personal account

#### For admins:
- User Listing: View a list of all users
- User Creation: Add a new user to the system
- Mass Deletion: Remove all users from the system
- User Retrieval: Access specific user details
- User Editing: Modify specific user details
- User Removal: Delete specific user accounts

## Dependencies

### Web server:
- express: Web server framework for building APIs and web applications.
- pm2: Production process manager for Node.js applications.

### Database and ORM:
- prisma: Prisma ORM for database management and easy access to data.
- prisma/client: Prisma client for querying the database.

### Authentication and authorization:
- passport: Authentication middleware for Node.js.
- passport-jwt: Passport Strategy for auth with a JSON Web Token.
- jsonwebtoken: Implementation of JSON Web Tokens for authentication.
- bcryptjs: Library for hashing and checking passwords.

### Email and messaging:
- nodemailer: Node.js module for sending emails.

### Configuration and environment:
- dotenv: Module for loading environment variables from a .env file.
- dayjs: Library for parsing, manipulating, and displaying dates and times.
- http-status: Utility for easy access to HTTP status codes.

### Logging:
- winston: Logger library for recording logs with multiple transports.
- morgan: HTTP request logger middleware for Express.

### Linting and formatting:
- eslint: Linter for enforcing code style and detecting errors.
- prettier: Code formatter for maintaining a consistent code style.

### Testing:
- jest: Testing framework for running unit and integration tests.
- supertest: Library for testing HTTP server APIs.
- faker: Library for generating fake data.
- node-mocks-http: Library for mocking Express.js HTTP objects.

### Security and optimization:
- compression: Middleware for gzip compression.
- cors: Middleware for enabling CORS with various options.
- helmet: Middleware for setting various security-related HTTP headers.

### Validation and rate limiting:
- express-rate-limit: Middleware for basic rate limiting.
- joi: Library for data validation.

### Git hooks and environment management:
- husky: Library for managing Git hooks.
- cross-env: Library for setting environment variables across platforms.
- lint-staged: Library for linting and formatting staged Git files pre-commit.

