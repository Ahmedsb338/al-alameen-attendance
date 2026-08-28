// =====================================================
// EMPLOYEES
// =====================================================


// =====================================================
// LOAD EMPLOYEES TABLE
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
            "Loading employees...";

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
            (employee, index) => {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

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

                `;


                table.appendChild(row);

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
// LOAD EMPLOYEES - SETTINGS
// =====================================================

async function loadEmployeesSettings() {

    const table =
        document.getElementById(
            "settingsEmployeesTable"
        );

    const status =
        document.getElementById(
            "settingsEmployeesStatus"
        );

    if (!table || !status) {
        return;
    }

    try {

        status.textContent =
            "Loading employees...";

        status.className =
            "status loading";


        const employees =
            await supabaseRequest(
                "/rest/v1/employees" +
                "?select=id,staff_id,full_name,role,active" +
                "&order=staff_id.asc"
            );


        table.innerHTML = "";


        employees.forEach(
            employee => {

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

                                `<button
                                    onclick="deactivateEmployee(${employee.id})"
                                    class="danger"
                                >
                                    Deactivate
                                </button>`

                                :

                                `<button
                                    onclick="activateEmployee(${employee.id})"
                                    class="primary"
                                >
                                    Activate
                                </button>`
                        }

                    </td>

                `;


                table.appendChild(row);

            }
        );


        status.textContent =
            employees.length +
            " employees loaded.";

        status.className =
            "status success";

    }

    catch (error) {

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

        const branch =
            await supabaseRequest(
                "/rest/v1/branches" +
                "?select=id" +
                "&limit=1"
            );


        const branchId =
            branch.length
                ? branch[0].id
                : null;


        await supabaseRequest(
            "/rest/v1/employees",
            {
                method: "POST",

                headers: {
                    "Prefer":
                        "return=minimal"
                },

                body:
                    JSON.stringify({

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

    }

    catch (error) {

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

                body:
                    JSON.stringify({
                        active: false
                    })
            }
        );


        alert(
            "Employee deactivated successfully."
        );


        await loadEmployeesSettings();

        await loadEmployeeCount();

    }

    catch (error) {

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

                body:
                    JSON.stringify({
                        active: true
                    })
            }
        );


        alert(
            "Employee activated successfully."
        );


        await loadEmployeesSettings();

        await loadEmployeeCount();

    }

    catch (error) {

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