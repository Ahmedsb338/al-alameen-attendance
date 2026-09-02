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