# UNIHub Backend
UNIHub is a comprehensive university club and event management platform. This repository contains the backend API for the UNIHub platform built with Node.js, Express.js, SQLite, and Drizzle ORM.

## Overview
UNIHub allows university students to discover clubs, attend events, and interact with club activities. The platform has three main user roles:

1. **Student (Regular User)** - Can browse clubs, attend events, and book tickets
2. **Head Admin (Club Curator)** - Can manage their own clubs and create events
3. **Super Admin (Platform Admin)** - Has full administrative powers to manage clubs and system

## Features

### Authentication System
- User registration with email and password
- JWT-based authentication
- Role-based access control
- Password change functionality
- Different navigation and content based on user role

### User Management
- Three user roles: student, head_admin, and super_admin 
- Default super admin seeding (admin@gmail.com)
- Extended user profiles with personal details
- Role transition when students become head admins

### Club Management
- Students can submit club creation requests with detailed information
- Super admins can review and approve/reject club requests
- When a club request is approved, the requester becomes a head admin
- Clubs have ratings based on activity and likes
- Club information includes name, goal, description, financing methods, and more

### Event Management
- Head admins can submit event creation requests
- Super admins can review and approve/reject event requests
- Approved events appear on the platform
- Event details include name, date, location, description, goals, and schedule
- Club-specific event listings

### Poster System
- Head admins can create posters for their approved events
- Posters include details like event title, date, location, time, description, seats, price, and images
- Images are stored as base64 in the database
- Students can browse all available event posters

### Ticket Booking
- Students can book tickets for events by specifying the number of attendees
- Payment proof upload functionality (stored as base64)
- Automatic seat tracking system that updates available seats
- Head admins can approve or reject ticket bookings
- When a ticket is approved, it appears in the student's calendar
- When a ticket is rejected, the seats are restored

### Post System
- Users can create posts with title, content, and images
- Head admins' posts are automatically associated with their clubs
- Posts can be liked by users
- Posts can be filtered by club or user
- Like count tracking for engagement metrics

### User Profiles
- Extended profile information including name, surname, phone, gender, birth date
- Club association for head admins
- Profile editing capabilities
- Admin tools for user management

### Calendar System
- Users can see their approved events in a calendar view
- Calendar shows event timing and details

### Request System
- Structured request flows for clubs and events
- Status tracking for all requests (pending, approved, rejected)
- Request history for users and admins

### API Documentation
- Comprehensive Swagger documentation
- All endpoints documented with parameters and responses
- API testing through Swagger UI

## Database Schema

The system uses SQLite with Drizzle ORM and includes the following main tables:

- `users`: Store user information and roles
- `clubRequests`: Track club creation requests
- `clubs`: Store approved clubs
- `eventRequests`: Track event creation requests
- `events`: Store approved events
- `posters`: Store event posters with details
- `ticketBookings`: Track ticket bookings and their status
- `posts`: Store user and club posts
- `postLikes`: Track user likes on posts

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login
- PUT `/api/auth/change-password` - Change password (protected)

### Users
- GET `/api/users/profile` - Get current user's profile (protected)
- PUT `/api/users/profile` - Update user profile (protected)
- GET `/api/users/:id` - Get a specific user (admin only)
- GET `/api/users` - Get all users (admin only)
- PUT `/api/users/:id/role` - Update user role (admin only)

### Club Requests
- POST `/api/club-requests` - Submit a club request (protected)
- GET `/api/club-requests` - Get all club requests (admin only)
- GET `/api/club-requests/my-requests` - Get user's club requests (protected)
- GET `/api/club-requests/:id` - Get a specific club request (protected)
- PUT `/api/club-requests/:id/approve` - Approve a club request (admin only)
- PUT `/api/club-requests/:id/reject` - Reject a club request (admin only)

### Clubs
- GET `/api/clubs` - Get all approved clubs
- GET `/api/clubs/my-club` - Get user's club (head admin only)
- GET `/api/clubs/:id` - Get a specific club
- PUT `/api/clubs/:id` - Update a club (head admin only)

### Event Requests
- POST `/api/event-requests` - Submit an event request (head admin only)
- GET `/api/event-requests` - Get all event requests (admin only)
- GET `/api/event-requests/my-requests` - Get user's event requests (head admin only)
- GET `/api/event-requests/:id` - Get a specific event request (protected)
- PUT `/api/event-requests/:id/approve` - Approve an event request (admin only)
- PUT `/api/event-requests/:id/reject` - Reject an event request (admin only)

