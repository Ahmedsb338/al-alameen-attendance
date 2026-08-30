// =====================================================
// PASSKEY - PRODUCTION
// Registration + Authentication
// =====================================================


// =====================================================
// GET ACCESS TOKEN
// =====================================================

function getPasskeyAccessToken() {

    const accessToken =
        localStorage.getItem("access_token");

    if (!accessToken) {
        throw new Error(
            "Your session has expired. Please login again."
        );
    }

    return accessToken;
}


// =====================================================
// GET CURRENT PROFILE
// =====================================================

function getPasskeyProfile() {

    const profile =
        window.currentUserProfile;

    if (!profile) {
        throw new Error(
            "User profile is not available. Please refresh and try again."
        );
    }

    if (!profile.employee_id) {
        throw new Error(
            "This account is not linked to an employee."
        );
    }

    return profile;
}


// =====================================================
// PASSKEY REGISTRATION
// =====================================================

async function registerCurrentUserPasskey() {

    try {

        const accessToken =
            getPasskeyAccessToken();

        getPasskeyProfile();


        // -------------------------------------------------
        // START REGISTRATION
        // -------------------------------------------------

        const registerResponse =
            await fetch(
                SUPABASE_URL +
                "/functions/v1/register-passkey",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            accessToken,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        let options;

        try {
            options =
                await registerResponse.json();
        } catch {
            throw new Error(
                "Invalid response from passkey registration service."
            );
        }


        if (!registerResponse.ok) {

            throw new Error(
                options.error ||
                "Unable to start passkey registration."
            );
        }


        // -------------------------------------------------
        // CHECK WEBAUTHN LIBRARY
        // -------------------------------------------------

        if (
            !window.SimpleWebAuthnBrowser ||
            typeof
                window.SimpleWebAuthnBrowser.startRegistration !==
                "function"
        ) {

            throw new Error(
                "Passkey service is not available. Please refresh the page and try again."
            );
        }


        // -------------------------------------------------
        // CREATE PASSKEY
        // -------------------------------------------------

        const registrationResponse =
            await window.SimpleWebAuthnBrowser.startRegistration({
                optionsJSON:
                    options
            });


        // -------------------------------------------------
        // COMPLETE REGISTRATION
        // -------------------------------------------------

        const completeResponse =
            await fetch(
                SUPABASE_URL +
                "/functions/v1/complete-passkey-registration",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            accessToken,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            response:
                                registrationResponse
                        })
                }
            );


        let result;

        try {
            result =
                await completeResponse.json();
        } catch {
            throw new Error(
                "Invalid response from passkey registration service."
            );
        }


        if (
            !completeResponse.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Failed to save passkey."
            );
        }


        alert(
            "Passkey registered successfully."
        );

        return true;


    } catch (error) {

        console.error(
            "Passkey registration error:",
            error
        );


        // User cancelled Windows Hello / biometric prompt
        if (
            error &&
            error.name === "NotAllowedError"
        ) {

            alert(
                "Passkey registration was cancelled or timed out."
            );

            return false;
        }


        // Credential already exists
        if (
            error &&
            error.name === "InvalidStateError"
        ) {

            alert(
                "This passkey is already registered."
            );

            return false;
        }


        alert(
            error.message ||
            "Passkey registration failed. Please try again."
        );

        return false;
    }
}


// =====================================================
// PASSKEY AUTHENTICATION
// =====================================================

async function authenticateCurrentUserPasskey() {

    try {

        const accessToken =
            getPasskeyAccessToken();

        getPasskeyProfile();


        // -------------------------------------------------
        // START AUTHENTICATION
        // -------------------------------------------------

        const authResponse =
            await fetch(
                SUPABASE_URL +
                "/functions/v1/create-passkey-authentication",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            accessToken,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        let options;

        try {
            options =
                await authResponse.json();
        } catch {
            throw new Error(
                "Invalid response from passkey authentication service."
            );
        }


        if (!authResponse.ok) {

            throw new Error(
                options.error ||
                "Unable to start passkey authentication."
            );
        }


        // -------------------------------------------------
        // CHECK WEBAUTHN LIBRARY
        // -------------------------------------------------

        if (
            !window.SimpleWebAuthnBrowser ||
            typeof
                window.SimpleWebAuthnBrowser.startAuthentication !==
                "function"
        ) {

            throw new Error(
                "Passkey service is not available. Please refresh the page and try again."
            );
        }


        // -------------------------------------------------
        // AUTHENTICATE PASSKEY
        // -------------------------------------------------

        const authenticationResponse =
            await window.SimpleWebAuthnBrowser.startAuthentication({
                optionsJSON:
                    options
            });


        // -------------------------------------------------
        // VERIFY AUTHENTICATION
        // IMPORTANT:
        // verify-passkey expects BOTH:
        // response + credential id
        // -------------------------------------------------

        const verifyResponse =
            await fetch(
                SUPABASE_URL +
                "/functions/v1/verify-passkey",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            accessToken,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            id:
                                authenticationResponse.id,

                            response:
                                authenticationResponse
                        })
                }
            );


        let result;

        try {
            result =
                await verifyResponse.json();
        } catch {
            throw new Error(
                "Invalid response from passkey verification service."
            );
        }


        if (
            !verifyResponse.ok ||
            !result.success ||
            result.verified !== true
        ) {

            throw new Error(
                result.error ||
                "Passkey authentication failed."
            );
        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return true;


    } catch (error) {

        console.error(
            "Passkey authentication error:",
            error
        );


        // User cancelled or authentication timed out
        if (
            error &&
            error.name === "NotAllowedError"
        ) {

            alert(
                "Passkey verification was cancelled or timed out."
            );

            return false;
        }


        // Passkey no longer exists on device
        if (
            error &&
            error.name === "NotFoundError"
        ) {

            alert(
                "No registered passkey was found on this device."
            );

            return false;
        }


        alert(
            error.message ||
            "Passkey authentication failed. Please try again."
        );

        return false;
    }
}


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.registerCurrentUserPasskey =
    registerCurrentUserPasskey;

window.authenticateCurrentUserPasskey =
    authenticateCurrentUserPasskey;
