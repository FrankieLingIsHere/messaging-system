# Secure Messaging System API

A secure, role-based messaging system API that allows user registration, authentication with JWT, email verification, and message exchange.

## Features

- User authentication with JWT
- Role-based access control (Super Admin, Admin, Normal User)
- Email verification with Mailtrap
- Secure password handling with bcrypt
- Real-time messaging with Socket.io
- PostgreSQL database for message and user storage

## System Architecture

### API Structure

The API follows a structured architecture:

- **Controllers**: Handle request logic and response formatting
- **Middleware**: Authenticate requests and enforce access control
- **Models**: Define database schema and relationships
- **Routes**: Define API endpoints
- **Services**: Handle business logic like email sending and token generation
- **Utils**: Provide helper functions for validation and password handling

### Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Email verification
- Rate limiting for sensitive endpoints
- Role-based access control
- CORS and Helmet for basic security headers

## Installation & Setup

### Prerequisites

- Node.js 14+
- PostgreSQL 12+
- Mailtrap account (for email verification)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/FrankielingIsHere/messaging-system.git
   cd messaging-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your configuration

4. Initialize the database:
   ```
   npm run init-db
   ```

5. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `GET /api/auth/verify-email` - Verify user email
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

### Messages

- `POST /api/messages/send` - Send a new message
- `GET /api/messages` - Get user's messages
- `PATCH /api/messages/:messageId/read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete a message (Super Admin only)

## Role-Based Access

### Super Admin
- Full CRUD operations on all resources
- Can manage users and roles
- Can delete messages

### Admin
- Can send and read all messages
- Cannot delete messages or manage users

### Normal User
- Can only send and receive their own messages

## Testing

Run the test suite:

```
npm test
```

## License

MIT

## Contributors

- Your Name
