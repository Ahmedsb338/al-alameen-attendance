// =====================================================
// PASSKEY
// Registration + Authentication
// Quantech Attendance System
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
// ENSURE USER SESSION / PROFILE
// =====================================================

async function ensurePasskeySession() {

    // =================================================
    // PROFILE ALREADY AVAILABLE
    // =================================================

    if (
        window.currentUserProfile &&
        window.currentUserProfile.employee_id &&
        window.currentUserProfile.active === true
    ) {

        return window.currentUserProfile;
    }


    // =================================================
    // TRY TO LOAD SESSION
    // =================================================

    if (
        typeof checkLoginSession ===
        "function"
    ) {

        try {

            await checkLoginSession();

        }

        catch (error) {

            console.error(
                "Unable to load login session:",
                error
            );
        }
    }


    // =================================================
    // PROFILE NOW AVAILABLE
    // =================================================

    if (
        window.currentUserProfile &&
        window.currentUserProfile.employee_id &&
        window.currentUserProfile.active === true
    ) {

        return window.currentUserProfile;
    }


    // =================================================
    // WAIT BRIEFLY FOR SESSION INITIALIZATION
    // =================================================

    for (
        let attempt = 0;
        attempt < 20;
        attempt++
    ) {

        await new Promise(
            resolve =>
                setTimeout(resolve, 250)
        );


        if (
            window.currentUserProfile &&
            window.currentUserProfile.employee_id &&
            window.currentUserProfile.active === true
        ) {

            return window.currentUserProfile;
        }
    }


    throw new Error(
        "User profile is not available. Please refresh and try again."
    );
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


    if (profile.active !== true) {

        throw new Error(
            "Your account is inactive."
        );
    }


    return profile;
}


// =====================================================
// CHECK WEBAUTHN SUPPORT
// =====================================================

function ensurePasskeySupport() {

    if (
        !window.SimpleWebAuthnBrowser
    ) {

        throw new Error(
            "Passkey service is not available. Please refresh the page."
        );
    }


    if (
        typeof
        window.SimpleWebAuthnBrowser.startRegistration !==
        "function"
    ) {

        throw new Error(
            "Passkey registration service is not available."
        );
    }


    if (
        typeof
        window.SimpleWebAuthnBrowser.startAuthentication !==
        "function"
    ) {

        throw new Error(
            "Passkey authentication service is not available."
        );
    }
}


// =====================================================
// SAFE JSON RESPONSE
// =====================================================

async function readPasskeyResponse(
    response,
    defaultMessage
) {

    let data = null;

    try {

        data =
            await response.json();

    }

    catch (error) {

        console.error(
            "Passkey server returned invalid JSON:",
            error
        );

        throw new Error(
            defaultMessage
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            data?.message ||
            defaultMessage
        );
    }


    return data;
}


// =====================================================
// PASSKEY REGISTRATION
// =====================================================

async function registerCurrentUserPasskey() {

    try {

        // =================================================
        // MAKE SURE SESSION / PROFILE IS READY
        // =================================================

        await ensurePasskeySession();


        const profile =
            getPasskeyProfile();


        ensurePasskeySupport();


        // =================================================
        // GET FRESH ACCESS TOKEN
        // =================================================

        const accessToken =
            getPasskeyAccessToken();


        console.log(
            "Starting passkey registration for employee:",
            profile.employee_id
        );


        // =================================================
        // START REGISTRATION
        // =================================================

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
                    },

                    cache: "no-store"
                }
            );


        const options =
            await readPasskeyResponse(
                registerResponse,
                "Unable to start passkey registration."
            );


        // =================================================
        // VALIDATE OPTIONS
        // =================================================

        if (
            !options ||
            !options.challenge ||
            !options.rp ||
            !options.user
        ) {

            console.error(
                "Invalid registration options:",
                options
            );

            throw new Error(
                "Passkey registration options are invalid."
            );
        }


        // =================================================
        // CREATE PASSKEY
        // =================================================

        let registrationResponse;


        try {

            registrationResponse =
                await window
                    .SimpleWebAuthnBrowser
                    .startRegistration({
                        optionsJSON:
                            options
                    });

        }

        catch (error) {

            console.error(
                "WebAuthn registration ceremony failed:",
                error
            );

            throw error;
        }


        // =================================================
        // COMPLETE REGISTRATION
        // =================================================

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
                            getPasskeyAccessToken(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            response:
                                registrationResponse
                        }),

                    cache: "no-store"
                }
            );


        const result =
            await readPasskeyResponse(
                completeResponse,
                "Failed to save passkey."
            );


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Failed to save passkey."
            );
        }


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "Passkey registration completed successfully."
        );


        const statusElement =
            document.getElementById(
                "passkeyStatus"
            );


        if (statusElement) {

            statusElement.textContent =
                "Passkey registered successfully.";

            statusElement.classList.add(
                "success"
            );
        }


        alert(
            "Passkey registered successfully."
        );


        return true;

    }

    catch (error) {

        console.error(
            "Passkey registration error:",
            error
        );


        // =================================================
        // USER CANCELLED / TIMEOUT
        // =================================================

        if (
            error &&
            error.name ===
                "NotAllowedError"
        ) {

            alert(
                "Passkey registration was cancelled or timed out."
            );

            return false;
        }


        // =================================================
        // CREDENTIAL ALREADY EXISTS
        // =================================================

        if (
            error &&
            error.name ===
                "InvalidStateError"
        ) {

            alert(
                "This passkey is already registered."
            );

            return false;
        }


        // =================================================
        // NOT SUPPORTED
        // =================================================

        if (
            error &&
            error.name ===
                "NotSupportedError"
        ) {

            alert(
                "This device or browser does not support passkeys."
            );

            return false;
        }


        // =================================================
        // NETWORK / CORS
        // =================================================

        if (
            error &&
            error.name ===
                "TypeError"
        ) {

            console.error(
                "Possible network or CORS error:",
                error
            );

            alert(
                "Unable to connect to the Passkey service. Please check your connection and try again."
            );

            return false;
        }


        // =================================================
        // OTHER ERROR
        // =================================================

        alert(
            error &&
            error.message
                ? error.message
                : "Passkey registration failed. Please try again."
        );


        return false;
    }
}


