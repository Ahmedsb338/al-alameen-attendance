
// =====================================================
// ATTENDANCE EXCEL EXPORT
// =====================================================
//
// Rules:
// 1. Export is based ONLY on attendance records.
// 2. Monthly schedule is NOT used.
// 3. First accepted Check In per employee/day.
// 4. Last accepted Check Out per employee/day.
// 5. Timezone: Africa/Cairo.
// 6. Grace period: 7 minutes.
// 7. Late Minutes = actual delay - grace period.
// 8. Rejected attendance is ignored.
// =====================================================


// =====================================================
// CONFIGURATION
// =====================================================

const EXPORT_TIMEZONE = "Africa/Cairo";
const EXPORT_GRACE_MINUTES = 5;


// =====================================================
// OPEN EXPORT DIALOG
// =====================================================

function openExportDialog() {

    const oldDialog =
        document.getElementById("exportDialog");

    if (oldDialog) {
        oldDialog.remove();
    }


    const dialog =
        document.createElement("div");

    dialog.id =
        "exportDialog";


    dialog.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:9999;
        ">

            <div style="
                background:#fff;
                width:420px;
                max-width:90%;
                padding:25px;
                border-radius:12px;
                box-shadow:0 10px 40px rgba(0,0,0,.25);
            ">

                <h2 style="margin-top:0;">
                    📤 Export Attendance Excel
                </h2>

                <p>
                    Select the attendance period.
                </p>

                <label>
                    From Date
                </label>

                <input
                    id="exportFromDate"
                    type="date"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:10px;
                        margin:7px 0 15px;
                    "
                >

                <label>
                    To Date
                </label>

                <input
                    id="exportToDate"
                    type="date"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:10px;
                        margin:7px 0 20px;
                    "
                >

                <div
                    id="exportStatus"
                    style="margin-bottom:15px;"
                ></div>

                <div style="
                    display:flex;
                    justify-content:flex-end;
                    gap:10px;
                ">

                    <button
                        type="button"
                        onclick="closeExportDialog()"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="primary"
                        onclick="exportAttendanceExcel()"
                    >
                        📥 Export
                    </button>

                </div>

            </div>

        </div>
    `;


    document.body.appendChild(dialog);


    const today =
        getTodayCairo();


    document.getElementById(
        "exportFromDate"
    ).value =
        today;


    document.getElementById(
        "exportToDate"
    ).value =
        today;
}


// =====================================================
// CLOSE EXPORT DIALOG
// =====================================================

function closeExportDialog() {

    const dialog =
        document.getElementById(
            "exportDialog"
        );

    if (dialog) {
        dialog.remove();
    }
}


// =====================================================
// MAIN EXPORT
// =====================================================

async function exportAttendanceExcel() {

    let status = null;


    try {

        // -------------------------------------------------
        // DATE INPUTS
        // -------------------------------------------------

        const fromInput =
            document.getElementById(
                "exportFromDate"
            );

        const toInput =
            document.getElementById(
                "exportToDate"
            );

        status =
            document.getElementById(
                "exportStatus"
            );


        if (!fromInput || !toInput) {

            throw new Error(
                "Export date fields were not found."
            );
        }


        const fromDate =
            String(
                fromInput.value || ""
            ).trim();


        const toDate =
            String(
                toInput.value || ""
            ).trim();


        if (!isValidDateString(fromDate)) {

            throw new Error(
                "Please select a valid From Date."
            );
        }


        if (!isValidDateString(toDate)) {

            throw new Error(
                "Please select a valid To Date."
            );
        }


        if (fromDate > toDate) {

            throw new Error(
                "From Date cannot be after To Date."
            );
        }


        setExportStatus(
            status,
            "Loading attendance data...",
            "loading"
        );


        // -------------------------------------------------
        // CURRENT USER
        // -------------------------------------------------

        const profile =
            window.currentUserProfile;


        if (
            !profile ||
            !profile.branch_id
        ) {

            throw new Error(
                "Current branch information was not found."
            );
        }


        const branchId =
            profile.branch_id;


        // =================================================
        // LOAD BRANCH
        // =================================================

        const branch =
            await loadExportBranch(
                branchId
            );


        // =================================================
        // LOAD EMPLOYEES
        // =================================================

        const employees =
            await loadExportEmployees(
                branchId
            );


        if (
            !Array.isArray(employees) ||
            employees.length === 0
        ) {

            throw new Error(
                "No active employees were found for this branch."
            );
        }


        // =================================================
        // LOAD ATTENDANCE ONLY
        // =================================================

        const attendance =
            await loadExportAttendance(
                fromDate,
                toDate
            );


        // =================================================
        // EMPLOYEE MAP
        // =================================================

        const employeeMap =
            new Map();


        employees.forEach(
            employee => {

                employeeMap.set(
                    String(employee.id),
                    employee
                );

            }
        );


        // =================================================
        // BUILD DAILY ATTENDANCE
        // =================================================

        const dailyAttendance =
            new Map();


        if (Array.isArray(attendance)) {

            attendance.forEach(
                record => {

                    const employee =
                        employeeMap.get(
                            String(
                                record.employee_id
                            )
                        );


                    // Ignore another branch
                    if (!employee) {
                        return;
                    }


                    const cairoDate =
                        getCairoDateFromTimestamp(
                            record.recorded_at
                        );


                    if (!cairoDate) {
                        return;
                    }


                    if (
                        cairoDate < fromDate ||
                        cairoDate > toDate
                    ) {

                        return;
                    }


                    const key =
                        makeAttendanceKey(
                            record.employee_id,
                            cairoDate
                        );


                    if (
                        !dailyAttendance.has(key)
                    ) {

                        dailyAttendance.set(
                            key,
                            {
                                employeeId:
                                    record.employee_id,

                                date:
                                    cairoDate,

                                checkIn:
                                    null,

                                checkOut:
                                    null
                            }
                        );

                    }


                    const day =
                        dailyAttendance.get(
                            key
                        );


                    // -----------------------------------------
                    // FIRST CHECK IN
                    // -----------------------------------------

                    if (
                        record.attendance_type ===
                        "check_in"
                    ) {

                        if (
                            !day.checkIn ||
                            new Date(
                                record.recorded_at
                            ).getTime() <
                            new Date(
                                day.checkIn
                            ).getTime()
                        ) {

                            day.checkIn =
                                record.recorded_at;

                        }

                    }


                    // -----------------------------------------
                    // LAST CHECK OUT
                    // -----------------------------------------

                    if (
                        record.attendance_type ===
                        "check_out"
                    ) {

                        if (
                            !day.checkOut ||
                            new Date(
                                record.recorded_at
                            ).getTime() >
                            new Date(
                                day.checkOut
                            ).getTime()
                        ) {

                            day.checkOut =
                                record.recorded_at;

                        }

                    }

                }
            );

        }


        // =================================================
        // NO ATTENDANCE
        // =================================================

        if (
            dailyAttendance.size === 0
        ) {

            throw new Error(
                "No accepted attendance records were found for the selected period."
            );
        }


        // =================================================
        // BUILD DETAIL + SUMMARY
        // =================================================

        const detailRows = [];

        const summaryMap =
            new Map();


        dailyAttendance.forEach(
            day => {

                const employee =
                    employeeMap.get(
                        String(
                            day.employeeId
                        )
                    );


                if (!employee) {
                    return;
                }


                const employeeId =
                    String(
                        employee.id
                    );


                // -----------------------------------------
                // CREATE SUMMARY
                // -----------------------------------------

                if (
                    !summaryMap.has(
                        employeeId
                    )
                ) {

                    summaryMap.set(
                        employeeId,
                        {
                            staffId:
                                employee.staff_id,

                            employeeName:
                                employee.full_name,

                            role:
                                employee.role || "",

                            attendanceDays:
                                0,

                            checkInDays:
                                0,

                            checkOutDays:
                                0,

                            lateDays:
                                0,

                            totalLateMinutes:
                                0,

                            missingCheckIn:
                                0,

                            missingCheckOut:
                                0
                        }
                    );

                }


                const summary =
                    summaryMap.get(
                        employeeId
                    );


                // -----------------------------------------
                // EMPLOYEE SHIFT
                // -----------------------------------------

                const shiftStart =
                    normalizeTime(
                        employee.shift_start
                    );


                const shiftEnd =
                    normalizeTime(
                        employee.shift_end
                    );


                // -----------------------------------------
                // CHECK IN
                // -----------------------------------------

                let checkInStatus =
                    "Missing";


                if (day.checkIn) {

                    checkInStatus =
                        "Present";

                    summary.checkInDays++;

                } else {

                    summary.missingCheckIn++;

                }


                // -----------------------------------------
                // CHECK OUT
                // -----------------------------------------

                let checkOutStatus =
                    "Missing";


                if (day.checkOut) {

                    checkOutStatus =
                        "Present";

                    summary.checkOutDays++;

                } else {

                    summary.missingCheckOut++;

                }


                summary.attendanceDays++;


                // -----------------------------------------
                // LATE CALCULATION
                // -----------------------------------------

                let lateMinutes =
                    0;


                let lateStatus =
                    "N/A";


                if (
                    day.checkIn &&
                    shiftStart
                ) {

                    const scheduledDate =
                        createCairoDateTime(
                            day.date,
                            shiftStart
                        );


                    const actualDate =
                        new Date(
                            day.checkIn
                        );


                    const difference =
                        Math.max(
                            0,
                            Math.round(
                                (
                                    actualDate.getTime() -
                                    scheduledDate.getTime()
                                ) / 60000
                            )
                        );


                    lateMinutes =
                        Math.max(
                            0,
                            difference -
                            EXPORT_GRACE_MINUTES
                        );


                    if (
                        lateMinutes > 0
                    ) {

                        lateStatus =
                            "Late";

                        summary.lateDays++;

                        summary.totalLateMinutes +=
                            lateMinutes;

                    } else {

                        lateStatus =
                            "On Time";

                    }

                }


                // -----------------------------------------
                // DETAIL ROW
                // -----------------------------------------

                detailRows.push({

                    "Date":
                        day.date,

                    "Staff ID":
                        employee.staff_id,

                    "Employee Name":
                        employee.full_name,

                    "Role":
                        employee.role || "",

                    "Scheduled Start":
                        shiftStart,

                    "Scheduled End":
                        shiftEnd,

                    "Grace Minutes":
                        EXPORT_GRACE_MINUTES,

                    "Check In":
                        day.checkIn
                            ? formatCairoDateTime(
                                day.checkIn
                            )
                            : "",

                    "Check In Status":
                        checkInStatus,

                    "Check Out":
                        day.checkOut
                            ? formatCairoDateTime(
                                day.checkOut
                            )
                            : "",

                    "Check Out Status":
                        checkOutStatus,

                    "Late Minutes":
                        lateMinutes,

                    "Late Status":
                        lateStatus

                });

            }
        );


        // =================================================
        // SORT DETAILS
        // =================================================

        detailRows.sort(
            (a, b) => {

                if (
                    a.Date !== b.Date
                ) {

                    return a.Date.localeCompare(
                        b.Date
                    );

                }


                return String(
                    a["Staff ID"]
                ).localeCompare(
                    String(
                        b["Staff ID"]
                    ),
                    undefined,
                    {
                        numeric: true
                    }
                );

            }
        );


        // =================================================
        // SUMMARY
        // =================================================

        const summaryRows =
            Array.from(
                summaryMap.values()
            )
            .map(
                row => ({

                    "Staff ID":
                        row.staffId,

                    "Employee Name":
                        row.employeeName,

                    "Role":
                        row.role,

                    "Attendance Days":
                        row.attendanceDays,

                    "Check In Days":
                        row.checkInDays,

                    "Check Out Days":
                        row.checkOutDays,

                    "Late Days":
                        row.lateDays,

                    "Total Late Minutes":
                        row.totalLateMinutes,

                    "Missing Check In":
                        row.missingCheckIn,

                    "Missing Check Out":
                        row.missingCheckOut

                })
            );


        // =================================================
        // CREATE WORKBOOK
        // =================================================

        setExportStatus(
            status,
            "Creating Excel file...",
            "loading"
        );


        if (
            typeof XLSX === "undefined"
        ) {

            throw new Error(
                "XLSX library was not loaded."
            );
        }


        const workbook =
            XLSX.utils.book_new();


        // =================================================
        // ATTENDANCE DETAILS SHEET
        // =================================================

        const detailSheet =
            XLSX.utils.json_to_sheet(
                detailRows
            );


        detailSheet["!cols"] = [

            { wch: 14 },
            { wch: 15 },
            { wch: 32 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            { wch: 16 },
            { wch: 22 },
            { wch: 18 },
            { wch: 22 },
            { wch: 18 },
            { wch: 16 },
            { wch: 15 }

        ];


        XLSX.utils.book_append_sheet(
            workbook,
            detailSheet,
            "Attendance Details"
        );


        // =================================================
        // EMPLOYEE SUMMARY SHEET
        // =================================================

        const summarySheet =
            XLSX.utils.json_to_sheet(
                summaryRows
            );


        summarySheet["!cols"] = [

            { wch: 15 },
            { wch: 32 },
            { wch: 20 },
            { wch: 18 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 22 },
            { wch: 20 },
            { wch: 21 }

        ];


        XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            "Employee Summary"
        );


        // =================================================
        // REPORT INFO
        // =================================================

        const infoRows = [

            {
                "Item":
                    "Branch",

                "Value":
                    branch.name || ""
            },

            {
                "Item":
                    "Store ID",

                "Value":
                    branch.store_id || ""
            },

            {
                "Item":
                    "From Date",

                "Value":
                    fromDate
            },

            {
                "Item":
                    "To Date",

                "Value":
                    toDate
            },

            {
                "Item":
                    "Timezone",

                "Value":
                    EXPORT_TIMEZONE
            },

            {
                "Item":
                    "Attendance Records",

                "Value":
                    detailRows.length
            },

            {
                "Item":
                    "Employees With Attendance",

                "Value":
                    summaryRows.length
            },

            {
                "Item":
                    "Check In Rule",

                "Value":
                    "First accepted Check In per employee per day"
            },

            {
                "Item":
                    "Check Out Rule",

                "Value":
                    "Last accepted Check Out per employee per day"
            },

            {
                "Item":
                    "Grace Period",

                "Value":
                    EXPORT_GRACE_MINUTES +
                    " minutes"
            },

            {
                "Item":
                    "Late Rule",

                "Value":
                    "Late Minutes = delay after scheduled start minus grace period"
            },

            {
                "Item":
                    "Monthly Schedule",

                "Value":
                    "Not used in Attendance Export"
            },

            {
                "Item":
                    "Rejected Records",

                "Value":
                    "Ignored"
            }

        ];


        const infoSheet =
            XLSX.utils.json_to_sheet(
                infoRows
            );


        infoSheet["!cols"] = [

            { wch: 32 },
            { wch: 70 }

        ];


        XLSX.utils.book_append_sheet(
            workbook,
            infoSheet,
            "Report Info"
        );


        // =================================================
        // FILE NAME
        // =================================================

        const safeBranchName =
            String(
                branch.name ||
                "Branch"
            )
            .replace(
                /[\\/:*?"<>|]/g,
                "_"
            )
            .replace(
                /\s+/g,
                "_"
            );


        const fileName =
            "Attendance_" +
            safeBranchName +
            "_" +
            fromDate +
            "_to_" +
            toDate +
            ".xlsx";


        // =================================================
        // DOWNLOAD
        // =================================================

        XLSX.writeFile(
            workbook,
            fileName
        );


        setExportStatus(
            status,
            "Excel exported successfully.",
            "success"
        );

    }


    catch (error) {

        console.error(
            "Attendance export error:",
            error
        );


        const currentStatus =
            document.getElementById(
                "exportStatus"
            );


        setExportStatus(
            currentStatus,
            error.message ||
            "Export failed.",
            "error"
        );

    }

}


// =====================================================
// LOAD BRANCH
// =====================================================

async function loadExportBranch(
    branchId
) {

    const result =
        await supabaseRequest(
            "/rest/v1/branches" +
            "?select=id,name,store_id" +
            "&id=eq." +
            encodeURIComponent(
                branchId
            )
        );


    if (
        !Array.isArray(result) ||
        result.length === 0
    ) {

        throw new Error(
            "Current branch was not found."
        );
    }


    return result[0];
}


// =====================================================
// LOAD EMPLOYEES
// =====================================================

async function loadExportEmployees(
    branchId
) {

    const result =
        await supabaseRequest(
            "/rest/v1/employees" +
            "?select=id,staff_id,full_name,role,branch_id,shift_start,shift_end,active" +
            "&branch_id=eq." +
            encodeURIComponent(
                branchId
            ) +
            "&active=eq.true" +
            "&order=staff_id.asc"
        );


    return Array.isArray(result)
        ? result
        : [];
}


// =====================================================
// LOAD ATTENDANCE
// =====================================================

async function loadExportAttendance(
    fromDate,
    toDate
) {

    const nextDate =
        getNextDate(
            toDate
        );


    const result =
        await supabaseRequest(

            "/rest/v1/attendance" +

            "?select=id,employee_id,attendance_type,recorded_at,status" +

            "&status=eq.accepted" +

            "&recorded_at=gte." +
            encodeURIComponent(
                fromDate +
                "T00:00:00+00:00"
            ) +

            "&recorded_at=lt." +
            encodeURIComponent(
                nextDate +
                "T00:00:00+00:00"
            ) +

            "&order=recorded_at.asc"
        );


    return Array.isArray(result)
        ? result
        : [];
}


// =====================================================
// ATTENDANCE KEY
// =====================================================

function makeAttendanceKey(
    employeeId,
    date
) {

    return (
        String(employeeId) +
        "_" +
        String(date)
    );
}


// =====================================================
// NORMALIZE TIME
// =====================================================

function normalizeTime(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";
    }


    return String(value)
        .trim()
        .substring(
            0,
            5
        );
}


// =====================================================
// CREATE CAIRO DATE/TIME
// =====================================================

function createCairoDateTime(
    dateString,
    timeString
) {

    const time =
        normalizeTime(
            timeString
        );


    if (!dateString || !time) {
        return null;
    }


    return new Date(
        `${dateString}T${time}:00+03:00`
    );
}


// =====================================================
// GET CAIRO DATE FROM TIMESTAMP
// =====================================================

function getCairoDateFromTimestamp(
    timestamp
) {

    if (!timestamp) {
        return null;
    }


    const date =
        new Date(
            timestamp
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;
    }


    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    EXPORT_TIMEZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        );


    return formatter.format(
        date
    );
}


// =====================================================
// FORMAT CAIRO DATETIME
// =====================================================

function formatCairoDateTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(
            timestamp
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    const formatter =
        new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone:
                    EXPORT_TIMEZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    false
            }
        );


    const parts =
        formatter.formatToParts(
            date
        );


    const values = {};


    parts.forEach(
        part => {

            if (
                part.type !==
                "literal"
            ) {

                values[
                    part.type
                ] =
                    part.value;

            }

        }
    );


    return (
        values.year +
        "-" +
        values.month +
        "-" +
        values.day +
        " " +
        values.hour +
        ":" +
        values.minute +
        ":" +
        values.second
    );
}


// =====================================================
// TODAY IN CAIRO
// =====================================================

function getTodayCairo() {

    return getCairoDateFromTimestamp(
        new Date()
    );
}


// =====================================================
// NEXT DATE
// =====================================================

function getNextDate(
    dateString
) {

    const parts =
        String(
            dateString
        )
        .split("-");


    const date =
        new Date(
            Date.UTC(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            )
        );


    date.setUTCDate(
        date.getUTCDate() + 1
    );


    return (
        date.getUTCFullYear() +
        "-" +
        String(
            date.getUTCMonth() + 1
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            date.getUTCDate()
        ).padStart(
            2,
            "0"
        )
    );
}


// =====================================================
// VALIDATE DATE
// =====================================================

function isValidDateString(
    value
) {

    return /^\d{4}-\d{2}-\d{2}$/
        .test(
            String(value || "")
        );
}


// =====================================================
// EXPORT STATUS
// =====================================================

function setExportStatus(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }


    element.innerHTML = `

        <div class="status ${type}">
            ${escapeExportText(message)}
        </div>

    `;
}


// =====================================================
// ESCAPE TEXT
// =====================================================

function escapeExportText(
    value
) {

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
// END
// =====================================================

