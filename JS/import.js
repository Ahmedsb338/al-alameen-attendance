// =====================================================
// MONTHLY SCHEDULE IMPORT
// =====================================================

async function readExcel() {

    const file =
        document.getElementById("excelFile").files[0];

    const preview =
        document.getElementById("excelPreview");


    if (!file) {

        alert(
            "Please select an Excel file first."
        );

        return;
    }


    preview.innerHTML = `
        <div class="status loading">
            Reading Excel file...
        </div>
    `;


    try {

        // =================================================
        // Read Excel
        // =================================================

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
            defval: "",
            raw: true,
            cellDates: true
        }
    );


        if (!rows.length) {

            throw new Error(
                "Excel file is empty."
            );
        }


        // =================================================
        // Read Header
        // =================================================

        const headers =
            rows[0]
                .map(
                    value =>
                        String(value)
                            .trim()
                );


        if (!headers.length) {

            throw new Error(
                "Excel header is missing."
            );
        }


        // =================================================
        // Date Column
        // =================================================

        const dateColumnIndex = 0;


        // =================================================
        // Staff IDs
        //
        // Every column after Date is treated
        // as a possible Staff ID.
        // =================================================

        const staffColumns = [];


        for (
            let columnIndex = 1;
            columnIndex < headers.length;
            columnIndex++
        ) {

            const staffId =
                String(
                    headers[columnIndex]
                ).trim();


            if (!staffId) {
                continue;
            }


            staffColumns.push({

                columnIndex,

                staffId
            });
        }


        if (!staffColumns.length) {

            throw new Error(
                "No Staff IDs were found in the Excel header."
            );
        }


        // =================================================
        // Load Active Employees From DB
        // =================================================

        const employees =
            await supabaseRequest(
                "/rest/v1/employees" +
                "?select=id,staff_id,full_name,active" +
                "&active=eq.true" +
                "&order=staff_id.asc"
            );


        // =================================================
        // Build Staff ID Map
        // =================================================

        const employeeMap = {};


        employees.forEach(
            employee => {

                employeeMap[
                    String(employee.staff_id).trim()
                ] =
                    employee;
            }
        );


        // =================================================
        // Match Excel Columns With DB
        // =================================================

        const matchedColumns = [];
        const ignoredColumns = [];


        staffColumns.forEach(
            column => {

                const employee =
                    employeeMap[
                        column.staffId
                    ];


                if (employee) {

                    matchedColumns.push({

                        ...column,

                        employee
                    });

                } else {

                    ignoredColumns.push(
                        column.staffId
                    );
                }
            }
        );


        // =================================================
        // Build Schedule Rows
        // =================================================

        const scheduleRows = [];


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
                row[dateColumnIndex];
                console.log("ROW 2 DATA:", row);
                console.log("RAW DATE:", rawDate);
                console.log("RAW DATE TYPE:", typeof rawDate);

            if (
                rawDate === undefined ||
                rawDate === null ||
                String(rawDate).trim() === ""
            ) {

                continue;
            }


            const scheduleDate =
                convertExcelDate(
                    rawDate
                );


            if (!scheduleDate) {

                throw new Error(
                    `Invalid date in Excel row ${rowIndex + 1}.`
                );
            }


            // =============================================
            // Only matched employees are imported
            // =============================================

            matchedColumns.forEach(
                column => {

                    const rawShift =
                        row[
                            column.columnIndex
                        ];


                    const shift =
                        normalizeShift(
                            rawShift
                        );


                    if (!shift) {
                        return;
                    }


                    scheduleRows.push({

                        staff_id:
                            column.staffId,

                        schedule_date:
                            scheduleDate,

                        shift_type:
                            shift
                    });
                }
            );
        }


        // =================================================
        // Nothing To Import
        // =================================================

        if (!scheduleRows.length) {

            preview.innerHTML = `
                <div class="status error">
                    No valid schedule records were found.
                </div>
            `;

            return;
        }


        // =================================================
        // Preview
        // =================================================

        let previewHTML = `

            <div class="status success">

                <strong>
                    Excel processed successfully
                </strong>

                <p>
                    Employees in DB:
                    ${employees.length}
                </p>

                <p>
                    Staff columns in Excel:
                    ${staffColumns.length}
                </p>

                <p>
                    Matched employees:
                    ${matchedColumns.length}
                </p>

                <p>
                    Ignored Staff IDs:
                    ${ignoredColumns.length}
                </p>

                <p>
                    Schedule records:
                    ${scheduleRows.length}
                </p>

            </div>

        `;


        if (ignoredColumns.length) {

            previewHTML += `

                <div class="status">

                    <strong>
                        Ignored Staff IDs
                    </strong>

                    <p>
                        ${ignoredColumns
                            .map(
                                escapeHTML
                            )
                            .join(", ")}
                    </p>

                    <small>
                        These Staff IDs exist in Excel
                        but were not found in the active
                        employees of this branch.
                    </small>

                </div>

            `;
        }


        previewHTML += `

            <button
                class="primary"
                onclick='uploadSchedule(
                    ${JSON.stringify(scheduleRows)}
                )'
            >
                Upload Schedule
            </button>

        `;


        preview.innerHTML =
            previewHTML;


        // Save temporarily
        // in case we need it later

        window.pendingScheduleRows =
            scheduleRows;


    }

    catch (error) {

        console.error(
            "Excel import error:",
            error
        );


        preview.innerHTML = `

            <div class="status error">

                <strong>
                    Import Error
                </strong>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }
}


// =====================================================
// UPLOAD SCHEDULE
// =====================================================

async function uploadSchedule(
    scheduleRows
) {

    const preview =
        document.getElementById(
            "excelPreview"
        );


    if (
        !scheduleRows ||
        !scheduleRows.length
    ) {

        alert(
            "No schedule data to upload."
        );

        return;
    }


    try {

        preview.innerHTML = `

            <div class="status loading">

                Uploading schedule...

            </div>

        `;


        // =================================================
        // Get Current Branch
        // =================================================

        const profile =
            window.currentUserProfile;


        if (
            !profile ||
            !profile.branch_id
        ) {

            throw new Error(
                "Branch information was not found."
            );
        }


        // =================================================
        // Upload Through Backend RPC
        // =================================================

        const result =
            await supabaseRequest(
                "/rest/v1/rpc/upload_monthly_schedule",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            p_branch_id:
                                profile.branch_id,

                            p_rows:
                                scheduleRows

                        })
                }
            );


        // =================================================
        // Success
        // =================================================

        preview.innerHTML = `

            <div class="status success">

                <strong>
                    Schedule uploaded successfully.
                </strong>

                <p>
                    Records processed:
                    ${
                        result.rows_processed ??
                        0
                    }
                </p>

                <p>
                    Records skipped:
                    ${
                        result.rows_skipped ??
                        0
                    }
                </p>

            </div>

        `;


        // Refresh schedule if page exists

        if (
            typeof loadSchedule ===
            "function"
        ) {

            await loadSchedule();
        }


    }

    catch (error) {

        console.error(
            "Schedule upload error:",
            error
        );


        preview.innerHTML = `

            <div class="status error">

                <strong>
                    Upload failed
                </strong>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }
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


    switch (shift) {

        case "AM":
            return "AM";

        case "PM":
            return "PM";

        case "BETWEEN":
            return "BETWEEN";

        case "OFF":
            return "OFF";

        case "FULL":
            return "FULL";

        case "SUP AM":
        case "SUP. AM":
            return "SUP AM";

        case "SUP PM":
        case "SUP. PM":
            return "SUP PM";

        case "SUPPORT":
            return "SUP AM";

        case "ANNUAL LEAVE":
        case "ANNUAL":
        case "LEAVE":
            return "ANNUAL LEAVE";

        default:
            return null;
    }
}