### Events
- GET `/api/events` - Get all approved events
- GET `/api/events/my-events` - Get user's club events (head admin only)
- GET `/api/events/club/:clubId` - Get all events for a specific club
- GET `/api/events/:id` - Get a specific event

### Posters
- POST `/api/posters` - Create a poster (head admin only)
- GET `/api/posters` - Get all posters
- GET `/api/posters/my-posters` - Get user's posters (head admin only)
- GET `/api/posters/club/:clubId` - Get all posters for a specific club
- GET `/api/posters/:id` - Get a specific poster
- PUT `/api/posters/:id` - Update a poster (head admin only)

### Tickets
- POST `/api/tickets` - Book a ticket (protected)
- GET `/api/tickets` - Get user's tickets (protected)
- GET `/api/tickets/pending` - Get pending tickets for approval (head admin only)
- GET `/api/tickets/calendar` - Get calendar events (protected)
- PUT `/api/tickets/:id/approve` - Approve a ticket (head admin only)
- PUT `/api/tickets/:id/reject` - Reject a ticket (head admin only)

### Posts
- POST `/api/posts` - Create a new post (protected)
- GET `/api/posts` - Get all posts
- GET `/api/posts/my-posts` - Get user's posts (protected)
- GET `/api/posts/:id` - Get a specific post
- PUT `/api/posts/:id` - Update a post (protected)
- DELETE `/api/posts/:id` - Delete a post (protected)
- POST `/api/posts/:id/like` - Like/unlike a post (protected)

## Installation

```bash
# Clone the repository
git clone https://github.com/damiraitbay/Diploma2.git
cd unihub-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate database migrations
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit push

# Start the development server
npm run dev

# Or simply u can use makefile
make run
```

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
DB_FILE_NAME=file:unihub.db
```

## Getting Started

1. After installation, seed the default admin:
   ```bash
   node src/seeders/adminSeed.js
   ```

2. Start the server:
   ```bash
  Н
   ```

3. Access the Swagger documentation at:
   ```
   http://localhost:3000/api-docs
   ```

4. Login with the default admin:
   - Email: admin@gmail.com
   - Password: admin123

## Summary of Key Features

1. **Authentication System**
   - User registration and login with JWT tokens
   - Role-based access control with three user levels
   - Password management and security

2. **User Profiles**
   - Extended profile information (name, surname, phone, gender, birth date)
   - Club association for head admins
   - Profile editing capabilities
   - Admin tools for user management

3. **Club Management**
   - Club request submission with detailed information
   - Admin review process for club creation
   - Automatic role transition when becoming a head admin

4. **Event Management**
   - Event request creation by head admins
   - Admin approval workflow for events
   - Comprehensive event details and organization

5. **Poster System**
   - Head admins can create posters for their approved events
   - Posters include detailed event information and images
   - Students can browse all available event posters

6. **Ticket Booking**
   - Students can book tickets for events
   - Payment proof upload and verification
   - Seat tracking and management
   - Head admin approval process for tickets

7. **Post System**
   - Create posts with text content and images
   - Like/unlike functionality
   - Club-specific posts
   - Social engagement features

8. **Calendar Integration**
   - Approved tickets appear in student calendars
   - Event timing and scheduling views

9. **Comprehensive Admin Tools**
   - Request management and approval workflows
   - User role management
   - System monitoring and control

10. **API Documentation**
    - Complete Swagger documentation
    - Testing interface for all endpoints

## Security Considerations
- All sensitive routes are protected by JWT authentication
- Role-based authorization for different user types
- Password hashing using bcrypt
- Input validation for all API endpoints
- Error handling and logging

## API Reference

### Auth

#### POST `/api/auth/register`
**Request body:**
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "gender": "male",
  "birthDate": "1990-01-01"
}
```
**Response:**
- 201: `{ message, token, user }`

---

#### POST `/api/auth/verify-email`
**Request body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```
**Response:**
- 200: `{ message: "Email verified successfully" }`

---

#### POST `/api/auth/login`
**Request body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
- 200: `{ token, user }`

---

#### PUT `/api/auth/change-password`
**Headers:**  
`Authorization: Bearer <token>`

**Request body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```
**Response:**
- 200: `{ message: "Password changed successfully" }`

---

### Users

#### GET `/api/users/profile`
**Headers:**  
`Authorization: Bearer <token>`

