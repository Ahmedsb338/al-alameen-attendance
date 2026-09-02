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

        // Find Auth email linked to username

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


        // Login through Supabase Auth

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


        // Save session

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        localStorage.setItem(
            "refresh_token",
            data.refresh_token
        );


        // Load session/profile

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
// LOGIN SESSION
// =====================================================

async function checkLoginSession() {

    const sessionLoader =
        document.getElementById("sessionLoader");

    const accessToken =
        localStorage.getItem("access_token");

    const loginPage =
        document.getElementById("loginPage");

    const appContainer =
        document.getElementById("appContainer");

    const dashboardPage =
        document.getElementById("dashboardPage");


    // =================================================
    // NO SESSION
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
        // GET CURRENT SUPABASE USER
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

            throw new Error(
                "Session expired."
            );
        }


        // =================================================
        // GET USER PROFILE
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
        // CHECK ACCOUNT STATUS
        // =================================================

        if (
            profile.active !== true
        ) {

            throw new Error(
                "This account has been deactivated."
            );
        }


        // =================================================
        // SAVE CURRENT USER
        // =================================================

        window.currentUserProfile =
            profile;


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
        // SHOW DASHBOARD
        // =================================================

        if (dashboardPage) {

            dashboardPage.style.display =
                "block";

            dashboardPage.classList.add(
                "active"
            );
        }


        // =================================================
        // APPLY ROLE PERMISSIONS
        // =================================================

        applyRolePermissions(
            profile.role
        );


        configureDashboardForRole(
            profile.role
        );


        // =================================================
        // LOAD BRANCH HEADER
        // =================================================

        if (
            typeof loadBranchHeader ===
            "function"
        ) {

            await loadBranchHeader();
        }


        // =================================================
        // LOAD DASHBOARD DATA
        // =================================================

        await loadDashboard();


        // =================================================
        // UPDATE SYSTEM STATUS
        // =================================================

        await updateSystemStatus();


        // =================================================
        // LOAD TODAY'S DATE
        // =================================================

        loadTodayDate();

    }

    catch (error) {

        console.error(
            "Session error:",
            error
        );


        // =================================================
        // CLEAR INVALID SESSION
        // =================================================

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


        // =================================================
        // HIDE APPLICATION
        // =================================================

        if (appContainer) {

            appContainer.style.display =
                "none";
        }


        // =================================================
        // HIDE DASHBOARD
        // =================================================

        if (dashboardPage) {

            dashboardPage.style.display =
                "none";

            dashboardPage.classList.remove(
                "active"
            );
        }


        // =================================================
        // SHOW LOGIN ERROR
        // =================================================

        const errorBox =
            document.getElementById(
                "loginError"
            );


        if (errorBox) {

            errorBox.textContent =
                error.message;
        }

    }

    finally {

        // =================================================
        // HIDE SESSION LOADER
        // =================================================

        if (sessionLoader) {

            sessionLoader.style.display =
                "none";
        }
    }
}