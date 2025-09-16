import { Router } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type { Request, Response } from 'express';

// Define interfaces for our application
interface UserDevice {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
}

interface User {
  currentChallenge: string;
  devices: UserDevice[];
}

const router = Router();

// These values should be stored in environment variables in production
const rpName = 'WebAuthn Example';
const rpID = process.env.RP_ID || 'example.com';
const origin = process.env.ORIGIN || `http://${rpID}:8000`;
// const origin = `android:apk-key-hash:hjnzy5U6UHHa2ivVWy3UTGf8mbXS3SUhKEZOU78duMQ=`;

// In-memory user storage - replace with your database in production
const users = new Map<string, User>();

// Registration routes
router.post('/register/start', async (req, res) => {
  const { username } = req.body;
  
  // Check if user exists
  if (users.has(username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Generate registration options
  const options: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: username,
    userName: username,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'required',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 & RS256
  };

  const registrationOptions = await generateRegistrationOptions(options);

  // Store options for verification
  users.set(username, {
    currentChallenge: registrationOptions.challenge,
    devices: [],
  });

  console.log('\n[Registration Start] 🚀', {
    username,
    rpID,
    challenge: registrationOptions.challenge,
    userVerification: options.authenticatorSelection?.userVerification || 'preferred',
    timestamp: new Date().toISOString()
  });

  res.json(registrationOptions);
});

router.post('/register/complete', async (req, res) => {
  const { username, response } = req.body;

  console.log(username, response);

  const user = users.get(username);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const expectedChallenge = user.currentChallenge;

  try {
    const verification: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    };

    const { verified, registrationInfo } = await verifyRegistrationResponse(verification);

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      // Add the device to user's authenticators
      const newDevice = {
        credentialPublicKey,
        credentialID,
        counter,
      };
      user.devices.push(newDevice);

      console.log('\n[Registration Complete] ✅', {
        username,
        verified: true,
        deviceInfo: {
          credentialID: Buffer.from(credentialID).toString('base64url'),
          counter,
          transports: response.response.transports || []
        },
        timestamp: new Date().toISOString()
      });

      return res.json({ verified: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'Registration failed' });
  }

  return res.status(400).json({ error: 'Registration failed' });
});

// Authentication routes
router.post('/login/start', async (req, res) => {
  const { username } = req.body;

  const user = users.get(username);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Get allowed credentials from user's devices
  // Define valid transport types
  type ValidTransport = 'usb' | 'ble' | 'nfc' | 'internal';
  const validTransports: ValidTransport[] = ['usb', 'ble', 'nfc', 'internal'];

  const allowCredentials = user.devices.map((dev: UserDevice) => ({
    id: dev.credentialID,
    type: 'public-key' as const,
    transports: validTransports,
  }));

  const options: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    allowCredentials,
    userVerification: 'preferred',
    rpID,
  };

  const authenticationOptions = await generateAuthenticationOptions(options);

  // Store challenge
  user.currentChallenge = authenticationOptions.challenge;

  console.log('\n[Authentication Start] 🔐', {
    username,
    rpID,
    challenge: authenticationOptions.challenge,
    allowCredentials: allowCredentials.map((cred) => ({
      id: Buffer.from(cred.id).toString('base64url'),
      type: cred.type
    })),
    timestamp: new Date().toISOString()
  });

  res.json(authenticationOptions);
});

router.post('/login/complete', async (req, res) => {
  const { username, response } = req.body;

  const user = users.get(username);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const expectedChallenge = user.currentChallenge;

  try {
    const device = user.devices.find((dev: any) => 
      Buffer.from(dev.credentialID).toString('base64url') === response.id
    );

    if (!device) {
      throw new Error('Authenticator is not registered with this user');
    }

    const verification: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: device.credentialPublicKey,
        credentialID: device.credentialID,
        counter: device.counter,
      },
      requireUserVerification: true,
    };

    const { verified, authenticationInfo } = await verifyAuthenticationResponse(verification);

    if (verified) {
      // Update the authenticator's counter in the DB after successful authentication
      device.counter = authenticationInfo.newCounter;

      console.log('\n[Authentication Complete] ✅', {
        username,
        verified: true,
        deviceInfo: {
          credentialID: Buffer.from(device.credentialID).toString('base64url'),
          oldCounter: device.counter,
          newCounter: authenticationInfo.newCounter,
          authenticatorData: {
            flags: response.response.authenticatorData,
            signCount: authenticationInfo.newCounter,
          }
        },
        timestamp: new Date().toISOString()
      });

      return res.json({ 
        verified: true,
        user: {
          id: username,
          username: username
        }
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'Authentication failed' });
  }

  return res.status(400).json({ error: 'Authentication failed' });
});

export { router };