// =====================================================
// PASSKEY AUTHENTICATION
// =====================================================

async function authenticateCurrentUserPasskey() {

    try {

        // =================================================
        // MAKE SURE SESSION / PROFILE IS READY
        // =================================================

        await ensurePasskeySession();


        const profile =
            getPasskeyProfile();


        ensurePasskeySupport();


        // =================================================
        // GET CURRENT ACCESS TOKEN
        // =================================================

        const accessToken =
            getPasskeyAccessToken();


        console.log(
            "Starting passkey authentication for employee:",
            profile.employee_id
        );


        // =================================================
        // START AUTHENTICATION
        // =================================================

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
                    },

                    cache: "no-store"
                }
            );


        const options =
            await readPasskeyResponse(
                authResponse,
                "Unable to start passkey authentication."
            );


        // =================================================
        // VALIDATE OPTIONS
        // =================================================

        if (
            !options ||
            !options.challenge
        ) {

            console.error(
                "Invalid authentication options:",
                options
            );

            throw new Error(
                "Passkey authentication options are invalid."
            );
        }


        console.log(
            "Passkey authentication options received."
        );


        // =================================================
        // AUTHENTICATE PASSKEY
        // =================================================

        let authenticationResponse;


        try {

            authenticationResponse =
                await window
                    .SimpleWebAuthnBrowser
                    .startAuthentication({
                        optionsJSON:
                            options
                    });

        }

        catch (error) {

            console.error(
                "WebAuthn authentication ceremony failed:",
                error
            );

            throw error;
        }


        // =================================================
        // VERIFY AUTHENTICATION
        // =================================================

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
                            getPasskeyAccessToken(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            response:
                                authenticationResponse
                        }),

                    cache: "no-store"
                }
            );


        const result =
            await readPasskeyResponse(
                verifyResponse,
                "Passkey authentication failed."
            );


        // =================================================
        // VERIFY RESULT
        // =================================================

        if (
            !result.success ||
            result.verified !== true
        ) {

            throw new Error(
                result.error ||
                "Passkey authentication failed."
            );
        }


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "Passkey authentication verified successfully."
        );


        return true;

    }

    catch (error) {

        console.error(
            "Passkey authentication error:",
            error
        );


        // =================================================
        // USER CANCELLED / TIMEOUT
        // =================================================

        if (
            error &&
            error.name ===
                "NotAllowedError"
        ) {

            alert(
                "Passkey verification was cancelled or timed out."
            );

            return false;
        }


        // =================================================
        // PASSKEY NOT FOUND
        // =================================================

        if (
            error &&
            error.name ===
                "NotFoundError"
        ) {

            alert(
                "No registered passkey was found on this device."
            );

            return false;
        }


        // =================================================
        // NOT SUPPORTED
        // =================================================

        if (
            error &&
            error.name ===
                "NotSupportedError"
        ) {

            alert(
                "This device or browser does not support passkeys."
            );

            return false;
        }


        // =================================================
        // NETWORK / CORS
        // =================================================

        if (
            error &&
            error.name ===
                "TypeError"
        ) {

            console.error(
                "Possible network or CORS error:",
                error
            );

            alert(
                "Unable to connect to the Passkey service. Please check your connection and try again."
            );

            return false;
        }


        // =================================================
        // OTHER ERROR
        // =================================================

        alert(
            error &&
            error.message
                ? error.message
                : "Passkey authentication failed. Please try again."
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

