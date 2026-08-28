// =====================================================
// DASHBOARD
// =====================================================


// =====================================================
// DATE
// =====================================================

function loadTodayDate() {

    const today =
        new Date();

    const todayElement =
        document.getElementById(
            "todayDate"
        );

    if (!todayElement) {
        return;
    }

    todayElement.textContent =
        today.toLocaleDateString("en-GB");
}


// =====================================================
// EMPLOYEES COUNT
// =====================================================

async function loadEmployeeCount() {

    try {

        const data =
            await supabaseRequest(
                "/rest/v1/employees" +
                "?select=id" +
                "&active=eq.true"
            );


        const employeeCount =
            document.getElementById(
                "employeeCount"
            );


        if (employeeCount) {

            employeeCount.textContent =
                data.length;
        }


        return true;

    }

    catch (error) {

        console.error(
            "Employee count error:",
            error
        );


        const employeeCount =
            document.getElementById(
                "employeeCount"
            );


        if (employeeCount) {

            employeeCount.textContent =
                "Error";
        }


        return false;
    }
}


// =====================================================
// ATTENDANCE COUNT
// =====================================================

async function loadAttendanceCount() {

    try {

        const start =
            new Date();


        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date(start);


        end.setDate(
            end.getDate() + 1
        );


        const data =
            await supabaseRequest(

                "/rest/v1/attendance" +

                "?select=id" +

                "&recorded_at=gte." +
                encodeURIComponent(
                    start.toISOString()
                ) +

                "&recorded_at=lt." +
                encodeURIComponent(
                    end.toISOString()
                )
            );


        const attendanceCount =
            document.getElementById(
                "attendanceCount"
            );


        if (attendanceCount) {

            attendanceCount.textContent =
                data.length;
        }


        return true;

    }

    catch (error) {

        console.error(
            "Attendance count error:",
            error
        );


        const attendanceCount =
            document.getElementById(
                "attendanceCount"
            );


        if (attendanceCount) {

            attendanceCount.textContent =
                "Error";
        }


        return false;
    }
}


// =====================================================
// LOAD BRANCH
// =====================================================

async function loadBranch() {

    try {

        const profileData =
            await supabaseRequest(
                "/rest/v1/profiles" +
                "?select=role,branch_id" +
                "&limit=1"
            );


        if (
            !profileData ||
            !profileData.length
        ) {

            document.getElementById(
                "branchName"
            ).textContent =
                "Not Found";

            return false;
        }


        const profile =
            profileData[0];


        // =================================================
        // SUPER ADMIN
        // =================================================

        if (
            profile.role ===
            "Super Admin"
        ) {

            document.getElementById(
                "branchName"
            ).textContent =
                "Quantech HR";

            return true;
        }


        // =================================================
        // BRANCH USER
        // =================================================

        if (!profile.branch_id) {

            document.getElementById(
                "branchName"
            ).textContent =
                "Not Found";

            return false;
        }


        const data =
            await supabaseRequest(
                "/rest/v1/branches" +
                "?select=name" +
                "&id=eq." +
                profile.branch_id +
                "&limit=1"
            );


        document.getElementById(
            "branchName"
        ).textContent =
            data.length
                ? data[0].name
                : "Not Found";


        return true;

    }

    catch (error) {

        console.error(
            "loadBranch error:",
            error
        );


        document.getElementById(
            "branchName"
        ).textContent =
            "Error";


        return false;
    }
}


// =====================================================
// BRANCH HEADER
// =====================================================

