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
        document
            .getElementById("loginError");

    errorBox.textContent = "";

    if (!username || !password) {

        errorBox.textContent =
            "Please enter username and password.";

        return;
    }

    try {

        // =================================================
        // FIND AUTH EMAIL
        // =================================================

        const lookupResponse =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/rpc/get_login_email",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            p_login_id:
                                username
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
        // SUPABASE LOGIN
        // =================================================

        const loginResponse =
            await fetch(
                SUPABASE_URL +
                "/auth/v1/token?grant_type=password",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email:
                                authEmail,

                            password:
                                password
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
        // SAVE SESSION
        // =================================================

        if (!data.access_token) {

            throw new Error(
                "Login succeeded but no access token was returned."
            );
        }

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        if (data.refresh_token) {

            localStorage.setItem(
                "refresh_token",
                data.refresh_token
            );
        }


        // =================================================
        // LOAD SESSION / PROFILE
        // =================================================

        await checkLoginSession();

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        errorBox.textContent =
            error.message;
    }
}


// =====================================================
// REFRESH SUPABASE SESSION
// =====================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem(
            "refresh_token"
        );

    if (!refreshToken) {

        return false;
    }

    try {

        const response =
            await fetch(
                SUPABASE_URL +
                "/auth/v1/token?grant_type=refresh_token",
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            refresh_token:
                                refreshToken
                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.access_token
        ) {

            console.warn(
                "Session refresh failed:",
                data
            );

            return false;
        }


        // =================================================
        // SAVE NEW ACCESS TOKEN
        // =================================================

        localStorage.setItem(
            "access_token",
            data.access_token
        );


        // =================================================
        // SAVE NEW REFRESH TOKEN
        // =================================================

        if (data.refresh_token) {

            localStorage.setItem(
                "refresh_token",
                data.refresh_token
            );
        }


        return true;

    }

    catch (error) {

        console.error(
            "Refresh token error:",
            error
        );

        return false;
    }
}


// =====================================================
// LOAD USER PROFILE
// =====================================================

async function loadCurrentUserProfile(
    accessToken
) {

    // =================================================
    // GET CURRENT USER
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

                    "Accept":
                        "application/json"
                },

                cache: "no-store"
            }
        );

    const user =
        await userResponse.json();


    if (
        !userResponse.ok ||
        !user.id
    ) {

        const error =
            new Error(
                "Session expired."
            );

        error.code =
            "AUTH_SESSION_INVALID";

        throw error;
    }


    // =================================================
    // GET PROFILE
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
                        accessToken,

                    "Accept":
                        "application/json"
                },

                cache: "no-store"
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
    // ACCOUNT STATUS
    // =================================================

    if (
        profile.active !== true
    ) {

        throw new Error(
            "This account has been deactivated."
        );
    }


    // =================================================
    // SAVE CURRENT PROFILE
    // =================================================

    window.currentUserProfile =
        profile;


    return profile;
}


// =====================================================
// LOGIN SESSION
// =====================================================

