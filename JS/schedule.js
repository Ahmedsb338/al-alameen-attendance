// =====================================================
// SCHEDULE
// =====================================================


// =====================================================
// LOAD SCHEDULE
// =====================================================

async function loadSchedule() {

    const table =
        document.getElementById(
            "scheduleTable"
        );

    const status =
        document.getElementById(
            "scheduleStatus"
        );


    if (!table || !status) {
        return;
    }


    try {

        status.textContent =
            "Loading schedule...";

        status.className =
            "status loading";


        // =================================================
        // Load Employees
        // =================================================

        const employees =
            await supabaseRequest(
                "/rest/v1/employees" +
                "?select=id,staff_id,full_name,active" +
                "&active=eq.true" +
                "&order=staff_id.asc"
            );


        // =================================================
        // Load Schedule
        // =================================================

        const data =
            await supabaseRequest(
                "/rest/v1/monthly_schedule" +
                "?select=id,schedule_date,shift_type,employee_id" +
                "&order=schedule_date.asc"
            );


        table.innerHTML = "";


        // =================================================
        // No Employees
        // =================================================

        if (!employees.length) {

            status.textContent =
                "No active employees found.";

            status.className =
                "status loading";

            return;
        }


        // =================================================
        // Build Employee Map
        // =================================================

        const staffMap = {};


        employees.forEach(
            employee => {

                staffMap[
                    employee.id
                ] = employee;

            }
        );


        // =================================================
        // Build Date Map
        // =================================================

        const dates = {};


        data.forEach(
            item => {

                if (!dates[item.schedule_date]) {

                    dates[item.schedule_date] =
                        {};
                }


                const employee =
                    staffMap[item.employee_id];


                if (!employee) {
                    return;
                }


                dates[
                    item.schedule_date
                ][
                    employee.staff_id
                ] = {
                    id: item.id,
                    shift: item.shift_type,
                    employeeId: item.employee_id
                };

            }
        );


        // =================================================
        // Render Table Header
        // =================================================

        const thead =
            table.closest("table")
                .querySelector("thead");


        if (thead) {

            let headerHTML =
                "<tr>";

            headerHTML +=
                "<th>Date</th>";


            employees.forEach(
                employee => {

                    headerHTML += `
                        <th>
                            ${escapeHTML(
                                employee.staff_id
                            )}
                        </th>
                    `;

                }
            );


            headerHTML +=
                "</tr>";


            thead.innerHTML =
                headerHTML;
        }


        // =================================================
        // No Schedule
        // =================================================

        if (!data.length) {

            status.textContent =
                "No monthly schedule has been imported yet.";

            status.className =
                "status loading";

            return;
        }


        // =================================================
        // Render Rows
        // =================================================

        Object.keys(dates)
            .sort()
            .forEach(
                date => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    let html =
                        `<td>${escapeHTML(date)}</td>`;


                    employees.forEach(
                        employee => {

                            const record =
                                dates[date][
                                    employee.staff_id
                                ];


                            const shift =
                                record
                                    ? record.shift
                                    : "-";


                            const className =
                                getShiftClass(
                                    shift
                                );


                            const isManager =
                                window.currentUserProfile &&
                                window.currentUserProfile.role ===
                                    "Branch Manager";


                            if (isManager) {

                                html += `
                                    <td
                                        class="${className} schedule-editable"
                                        data-date="${escapeHTML(date)}"
                                        data-employee-id="${employee.id}"
                                        data-record-id="${record ? record.id : ""}"
                                        data-shift="${escapeHTML(shift)}"
                                    >
                                        ${escapeHTML(shift)}
                                    </td>
                                `;

                            } else {

                                html += `
                                    <td class="${className}">
                                        ${escapeHTML(shift)}
                                    </td>
                                `;
                            }

                        }
                    );


                    row.innerHTML =
                        html;


                    table.appendChild(
                        row
                    );
                }
            );


        // =================================================
        // Activate Manager Editing
        // =================================================

        initializeScheduleEditing();


        // =================================================
        // Status
        // =================================================

        status.textContent =
            data.length +
            " schedule records loaded.";

        status.className =
            "status success";

    }

    catch (error) {

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
// PENDING CHANGES
// =====================================================

const pendingScheduleChanges = {};

let activeEditCell = null;


// =====================================================
// SHIFT OPTIONS
// =====================================================

const scheduleShiftOptions = [
    "AM",
    "PM",
    "BETWEEN",
    "FULL",
    "SUP AM",
    "SUP PM",
    "OFF",
    "Annual Leave"
];


// =====================================================
// INITIALIZE EDITING
// =====================================================

function initializeScheduleEditing() {

    const cells =
        document.querySelectorAll(
            ".schedule-editable"
        );


    cells.forEach(
        cell => {

            cell.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    openScheduleEditor(
                        cell
                    );

                }
            );

        }
    );
}


// =====================================================
// OPEN EDITOR
// =====================================================

function openScheduleEditor(cell) {

    const isManager =
        window.currentUserProfile &&
        window.currentUserProfile.role ===
            "Branch Manager";


    if (!isManager) {
        return;
    }


    // Already editing this cell

    if (
        activeEditCell === cell
    ) {
        return;
    }


    // Close previous editor

    if (activeEditCell) {

        closeScheduleEditor(
            activeEditCell
        );
    }


    activeEditCell =
        cell;


    const currentShift =
        cell.dataset.shift || "OFF";


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "schedule-shift-select";


    scheduleShiftOptions.forEach(
        shift => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                shift;

            option.textContent =
                shift;

            option.selected =
                shift === currentShift;

            select.appendChild(
                option
            );

        }
    );


    select.dataset.originalValue =
        currentShift;


    cell.innerHTML = "";

    cell.appendChild(
        select
    );


    // Prevent click from reaching cell

    select.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );


    select.addEventListener(
        "change",
        function () {

            applyScheduleChange(
                cell,
                select.value
            );

        }
    );


    select.addEventListener(
        "blur",
        function () {

            setTimeout(
                () => {

                    if (
                        activeEditCell ===
                        cell
                    ) {

                        closeScheduleEditor(
                            cell
                        );

                    }

                },
                100
            );

        }
    );


    // IMPORTANT:
    // Do NOT call select.click().
    // Browser owns the dropdown opening.

    select.focus();
}


