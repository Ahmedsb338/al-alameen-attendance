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

                "?select=schedule_date,shift_type,employee_id" +

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


                // Ignore schedules for inactive/
                // unknown employees

                if (!employee) {
                    return;
                }


                dates[
                    item.schedule_date
                ][
                    employee.staff_id
                ] =
                    item.shift_type;
            }
        );


        // =================================================
        // Render Table Header Dynamically
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
                            ${escapeHTML(employee.staff_id)}
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

                            const shift =
                                dates[date][
                                    employee.staff_id
                                ] || "-";


                            const className =
                                getShiftClass(
                                    shift
                                );


                            html += `
                                <td class="${className}">
                                    ${escapeHTML(shift)}
                                </td>
                            `;
                        }
                    );


                    row.innerHTML =
                        html;


                    table.appendChild(row);
                }
            );


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
            return "shift-Support";

        case "OFF":
            return "shift-OFF";

        case "Annual Leave":
            return "shift-Annual";

        default:
            return "";
    }
}