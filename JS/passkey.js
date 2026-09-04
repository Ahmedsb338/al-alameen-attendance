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
// LOAD CURRENT USER PROFILE DIRECTLY
// =====================================================
// IMPORTANT:
// Passkey must NOT depend only on checkLoginSession()
// because attendance.html may call Passkey before
// window.currentUserProfile is initialized.
// =====================================================

async function loadPasskeyUserProfile() {

    const accessToken =
        getPasskeyAccessToken();


    // =================================================
    // CHECK REQUIRED SUPABASE CONFIGURATION
    // =================================================

    if (
        typeof SUPABASE_URL === "undefined" ||
        typeof SUPABASE_KEY === "undefined"
    ) {

        throw new Error(
            "Supabase configuration is not available."
        );
    }


    // =================================================
    // GET CURRENT AUTH USER
    // =================================================

    const userResponse =
        await fetch(
            SUPABASE_URL +
            "/auth/v1/user",
            {
                method: "GET",

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


    let userData = null;

    try {

        userData =
            await userResponse.json();

    }

    catch (error) {

        throw new Error(
            "Unable to read the current user session."
        );
    }


    if (
        !userResponse.ok ||
        !userData ||
        !userData.id
    ) {

        console.error(
            "Supabase Auth user error:",
            userData
        );

        throw new Error(
            "Your session has expired. Please login again."
        );
    }


    // =================================================
    // LOAD PROFILE
    // =================================================

    const profileResponse =
        await fetch(
            SUPABASE_URL +
            "/rest/v1/profiles" +
            "?id=eq." +
            encodeURIComponent(userData.id) +
            "&select=*",
            {
                method: "GET",

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


    let profiles = null;

    try {

        profiles =
            await profileResponse.json();

    }

    catch (error) {

        throw new Error(
            "Unable to read your user profile."
        );
    }


    if (
        !profileResponse.ok
    ) {

        console.error(
            "Supabase profile error:",
            profiles
        );

        throw new Error(
            "Unable to load your user profile."
        );
    }


    if (
        !Array.isArray(profiles) ||
        profiles.length === 0
    ) {

        console.error(
            "No profile found for Auth user:",
            userData.id
        );

        throw new Error(
            "User profile was not found. Please contact your administrator."
        );
    }


    const profile =
        profiles[0];


    // =================================================
    // ACCOUNT ACTIVE CHECK
    // =================================================

    if (
        profile.active !== true
    ) {

        throw new Error(
            "Your account has been deactivated."
        );
    }


    // =================================================
    // EMPLOYEE LINK CHECK
    // =================================================

    if (
        !profile.employee_id
    ) {

        throw new Error(
            "This account is not linked to an employee."
        );
    }


    // =================================================
    // SAVE PROFILE GLOBALLY
    // =================================================

    window.currentUserProfile =
        profile;


    console.log(
        "Passkey profile loaded successfully:",
        {
            userId:
                userData.id,

            employeeId:
                profile.employee_id,

            role:
                profile.role,

            active:
                profile.active
        }
    );


    return profile;
}


// =====================================================
// ENSURE USER SESSION / PROFILE
// =====================================================

async function ensurePasskeySession() {

    // =================================================
    // 1. USE EXISTING PROFILE IF VALID
    // =================================================

    if (
        window.currentUserProfile &&
        window.currentUserProfile.employee_id &&
        window.currentUserProfile.active === true
    ) {

        return window.currentUserProfile;
    }


    // =================================================
    // 2. DIRECTLY LOAD PROFILE FROM SUPABASE
    // =================================================
    // This is the important fix.
    // We no longer depend on checkLoginSession().
    // =================================================

    try {

        const profile =
            await loadPasskeyUserProfile();

        if (
            profile &&
            profile.employee_id &&
            profile.active === true
        ) {

            return profile;
        }

    }

    catch (error) {

        console.error(
            "Direct Passkey profile loading failed:",
            error
        );
    }


    // =================================================
    // 3. FALLBACK TO EXISTING SESSION FUNCTION
    // =================================================
    // Keep compatibility with the existing application.
    // =================================================

    if (
        typeof checkLoginSession === "function"
    ) {

        try {

            await checkLoginSession();

        }

        catch (error) {

            console.error(
                "Existing login session check failed:",
                error
            );
        }
    }


    // =================================================
    // 4. CHECK PROFILE AGAIN
    // =================================================

    if (
        window.currentUserProfile &&
        window.currentUserProfile.employee_id &&
        window.currentUserProfile.active === true
    ) {

        return window.currentUserProfile;
    }


    // =================================================
    // 5. FINAL DIRECT RETRY
    // =================================================

    try {

        const profile =
            await loadPasskeyUserProfile();

        if (
            profile &&
            profile.employee_id &&
            profile.active === true
        ) {

            return profile;
        }

    }

    catch (error) {

        console.error(
            "Final Passkey profile loading attempt failed:",
            error
        );

        throw error;
    }


    throw new Error(
        "Unable to load your employee profile. Please login again."
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
            "User profile is not available."
        );
    }


    if (
        !profile.employee_id
    ) {

        throw new Error(
            "This account is not linked to an employee."
        );
    }


    if (
        profile.active !== true
    ) {

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
        // ENSURE PROFILE
        // =================================================

        await ensurePasskeySession();


        const profile =
            getPasskeyProfile();


        ensurePasskeySupport();


        // =================================================
        // ACCESS TOKEN
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


        if (
            error &&
            error.name ===
                "TypeError"
        ) {

            alert(
                "Unable to connect to the Passkey service. Please check your connection and try again."
            );

            return false;
        }


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
        // ENSURE PROFILE
        // =================================================

        const profile =
            await ensurePasskeySession();


        // =================================================
        // GET PROFILE AGAIN FROM VERIFIED SOURCE
        // =================================================

        if (
            !profile ||
            !profile.employee_id ||
            profile.active !== true
        ) {

            throw new Error(
                "Your employee profile is not available or inactive."
            );
        }


        ensurePasskeySupport();


        // =================================================
        // ACCESS TOKEN
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
            "Passkey authentication verified successfully.",
            {
                employeeId:
                    profile.employee_id
            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "Passkey authentication error:",
            error
        );


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

