// =====================================================
// SUPABASE CONFIGURATION
// =====================================================

const SUPABASE_URL =
    "https://lwbyjnzpmtlflhsywtcw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_BeMQaIT1VmSjOb9B4t8VdA_QQAkS-jF";


// =====================================================
// SUPABASE REQUEST
// =====================================================

async function supabaseRequest(
    endpoint,
    options = {}
) {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );

    const normalizedEndpoint =
        endpoint.startsWith("/")
            ? endpoint
            : "/" + endpoint;

    const apiEndpoint =
        normalizedEndpoint.startsWith("/rest/v1/")
            ? normalizedEndpoint
            : "/rest/v1" + normalizedEndpoint;

    const response =
        await fetch(
            SUPABASE_URL + apiEndpoint,
            {

                method:
                    options.method || "GET",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        "Bearer " +
                        (
                            accessToken ||
                            SUPABASE_KEY
                        ),

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                },

                body:
                    options.body || undefined

            }
        );

    const text =
        await response.text();

    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status +
            ": " +
            text
        );

    }

    if (!text) {
        return [];
    }

    return JSON.parse(text);
}

// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
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

    const accessToken =
        localStorage.getItem("access_token");

    const loginPage =
        document.getElementById("loginPage");

    const dashboardPage =
        document.getElementById("dashboardPage");


    // No session

    if (!accessToken) {

        loginPage.style.display = "flex";

        dashboardPage.style.display = "none";

        dashboardPage.classList.remove("active");

        return;
    }


    try {

        // Get current Supabase user

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


        // Get user profile

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


        // Check account status

        if (
            profile.active !== true
        ) {

            throw new Error(
                "This account has been deactivated."
            );
        }


        // Save current user

        window.currentUserProfile =
            profile;


        // Hide login

        loginPage.style.display =
            "none";


        // Show dashboard

        dashboardPage.style.display =
            "block";

        dashboardPage.classList.add(
            "active"
        );


        // Apply role permissions

        applyRolePermissions(
            profile.role
        );


        // Load branch header

if (
    typeof loadBranchHeader ===
    "function"
) {

    await loadBranchHeader();
}

// Load dashboard data

await loadDashboard();


// Update system status

await updateSystemStatus();


// Load today's date

loadTodayDate();
    }

    catch (error) {

        console.error(
            "Session error:",
            error
        );


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


    if (dashboardPage) {

        dashboardPage.style.display =
            "none";

        dashboardPage.classList.remove(
            "active"
        );
    }


    if (loginPage) {

        loginPage.style.display =
            "flex";
    }


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
// CHECK SESSION WHEN PAGE LOADS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    checkLoginSession
);
// =====================================================
// ROLE-BASED DASHBOARD PERMISSIONS
// =====================================================
function applyRolePermissions(role) {

    const buttons = {
        employees: document.getElementById("employeesMenuButton"),
        branches: document.getElementById("branchesMenuButton"),
        schedule: document.getElementById("scheduleMenuButton"),
        import: document.getElementById("importMenuButton"),
        export: document.getElementById("exportMenuButton"),
        attendance: document.getElementById("attendanceMenuButton"),
        reports: document.getElementById("reportsMenuButton"),
        settings: document.getElementById("settingsMenuButton")
    };

    // Hide everything first
    Object.values(buttons).forEach(button => {
        if (button) {
            button.style.display = "none";
        }
    });


    // =================================================
    // SUPER ADMIN
    // =================================================

    if (role === "Super Admin") {

        Object.values(buttons).forEach(button => {
            if (button) {
                button.style.display = "block";
            }
        });

        return;
    }


    // =================================================
    // BRANCH MANAGER
    // =================================================

    if (role === "Branch Manager") {

        [
            buttons.employees,
            buttons.schedule,
            buttons.import,
            buttons.export,
            buttons.attendance,
            buttons.settings
        ].forEach(button => {

            if (button) {
                button.style.display = "block";
            }

        });

        return;
    }


    // =================================================
    // EMPLOYEE
    // =================================================

    if (role === "Employee") {

        [
            buttons.schedule,
            buttons.attendance
        ].forEach(button => {

            if (button) {
                button.style.display = "block";
            }

        });

        return;
    }


    console.warn(
        "Unknown user role:",
        role
    );
}

// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    await Promise.all([
        loadEmployeeCount(),
        loadAttendanceCount(),
        loadBranch()
    ]);
}

// =====================================================
// SYSTEM STATUS
// =====================================================

async function updateSystemStatus() {

    const element =
        document.getElementById("systemStatus");

    if (!element) {
        return;
    }

    try {

        await supabaseRequest(
            "/rest/v1/employees?select=id&limit=1"
        );

        element.textContent =
            "Connected";

        element.className =
            "success";

    } catch (error) {

        console.error(
            "System status error:",
            error
        );

        element.textContent =
            "Disconnected";

        element.className =
            "error";
    }
}

// =====================================================
// TODAY DATE
// =====================================================

function loadTodayDate() {

    const today =
        new Date();

    const element =
        document.getElementById(
            "todayDate"
        );

    if (element) {

        element.textContent =
            today.toLocaleDateString(
                "en-GB"
            );
    }
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


        const element =
            document.getElementById(
                "employeeCount"
            );


        if (element) {

            element.textContent =
                data.length;
        }


        return true;

    }

    catch (error) {

        console.error(
            "Employee count error:",
            error
        );


        const element =
            document.getElementById(
                "employeeCount"
            );


        if (element) {

            element.textContent =
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


        const element =
            document.getElementById(
                "attendanceCount"
            );


        if (element) {

            element.textContent =
                data.length;
        }


        return true;

    }

    catch (error) {

        console.error(
            "Attendance count error:",
            error
        );


        const element =
            document.getElementById(
                "attendanceCount"
            );


        if (element) {

            element.textContent =
                "Error";
        }


        return false;
    }
}


// =====================================================
// BRANCH
// =====================================================