**Response:**
- 200: `{ id, name, surname, email, ... }`

---

#### PUT `/api/users/profile`
**Headers:**  
`Authorization: Bearer <token>`

**Request body:**
```json
{
  "name": "John",
  "surname": "Doe",
  "phone": "+1234567890",
  "gender": "male",
  "birthDate": "1990-01-01",
  "profileImage": [file]
}
```
**Response:**
- 200: `{ message: "Profile updated successfully" }`

---

#### GET `/api/users/:id`
**Headers:**  
`Authorization: Bearer <token>` (role: super_admin)

**Response:**
- 200: `{ id, name, surname, ... }`

---

#### GET `/api/users`
**Headers:**  
`Authorization: Bearer <token>` (role: super_admin)

**Response:**
- 200: `[ { id, name, surname, ... }, ... ]`

---

#### PUT `/api/users/:id/role`
**Headers:**  
`Authorization: Bearer <token>` (role: super_admin)

**Request body:**
```json
{
  "role": "head_admin"
}
```
**Response:**
- 200: `{ message: "User role updated successfully" }`

---

### Club Requests

#### POST `/api/club-requests`
**Headers:**  
`Authorization: Bearer <token>`

**Request body:**
```json
{
  "name": "Chess Club",
  "goal": "Promote chess culture",
  "description": "A club for chess enthusiasts",
  "headId": 1
}
```
**Response:**
- 201: `{ message: "Club request submitted" }`

---

#### PUT `/api/club-requests/:id/approve`
**Headers:**  
`Authorization: Bearer <token>` (role: super_admin)

**Response:**
- 200: `{ message: "Club request approved" }`

---

#### PUT `/api/club-requests/:id/reject`
**Headers:**  
`Authorization: Bearer <token>` (role: super_admin)

**Response:**
- 200: `{ message: "Club request rejected" }`

---

### Clubs

#### GET `/api/clubs`
**Response:**
- 200: `[ { id, name, goal, ... }, ... ]`

---

#### PUT `/api/clubs/:id`
**Headers:**  
`Authorization: Bearer <token>` (role: head_admin)

**Request body:**
```json
{
  "name": "Chess Club",
  "goal": "Updated goal",
  "description": "Updated description"
}
```
**Response:**
- 200: `{ message: "Club updated successfully" }`

---

### Event Requests

#### POST `/api/event-requests`
**Headers:**  
`Authorization: Bearer <token>` (role: head_admin)

**Request body:**
```json
{
  "eventName": "Chess Tournament",
  "eventDate": "2024-03-20",
  "location": "Main Hall",
  "shortDescription": "Annual chess tournament",
  "goal": "Find the best chess player",
  "organizers": "Chess Club",
  "schedule": "10:00 - 18:00",
  "sponsorship": "None",
  "clubHead": "John Doe",
  "phone": "+1234567890",
  "comment": "Optional comment",
  "image": [file]
}
```
**Response:**
- 201: `{ message: "Event request submitted" }`

---

### Events

#### GET `/api/events`
**Response:**
- 200: `[ { id, eventName, eventDate, ... }, ... ]`

---

### Posters

#### POST `/api/posters`
**Headers:**  
`Authorization: Bearer <token>` (role: head_admin)

**Request body:**
```json
{
  "eventId": 1,
  "title": "Chess Poster",
  "description": "Join our event!",
  "image": "base64string"
}
```
**Response:**
- 201: `{ message: "Poster created successfully" }`

---

### Tickets

#### POST `/api/tickets`
**Headers:**  
`Authorization: Bearer <token>`

**Request body:**
```json
{
  "posterId": 1,
  "numberOfPersons": 2,
  "paymentProof": "base64string"
}
```
**Response:**
- 201: `{ message: "Ticket booked successfully" }`

---

### Posts

#### POST `/api/posts`
**Headers:**  
`Authorization: Bearer <token>`

**Request body:**
```json
{
  "title": "Post Title",
  "content": "Post content",
  "image": "base64string"
}
```
**Response:**
- 201: `{ message: "Post created successfully" }`

---

#### POST `/api/posts/:id/like`
**Headers:**  
`Authorization: Bearer <token>`

**Response:**
- 200: `{ message: "Post liked/unliked" }`

---

> Для всех защищённых эндпоинтов используйте заголовок:
> 
> `Authorization: Bearer <token>`

> Все даты должны быть в формате ISO 8601 (например, "2024-06-01T18:00:00Z")

