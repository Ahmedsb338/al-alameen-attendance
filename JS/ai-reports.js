// =====================================================
// AI REPORTS - INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("AI Reports page loaded.");

});


// =====================================================
// GENERATE REPORT
// =====================================================

async function generateReport() {

    console.log("Generating AI report...");

    try {

        // =============================================
        // LOAD EMPLOYEES
        // =============================================

        const employees =
            await supabaseRequest(
                "/employees?select=id,staff_id,full_name,branch_id&active=eq.true"
            );

        console.log(
            "Employees loaded:",
            employees
        );


        // =============================================
        // LOAD SCHEDULE
        // =============================================

        const schedule =
            await supabaseRequest(
                "/monthly_schedule?select=id,schedule_date,employee_id,shift_type"
            );

        console.log(
            "Schedule loaded:",
            schedule
        );


        // =============================================
        // LOAD SHIFT SETTINGS
        // =============================================

        const shiftSettings =
            await supabaseRequest(
                "/shift_settings?select=id,shift_type,day_of_week,start_time,end_time,grace_minutes,valid_from,valid_to,active"
            );

        console.log(
            "Shift settings loaded:",
            shiftSettings
        );


        // =============================================
        // LOAD ATTENDANCE
        // =============================================

        const attendance =
            await supabaseRequest(
                "/attendance?select=id,employee_id,attendance_type,recorded_at,status&status=eq.accepted&order=recorded_at.asc"
            );

        console.log(
            "Attendance loaded:",
            attendance
        );

        console.log("AI REPORT DATA CHECK");
        console.log("Employees count:", employees.length);
        console.log("Schedule count:", schedule.length);
        console.log("Shift settings count:", shiftSettings.length);
        console.log("Attendance count:", attendance.length);

    } catch (error) {

        console.error(
            "AI Reports data error:",
            error
        );

    }
}