async function loadBranch() {

    try {

        const profileData =
            await supabaseRequest(
                "/rest/v1/profiles" +
                "?select=role,branch_id" +
                "&limit=1"
            );


        const element =
            document.getElementById(
                "branchName"
            );


        if (
            !profileData ||
            !profileData.length
        ) {

            if (element) {

                element.textContent =
                    "Not Found";
            }

            return false;
        }


        const profile =
            profileData[0];


        // Super Admin

        if (
            profile.role ===
            "Super Admin"
        ) {

            if (element) {

                element.textContent =
                    "Quantech HR";
            }

            return true;
        }


        // Branch user

        if (!profile.branch_id) {

            if (element) {

                element.textContent =
                    "Not Found";
            }

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


        if (element) {

            element.textContent =
                data.length
                    ? data[0].name
                    : "Not Found";
        }


        return true;

    }

    catch (error) {

        console.error(
            "loadBranch error:",
            error
        );


        const element =
            document.getElementById(
                "branchName"
            );


        if (element) {

            element.textContent =
                "Error";
        }


        return false;
    }
}


// =====================================================
// EMPLOYEES TABLE
// =====================================================

async function loadEmployees() {

    const table =
        document.getElementById(
            "employeesTable"
        );

    const status =
        document.getElementById(
            "employeesStatus"
        );


    if (!table || !status) {
        return;
    }


    try {

        status.textContent =
            "Loading...";

        status.className =
            "status loading";


        const employees =
            await supabaseRequest(

                "/rest/v1/employees" +

                "?select=staff_id,full_name,role,active" +

                "&order=staff_id.asc"
            );


        table.innerHTML = "";


        employees.forEach(
            (
                employee,
                index
            ) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            employee.staff_id
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            employee.full_name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            employee.role || "-"
                        )}
                    </td>

                    <td class="${
                        employee.active
                            ? "success"
                            : "error"
                    }">

                        ${
                            employee.active
                                ? "Active"
                                : "Inactive"
                        }

                    </td>

                `;


                table.appendChild(
                    row
                );
            }
        );


        status.textContent =
            employees.length +
            " employees loaded successfully.";

        status.className =
            "status success";

    }

    catch (error) {

        console.error(
            "loadEmployees error:",
            error
        );


        status.textContent =
            "Error: " +
            error.message;

        status.className =
            "status error";
    }
}


// =====================================================
// PAGE NAVIGATION
// =====================================================

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(
            page => {

                page.classList.remove(
                    "active"
                );
            }
        );


    const page =
        document.getElementById(
            pageId
        );


    if (!page) {
        return;
    }


    page.classList.add(
        "active"
    );


    // Page-specific loading

    if (
        pageId ===
        "employeesPage"
    ) {

        loadEmployees();
    }


    if (
        pageId ===
        "schedulePage"
    ) {

        loadSchedule();
    }


    if (
        pageId ===
        "attendancePage"
    ) {

        loadAttendancePage();
    }


    if (
        pageId ===
        "settingsPage"
    ) {

        loadEmployeesSettings();
    }
}
// =====================================================
// SETTINGS - LOAD EMPLOYEES
// =====================================================

async function loadEmployeesSettings() {

    const table =
        document.getElementById("settingsEmployeesTable");

    const status =
        document.getElementById("settingsEmployeesStatus");

    if (!table || !status) return;

    try {

        status.textContent = "Loading employees...";
        status.className = "status loading";

        const employees =
            await supabaseRequest(
                "/rest/v1/employees" +
                "?select=id,staff_id,full_name,role,active" +
                "&order=staff_id.asc"
            );

        table.innerHTML = "";

        employees.forEach(employee => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHTML(employee.staff_id)}
                </td>

                <td>
                    ${escapeHTML(employee.full_name)}
                </td>

                <td>
                    ${escapeHTML(employee.role || "-")}
                </td>

                <td class="${
                    employee.active
                        ? "success"
                        : "error"
                }">
                    ${
                        employee.active
                            ? "Active"
                            : "Inactive"
                    }
                </td>

                <td>
                    ${
                        employee.active
                        ?
                        `
                        <button
                            onclick="deactivateEmployee(${employee.id})"
                            class="danger"
                        >
                            Deactivate
                        </button>
                        `
                        :
                        `
                        <button
                            onclick="activateEmployee(${employee.id})"
                            class="primary"
                        >
                            Activate
                        </button>
                        `
                    }
                </td>
            `;

            table.appendChild(row);
        });

        status.textContent =
            employees.length +
            " employees loaded.";

        status.className =
            "status success";

    } catch (error) {

        console.error(
            "loadEmployeesSettings error:",
            error
        );

        status.textContent =
            "Error: " +
            error.message;

        status.className =
            "status error";
    }
}


// =====================================================
// ADD EMPLOYEE
// =====================================================

async function addEmployee() {

    const staffId =
        document
            .getElementById("newStaffId")
            .value
            .trim();

    const fullName =
        document
            .getElementById("newFullName")
            .value
            .trim();

    const role =
        document
            .getElementById("newRole")
            .value
            .trim();


    if (!staffId || !fullName) {

        alert(
            "Staff ID and Full Name are required."
        );

        return;
    }


    try {

        const profile =
            await supabaseRequest(
                "/rest/v1/profiles" +
                "?select=branch_id" +
                "&limit=1"
            );


        const branchId =
            profile.length
                ? profile[0].branch_id
                : null;


        if (!branchId) {

            throw new Error(
                "Branch could not be determined."
            );
        }


        await supabaseRequest(
            "/rest/v1/employees",
            {
                method: "POST",

                headers: {
                    "Prefer":
                        "return=minimal"
                },

                body: JSON.stringify({

                    staff_id:
                        staffId,

                    full_name:
                        fullName,

                    role:
                        role || null,

                    branch_id:
                        branchId,

                    active:
                        true
                })
            }
        );


        alert(
            "Employee added successfully."
        );


        document.getElementById(
            "newStaffId"
        ).value = "";

        document.getElementById(
            "newFullName"
        ).value = "";

        document.getElementById(
            "newRole"
        ).value = "";


        await loadEmployeesSettings();

        await loadEmployeeCount();


    } catch (error) {

        console.error(
            "addEmployee error:",
            error
        );

        alert(
            "Error adding employee:\n" +
            error.message
        );
    }
}


