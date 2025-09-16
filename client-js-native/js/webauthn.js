class WebAuthnNative {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        
        // Check WebAuthn support
        if (!utils.isWebAuthnSupported()) {
            logger.addLog('error', 'WebAuthn is not supported in this browser');
            throw new Error('WebAuthn is not supported in this browser');
        }
    }

    async register(username) {
        try {
            logger.addLog('info', 'Starting native WebAuthn registration', { username });

            // Get registration options from server
            logger.addLog('info', 'Requesting registration options from server');
            const optionsRes = await fetch(`${this.API_URL}/auth/register/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
                credentials: 'include'
            });

            if (!optionsRes.ok) {
                const error = await optionsRes.json();
                console.log(error);
                throw new Error('Failed to get registration options : ', error.message);
            }

            const serverOptions = await optionsRes.json();
            logger.addLog('info', 'Received registration options', serverOptions);

            // Convert server options to credential creation options
            const publicKeyOptions = {
                challenge: utils.base64urlToBuffer(serverOptions.challenge),
                rp: serverOptions.rp,
                user: {
                    id: utils.base64urlToBuffer(serverOptions.user.id),
                    name: serverOptions.user.name,
                    displayName: serverOptions.user.displayName || serverOptions.user.name
                },
                pubKeyCredParams: serverOptions.pubKeyCredParams,
                authenticatorSelection: serverOptions.authenticatorSelection,
                timeout: serverOptions.timeout,
                attestation: serverOptions.attestation
            };

            // Create credentials using native API
            logger.addLog('info', 'Creating credentials using navigator.credentials.create()');
            const credential = await navigator.credentials.create({
                publicKey: publicKeyOptions
            });

            logger.addLog('info', 'Credentials created successfully', utils.formatCredentialData(credential));

            // Format the credential for server verification
            const attestationResponse = {
                id: credential.id,
                rawId: utils.bufferToBase64url(credential.rawId),
                response: {
                    clientDataJSON: utils.bufferToBase64url(credential.response.clientDataJSON),
                    attestationObject: utils.bufferToBase64url(credential.response.attestationObject)
                },
                type: credential.type
            };

            // Send response to server for verification
            logger.addLog('info', 'Sending attestation to server for verification');
            const verificationRes = await fetch(`${this.API_URL}/auth/register/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    response: attestationResponse
                }),
                credentials: 'include'
            });

            if (!verificationRes.ok) {
                throw new Error('Failed to verify registration');
            }

            const verificationResult = await verificationRes.json();
            logger.addLog('success', 'Registration verified by server', verificationResult);

            return verificationResult;
        } catch (error) {
            logger.addLog('error', 'Registration failed', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async login(username) {
        try {
            logger.addLog('info', 'Starting native WebAuthn authentication', { username });

            // Get authentication options from server
            logger.addLog('info', 'Requesting authentication options from server');
            const optionsRes = await fetch(`${this.API_URL}/auth/login/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
                credentials: 'include'
            });

            if (!optionsRes.ok) {
                throw new Error('Failed to get authentication options');
            }

            const serverOptions = await optionsRes.json();
            logger.addLog('info', 'Received authentication options', serverOptions);

            // Convert server options to credential request options
            const publicKeyOptions = {
                challenge: utils.base64urlToBuffer(serverOptions.challenge),
                allowCredentials: serverOptions.allowCredentials?.map(cred => ({
                    id: utils.base64urlToBuffer(cred.id),
                    type: cred.type,
                    transports: cred.transports
                })),
                timeout: serverOptions.timeout,
                userVerification: serverOptions.userVerification
            };

            // Get credentials using native API
            logger.addLog('info', 'Getting credentials using navigator.credentials.get()');
            const credential = await navigator.credentials.get({
                publicKey: publicKeyOptions
            });

            logger.addLog('info', 'Credentials retrieved successfully', utils.formatCredentialData(credential));

            // Format the credential for server verification
            const assertionResponse = {
                id: credential.id,
                rawId: utils.bufferToBase64url(credential.rawId),
                response: {
                    clientDataJSON: utils.bufferToBase64url(credential.response.clientDataJSON),
                    authenticatorData: utils.bufferToBase64url(credential.response.authenticatorData),
                    signature: utils.bufferToBase64url(credential.response.signature),
                    userHandle: credential.response.userHandle ? 
                        utils.bufferToBase64url(credential.response.userHandle) : null
                },
                type: credential.type
            };

            // Send response to server for verification
            logger.addLog('info', 'Sending assertion to server for verification');
            const verificationRes = await fetch(`${this.API_URL}/auth/login/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    response: assertionResponse
                }),
                credentials: 'include'
            });

            if (!verificationRes.ok) {
                throw new Error('Failed to verify authentication');
            }

            const verificationResult = await verificationRes.json();
            logger.addLog('success', 'Authentication verified by server', verificationResult);

            return verificationResult;
        } catch (error) {
            logger.addLog('error', 'Authentication failed', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

// Create global auth instance
window.auth = new WebAuthnNative();
