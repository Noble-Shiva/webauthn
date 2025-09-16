class WebAuthnClient {
    constructor() {
        this.API_URL = 'http://localhost:3000';
    }

    async register(username) {
        try {
            logger.addLog('info', 'Starting WebAuthn registration', { username });

            // Get registration options from server
            logger.addLog('info', 'Requesting registration options from server');
            const optionsRes = await fetch(`${this.API_URL}/auth/register/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
                credentials: 'include'
            });

            const options = await optionsRes.json();
            logger.addLog('info', 'Received registration options', {
                challenge: options.challenge,
                rp: { name: options.rp.name, id: options.rp.id },
                user: { name: options.user.name, id: options.user.id },
                authenticatorSelection: options.authenticatorSelection,
                timestamp: new Date().toISOString()
            });

            // Start the WebAuthn registration process
            logger.addLog('info', 'Creating credentials with authenticator');
            const attResp = await SimpleWebAuthnBrowser.startRegistration(options);
            logger.addLog('info', 'Credentials created successfully', {
                id: attResp.id,
                type: attResp.type,
                authenticatorData: attResp.response.authenticatorData,
                transports: attResp.response.transports,
                timestamp: new Date().toISOString()
            });

            // Send response to server for verification
            const verificationRes = await fetch(
                `${this.API_URL}/auth/register/complete`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        response: attResp,
                    }),
                    credentials: 'include'
                }
            );

            const verificationResult = await verificationRes.json();
            logger.addLog('success', 'Registration completed successfully', {
                verified: verificationResult.verified,
                timestamp: new Date().toISOString()
            });

            return verificationResult;
        } catch (error) {
            logger.addLog('error', 'Registration failed', {
                error: error.message,
                details: error.response?.data,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async login(username) {
        try {
            logger.addLog('info', 'Starting WebAuthn authentication', { username });

            // Get authentication options from server
            logger.addLog('info', 'Requesting authentication options from server');
            const optionsRes = await fetch(`${this.API_URL}/auth/login/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
                credentials: 'include'
            });

            const options = await optionsRes.json();
            logger.addLog('info', 'Received authentication options', {
                challenge: options.challenge,
                allowCredentials: options.allowCredentials?.map(cred => ({
                    id: cred.id,
                    type: cred.type,
                    transports: cred.transports
                })),
                timeout: options.timeout,
                userVerification: options.userVerification,
                timestamp: new Date().toISOString()
            });

            // Start the WebAuthn authentication process
            logger.addLog('info', 'Verifying credentials with authenticator');
            const asseResp = await SimpleWebAuthnBrowser.startAuthentication(options);
            logger.addLog('info', 'Authenticator verified credentials', {
                id: asseResp.id,
                type: asseResp.type,
                authenticatorData: asseResp.response.authenticatorData,
                clientDataJSON: asseResp.response.clientDataJSON,
                timestamp: new Date().toISOString()
            });

            // Send response to server for verification
            const verificationRes = await fetch(
                `${this.API_URL}/auth/login/complete`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        response: asseResp,
                    }),
                    credentials: 'include'
                }
            );

            const verificationResult = await verificationRes.json();
            logger.addLog('success', 'Authentication completed successfully', {
                verified: verificationResult.verified,
                user: verificationResult.user,
                timestamp: new Date().toISOString()
            });

            return verificationResult;
        } catch (error) {
            logger.addLog('error', 'Authentication failed', {
                error: error.message,
                details: error.response?.data,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
}

// Create global auth instance
window.auth = new WebAuthnClient();