// =====================================================
// DEACTIVATE EMPLOYEE
// =====================================================

async function deactivateEmployee(id) {

    const confirmed =
        confirm(
            "Are you sure you want to deactivate this employee?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await supabaseRequest(

            "/rest/v1/employees" +
            "?id=eq." +
            id,

            {
                method: "PATCH",

                headers: {
                    "Prefer":
                        "return=minimal"
                },

                body: JSON.stringify({
                    active: false
                })
            }
        );


        alert(
            "Employee deactivated successfully."
        );


        await loadEmployeesSettings();

        await loadEmployeeCount();


    } catch (error) {

        console.error(
            "deactivateEmployee error:",
            error
        );

        alert(
            "Error:\n" +
            error.message
        );
    }
}


// =====================================================
// ACTIVATE EMPLOYEE
// =====================================================

async function activateEmployee(id) {

    try {

        await supabaseRequest(

            "/rest/v1/employees" +
            "?id=eq." +
            id,

            {
                method: "PATCH",

                headers: {
                    "Prefer":
                        "return=minimal"
                },

                body: JSON.stringify({
                    active: true
                })
            }
        );


        alert(
            "Employee activated successfully."
        );


        await loadEmployeesSettings();

        await loadEmployeeCount();


    } catch (error) {

        console.error(
            "activateEmployee error:",
            error
        );

        alert(
            "Error:\n" +
            error.message
        );
    }
}
// =====================================================
// LOAD MONTHLY SCHEDULE - DYNAMIC
// =====================================================

async function loadSchedule() {

    const table =
        document.getElementById("scheduleTable");

    const status =
        document.getElementById("scheduleStatus");

    if (!table || !status) return;


    try {

        status.textContent =
            "Loading schedule...";

        status.className =
            "status loading";


        // =========================================
        // 1. Get active employees of current branch
        // =========================================

        const employees =
            await supabaseRequest(
                "/rest/v1/employees" +
                "?select=id,staff_id,full_name" +
                "&active=eq.true" +
                "&order=staff_id.asc"
            );


        // =========================================
        // 2. Get schedule
        // =========================================

        const data =
            await supabaseRequest(

                "/rest/v1/monthly_schedule" +

                "?select=schedule_date,shift_type,employee_id" +

                "&order=schedule_date.asc"
            );


        table.innerHTML = "";


        // =========================================
        // 3. Build employee map
        // =========================================

        const staffMap = {};

        employees.forEach(employee => {

            staffMap[employee.id] =
                employee.staff_id;

        });


        // =========================================
        // 4. Build date structure
        // =========================================

        const dates = {};


        data.forEach(item => {

            if (!dates[item.schedule_date]) {

                dates[item.schedule_date] = {};
            }


            const staffId =
                staffMap[item.employee_id];


            if (!staffId) {
                return;
            }


            dates[item.schedule_date][staffId] =
                item.shift_type;
        });


        // =========================================
        // 5. Create dynamic table header
        // =========================================

        const headerRow =
            table
                .closest("table")
                .querySelector("thead tr");


        if (headerRow) {

            headerRow.innerHTML = `
                <th>Date</th>
            `;


            employees.forEach(employee => {

                headerRow.innerHTML += `
                    <th title="${escapeHTML(
                        employee.full_name || ""
                    )}">
                        ${escapeHTML(
                            employee.staff_id
                        )}
                    </th>
                `;
            });
        }


        // =========================================
        // 6. No schedule
        // =========================================

        if (!data.length) {

            status.textContent =
                "No monthly schedule has been imported yet.";

            status.className =
                "status loading";

            return;
        }


        // =========================================
        // 7. Render dates
        // =========================================

        Object.keys(dates)
            .sort()
            .forEach(date => {

                const row =
                    document.createElement("tr");


                let html =
                    `<td>${escapeHTML(date)}</td>`;


                // ---------------------------------
                // Loop through DB employees
                // ---------------------------------

                employees.forEach(employee => {

                    const staffId =
                        employee.staff_id;


                    const shift =
                        dates[date][staffId]
                        || "-";


                    let className = "";


                    if (shift === "AM") {

                        className =
                            "shift-AM";

                    } else if (shift === "PM") {

                        className =
                            "shift-PM";

                    } else if (
                        shift === "Support" ||
                        shift === "SUP AM" ||
                        shift === "SUP PM"
                    ) {

                        className =
                            "shift-Support";

                    } else if (shift === "OFF") {

                        className =
                            "shift-OFF";

                    } else if (
                        shift === "Annual Leave"
                    ) {

                        className =
                            "shift-Annual";
                    }


                    html += `
                        <td class="${className}">
                            ${escapeHTML(shift)}
                        </td>
                    `;
                });


                row.innerHTML =
                    html;


                table.appendChild(row);
            });


        status.textContent =
            data.length +
            " schedule records loaded.";


        status.className =
            "status success";


    } catch (error) {

        console.error(
            "loadSchedule error:",
            error
        );


        status.textContent =
            "Error: " +
            error.message;

        status.className =
            "status error";
    }
}
// =====================================================
// EXCEL IMPORT
// =====================================================