// =====================================================
// APPLY CHANGE
// =====================================================

function applyScheduleChange(
    cell,
    newShift
) {

    const originalShift =
        cell.dataset.shift || "-";


    const date =
        cell.dataset.date;


    const employeeId =
        cell.dataset.employeeId;


    const recordId =
        cell.dataset.recordId || null;


    const key =
        date +
        "_" +
        employeeId;


    // If user returned to original value,
    // remove pending change.

    if (
        newShift ===
        originalShift
    ) {

        delete pendingScheduleChanges[
            key
        ];

    } else {

        pendingScheduleChanges[
            key
        ] = {

            date: date,

            employeeId:
                employeeId,

            recordId:
                recordId,

            originalShift:
                originalShift,

            shift:
                newShift

        };

    }


    cell.dataset.shift =
        newShift;


    cell.className =
        getShiftClass(
            newShift
        ) +
        " schedule-editable";


    if (
        pendingScheduleChanges[key]
    ) {

        cell.classList.add(
            "schedule-pending"
        );

        cell.title =
            "Pending change: " +
            newShift;

    } else {

        cell.title =
            "Click to edit shift";
    }


    cell.innerHTML =
        escapeHTML(
            newShift
        );


    activeEditCell =
        null;
}


// =====================================================
// CLOSE EDITOR
// =====================================================

function closeScheduleEditor(cell) {

    if (!cell) {
        return;
    }


    const select =
        cell.querySelector(
            ".schedule-shift-select"
        );


    if (!select) {

        if (
            activeEditCell === cell
        ) {

            activeEditCell =
                null;
        }

        return;
    }


    const selectedShift =
        select.value;


    cell.innerHTML =
        escapeHTML(
            selectedShift
        );


    cell.dataset.shift =
        selectedShift;


    cell.className =
        getShiftClass(
            selectedShift
        ) +
        " schedule-editable";


    const key =
        cell.dataset.date +
        "_" +
        cell.dataset.employeeId;


    if (
        pendingScheduleChanges[key]
    ) {

        cell.classList.add(
            "schedule-pending"
        );

    }


    if (
        activeEditCell === cell
    ) {

        activeEditCell =
            null;
    }
}


// =====================================================
// SAVE ALL CHANGES
// =====================================================

async function saveScheduleChanges() {

    // Close current editor first

    if (activeEditCell) {

        const cell =
            activeEditCell;

        const select =
            cell.querySelector(
                ".schedule-shift-select"
            );


        if (select) {

            applyScheduleChange(
                cell,
                select.value
            );

        }

    }


    const changes =
        Object.values(
            pendingScheduleChanges
        );


    if (!changes.length) {

        alert(
            "No schedule changes to save."
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "saveScheduleButton"
        );


    try {

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";
        }


        for (
            const change
            of changes
        ) {

            // =================================================
            // UPDATE EXISTING RECORD
            // =================================================

            if (change.recordId) {

                await supabaseRequest(

                    "/rest/v1/monthly_schedule" +
                    "?id=eq." +
                    encodeURIComponent(
                        change.recordId
                    ),

                    {
                        method: "PATCH",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        },

                        body:
                            JSON.stringify({

                                shift_type:
                                    change.shift

                            })
                    }
                );

            }

            // =================================================
            // INSERT NEW RECORD
            // =================================================

            else {

                await supabaseRequest(

                    "/rest/v1/monthly_schedule",

                    {
                        method: "POST",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        },

                        body:
                            JSON.stringify({

                                schedule_date:
                                    change.date,

                                employee_id:
                                    change.employeeId,

                                shift_type:
                                    change.shift

                            })
                    }
                );

            }
        }


        // =================================================
        // Clear Pending Changes
        // =================================================

        Object.keys(
            pendingScheduleChanges
        ).forEach(
            key => {

                delete pendingScheduleChanges[
                    key
                ];

            }
        );


        activeEditCell =
            null;


        if (saveButton) {

            saveButton.textContent =
                "Saved ✓";
        }


        await loadSchedule();


        setTimeout(
            () => {

                if (saveButton) {

                    saveButton.textContent =
                        "Save Changes";

                    saveButton.disabled =
                        false;
                }

            },
            1500
        );

    }

    catch (error) {

        console.error(
            "saveScheduleChanges error:",
            error
        );


        alert(
            "Failed to save schedule changes: " +
            error.message
        );


        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Changes";
        }
    }
}


window.saveScheduleChanges =
    saveScheduleChanges;


// =====================================================
// SHIFT CLASS
// =====================================================

function getShiftClass(shift) {

    switch (shift) {

        case "AM":
            return "shift-AM";

        case "PM":
            return "shift-PM";

        case "Support":
        case "SUP AM":
        case "SUP PM":
        case "BETWEEN":
            return "shift-Support";

        case "FULL":
            return "shift-PM";

        case "OFF":
            return "shift-OFF";

        case "Annual Leave":
            return "shift-Annual";

        default:
            return "";
    }
}