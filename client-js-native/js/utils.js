// Utility functions for encoding and decoding
const utils = {
    // Convert base64url to ArrayBuffer
    base64urlToBuffer(base64url) {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padLen = (4 - (base64.length % 4)) % 4;
        const padded = base64 + '='.repeat(padLen);
        const binary = atob(padded);
        const buffer = new ArrayBuffer(binary.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return buffer;
    },

    // Convert ArrayBuffer to base64url
    bufferToBase64url(buffer) {
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (const byte of bytes) {
            str += String.fromCharCode(byte);
        }
        const base64 = btoa(str);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },

    // Convert a string to UTF-8 ArrayBuffer
    strToBuffer(str) {
        return new TextEncoder().encode(str).buffer;
    },

    // Convert UTF-8 ArrayBuffer to string
    bufferToStr(buffer) {
        return new TextDecoder().decode(buffer);
    },

    // Format credential data for logging
    formatCredentialData(credential) {
        if (!credential) return null;

        return {
            id: credential.id,
            type: credential.type,
            authenticatorAttachment: credential.authenticatorAttachment,
            response: {
                clientDataJSON: this.bufferToStr(credential.response.clientDataJSON),
                attestationObject: credential.response.attestationObject 
                    ? this.bufferToBase64url(credential.response.attestationObject)
                    : undefined,
                authenticatorData: credential.response.authenticatorData
                    ? this.bufferToBase64url(credential.response.authenticatorData)
                    : undefined,
                signature: credential.response.signature
                    ? this.bufferToBase64url(credential.response.signature)
                    : undefined,
                userHandle: credential.response.userHandle
                    ? this.bufferToStr(credential.response.userHandle)
                    : undefined
            }
        };
    },

    // Generate a random challenge
    generateChallenge() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return array.buffer;
    },

    // Check if WebAuthn is supported
    isWebAuthnSupported() {
        return window.PublicKeyCredential !== undefined && 
               typeof window.PublicKeyCredential === 'function';
    }
};
