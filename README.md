# Book-A Room a Room Booking Platform

A room booking platform that enables users to search, view, and reserve available rooms. The application provides a booking experience with real-time availability updates, user authentication, and booking management capabilities.

## High-Level Architecture

The application follows a **modular architecture** with clear separation between frontend and backend services, designed for scalability and maintainability.

### System Components

**Frontend (React Router v7)**
- Built with React Router v7 for file-based routing and server-side rendering capabilities
- React Query for efficient data fetching, caching, and state management
- Type-safe API client generated from OpenAPI specifications
- Component-based architecture with separation of concerns (routes, components, hooks, lib)
- React Query caching with 5-minute stale time and 10-minute cache retention
- Dockerized for consistent deployment across environments

**Backend (NestJS)**
- Modular architecture organized by feature domains (auth, users, rooms, bookings, emails)
- Dependency injection pattern throughout for testability and maintainability
- Service layer architecture with thin controllers delegating business logic to services
- Global modules for shared concerns (database connection, configuration)
- Dockerized for consistent deployment across environments
- Designed to be Redis-ready for future caching implementation

**Database Layer**
- PostgreSQL with Drizzle ORM for type-safe database operations
- Connection pooling configured for optimal resource management
- Schema-driven development with migration support

### Architectural Patterns

**Feature-Based Module Structure**
Each business domain (authentication, room management, bookings) is encapsulated in its own module with clear boundaries, enabling:
- Independent development and testing
- Future microservices extraction
- Clear separation of concerns

**Service Layer Pattern**
Controllers handle HTTP concerns while services contain business logic, enabling:
- Reusable business logic
- Easier unit testing
- Clear API boundaries

**Type Safety Across Stack**
Type-safe communication between frontend and backend through:
- OpenAPI specification generation from backend
- Automatic TypeScript type generation for frontend
- Zod schema validation for runtime type checking

**JWT-Based Authorization**
Stateless JWT authentication enables:
- No server-side session state required
- Independent token validation across services
- Horizontal scaling without shared state
- Token-based access control across service boundaries

### Design Philosophy

The modular architecture supports:
- Horizontal scaling of services
- Performance optimizations at module level
- Gradual migration to microservices if needed
- Independent frontend/backend scaling


## API Design

> **⚠️ Note:** The API is running on a Docker image served using Render's free tier. The server may need to load on first access and it may take approximately 30 seconds on first call (Cold Start).