async function checkLoginSession() {

    const sessionLoader =
        document.getElementById(
            "sessionLoader"
        );

    const loginPage =
        document.getElementById(
            "loginPage"
        );

    const appContainer =
        document.getElementById(
            "appContainer"
        );

    const dashboardPage =
        document.getElementById(
            "dashboardPage"
        );


    // =================================================
    // GET ACCESS TOKEN
    // =================================================

    let accessToken =
        localStorage.getItem(
            "access_token"
        );


    // =================================================
    // NO ACCESS TOKEN
    // =================================================

    if (!accessToken) {

        if (loginPage) {

            loginPage.style.display =
                "flex";
        }

        if (appContainer) {

            appContainer.style.display =
                "none";
        }

        if (dashboardPage) {

            dashboardPage.style.display =
                "none";

            dashboardPage.classList.remove(
                "active"
            );
        }

        if (sessionLoader) {

            sessionLoader.style.display =
                "none";
        }

        return;
    }


    try {

        // =================================================
        // LOAD PROFILE
        // =================================================

        let profile;

        try {

            profile =
                await loadCurrentUserProfile(
                    accessToken
                );

        }

        catch (error) {

            // =================================================
            // ACCESS TOKEN MAY HAVE EXPIRED
            // =================================================

            if (
                error.code ===
                "AUTH_SESSION_INVALID"
            ) {

                const refreshed =
                    await refreshAccessToken();

                if (!refreshed) {

                    throw error;
                }


                // =================================================
                // GET NEW TOKEN
                // =================================================

                accessToken =
                    localStorage.getItem(
                        "access_token"
                    );


                // =================================================
                // RETRY PROFILE
                // =================================================

                profile =
                    await loadCurrentUserProfile(
                        accessToken
                    );

            }

            else {

                throw error;
            }
        }


        // =================================================
        // HEADER USER INFORMATION
        // =================================================

        const headerUserName =
            document.getElementById(
                "headerUserName"
            );

        const headerUserRole =
            document.getElementById(
                "headerUserRole"
            );


        if (headerUserName) {

            headerUserName.textContent =
                profile.full_name || "-";
        }


        if (headerUserRole) {

            headerUserRole.textContent =
                profile.role || "-";
        }


        // =================================================
        // HIDE LOGIN
        // =================================================

        if (loginPage) {

            loginPage.style.display =
                "none";
        }


        // =================================================
        // SHOW APPLICATION
        // =================================================

        if (appContainer) {

            appContainer.style.display =
                "block";
        }


        // =================================================
        // DASHBOARD ONLY
        // =================================================

        if (dashboardPage) {

            dashboardPage.style.display =
                "block";

            dashboardPage.classList.add(
                "active"
            );


            // =================================================
            // ROLE PERMISSIONS
            // =================================================

            if (
                typeof applyRolePermissions ===
                "function"
            ) {

                applyRolePermissions(
                    profile.role
                );
            }


            if (
                typeof configureDashboardForRole ===
                "function"
            ) {

                configureDashboardForRole(
                    profile.role
                );
            }


            // =================================================
            // BRANCH HEADER
            // =================================================

            if (
                typeof loadBranchHeader ===
                "function"
            ) {

                await loadBranchHeader();
            }


            // =================================================
            // DASHBOARD DATA
            // =================================================

            if (
                typeof loadDashboard ===
                "function"
            ) {

                await loadDashboard();
            }


            // =================================================
            // SYSTEM STATUS
            // =================================================

            if (
                typeof updateSystemStatus ===
                "function"
            ) {

                await updateSystemStatus();
            }


            // =================================================
            // TODAY DATE
            // =================================================

            if (
                typeof loadTodayDate ===
                "function"
            ) {

                loadTodayDate();
            }
        }


        console.log(
            "Session loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Session error:",
            error
        );


        // =================================================
        // ONLY CLEAR SESSION WHEN AUTH IS REALLY INVALID
        // =================================================

        const isAuthError =
            error.code ===
            "AUTH_SESSION_INVALID";


        if (isAuthError) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.currentUserProfile =
                null;


            // =================================================
            // SHOW LOGIN
            // =================================================

            if (loginPage) {

                loginPage.style.display =
                    "flex";
            }


            if (appContainer) {

                appContainer.style.display =
                    "none";
            }


            if (dashboardPage) {

                dashboardPage.style.display =
                    "none";

                dashboardPage.classList.remove(
                    "active"
                );
            }


            const errorBox =
                document.getElementById(
                    "loginError"
                );


            if (errorBox) {

                errorBox.textContent =
                    "Your session has expired. Please login again.";
            }

        }

        else {

            // =================================================
            // DO NOT DESTROY A VALID SESSION
            // =================================================

            console.error(
                "Page initialization error. Session preserved.",
                error
            );
        }
    }

    finally {

        if (sessionLoader) {

            sessionLoader.style.display =
                "none";
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


    // =================================================
    // SHOW LOGIN
    // =================================================

    const loginPage =
        document.getElementById(
            "loginPage"
        );

    const appContainer =
        document.getElementById(
            "appContainer"
        );

    const dashboardPage =
        document.getElementById(
            "dashboardPage"
        );


    if (loginPage) {

        loginPage.style.display =
            "flex";
    }

    if (appContainer) {

        appContainer.style.display =
            "none";
    }

    if (dashboardPage) {

        dashboardPage.style.display =
            "none";

        dashboardPage.classList.remove(
            "active"
        );
    }
}
