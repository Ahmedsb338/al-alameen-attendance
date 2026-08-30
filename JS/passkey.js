// =====================================================
// PASSKEY REGISTRATION
// =====================================================

async function registerCurrentUserPasskey() {

    try {

        // Check current Supabase session
        const accessToken =
            localStorage.getItem(
                "access_token"
            );

        if (!accessToken) {
            throw new Error(
                "Please login first."
            );
        }

        // Get current profile
        const profile =
            window.currentUserProfile;

        if (!profile) {
            throw new Error(
                "User profile not loaded."
            );
        }

        if (!profile.employee_id) {
            throw new Error(
                "This account is not linked to an employee."
            );
        }

        // Start registration
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

        const options =
            await registerResponse.json();

        if (!registerResponse.ok) {
            throw new Error(
                options.error ||
                "Failed to start passkey registration."
            );
        }

        // Start WebAuthn
        const {
            startRegistration
        } = SimpleWebAuthnBrowser;

        const registrationResponse =
            await startRegistration({
                optionsJSON:
                    options
            });

        console.log(
            "WebAuthn registration completed."
        );

        // Complete registration
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

        const result =
            await completeResponse.json();

        if (
            !completeResponse.ok ||
            !result.success
        ) {
            throw new Error(
                result.error ||
                "Failed to complete passkey registration."
            );
        }

        alert(
            "Passkey registered successfully."
        );

        console.log(
            "Passkey registration result:",
            result
        );

        return true;

    } catch (error) {

        console.error(
            "Passkey registration error:",
            error
        );

        alert(
            error.message ||
            "Passkey registration failed."
        );

        return false;
    }
}


// =====================================================
// PASSKEY AUTHENTICATION
// =====================================================

async function authenticateCurrentUserPasskey() {

    try {

        // -------------------------------------------------
        // Check current Supabase session
        // -------------------------------------------------

        const accessToken =
            localStorage.getItem(
                "access_token"
            );

        if (!accessToken) {
            throw new Error(
                "Please login first."
            );
        }


        // -------------------------------------------------
        // Start authentication
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


        const options =
            await authResponse.json();


        if (!authResponse.ok) {

            throw new Error(
                options.error ||
                "Failed to start passkey authentication."
            );
        }


        console.log(
            "Authentication options received:",
            options
        );


        // -------------------------------------------------
        // Start WebAuthn
        // -------------------------------------------------

        const {
            startAuthentication
        } = SimpleWebAuthnBrowser;


        if (
            typeof startAuthentication !==
            "function"
        ) {

            throw new Error(
                "SimpleWebAuthnBrowser.startAuthentication is not available."
            );
        }


        const authenticationResponse =
            await startAuthentication({
                optionsJSON:
                    options
            });


        console.log(
            "WebAuthn authentication completed:",
            authenticationResponse
        );


        // -------------------------------------------------
        // Verify authentication
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
                            response:
                                authenticationResponse
                        })
                }
            );


        const result =
            await verifyResponse.json();


        console.log(
            "Passkey verification result:",
            result
        );


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
        // Success
        // -------------------------------------------------

        alert(
            "Passkey authentication successful."
        );


        return true;


    } catch (error) {

        console.error(
            "Passkey authentication error:",
            error
        );


        alert(
            error.message ||
            "Passkey authentication failed."
        );


        return false;
    }
}


// =====================================================
// Make functions available to HTML onclick
// =====================================================

window.registerCurrentUserPasskey =
    registerCurrentUserPasskey;

window.authenticateCurrentUserPasskey =
    authenticateCurrentUserPasskey;