**Swagger Documentation:** [https://booka-docker.onrender.com/api](https://booka-docker.onrender.com/api)

The API follows RESTful principles and uses a consistent response format. All endpoints are prefixed with `/api/v1`.

### Health Endpoints

- `GET /api/v1/health` - Check application health status
  - **Authorization:** Not required

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user account
  - **Authorization:** Not required

- `POST /api/v1/auth/login` - Authenticate user and receive JWT tokens
  - **Authorization:** Not required

- `POST /api/v1/auth/refresh` - Refresh access token using refresh token
  - **Authorization:** Not required

- `POST /api/v1/auth/logout` - Logout user and invalidate tokens
  - **Authorization:** Required (JWT Bearer token)

### User Management Endpoints

- `GET /api/v1/users/me` - Get current authenticated user's profile
  - **Authorization:** Required (JWT Bearer token)

- `PATCH /api/v1/users/me` - Update current authenticated user's profile
  - **Authorization:** Required (JWT Bearer token)

- `POST /api/v1/users` - Create a new user (admin function)
  - **Authorization:** Required (JWT Bearer token)

### Room Search Endpoints

- `GET /api/v1/rooms` - Search available rooms with filters (date range, location, capacity, amenities, price range)
  - **Authorization:** Not required
  - Supports pagination and multiple filter combinations

- `GET /api/v1/rooms/locations` - Get all unique room locations
  - **Authorization:** Not required

- `GET /api/v1/rooms/:id` - Get detailed information about a specific room
  - **Authorization:** Not required

- `GET /api/v1/rooms/:id/availability` - Check room availability for a specific date range
  - **Authorization:** Not required

### Booking Management Endpoints

- `POST /api/v1/bookings` - Create a new room booking
  - **Authorization:** Required (JWT Bearer token)

- `GET /api/v1/bookings` - Get authenticated user's booking history with optional filters (status, date range)
  - **Authorization:** Required (JWT Bearer token)
  - Supports pagination

- `GET /api/v1/bookings/:id` - Get detailed information about a specific booking
  - **Authorization:** Required (JWT Bearer token)
  - Users can only access their own bookings

- `PATCH /api/v1/bookings/:id/cancel` - Cancel a specific booking
  - **Authorization:** Required (JWT Bearer token)
  - Users can only cancel their own bookings

## Database Schema

### Overview

PostgreSQL relational schema with foreign key constraints, unique indexes, and check constraints. Normalized structure with clear separation between users, rooms, and bookings.

### Tables

#### Users Table
Stores user account information and authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PRIMARY KEY | Auto-incrementing user identifier |
| `email` | text | NOT NULL, UNIQUE | User email address (unique across system) |
| `name` | text | NOT NULL | User's full name |
| `password` | text | NOT NULL | Hashed password (bcrypt) |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updated_at` | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

#### Rooms Table
Stores room information including location, capacity, pricing, and amenities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PRIMARY KEY | Auto-incrementing room identifier |
| `name` | text | NOT NULL | Room name/title |
| `description` | text | NULL | Detailed room description |
| `location` | text | NOT NULL | Room location (city, address, etc.) |
| `capacity` | integer | NOT NULL | Maximum number of guests |
| `price_per_night` | decimal(10,2) | NOT NULL | Price per night in currency units |
| `amenities` | jsonb | NULL | JSON object containing amenities (WiFi, parking, etc.) |
| `images` | text[] | NULL | Array of image URLs |
| `status` | enum | NOT NULL, DEFAULT 'available' | Room status: 'available' or 'unavailable' |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | Room creation timestamp |
| `updated_at` | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

#### Bookings Table
Stores booking information linking users to rooms with date ranges and pricing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PRIMARY KEY | Auto-incrementing booking identifier |
| `user_id` | integer | NOT NULL, FK → users.id | Foreign key to users table (CASCADE DELETE) |
| `room_id` | integer | NOT NULL, FK → rooms.id | Foreign key to rooms table (CASCADE DELETE) |
| `check_in_date` | date | NOT NULL | Booking check-in date |
| `check_out_date` | date | NOT NULL | Booking check-out date |
| `total_price` | decimal(10,2) | NOT NULL | Total booking price |
| `status` | enum | NOT NULL, DEFAULT 'pending' | Booking status: 'pending', 'confirmed', 'cancelled', 'completed' |
| `cancellation_reason` | text | NULL | Reason for cancellation (if applicable) |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | Booking creation timestamp |
| `updated_at` | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Constraints:**
- Check constraint: `check_out_date > check_in_date` (ensures valid date range)
- Partial unique index: Prevents overlapping bookings for the same room when status != 'cancelled'

#### Refresh Tokens Table
Stores refresh tokens for JWT token rotation and revocation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PRIMARY KEY | Auto-incrementing token identifier |
| `user_id` | integer | NOT NULL, FK → users.id | Foreign key to users table (CASCADE DELETE) |
| `token` | text | NOT NULL, UNIQUE | Refresh token string |
| `expires_at` | timestamp | NOT NULL | Token expiration timestamp |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | Token creation timestamp |

**Constraints:**
- Unique constraint on `token`
- Unique constraint on (`user_id`, `token`) combination

### Relationships

#### One-to-Many Relationships

**Users → Bookings (One-to-Many)**
- One user can have many bookings
- Relationship: `users.id` → `bookings.user_id`
- Cascade delete: When a user is deleted, all their bookings are automatically deleted
- **Application:** Users can view their complete booking history

**Rooms → Bookings (One-to-Many)**
- One room can have many bookings (across different date ranges)
- Relationship: `rooms.id` → `bookings.room_id`
- Cascade delete: When a room is deleted, all associated bookings are automatically deleted
- **Application:** Rooms can display their booking history and availability

**Users → Refresh Tokens (One-to-Many)**
- One user can have multiple refresh tokens (for different devices/sessions)
- Relationship: `users.id` → `refresh_tokens.user_id`
- Cascade delete: When a user is deleted, all their refresh tokens are automatically deleted
- **Application:** Supports token rotation and multi-device authentication

#### Many-to-One Relationships

**Bookings → Users (Many-to-One)**
- Many bookings belong to one user
- Relationship: `bookings.user_id` → `users.id`
- **Application:** Each booking is associated with exactly one user

**Bookings → Rooms (Many-to-One)**
- Many bookings can be made for one room (at different times)
- Relationship: `bookings.room_id` → `rooms.id`
- **Application:** Each booking is associated with exactly one room

**Refresh Tokens → Users (Many-to-One)**
- Multiple refresh tokens can belong to one user
- Relationship: `refresh_tokens.user_id` → `users.id`
- **Application:** Enables multi-session support per user

### Unique Indexes and Constraints

The database uses UNIQUE constraints and indexes to enforce data integrity and prevent duplicate entries:

- **`users.email`** - UNIQUE constraint ensuring each email address can only be registered once
- **`refresh_tokens.token`** - UNIQUE constraint preventing duplicate refresh tokens
- **`refresh_tokens(user_id, token)`** - Composite UNIQUE constraint ensuring a user cannot have duplicate tokens
- **`booking_dates_unique_active`** - Partial unique index on `bookings(room_id, check_in_date, check_out_date)` WHERE `status != 'cancelled'`
  - Prevents overlapping bookings for the same room
  - Only applies to non-cancelled bookings

### Database Design Principles

1. **Referential Integrity:** All foreign key relationships use CASCADE DELETE to maintain data consistency when parent records are removed
2. **Data Validation:** Check constraints ensure business rules are enforced at the database level (e.g., check-out date must be after check-in date)
3. **Concurrency Control:** Partial unique index on bookings prevents double-booking by ensuring no overlapping date ranges for non-cancelled bookings
4. **Audit Trail:** All tables include `created_at` and `updated_at` timestamps for tracking record lifecycle
5. **Flexible Data Storage:** JSONB column for amenities allows schema evolution without migrations
6. **Normalization:** Properly normalized schema reduces data redundancy and maintains consistency

## Concurrency Handling

Multiple concurrency control techniques prevent race conditions and ensure data consistency for booking operations.

### Implemented Techniques

#### 1. Database Transactions
All booking operations use transactions to ensure atomicity—all steps succeed or all fail.

**Usage:**
- Booking creation: Room lock, availability check, and booking insertion occur atomically
- Automatic rollback on error maintains data consistency

#### 2. Pessimistic Locking with FOR UPDATE
Row-level locking prevents concurrent modifications during booking operations.

**Implementation:**
- Room row locked with `SELECT ... FOR UPDATE` during booking creation
- Exclusive lock prevents other transactions until completion
- Concurrent attempts wait for lock release

**Example Flow:**
1. Transaction begins
2. Room row is locked with `FOR UPDATE`
3. Availability is checked within the locked transaction
4. Booking is created if available
5. Transaction commits (lock released)

If two users attempt to book the same room simultaneously:
- First request acquires the lock and proceeds
- Second request waits for the lock
- First request completes and commits
- Second request acquires lock, checks availability, and receives conflict error

#### 3. Partial Unique Index
Partial unique index `booking_dates_unique_active` on `(room_id, check_in_date, check_out_date)` WHERE `status != 'cancelled'` prevents overlapping bookings at the database level.

**Benefits:**
- Database-level enforcement prevents double-booking
- Only applies to active bookings
- Works with FOR UPDATE locks for defense-in-depth

#### 4. Conflict Detection
Application-level checks for overlapping date ranges before creating bookings.

**Logic:**
- Same room, non-cancelled status, overlapping dates

**Combined Approach:**
- FOR UPDATE lock prevents race conditions
- Conflict detection identifies overlaps
- Partial unique index provides database-level protection

### Concurrency Control Flow

```
User Request → Transaction Start → FOR UPDATE Lock (Room) 
  → Availability Check → Conflict Detection → Booking Creation 
  → Transaction Commit → Lock Release
```

### Future Implementation: Distributed Locks (Not Implemented Yet)

For multi-instance deployments, Redis can be added for distributed locking:
- Coordinate booking operations across instances
- Enable horizontal scaling of booking services
- Reduce database lock contention
- Improve performance under high concurrency

The modular design enables adding Redis without major refactoring.

## Scalability Strategies

Progressive scalability strategy to handle increasing traffic while maintaining performance and simplicity.

### Current Implementations

#### Containerization (Docker)
- **Frontend:** Dockerized for consistent deployment across environments
- **Backend:** Dockerized with multi-stage builds for optimized production images

#### Database Optimizations
- **Connection Pooling:** Configured with max 10 connections per instance to optimize database resource usage

#### Stateless Architecture
- **JWT Authentication:** Stateless design enables horizontal scaling

#### Code Design
- **Domain Separation:** Clear feature boundaries support future microservices extraction

### Future Improvements (Not Yet Implemented)

#### Caching (Redis)
- **Search Operations:** Query result caching with TTLs (room searches: 5-15 min, locations: 24 hours, room details: 10 min)
- **Booking Operations:** Distributed locks (Redlock) for cross-instance coordination, rate limiting, session data caching
- **Cache-aside pattern** with invalidation on updates

#### Database Replication
- **Read Replicas:** Handle search queries, availability checks, user profiles, booking history
- **Primary Database:** All write operations (bookings, updates)
- Route reads to replicas, writes to primary; handle replication lag for critical operations

#### Load Balancing
- **Application Layer:** load balancing with health checks (`/api/v1/health`)
- **Traffic Distribution:** Round-robin for general traffic, least connections for bookings
- **Database Load Balancing:** Route read queries across replicas

#### Queue Management Platform
Async processing for email notifications, search index updates, analytics events, and high-traffic booking workflows.

#### Monitoring & Observability
Track performance metrics, resource usage, and database performance. Implement distributed tracing and alerts for critical failures and performance degradation.

#### Google Analytics
User behavior tracking, performance insights, and business intelligence (booking trends, peak usage, revenue analytics).

#### A/B Testing Platform
Test search experience, booking flow, pricing display, and recommendation algorithms. Use feature flags, statistical significance tracking, and user segmentation.

#### Service Discovery (Consul)
Automatic service registration, health checking, DNS-based communication, and centralized configuration management.

## Optional Components

**Email Notifications (Resend Service)**
- **Booking Confirmation Emails:** Automatically sent when a room is successfully booked, including booking details (ID, room name, dates, total price)
- **Cancellation Emails:** Sent when a booking is cancelled.
- **Welcome Emails:** Sent to new users upon registration
- **Implementation:** Uses Resend service with retry logic