async function readExcel() {

    const fileInput =
        document.getElementById("excelFile");

    const preview =
        document.getElementById("excelPreview");


    if (!fileInput || !fileInput.files.length) {

        alert("Please select an Excel file first.");

        return;
    }


    const file =
        fileInput.files[0];


    preview.innerHTML = `
        <div class="status loading">
            Reading Excel file...
        </div>
    `;


    try {

        // =========================================
        // Read Excel using SheetJS
        // =========================================

        const arrayBuffer =
            await file.arrayBuffer();


        const workbook =
            XLSX.read(
                arrayBuffer,
                {
                    type: "array"
                }
            );


        const firstSheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];


        const rows =
            XLSX.utils.sheet_to_json(
                firstSheet,
                {
                    header: 1,
                    defval: ""
                }
            );


        if (!rows.length) {

            throw new Error(
                "The Excel file is empty."
            );
        }


        // =========================================
        // Convert Excel → Schedule Rows
        // =========================================

        const scheduleRows =
            convertExcelToScheduleRows(rows);


        if (!scheduleRows.length) {

            throw new Error(
                "No valid schedule records were found."
            );
        }


        // =========================================
        // Preview
        // =========================================

        renderExcelPreview(
            scheduleRows,
            file.name
        );


    } catch (error) {

        console.error(
            "Excel import error:",
            error
        );


        preview.innerHTML = `
            <div class="status error">
                Error: ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}


// =====================================================
// CONVERT EXCEL TO SCHEDULE ROWS
// =====================================================

function convertExcelToScheduleRows(rows) {

    if (!rows || rows.length < 2) {

        return [];
    }


    const header =
        rows[0];


    // =========================================
    // Date column
    // =========================================

    const dateIndex = 0;


    // =========================================
    // Build dynamic Staff ID columns
    // =========================================

    const columns = [];


    for (
        let columnIndex = 1;
        columnIndex < header.length;
        columnIndex++
    ) {

        const staffId =
            String(
                header[columnIndex] || ""
            )
            .trim();


        if (!staffId) {
            continue;
        }


        columns.push({

            columnIndex:
                columnIndex,

            staffId:
                staffId
        });
    }


    const result = [];


    // =========================================
    // Process every Excel row
    // =========================================

    for (
        let rowIndex = 1;
        rowIndex < rows.length;
        rowIndex++
    ) {

        const row =
            rows[rowIndex];


        if (!row) {
            continue;
        }


        const rawDate =
            row[dateIndex];


        if (
            rawDate === undefined ||
            rawDate === null ||
            String(rawDate).trim() === ""
        ) {

            continue;
        }


        const scheduleDate =
            normalizeExcelDate(
                rawDate
            );


        if (!scheduleDate) {

            throw new Error(
                `Invalid date in Excel row ${
                    rowIndex + 1
                }.`
            );
        }


        // =====================================
        // Process every Staff ID column
        // =====================================

        columns.forEach(column => {

            const rawShift =
                row[column.columnIndex];


            const shift =
                normalizeShift(
                    rawShift
                );


            // Empty cells are ignored

            if (!shift) {
                return;
            }


            result.push({

                staff_id:
                    column.staffId,

                schedule_date:
                    scheduleDate,

                shift_type:
                    shift
            });

        });
    }


    return result;
}


// =====================================================
// NORMALIZE EXCEL DATE
// =====================================================

function normalizeExcelDate(value) {

    // Already a Date object

    if (
        value instanceof Date &&
        !isNaN(value.getTime())
    ) {

        return value
            .toISOString()
            .split("T")[0];
    }


    // Excel serial number

    if (
        typeof value === "number"
    ) {

        const excelDate =
            XLSX.SSF.parse_date_code(
                value
            );


        if (!excelDate) {
            return null;
        }


        return [
            excelDate.y,
            String(excelDate.m).padStart(2, "0"),
            String(excelDate.d).padStart(2, "0")
        ].join("-");
    }


    // Text date

    const text =
        String(value).trim();


    if (!text) {
        return null;
    }


    // YYYY-MM-DD

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {

        return text;
    }


    // DD/MM/YYYY

    const match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (match) {

        const day =
            match[1].padStart(2, "0");

        const month =
            match[2].padStart(2, "0");

        const year =
            match[3];


        return `${year}-${month}-${day}`;
    }


    return null;
}


// =====================================================
// NORMALIZE SHIFT
// =====================================================

function normalizeShift(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;
    }


    const shift =
        String(value)
            .trim()
            .toUpperCase();


    if (!shift) {
        return null;
    }


    const shiftMap = {

        "AM":
            "AM",

        "PM":
            "PM",

        "BETWEEN":
            "BETWEEN",

        "OFF":
            "OFF",

        "FULL":
            "FULL",

        "SUP AM":
            "SUP AM",

        "SUP PM":
            "SUP PM",

        "SUPPORT":
            "SUP AM",

        "ANNUAL LEAVE":
            "ANNUAL LEAVE",

        "ANNUAL":
            "ANNUAL LEAVE"
    };


    return shiftMap[shift] || null;
}


// =====================================================
// EXCEL PREVIEW
// =====================================================

function renderExcelPreview(
    scheduleRows,
    fileName
) {

    const preview =
        document.getElementById(
            "excelPreview"
        );


    if (!preview) {
        return;
    }


    const previewRows =
        scheduleRows.slice(
            0,
            20
        );


    let html = `

        <div class="status success">

            <strong>
                Excel loaded successfully
            </strong>

            <p>
                File:
                ${escapeHTML(fileName)}
            </p>

            <p>
                Total records:
                ${scheduleRows.length}
            </p>

        </div>

        <div class="table-container">

            <table>

                <thead>

                    <tr>
                        <th>Date</th>
                        <th>Staff ID</th>
                        <th>Shift</th>
                    </tr>

                </thead>

                <tbody>
    `;


    previewRows.forEach(row => {

        html += `

            <tr>

                <td>
                    ${escapeHTML(
                        row.schedule_date
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.staff_id
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.shift_type
                    )}
                </td>

            </tr>

        `;
    });


    html += `

                </tbody>

            </table>

        </div>

        <button
            class="primary"
            onclick="uploadScheduleRows()"
        >
            Upload Schedule
        </button>

    `;


    preview.innerHTML =
        html;


    // Save temporarily for upload

    window.pendingScheduleRows =
        scheduleRows;
}


// =====================================================
// UPLOAD SCHEDULE TO SUPABASE
// =====================================================

async function uploadScheduleRows() {

    const rows =
        window.pendingScheduleRows;


    if (
        !rows ||
        !rows.length
    ) {

        alert(
            "No schedule data is ready for upload."
        );

        return;
    }


    const preview =
        document.getElementById(
            "excelPreview"
        );


    try {

        if (preview) {

            preview.innerHTML += `

                <div class="status loading">
                    Uploading schedule...
                </div>

            `;
        }


        // =========================================
        // Get current branch
        // =========================================

        const profile =
            await supabaseRequest(
                "/rest/v1/profiles" +
                "?select=branch_id,role" +
                "&limit=1"
            );


        if (
            !profile ||
            !profile.length
        ) {

            throw new Error(
                "User profile not found."
            );
        }


        const branchId =
            profile[0].branch_id;


        // =========================================
        // Super Admin must select a branch later
        // =========================================

        if (!branchId) {

            throw new Error(
                "No branch is assigned to this account."
            );
        }


        // =========================================
        // Call Backend Function
        // =========================================

        const result =
            await supabaseRequest(
                "/rest/v1/rpc/upload_monthly_schedule",
                {
                    method: "POST",

                    body: JSON.stringify({

                        p_branch_id:
                            branchId,

                        p_rows:
                            rows
                    })
                }
            );


        console.log(
            "Schedule upload result:",
            result
        );


        if (preview) {

            preview.innerHTML = `

                <div class="status success">

                    <strong>
                        Schedule uploaded successfully.
                    </strong>

                    <p>
                        Rows processed:
                        ${
                            result.rows_processed
                            ?? 0
                        }
                    </p>

                    <p>
                        Rows skipped:
                        ${
                            result.rows_skipped
                            ?? 0
                        }
                    </p>

                </div>

            `;
        }


        // Refresh schedule

        await loadSchedule();


    } catch (error) {

        console.error(
            "Schedule upload error:",
            error
        );


        if (preview) {

            preview.innerHTML += `

                <div class="status error">

                    Error uploading schedule:
                    ${escapeHTML(
                        error.message
                    )}

                </div>

            `;
        }
    }
}
// =====================================================
// ATTENDANCE PAGE
// =====================================================

async function loadAttendancePage() {

    const statusBox =
        document.getElementById(
            "attendancePageStatus"
        );

    if (!statusBox) {
        return;
    }

    if (!window.currentUserProfile) {

        statusBox.textContent =
            "User profile not found.";

        statusBox.className =
            "status error";

        return;
    }

    statusBox.textContent =
        "Ready";

    statusBox.className =
        "status";

    document.getElementById(
        "myAttendanceStatus"
    ).textContent = "Ready";

    document.getElementById(
        "myCheckInTime"
    ).textContent = "-";

    document.getElementById(
        "myCheckOutTime"
    ).textContent = "-";

    await loadTodayAttendance();
}


// =====================================================
// LOAD TODAY ATTENDANCE
// =====================================================

async function loadTodayAttendance() {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );

    const employeeId =
        window.currentUserProfile &&
        window.currentUserProfile.employee_id;

    if (!employeeId || !accessToken) {
        return;
    }

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    try {

        const response =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/attendance" +

                "?employee_id=eq." +
                employeeId +

                "&recorded_at=gte." +
                today +
                "T00:00:00" +

                "&select=*" +

                "&order=recorded_at.asc",

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


        if (!response.ok) {
            return;
        }


        const records =
            await response.json();


        let checkIn = null;
        let checkOut = null;


        records.forEach(record => {

            if (
                record.attendance_type ===
                    "CHECK_IN" &&
                record.status ===
                    "APPROVED"
            ) {

                checkIn = record;
            }


            if (
                record.attendance_type ===
                    "CHECK_OUT" &&
                record.status ===
                    "APPROVED"
            ) {

                checkOut = record;
            }
        });


        // =========================================
        // Display Check In
        // =========================================

        if (checkIn) {

            document.getElementById(
                "myCheckInTime"
            ).textContent =

                new Date(
                    checkIn.recorded_at
                ).toLocaleTimeString();


            document.getElementById(
                "myAttendanceStatus"
            ).textContent =

                checkOut
                    ? "Completed"
                    : "Checked In";
        }


        // =========================================
        // Display Check Out
        // =========================================

        if (checkOut) {

            document.getElementById(
                "myCheckOutTime"
            ).textContent =

                new Date(
                    checkOut.recorded_at
                ).toLocaleTimeString();
        }


        // =========================================
        // Button states
        // =========================================

        const checkInButton =
            document.getElementById(
                "checkInButton"
            );

        const checkOutButton =
            document.getElementById(
                "checkOutButton"
            );


        if (checkInButton) {

            checkInButton.disabled =
                !!checkIn;
        }


        if (checkOutButton) {

            checkOutButton.disabled =
                !checkIn ||
                !!checkOut;
        }

    } catch (error) {

        console.error(
            "loadTodayAttendance error:",
            error
        );
    }
}


// =====================================================
// GET CURRENT GPS POSITION
// =====================================================

function getCurrentLocation() {

    return new Promise(
        function(resolve, reject) {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "GPS is not supported by this device."
                    )
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                function(position) {

                    resolve({

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy
                    });
                },


                function(error) {

                    let message =
                        "Unable to get your location.";


                    if (
                        error.code ===
                        error.PERMISSION_DENIED
                    ) {

                        message =
                            "Location permission was denied.";
                    }


                    if (
                        error.code ===
                        error.POSITION_UNAVAILABLE
                    ) {

                        message =
                            "Location is currently unavailable.";
                    }


                    if (
                        error.code ===
                        error.TIMEOUT
                    ) {

                        message =
                            "Location request timed out.";
                    }


                    reject(
                        new Error(message)
                    );
                },


                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        0
                }
            );
        }
    );
}


// =====================================================
// CHECK IN
// =====================================================

async function checkIn() {

    const statusBox =
        document.getElementById(
            "attendancePageStatus"
        );


    if (!statusBox) {
        return;
    }


    statusBox.textContent =
        "Getting your location...";

    statusBox.className =
        "status loading";


    try {

        const location =
            await getCurrentLocation();


        statusBox.textContent =
            "Checking branch location...";


        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {

            throw new Error(
                "Your session has expired. Please login again."
            );
        }


        const response =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/rpc/employee_check_in",

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

                            p_latitude:
                                location.latitude,

                            p_longitude:
                                location.longitude,

                            p_gps_accuracy_meters:
                                location.accuracy
                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Check-in failed."
            );
        }


        statusBox.textContent =
            result.message ||
            "Check-in completed.";

        statusBox.className =
            result.success
                ? "status success"
                : "status";


        await loadTodayAttendance();

    } catch (error) {

        console.error(
            "Check-in error:",
            error
        );


        statusBox.textContent =
            error.message;

        statusBox.className =
            "status error";
    }
}


// =====================================================
// CHECK OUT
// =====================================================

async function checkOut() {

    const statusBox =
        document.getElementById(
            "attendancePageStatus"
        );


    if (!statusBox) {
        return;
    }


    statusBox.textContent =
        "Getting your location...";

    statusBox.className =
        "status loading";


    try {

        const location =
            await getCurrentLocation();


        statusBox.textContent =
            "Checking branch location...";


        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {

            throw new Error(
                "Your session has expired. Please login again."
            );
        }


        const response =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/rpc/employee_check_out",

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

                            p_latitude:
                                location.latitude,

                            p_longitude:
                                location.longitude,

                            p_gps_accuracy_meters:
                                location.accuracy
                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Check-out failed."
            );
        }


        statusBox.textContent =
            result.message ||
            "Check-out completed.";

        statusBox.className =
            result.success
                ? "status success"
                : "status";


        await loadTodayAttendance();

    } catch (error) {

        console.error(
            "Check-out error:",
            error
        );


        statusBox.textContent =
            error.message;

        statusBox.className =
            "status error";
    }
}