---

# UniHub Backend API Documentation

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "John",
    "surname": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "gender": "male",
    "birthDate": "1990-01-01"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

## Users

### Get Profile
```http
GET /api/users/profile
Authorization: Bearer YOUR_TOKEN
```

### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

{
    "name": "John",
    "surname": "Doe",
    "phone": "+1234567890",
    "gender": "male",
    "birthDate": "1990-01-01",
    "profileImage": [file]
}
```

### Get User by ID (Admin only)
```http
GET /api/users/:id
Authorization: Bearer YOUR_TOKEN
```

### Get All Users (Admin only)
```http
GET /api/users
Authorization: Bearer YOUR_TOKEN
```

### Update User Role (Admin only)
```http
PUT /api/users/:id/role
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "role": "head_admin"
}
```

## Clubs

### Create Club (Admin only)
```http
POST /api/clubs
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "name": "Chess Club",
    "goal": "Promote chess culture",
    "description": "A club for chess enthusiasts",
    "headId": 1
}
```

### Get All Clubs
```http
GET /api/clubs
Authorization: Bearer YOUR_TOKEN
```

### Get Club by ID
```http
GET /api/clubs/:id
Authorization: Bearer YOUR_TOKEN
```

### Update Club (Head Admin only)
```http
PUT /api/clubs/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "name": "Chess Club",
    "goal": "Updated goal",
    "description": "Updated description"
}
```

### Delete Club (Admin only)
```http
DELETE /api/clubs/:idAuthorization: Bearer YOUR_TOKEN
```

## Events

### Create Event Request (Head Admin only)
```http
POST /api/event-requests
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

{
    "eventName": "Chess Tournament",
    "eventDate": "2024-03-20",
    "location": "Main Hall",
    "shortDescription": "Annual chess tournament",
    "goal": "Find the best chess player",
    "organizers": "Chess Club",
    "schedule": "10:00 - 18:00",
    "sponsorship": "None",
    "clubHead": "John Doe",
    "phone": "+1234567890",
    "comment": "Optional comment",
    "image": [file]
}
```

### Get All Event Requests (Admin only)
```http
GET /api/event-requests
Authorization: Bearer YOUR_TOKEN
```

### Get Event Request by ID
```http
GET /api/event-requests/:id
Authorization: Bearer YOUR_TOKEN
```

### Get User Event Requests (Head Admin only)
```http
GET /api/event-requests/user/requests
Authorization: Bearer YOUR_TOKEN
```

### Approve Event Request (Admin only)
```http
PUT /api/event-requests/:id/approve
Authorization: Bearer YOUR_TOKEN
```

### Reject Event Request (Admin only)
```http
PUT /api/event-requests/:id/reject
Authorization: Bearer YOUR_TOKEN
```

## Posts

### Create Post
```http
POST /api/posts
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

{
    "title": "Post Title",
    "content": "Post content",
    "image": [file]
}
```

### Get All Posts
```http
GET /api/posts
Authorization: Bearer YOUR_TOKEN
```

### Get Post by ID
```http
GET /api/posts/:id
Authorization: Bearer YOUR_TOKEN
```

### Update Post
```http
PUT /api/posts/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

{
    "title": "Updated Title",
    "content": "Updated content",
    "image": [file]
}
```

### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer YOUR_TOKEN
```

### Like/Unlike Post
```http
POST /api/posts/:id/like
Authorization: Bearer YOUR_TOKEN
```

## Tickets

### Book Ticket
```http
POST /api/tickets
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

{
    "posterId": 1,
    "numberOfPersons": 2,
    "paymentProof": [file]
}
```

### Get User Tickets
```http
GET /api/tickets/user
Authorization: Bearer YOUR_TOKEN
```

### Approve Ticket (Head Admin only)
```http
PUT /api/tickets/:id/approve
Authorization: Bearer YOUR_TOKEN
```

### Reject Ticket (Head Admin only)
```http
PUT /api/tickets/:id/reject
Authorization: Bearer YOUR_TOKEN
```

## File Upload

All file uploads support the following formats:
- JPEG
- PNG
- GIF
- WEBP

Maximum file size: 5MB

Files are stored in `src/public/uploads` and can be accessed via:
```
http://localhost:3000/uploads/<filename>
```

## Error Responses

All endpoints return errors in the following format:
```json
{
    "message": "Error message",
    "error": "Detailed error message (if available)"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
