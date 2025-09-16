# WebAuthn Backend Server

This is a WebAuthn authentication server implementation using SimpleWebAuthn, Express, and TypeScript.

## Features

- User registration with WebAuthn
- User authentication with WebAuthn
- Passwordless login
- Support for multiple authenticators per user
- TypeScript for type safety

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A WebAuthn-compatible browser
- A WebAuthn authenticator (built-in platform authenticator or security key)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (already done with default values):
```env
PORT=3000
RP_ID=localhost
FRONTEND_ORIGIN=http://localhost:5173
ORIGIN=http://localhost:5173
```

## Development

Start the development server:

```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

## Starting the Server

```bash
npm start
```

## API Endpoints

### Registration

- POST `/auth/register/start` - Start registration process
- POST `/auth/register/complete` - Complete registration

### Authentication

- POST `/auth/login/start` - Start authentication process
- POST `/auth/login/complete` - Complete authentication

### Health Check

- GET `/health` - Check server health

## Important Notes

- The current implementation uses in-memory storage for users. In a production environment, you should use a proper database.
- Make sure to update the RP_ID and ORIGIN in the .env file according to your domain in production.
- The authenticator selection is set to require resident keys (discoverable credentials) for better UX.
- The server supports both ES256 and RS256 algorithms.

## Security Considerations

1. Always use HTTPS in production
2. Store credentials securely in a database
3. Implement rate limiting
4. Add proper session management
5. Consider implementing backup methods for account recovery

## License

MIT
