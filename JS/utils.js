// =====================================================
// UTILITIES
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// PAGE NAVIGATION
// =====================================================

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(
            page => {
                page.classList.remove("active");
            }
        );


    const targetPage =
        document.getElementById(pageId);


    if (!targetPage) {
        return;
    }


    targetPage.classList.add("active");


    // =================================================
    // PAGE-SPECIFIC LOADERS
    // =================================================

    if (pageId === "employeesPage") {
        loadEmployees();
    }


    if (pageId === "schedulePage") {
        loadSchedule();
    }


    if (pageId === "settingsPage") {
        loadEmployeesSettings();
    }


    if (pageId === "attendancePage") {
        loadAttendancePage();
    }
}