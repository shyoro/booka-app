# Booka - Room Booking Platform

A scalable and fault-tolerant backend service for searching and booking rooms, with comprehensive booking history and user management capabilities.

## Overview

Booka is a NestJS-based backend service designed to handle room booking operations at scale. The platform supports user registration, room search, booking management, cancellation, and booking history retrieval with confirmation email notifications.

## Features

- **User Management**: User registration and authentication
- **Room Search**: Advanced search with filters (date, location, capacity, amenities)
- **Booking Management**: Create, view, and cancel room bookings
- **Booking History**: Retrieve complete booking history for users
- **Email Notifications**: Automated confirmation emails for bookings
- **Health Monitoring**: Built-in health check endpoints
- **Rate Limiting**: API rate limiting for protection against abuse
- **Multi-Region Support**: Designed for distributed deployment
- **Data Consistency**: Transaction-based operations with concurrency control

## Tech Stack

- **Framework**: NestJS 10.3.0
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM 0.29.0
- **Validation**: Zod 3.22.4 with nestjs-zod
- **Runtime**: Node.js 20
- **Containerization**: Docker & Docker Compose
- **Testing**: Vitest

## Prerequisites

- Node.js 20 or higher
- Docker and Docker Compose
- PostgreSQL 16 (or use Docker Compose)
- npm or yarn package manager

## Installation & Setup

### Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd booka
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/booka
```

4. Start PostgreSQL database:
```bash
docker-compose up -d postgres
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`

### Docker Setup

1. Build and start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- NestJS application on port 3000

2. Run database migrations:
```bash
docker-compose exec app npm run db:migrate
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (development/production/test) | `development` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required in production |

## Development

### Available Scripts

- `npm run build` - Build the application for production
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start production build
- `npm run lint` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

### Database Commands

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema changes directly to database (dev only)
- `npm run db:studio` - Open Drizzle Studio for database management

### Project Structure

```
booka/
├── src/
│   ├── app.module.ts          # Root application module
│   ├── main.ts                 # Application entry point
│   ├── config/                 # Configuration and environment validation
│   ├── database/               # Database schema and Drizzle setup
│   ├── health/                 # Health check module
│   └── common/                 # Shared utilities and DTOs
├── docker/                     # Docker configuration
├── test/                       # Test files
├── docker-compose.yml          # Docker Compose configuration
├── drizzle.config.ts           # Drizzle ORM configuration
└── package.json                # Dependencies and scripts
```

## API Documentation

### Health Check

- `GET /health` - Returns application health status

Example response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### API Endpoints (To be implemented)

The following endpoints will be available:

- **Authentication**
  - `POST /auth/register` - Register a new user
  - `POST /auth/login` - User login
  - `POST /auth/logout` - User logout

- **Rooms**
  - `GET /rooms` - Search rooms with filters
  - `GET /rooms/:id` - Get room details

- **Bookings**
  - `POST /bookings` - Create a new booking
  - `GET /bookings` - Get user's booking history
  - `GET /bookings/:id` - Get booking details
  - `DELETE /bookings/:id` - Cancel a booking

## Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:cov
```

Run end-to-end tests:
```bash
npm run test:e2e
```

## Contributing

Please follow the project's coding standards:

- Avoid nested if statements - use early returns or guard clauses
- Avoid the use of `else` keyword when possible
- Avoid nested loops as much as possible
- Use the most efficient code possible
- Always add JSDoc comments to new functions, methods, or classes
- Keep functions short and focused on a single responsibility
- Use template literals for string generation in JavaScript/TypeScript
- Use single quotes in code (double quotes only in HTML/templates)

### Code Style

- Use TypeScript strict mode
- Prefer type inference where possible
- Use interfaces for object shapes
- Always type function parameters and return types

### NestJS Patterns

- Use dependency injection for all services
- Keep controllers thin - delegate business logic to services
- Use modules to organize code by feature
- Use global modules sparingly

## Deployment

### Production Considerations

1. **Environment Variables**: Ensure all required environment variables are set
2. **Database Migrations**: Run migrations before starting the application
3. **Health Checks**: Configure health check endpoints for load balancers
4. **Rate Limiting**: Configure rate limiting based on your requirements
5. **Logging**: Set up proper logging and monitoring
6. **Security**: Enable HTTPS, configure CORS appropriately, and use secure authentication

### Docker Production Build

```bash
docker build -f docker/Dockerfile -t booka:latest .
```

## Architecture

For detailed system architecture, design patterns, and business logic documentation, see [AGENTS.md](./AGENTS.md).

## License

UNLICENSED - Private project

