// =====================================================
// AUTHENTICATION
// =====================================================

async function loginUser() {

    const username =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const errorBox =
        document.getElementById("loginError");

    errorBox.textContent = "";

    if (!username || !password) {

        errorBox.textContent =
            "Please enter username and password.";

        return;
    }

    try {

        // =================================================
        // Find Auth Email from Login ID
        // =================================================

        const lookupResponse =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/rpc/get_login_email",
                {
                    method: "POST",

                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        p_login_id: username
                    })
                }
            );


        const authEmail =
            await lookupResponse.json();


        if (
            !lookupResponse.ok ||
            !authEmail
        ) {

            throw new Error(
                "Username not found."
            );
        }


        // =================================================
        // Login to Supabase Auth
        // =================================================

        const loginResponse =
            await fetch(
                SUPABASE_URL +
                "/auth/v1/token?grant_type=password",
                {
                    method: "POST",

                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: authEmail,
                        password: password
                    })
                }
            );


        const data =
            await loginResponse.json();


        if (!loginResponse.ok) {

            throw new Error(
                data.error_description ||
                "Invalid username or password."
            );
        }


        // =================================================
        // Save Session
        // =================================================

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        localStorage.setItem(
            "refresh_token",
            data.refresh_token
        );


        // =================================================
        // Load User Profile
        // =================================================

        await loadCurrentUserProfile();


        // =================================================
        // Hide Login
        // =================================================

        document.getElementById(
            "loginPage"
        ).style.display = "none";


        // =================================================
        // Show Dashboard
        // =================================================

        const dashboard =
            document.getElementById(
                "dashboardPage"
            );

        dashboard.style.display = "block";
        dashboard.classList.add("active");


        // =================================================
        // Apply Permissions
        // =================================================

        if (window.currentUserProfile) {

            applyRolePermissions(
                window.currentUserProfile.role
            );
        }


        // =================================================
        // Load Branch Header
        // =================================================

        await loadBranchHeader();

    }

    catch (error) {

        console.error(error);

        errorBox.textContent =
            error.message;
    }
}


// =====================================================
// LOAD CURRENT USER PROFILE
// =====================================================

async function loadCurrentUserProfile() {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    if (!accessToken) {

        throw new Error(
            "No active session."
        );
    }


    // =================================================
    // Get Current Auth User
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
                        accessToken
                }
            }
        );


    const user =
        await userResponse.json();


    if (
        !userResponse.ok ||
        !user.id
    ) {

        throw new Error(
            "Session expired."
        );
    }


    // =================================================
    // Get Profile
    // =================================================

    const profileResponse =
        await fetch(
            SUPABASE_URL +
            "/rest/v1/profiles?id=eq." +
            user.id +
            "&select=*",
            {
                method: "GET",

                headers: {
                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        "Bearer " +
                        accessToken
                }
            }
        );


    const profiles =
        await profileResponse.json();


    if (
        !profileResponse.ok ||
        !profiles.length
    ) {

        throw new Error(
            "User profile not found."
        );
    }


    const profile =
        profiles[0];


    // =================================================
    // Check Active Account
    // =================================================

    if (profile.active !== true) {

        throw new Error(
            "This account has been deactivated."
        );
    }


    // =================================================
    // Save Profile Globally
    // =================================================

    window.currentUserProfile =
        profile;


    return profile;
}


// =====================================================
// CHECK LOGIN SESSION
// =====================================================

async function checkLoginSession() {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    const loginPage =
        document.getElementById(
            "loginPage"
        );


    const dashboardPage =
        document.getElementById(
            "dashboardPage"
        );


    // =================================================
    // No Session
    // =================================================

    if (!accessToken) {

        loginPage.style.display =
            "flex";

        dashboardPage.style.display =
            "none";

        dashboardPage.classList.remove(
            "active"
        );

        return;
    }


    try {

        // =================================================
        // Load User Profile
        // =================================================

        const profile =
            await loadCurrentUserProfile();


        // =================================================
        // Hide Login
        // =================================================

        loginPage.style.display =
            "none";


        // =================================================
        // Show Dashboard
        // =================================================

        dashboardPage.style.display =
            "block";

        dashboardPage.classList.add(
            "active"
        );


        // =================================================
        // Apply Permissions
        // =================================================

        applyRolePermissions(
            profile.role
        );


        // =================================================
        // Load Branch Header
        // =================================================

        await loadBranchHeader();

    }

    catch (error) {

        console.error(error);


        // =================================================
        // Remove Invalid Session
        // =================================================

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );


        loginPage.style.display =
            "flex";

        dashboardPage.style.display =
            "none";

        dashboardPage.classList.remove(
            "active"
        );


        const errorBox =
            document.getElementById(
                "loginError"
            );


        if (errorBox) {

            errorBox.textContent =
                error.message;
        }
    }
}


// =====================================================
// LOGOUT
// =====================================================

function logoutUser() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "refresh_token"
    );


    window.currentUserProfile =
        null;


    const dashboardPage =
        document.getElementById(
            "dashboardPage"
        );


    const loginPage =
        document.getElementById(
            "loginPage"
        );


    dashboardPage.style.display =
        "none";

    dashboardPage.classList.remove(
        "active"
    );


    loginPage.style.display =
        "flex";


    document.getElementById(
        "loginEmail"
    ).value = "";


    document.getElementById(
        "loginPassword"
    ).value = "";


    document.getElementById(
        "loginError"
    ).textContent = "";
}


// =====================================================
// INITIALIZE AUTH
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    checkLoginSession
);