async function loadBranchHeader() {

    try {

        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {
            return;
        }


        const profileResponse =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/profiles" +
                "?select=branch_id,role" +
                "&limit=1",
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


        if (!profileResponse.ok) {

            console.error(
                "Profile load failed"
            );

            return;
        }


        const profiles =
            await profileResponse.json();


        if (
            !profiles ||
            !profiles.length
        ) {

            return;
        }


        const profile =
            profiles[0];


        const header =
            document.getElementById(
                "branchHeaderName"
            );


        if (!header) {
            return;
        }


        // =================================================
        // SUPER ADMIN
        // =================================================

        if (
            profile.role ===
            "Super Admin"
        ) {

            header.textContent =
                "HR Administration";

            return;
        }


        // =================================================
        // BRANCH ACCOUNT
        // =================================================

        if (!profile.branch_id) {
            return;
        }


        const branchResponse =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/branches?id=eq." +
                profile.branch_id +
                "&select=name&limit=1",
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


        if (!branchResponse.ok) {

            console.error(
                "Branch load failed"
            );

            return;
        }


        const branches =
            await branchResponse.json();


        if (
            branches &&
            branches.length
        ) {

            header.textContent =
                branches[0].name;
        }

    }

    catch (error) {

        console.error(
            "Header error:",
            error
        );
    }
}


// =====================================================
// ROLE PERMISSIONS
// =====================================================

function applyRolePermissions(role) {

    const employeesButton =
        document.getElementById(
            "employeesMenuButton"
        );

    const branchesButton =
        document.getElementById(
            "branchesMenuButton"
        );

    const scheduleButton =
        document.getElementById(
            "scheduleMenuButton"
        );

    const importButton =
        document.getElementById(
            "importMenuButton"
        );

    const exportButton =
        document.getElementById(
            "exportMenuButton"
        );

    const attendanceButton =
        document.getElementById(
            "attendanceMenuButton"
        );

    const reportsButton =
        document.getElementById(
            "reportsMenuButton"
        );

    const settingsButton =
        document.getElementById(
            "settingsMenuButton"
        );


    // =================================================
    // Hide Everything First
    // =================================================

    [
        employeesButton,
        branchesButton,
        scheduleButton,
        importButton,
        exportButton,
        attendanceButton,
        reportsButton,
        settingsButton
    ].forEach(
        button => {

            if (button) {
                button.style.display =
                    "none";
            }
        }
    );


    // =================================================
    // SUPER ADMIN
    // =================================================

    if (
        role ===
        "Super Admin"
    ) {

        [
            employeesButton,
            branchesButton,
            scheduleButton,
            importButton,
            exportButton,
            attendanceButton,
            reportsButton,
            settingsButton
        ].forEach(
            button => {

                if (button) {
                    button.style.display =
                        "block";
                }
            }
        );

        return;
    }


    // =================================================
    // BRANCH MANAGER
    // =================================================

    if (
        role ===
        "Branch Manager"
    ) {

        [
            employeesButton,
            scheduleButton,
            exportButton,
            attendanceButton,
            settingsButton
        ].forEach(
            button => {

                if (button) {
                    button.style.display =
                        "block";
                }
            }
        );

        return;
    }


    // =================================================
    // EMPLOYEE
    // =================================================

    if (
        role ===
        "Employee"
    ) {

        [
            scheduleButton,
            attendanceButton
        ].forEach(
            button => {

                if (button) {
                    button.style.display =
                        "block";
                }
            }
        );

        return;
    }


    // =================================================
    // UNKNOWN ROLE
    // =================================================

    console.warn(
        "Unknown user role:",
        role
    );
}


// =====================================================
// DASHBOARD INITIALIZATION
// =====================================================

async function initializeDashboard() {

    loadTodayDate();


    const employeeResult =
        await loadEmployeeCount();


    const attendanceResult =
        await loadAttendanceCount();


    const branchResult =
        await loadBranch();


    const status =
        document.getElementById(
            "systemStatus"
        );


    if (!status) {
        return;
    }


    if (
        employeeResult &&
        attendanceResult &&
        branchResult
    ) {

        status.textContent =
            "Connected to Supabase successfully.";

        status.className =
            "success";

    }

    else {

        status.textContent =
            "Database connection error.";

        status.className =
            "error";
    }
}


// =====================================================
// INITIALIZE DASHBOARD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);