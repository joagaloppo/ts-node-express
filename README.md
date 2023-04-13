# TypeScript Node Express Prisma

This is an Express server boilerplate project made with TypeScript, Node, Prisma and several other features to create a foundation for scalable and maintainable web applications. This project was developed as a learning journey. I tried to use the latest technologies, following best practices and conventions. I know it won't be perfect that's why I genuinely appreciate any feedback, corrections, or suggestions that will contribute to the improvement of this boilerplate and my development skills.

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

- NoSQL database: MongoDB with Prisma
- Authentication with Passport.js
- JSON Web Tokens with rotating refresh tokens
- Middleware for centralized for error handling
- Logging with Winston and Morgan
- Linting: ESLint and Prettier
- Docker support

## Functionalities

- Register (email/password or Google account)
- Login (email/password or Google account)
- Log out (destroy current refresh token)
- Refresh access token when it expires
- View account information
- Verify email (SMTP server)
- Reset password (via email code)

## Dependencies

#### Web server:
- express: Web server framework for building APIs and web applications.
#### Database and ORM:
- prisma: Prisma ORM for database management and easy access to data.
- prisma/client: Prisma client for querying the database.
#### Authentication and authorization:
- passport: Authentication middleware for Node.js.
- passport-jwt: Passport Strategy for auth with a JSON Web Token.
- passport-google-oauth20: Strategy for auth with Google OAuth 2.0.
- jsonwebtoken: Implementation of JSON Web Tokens for authentication.
- bcryptjs: Library for hashing and checking passwords.
#### Email and messaging:
- nodemailer: Node.js module for sending emails.
#### Configuration and environment:
- dotenv: Module for loading environment variables from a .env file.
- moment: Library for parsing, manipulating, and displaying dates and times.
- http-status: Utility for easy access to HTTP status codes.
#### Logging:
- winston: Logger library for recording logs with multiple transports.
- morgan: HTTP request logger middleware for Express.
### Linting and formatting:
- eslint: Linter for enforcing code style and detecting errors.
- prettier: Code formatter for maintaining a consistent code style.
### Testing:
- jest: Testing framework for running unit and integration tests.
- supertest: Library for testing HTTP server APIs.

## Checklist

- [x]  Implement helmet middleware
- [x]  Configure proper CORS policies
- [x]  Enable gzip compression using compression middleware
- [x]  Integrate input validation (e.g., joi or express-validator)
- [x]  Add rate limiting (e.g., express-rate-limiter)
- [ ]  Support more authentication methods (e.g., facebook)
- [ ]  Add support for WebSocket (e.g., socket.io)
- [ ]  Implement role-based access control (RBAC)
- [ ]  Integrate API documentation (e.g., Swagger)
- [ ]  Write unit and integration tests (e.g., jest, mocha, chai, supertest)
- [ ]  Add a CI/CD pipeline (e.g., GitHub Actions, GitLab CI/CD, Jenkins)
- [ ]  Use a process manager (e.g., pm2, forever) in production
- [ ]  Include caching (e.g., redis)
