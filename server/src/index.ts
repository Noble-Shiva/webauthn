import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as authRouter } from './routes/auth';

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// app.use(cors({
//   origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
//   credentials: true,
// }));
app.use((req, res, next) => {
  // Check if it's a native Android request
  const isNativeAndroid = req.headers['x-client-type'] === 'android';
  
  if (isNativeAndroid) {
    // For native Android requests, skip CORS
    console.log('Native Android request detected, skipping CORS');
    next();
  } else {
    // For web requests, apply CORS
    cors({
      origin: [
        `${process.env.FRONTEND_ORIGIN}`, 
        'http://localhost:57000'
      ],
      credentials: true,
    })(req, res, next);
  }
});


// Custom CORS middleware
// const corsMiddleware = (req: any, res: any, next: any) => {
//   console.log('CORS Middleware Invoked, ', req.headers);
//   // Check if request is from native app
//   if (req.headers['x-client-type'] === 'android') {
//     // Allow the request by setting CORS headers
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Type');
    
//     // Handle preflight requests
//     if (req.method === 'OPTIONS') {
//       return res.sendStatus(200);
//     }
//     return next();
//   }

//   // For web clients, use standard CORS with specific origins
//   cors({
//     origin: [
//       `$${process.env.FRONTEND_ORIGIN}`,
//       'http://localhost:5173',
//       // Add other web origins as needed
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
//   })(req, res, next);
// };

// Use the middleware
// app.use(corsMiddleware);

// Routes
app.use('/auth', authRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