// =====================================================
// EXCEL DATE CONVERSION
// =====================================================
function convertExcelDate(value) {

    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();

    if (!text) {
        return null;
    }

    // Excel serial number
    if (typeof value === "number") {

        const excelEpoch =
            new Date(Date.UTC(1899, 11, 30));

        const date =
            new Date(
                excelEpoch.getTime() +
                Math.round(value) * 86400000
            );

        return formatDate(date);
    }

    // YYYY-MM-DD
    let match =
        text.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/
        );

    if (match) {

        return buildValidDate(
            Number(match[1]),
            Number(match[2]),
            Number(match[3])
        );
    }

    // D-M-YYYY
    // Example: 8-1-2026
    match =
        text.match(
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/
        );

    if (match) {

        return buildValidDate(
            Number(match[3]),
            Number(match[2]),
            Number(match[1])
        );
    }

    // D/M/YYYY
    match =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );

    if (match) {

        return buildValidDate(
            Number(match[3]),
            Number(match[2]),
            Number(match[1])
        );
    }

    return null;
}

// =====================================================
// BUILD VALID DATE
// =====================================================

function buildValidDate(
    year,
    month,
    day
) {

    if (
        !year ||
        !month ||
        !day
    ) {
        return null;
    }


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }


    return formatDate(date);
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date) {

    if (
        !date ||
        isNaN(date.getTime())
    ) {
        return null;
    }


    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getUTCDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}

