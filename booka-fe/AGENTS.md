# Booka Frontend - Architecture & Development Guide

This document provides comprehensive documentation of the Booka Room Booking Platform's frontend architecture, development patterns, and integration with the backend API. It serves as a reference for both AI agents and developers working on the frontend application.

## Table of Contents

1. [Business Logic & Requirements](#business-logic--requirements)
2. [Frontend Architecture](#frontend-architecture)
3. [Data Models](#data-models)
4. [API Integration](#api-integration)
5. [State Management](#state-management)
6. [Routing & Navigation](#routing--navigation)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Error Handling & Loading States](#error-handling--loading-states)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)

## Business Logic & Requirements

### Core Features

#### User Registration and Authentication
- Users can register with email and password
- Email must be unique across the system
- Password must meet security requirements
- Users can authenticate using email/password credentials
- JWT tokens are used for session management
- Tokens stored securely (HTTP-only cookies recommended, or secure localStorage)
- Automatic token refresh before expiration
- Logout functionality clears all authentication state

#### Room Search
- Users can search for available rooms with multiple filters:
  - **Date Range**: Check-in and check-out dates (date picker component)
  - **Location**: City, region, or specific address (autocomplete/search)
  - **Capacity**: Number of guests (number input/stepper)
  - **Amenities**: WiFi, parking, air conditioning, etc. (multi-select checkboxes)
  - **Price Range**: Minimum and maximum price per night (range slider)
- Search results are paginated with infinite scroll or page navigation
- Results show availability status in real-time
- Results include room images (image gallery/carousel), descriptions, and ratings
- Search state persists in URL query parameters for shareable/bookmarkable results
- Debounced search input to reduce API calls

#### Room Booking
- Users can book available rooms (must be authenticated)
- Booking process includes:
  1. Room detail view with availability calendar
  2. Date selection with availability visualization
  3. Booking form with guest information
  4. Payment processing UI (integration point)
  5. Booking confirmation page
  6. Confirmation email notification (handled by backend)
- Real-time availability checking during date selection
- Overlapping bookings are prevented (backend validation)
- Booking statuses: `pending`, `confirmed`, `cancelled`, `completed`
- Optimistic UI updates for better UX

#### Booking Cancellation
- Users can cancel their own bookings
- Cancellation confirmation dialog to prevent accidental cancellations
- Cancellation policies displayed (refund rules based on timing)
- Cancellation triggers:
  - Status update in UI (optimistic update)
  - Backend API call
  - Cancellation email notification (handled by backend)
  - Potential refund processing (integration point)

#### Booking History Retrieval
- Users can retrieve their complete booking history (must be authenticated)
- History includes:
  - All bookings (past, present, future)
  - Booking status with visual indicators
  - Room details with images
  - Dates and pricing
  - Cancellation information
- Results are paginated and sortable
- Filtering by date range and status
- Search functionality within booking history

## Frontend Architecture

### Technology Stack

- **Framework**: React 19.2.3 - Modern React with latest features
- **Routing**: React Router v7.10.1 - File-based routing with loaders and actions
- **Styling**: Tailwind CSS v4.1.13 - Utility-first CSS framework
- **State Management**: @tanstack/react-query - Server state management and caching
- **API Client**: openapi-fetch - Type-safe API client with OpenAPI integration
- **Type Generation**: openapi-typescript - Generate TypeScript types from OpenAPI spec
- **Icons**: lucide-react - Icon library
- **Utilities**: clsx, tailwind-merge - Conditional class name utilities
- **Build Tool**: Vite 7.1.7 - Fast build tool and dev server
- **TypeScript**: 5.9.2 - Type safety

### Architecture Patterns

#### MVC-Inspired Structure
The frontend follows an MVC-inspired pattern adapted for React:

```
app/
├── routes/              # View Layer - Route components and pages
├── components/          # View Layer - Reusable UI components
│   └── ui/             # shadcn/ui components
├── hooks/              # Controller Layer - Custom hooks for logic
│   └── api/            # API interaction hooks
├── lib/                # Controller Layer - Utilities and services
│   ├── api-client.ts   # openapi-fetch client setup
│   ├── query-client.ts # React Query configuration
│   └── utils.ts        # Utility functions
├── types/              # Model Layer - TypeScript types
│   └── api-types.ts    # Generated OpenAPI types
└── styles/             # Global styles
```

#### Component Organization

**Route Components** (`app/routes/`):
- File-based routing with React Router v7
- Each route file exports a default component
- Use loaders for data fetching before render
- Use actions for form submissions and mutations

**UI Components** (`app/components/`):
- Reusable, presentational components
- Use shadcn/ui components as base
- Follow composition pattern
- Accept props for customization
- No direct API calls (data passed as props)

**Custom Hooks** (`app/hooks/`):
- Encapsulate business logic
- API interaction hooks in `app/hooks/api/`
- Return `{ data, isLoading, error, mutate }` pattern
- Use React Query for caching and state management

#### Service Layer Architecture
- API client configured in `app/lib/api-client.ts`
- Request/response interceptors for authentication and error handling
- Type-safe API calls using generated OpenAPI types
- React Query handles caching, refetching, and state synchronization

### File Structure

```
booka-fe/
├── AGENTS.md                          # This file
├── .cursor/
│   └── rules/
│       └── react-fast-mvc.mdc        # React coding standards
├── app/
│   ├── lib/
│   │   ├── api-client.ts             # openapi-fetch client setup
│   │   ├── query-client.ts           # React Query configuration
│   │   └── utils.ts                  # Utility functions (cn, etc.)
│   ├── hooks/
│   │   └── api/                      # API interaction hooks
│   ├── components/
│   │   └── ui/                       # shadcn/ui components
│   ├── routes/                       # Route components
│   ├── types/
│   │   └── api-types.ts              # Generated OpenAPI types
│   ├── app.css                       # Global styles
│   ├── root.tsx                      # Root layout component
│   └── routes.ts                     # Route configuration
├── public/                           # Static assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Data Models

### Type Definitions

All API response types are generated from the OpenAPI specification and located in `app/types/api-types.ts`. These types are the single source of truth for API data structures.

**Access Pattern**:
```typescript
import type { paths } from '~/types/api-types';

// Example: Get booking response type
type BookingResponse = paths['/bookings']['get']['responses'][200]['content']['application/json'];
type Booking = BookingResponse['data']['data'][0];
```

### User Model
```typescript
{
  id: number;
  email: string;
  name: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
```

### Room Model
```typescript
{
  id: number;
  name: string;
  description: string | null;
  location: string;
  capacity: number;
  pricePerNight: number;
  amenities: Record<string, boolean>; // e.g., { wifi: true, parking: false }
  images: string[]; // Array of image URLs
  status: 'available' | 'unavailable';
  createdAt: string;
  updatedAt: string;
}
```

### Booking Model
```typescript
{
  id: number;
  userId: number;
  roomId: number;
  checkInDate: string; // ISO date string
  checkOutDate: string; // ISO date string
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated fields (from backend joins)
  room?: Room;
  user?: User;
}
```

### Relationships

- **User → Bookings**: One-to-many (user has many bookings)
- **Room → Bookings**: One-to-many (room has many bookings)
- **Booking → User**: Many-to-one (booking belongs to user)
- **Booking → Room**: Many-to-one (booking belongs to room)

## API Integration

### API Client Setup

**Location**: `app/lib/api-client.ts`

**Configuration**:
- Base URL from `VITE_API_URL` environment variable (defaults to `http://localhost:3000/api/v1`)
- JWT token handling via Authorization header
- Request interceptors for authentication
- Response interceptors for error handling
- Type-safe requests using OpenAPI types

**Example Setup**:
```typescript
import createClient from 'openapi-fetch';
import type { paths } from '~/types/api-types';

const apiClient = createClient<paths>({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

// Request interceptor for authentication
apiClient.use({
  onRequest({ request }) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
});

export default apiClient;
```

### API Endpoints

#### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.booka.com/api/v1 (update when deployed)
```

#### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout (protected)
- `POST /auth/refresh` - Refresh access token

#### Room Endpoints
- `GET /rooms` - Search rooms (query parameters: dateFrom, dateTo, location, capacity, amenities, minPrice, maxPrice, page, limit)
- `GET /rooms/:id` - Get room details
- `GET /rooms/:id/availability` - Check room availability for date range

#### Booking Endpoints (Protected)
- `POST /bookings` - Create new booking
- `GET /bookings` - Get user's booking history (query parameters: status, dateFrom, dateTo, page, limit)
- `GET /bookings/:id` - Get booking details
- `PATCH /bookings/:id/cancel` - Cancel booking

#### User Endpoints (Protected)
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user profile

### Request/Response Formats

#### Request Format
All requests use JSON format. Authentication tokens are sent via `Authorization: Bearer <token>` header.

#### Success Response Format
```typescript
{
  success: true;
  data: T; // Response data
  message?: string; // Optional success message
}
```

#### Error Response Format
```typescript
{
  success: false;
  error: {
    code: string; // Error code (e.g., "VALIDATION_ERROR", "UNAUTHORIZED")
    message: string; // Human-readable error message
    details?: Record<string, unknown>; // Additional error details
  };
}
```

#### Pagination Format
```typescript
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Error Handling

**HTTP Status Codes**:
- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., room already booked)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Frontend Error Handling**:
- Network errors handled by React Query
- Validation errors displayed in forms
- Authentication errors trigger redirect to login
- Global error boundary catches unexpected errors
- User-friendly error messages displayed via toast notifications

### OpenAPI Type Generation

**Script**: `npm run generate:api-types`

**Command**: 
```bash
openapi-typescript http://localhost:3000/api-json -o app/types/api-types.ts
```

**Usage**:
1. Start the backend server
2. Run the generation script
3. Types are automatically available in `app/types/api-types.ts`
4. Use types via `paths` type from generated file

**Note**: Regenerate types when backend API changes.

## State Management

### React Query Setup

**Location**: `app/lib/query-client.ts`

**Configuration**:
- Default staleTime: 5 minutes
- Default cacheTime: 10 minutes
- Retry logic: 3 attempts with exponential backoff
- Error handling via global error boundary
- Query invalidation for optimistic updates

**Example Setup**:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### State Management Patterns

#### Server State (React Query)
- All API data managed by React Query
- Automatic caching and refetching
- Background updates
- Optimistic updates for mutations

#### Client State (React State)
- UI state (modals, dropdowns, form inputs)
- Local component state using `useState`
- Shared UI state using Context API (if needed)

#### Form State
- Use React Hook Form for complex forms
- Form validation with Zod schemas
- Error handling and display

### Custom Hooks Pattern

**Location**: `app/hooks/api/`

**Pattern**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import type { paths } from '~/types/api-types';

export function useBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/bookings', {
        params: { query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingData: CreateBookingDto) => {
      const { data, error } = await apiClient.POST('/bookings', {
        body: bookingData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

## Routing & Navigation

### React Router v7 Configuration

**File-based Routing**: Routes are defined in `app/routes/` directory

**Route Configuration**: `app/routes.ts`

**Current Routes**:
- `/` - Home page (index route)

### Route Patterns

#### Public Routes
- `/` - Home/Landing page
- `/login` - Login page
- `/register` - Registration page
- `/rooms` - Room search/listings
- `/rooms/:id` - Room details

#### Protected Routes
- `/bookings` - Booking history
- `/bookings/:id` - Booking details
- `/profile` - User profile

### Data Loading with Loaders

**Pattern**: Use React Router loaders for pre-fetching data

```typescript
// app/routes/rooms.$id.tsx
import { useLoaderData } from 'react-router';
import type { Route } from './+types/rooms.$id';

export async function loader({ params }: Route.LoaderArgs) {
  const { data, error } = await apiClient.GET('/rooms/{id}', {
    params: { path: { id: Number(params.id) } },
  });
  
  if (error) {
    throw new Response('Room not found', { status: 404 });
  }
  
  return { room: data.data };
}

export default function RoomDetail() {
  const { room } = useLoaderData<typeof loader>();
  // Render room details
}
```

### Navigation

- Use `<Link>` component for client-side navigation
- Use `useNavigate()` hook for programmatic navigation
- Preserve search params when navigating
- Use `useSearchParams()` for URL query parameter management

## UI/UX Guidelines

### Design System

**Styling**: Tailwind CSS v4 - Utility-first CSS framework

**Component Library**: shadcn/ui components (located in `app/components/ui/`)

**Icons**: lucide-react - Consistent icon set

**Color Scheme**: Follow Tailwind default palette, customize as needed

### Component Patterns

#### Composition Pattern
- Build complex components from simple, reusable components
- Use children prop for flexibility
- Prefer composition over configuration

#### Conditional Styling
- Use `cn()` utility for conditional class names
- Combine `clsx` and `tailwind-merge` for intelligent class merging

**Example**:
```typescript
import { cn } from '~/lib/utils';

function Button({ variant = 'default', className, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
      {...props}
    />
  );
}
```

### Accessibility (a11y)

**Requirements**:
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance (WCAG AA minimum)

**Best Practices**:
- Use proper heading hierarchy (h1, h2, h3, etc.)
- Provide alt text for images
- Use form labels properly
- Ensure interactive elements are keyboard accessible
- Test with screen readers

### Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Mobile-First Approach**:
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly interactive elements (min 44x44px)

### Loading States

- Skeleton loaders for content loading
- Spinner for actions/buttons
- Progress indicators for multi-step processes
- Optimistic UI updates where appropriate

### Error States

- User-friendly error messages
- Retry mechanisms for failed operations
- Fallback UI for error scenarios
- Error boundaries for unexpected errors

## Error Handling & Loading States

### Error Boundaries

**Global Error Boundary**: `app/root.tsx`

**Route Error Boundaries**: Per-route error handling

**Pattern**:
```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    // Handle route errors (404, etc.)
    return <ErrorPage status={error.status} />;
  }
  
  // Handle unexpected errors
  return <ErrorPage message={error.message} />;
}
```

### Loading States

#### Suspense Boundaries
- Use React Suspense for async components
- Provide fallback UI during loading

**Pattern**:
```typescript
<Suspense fallback={<LoadingSpinner />}>
  <AsyncComponent />
</Suspense>
```

#### React Query Loading States
- `isLoading` - Initial load
- `isFetching` - Background refetch
- `isPending` - Mutation pending state

### Error Display

- Toast notifications for user actions
- Inline error messages for forms
- Error pages for route errors
- Global error boundary for unexpected errors

## Security Considerations

### Authentication

**Token Storage**:
- **Recommended**: HTTP-only cookies (set by backend)
- **Alternative**: Secure localStorage with XSS protection
- **Never**: Regular cookies or sessionStorage for sensitive data

**Token Refresh**:
- Automatic refresh before expiration
- Silent refresh on API 401 errors
- Redirect to login on refresh failure

**Authentication Flow**:
1. User logs in → receive access token and refresh token
2. Store tokens securely
3. Include access token in API requests
4. On 401 error → attempt token refresh
5. On refresh success → retry original request
6. On refresh failure → redirect to login

### Authorization

**Protected Routes**:
- Check authentication status in route loaders
- Redirect to login if not authenticated
- Preserve intended destination for post-login redirect

**Resource Access**:
- Users can only access their own bookings
- Backend enforces authorization (frontend provides UX only)
- Display appropriate UI based on user permissions

### Data Protection

**Input Validation**:
- Client-side validation for UX (Zod schemas)
- Never trust client-side validation alone
- Backend validation is the source of truth

**XSS Prevention**:
- React automatically escapes content
- Use `dangerouslySetInnerHTML` only when necessary and sanitize
- Validate and sanitize user inputs
- Use Content Security Policy (CSP) headers

**CSRF Protection**:
- Use CSRF tokens for state-changing operations
- Include tokens in request headers
- Backend validates tokens

**Sensitive Data**:
- Never log sensitive data (tokens, passwords)
- Clear sensitive data from memory when possible
- Use HTTPS in production

### Environment Variables

**Security**:
- Never commit `.env` files
- Use `VITE_` prefix for Vite environment variables
- Keep API keys and secrets server-side only
- Use different configs for dev/staging/production

## Performance Optimization

### Code Splitting

**Route-based Splitting**:
- React Router v7 automatically code-splits routes
- Lazy load route components when possible

**Component Splitting**:
- Use `React.lazy()` for large components
- Dynamic imports for heavy dependencies

### React Optimization

**Memoization**:
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive computations
- Use `useCallback()` for stable function references

**When to Optimize**:
- Profile first, optimize second
- Don't prematurely optimize
- Focus on actual performance bottlenecks

### Image Optimization

- Use appropriate image formats (WebP, AVIF)
- Lazy load images below the fold
- Provide responsive image sizes
- Use image CDN if available

### API Optimization

**Caching**:
- React Query handles API response caching
- Configure appropriate stale times
- Use cache invalidation strategically

**Request Optimization**:
- Debounce search inputs
- Batch related requests when possible
- Use pagination for large datasets
- Implement infinite scroll or virtual scrolling for long lists

### Bundle Optimization

**Tree Shaking**:
- Vite automatically tree-shakes unused code
- Use named imports instead of default imports when possible
- Avoid importing entire libraries when only using a small part

**Build Optimization**:
- Production builds are minified and optimized
- Source maps for debugging (dev only)
- Code splitting for optimal loading

## Development Guidelines

### Code Organization

**File Structure**:
- Feature-based organization in routes
- Shared components in `app/components/`
- Reusable hooks in `app/hooks/`
- Utilities in `app/lib/`

**Naming Conventions**:
- Components: PascalCase (e.g., `RoomCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useBookings.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase (e.g., `Booking.ts`)

### TypeScript Best Practices

**Type Safety**:
- Use generated OpenAPI types for API responses
- Avoid `any` type (use `unknown` if necessary)
- Define proper types for all props and state
- Use type guards for runtime type checking

**Type Patterns**:
```typescript
// Use generated types
import type { paths } from '~/types/api-types';
type Booking = paths['/bookings']['get']['responses'][200]['content']['application/json']['data']['data'][0];

// Define component props
interface RoomCardProps {
  room: Room;
  onBook?: (roomId: number) => void;
}

// Use utility types
type PartialBooking = Partial<Booking>;
type BookingIds = Pick<Booking, 'id'>;
```

### Component Best Practices

**Single Responsibility**:
- Each component should do one thing well
- Extract complex logic into custom hooks
- Keep components small and focused

**Composition over Configuration**:
- Prefer composition patterns
- Use children prop for flexibility
- Build complex UIs from simple components

**Props Interface**:
- Define clear prop interfaces
- Use TypeScript for prop validation
- Provide default values where appropriate
- Document complex props with JSDoc

### Testing Considerations

**Testing Strategy** (Future):
- Unit tests for utilities and hooks
- Component tests with React Testing Library
- Integration tests for user flows
- E2E tests for critical paths

**Test Organization**:
- Co-locate tests with source files
- Use descriptive test names
- Test user behavior, not implementation

### Documentation

**Code Documentation**:
- JSDoc comments for functions and components
- Document complex logic and business rules
- Keep comments up-to-date with code changes

**Component Documentation**:
- Document component props and usage
- Provide usage examples
- Document any special requirements or constraints

## Future Enhancements

- **Offline Support**: Service workers for offline functionality
- **Progressive Web App**: PWA features for mobile experience
- **Real-time Updates**: WebSocket integration for real-time booking updates
- **Advanced Search**: Elasticsearch integration for better search
- **Analytics**: User behavior tracking and analytics
- **A/B Testing**: Feature flag system for A/B testing
- **Internationalization**: Multi-language support (i18n)
- **Theme System**: Dark mode and theme customization
- **Advanced Caching**: Service worker caching strategies
- **Performance Monitoring**: Real User Monitoring (RUM) integration

