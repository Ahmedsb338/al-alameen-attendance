// =====================================================
// QUANTECH ATTENDANCE SYSTEM
// SETTINGS
// =====================================================


// =====================================================
// SETTINGS - ROLE ACCESS
// =====================================================

function applySettingsRoleAccess() {

    const profile = window.currentUserProfile;

    if (!profile) {
        return false;
    }

    const settingsContainer =
        document.querySelector(".settings-container");

    if (!settingsContainer) {
        return true;
    }


    // =================================================
    // BRANCH MANAGER
    // =================================================

    if (profile.role === "Branch Manager") {

        return true;
    }


    // =================================================
    // SUPER ADMIN / HR
    // =================================================

    if (
        profile.role === "Super Admin" ||
        profile.role === "HR"
    ) {

        settingsContainer.innerHTML = `

            <div class="page-header">

                <h2>
                    <i class="fa-solid fa-gear"></i>
                    Settings
                </h2>

                <p>
                    Settings are not available for Super Admin.
                </p>

            </div>


            <div class="settings-card">

                <div class="settings-card-header">

                    <i class="fa-solid fa-circle-info"></i>

                    <h3>
                        Settings Not Available
                    </h3>

                </div>

                <p class="settings-description">

                    Settings are not available for Super Admin.

                </p>

            </div>

        `;

        return true;
    }


    // =================================================
    // OTHER ROLES
    // =================================================

    settingsContainer.innerHTML = `

        <div class="page-header">

            <h2>
                <i class="fa-solid fa-gear"></i>
                Settings
            </h2>

            <p>
                Settings are not available for this account.
            </p>

        </div>

    `;

    return true;
}


// =====================================================
// SETTINGS - LOAD BRANCH SETTINGS
// =====================================================

async function loadBranchSettings() {

    const profile =
        window.currentUserProfile;

    if (!profile) {
        return;
    }


    // Only Branch Manager can access branch settings
    if (profile.role !== "Branch Manager") {
        return;
    }


    const branchId =
        profile.branch_id;

    if (!branchId) {

        console.error(
            "loadBranchSettings: Branch ID not found."
        );

        return;
    }


    try {

        const branches =
            await supabaseRequest(

                "/rest/v1/branches" +
                "?id=eq." +
                branchId +
                "&select=*"

            );


        if (
            !branches ||
            !Array.isArray(branches) ||
            branches.length === 0
        ) {

            console.error(
                "loadBranchSettings: Branch not found."
            );

            return;
        }


        const branch =
            branches[0];


        // =================================================
        // BRANCH NAME
        // =================================================

        const branchName =
            document.getElementById(
                "settingsBranchName"
            );

        if (branchName) {

            branchName.value =
                branch.name || "";

        }


        // =================================================
        // BRANCH CODE
        // =================================================

        const branchCode =
            document.getElementById(
                "settingsBranchCode"
            );

        if (branchCode) {

            branchCode.value =
                branch.store_id ??
                branch.branch_code ??
                branch.code ??
                "";

        }


        // =================================================
        // MANAGER NAME
        // =================================================

        const managerName =
            document.getElementById(
                "settingsManagerName"
            );

        if (managerName) {

            managerName.value =
                branch.manager_name || "";

        }


        // =================================================
        // MANAGER EMAIL
        // =================================================

        const managerEmail =
            document.getElementById(
                "settingsManagerEmail"
            );

        if (managerEmail) {

            managerEmail.value =
                branch.manager_email || "";

        }


        // =================================================
        // MANAGER PHONE
        // =================================================

        const managerPhone =
            document.getElementById(
                "settingsManagerPhone"
            );

        if (managerPhone) {

            managerPhone.value =
                branch.manager_phone || "";

        }


        // =================================================
        // LATITUDE
        // =================================================

        const latitude =
            document.getElementById(
                "settingsLatitude"
            );

        if (latitude) {

            latitude.value =
                branch.latitude ??
                "";

        }


        // =================================================
        // LONGITUDE
        // =================================================

        const longitude =
            document.getElementById(
                "settingsLongitude"
            );

        if (longitude) {

            longitude.value =
                branch.longitude ??
                "";

        }


        // =================================================
        // ALLOWED RADIUS
        // =================================================

        const radius =
            document.getElementById(
                "settingsRadius"
            );

        if (radius) {

            radius.value =
                branch.allowed_radius_meters ??
                "";

        }


        // Update preview
        updateSettingsLocationPreview();


    } catch (error) {

        console.error(
            "loadBranchSettings error:",
            error
        );

    }
}


// =====================================================
// SETTINGS - LOCATION PREVIEW
// =====================================================

function updateSettingsLocationPreview() {

    const latitude =
        document.getElementById(
            "settingsLatitude"
        );

    const longitude =
        document.getElementById(
            "settingsLongitude"
        );

    const radius =
        document.getElementById(
            "settingsRadius"
        );


    const latitudePreview =
        document.getElementById(
            "settingsLatitudePreview"
        );

    const longitudePreview =
        document.getElementById(
            "settingsLongitudePreview"
        );

    const radiusPreview =
        document.getElementById(
            "settingsRadiusPreview"
        );


    if (latitudePreview) {

        latitudePreview.textContent =
            latitude &&
            latitude.value
                ? latitude.value
                : "-";

    }


    if (longitudePreview) {

        longitudePreview.textContent =
            longitude &&
            longitude.value
                ? longitude.value
                : "-";

    }


    if (radiusPreview) {

        radiusPreview.textContent =
            radius &&
            radius.value
                ? radius.value + " meters"
                : "-";

    }

}


// =====================================================
// SETTINGS - SAVE BRANCH SETTINGS
// =====================================================

async function saveBranchSettings() {

    const branchId =
        window.currentUserProfile &&
        window.currentUserProfile.branch_id;


    const status =
        document.getElementById(
            "branchSettingsStatus"
        );


    if (!status) {
        return;
    }


    // =================================================
    // ROLE CHECK
    // =================================================

    if (
        !window.currentUserProfile ||
        window.currentUserProfile.role !== "Branch Manager"
    ) {

        status.textContent =
            "You are not allowed to edit branch settings.";

        status.className =
            "status error";

        return;
    }


    // =================================================
    // BRANCH CHECK
    // =================================================

    if (!branchId) {

        status.textContent =
            "Branch could not be determined.";

        status.className =
            "status error";

        return;
    }


    // =================================================
    // GET FORM VALUES
    // =================================================

    const branchNameElement =
        document.getElementById(
            "settingsBranchName"
        );

    const managerNameElement =
        document.getElementById(
            "settingsManagerName"
        );

    const managerEmailElement =
        document.getElementById(
            "settingsManagerEmail"
        );

    const managerPhoneElement =
        document.getElementById(
            "settingsManagerPhone"
        );

    const latitudeElement =
        document.getElementById(
            "settingsLatitude"
        );

    const longitudeElement =
        document.getElementById(
            "settingsLongitude"
        );

    const radiusElement =
        document.getElementById(
            "settingsRadius"
        );


    const branchName =
        branchNameElement
            ? branchNameElement.value.trim()
            : "";


    const managerName =
        managerNameElement
            ? managerNameElement.value.trim()
            : "";


    const managerEmail =
        managerEmailElement
            ? managerEmailElement.value.trim()
            : "";


    const managerPhone =
        managerPhoneElement
            ? managerPhoneElement.value.trim()
            : "";


    const latitude =
        latitudeElement
            ? latitudeElement.value
            : "";


    const longitude =
        longitudeElement
            ? longitudeElement.value
            : "";


    const radius =
        radiusElement
            ? radiusElement.value
            : "";


    // =================================================
    // VALIDATION
    // =================================================

    if (!branchName) {

        status.textContent =
            "Branch Name is required.";

        status.className =
            "status error";

        return;
    }


    if (!managerName) {

        status.textContent =
            "Manager Name is required.";

        status.className =
            "status error";

        return;
    }


    if (!managerEmail) {

        status.textContent =
            "Manager Email is required.";

        status.className =
            "status error";

        return;
    }


    if (!managerPhone) {

        status.textContent =
            "Manager Phone is required.";

        status.className =
            "status error";

        return;
    }


    if (
        latitude === "" ||
        longitude === ""
    ) {

        status.textContent =
            "Latitude and Longitude are required.";

        status.className =
            "status error";

        return;
    }


    if (
        !radius ||
        Number(radius) <= 0
    ) {

        status.textContent =
            "Allowed Radius must be greater than zero.";

        status.className =
            "status error";

        return;
    }


    // =================================================
    // SAVE
    // =================================================

    try {

        status.textContent =
            "Saving branch settings...";

        status.className =
            "status loading";


        await supabaseRequest(

            "/rest/v1/branches" +
            "?id=eq." +
            branchId,

            {

                method: "PATCH",

                headers: {

                    "Prefer":
                        "return=minimal"

                },

                body:
                    JSON.stringify({

                        name:
                            branchName,

                        manager_name:
                            managerName,

                        manager_phone:
                            managerPhone,

                        manager_email:
                            managerEmail,

                        latitude:
                            Number(latitude),

                        longitude:
                            Number(longitude),

                        allowed_radius_meters:
                            Number(radius)

                    })

            }

        );


        // =================================================
        // SUCCESS
        // =================================================

        status.textContent =
            "Branch settings saved successfully.";

        status.className =
            "status success";


        // Refresh branch header
        if (
            typeof loadBranchHeader ===
            "function"
        ) {

            await loadBranchHeader();

        }


        // Refresh dashboard branch name
        if (
            typeof loadBranch ===
            "function"
        ) {

            await loadBranch();

        }


    } catch (error) {

        console.error(
            "saveBranchSettings error:",
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
// SETTINGS - INITIALIZATION
// =====================================================

function initializeSettingsPage() {

    const settingsContainer =
        document.querySelector(
            ".settings-container"
        );


    if (!settingsContainer) {
        return;
    }


    let attempts = 0;

    const maxAttempts = 50;


    const settingsInterval =
        setInterval(async () => {

            attempts++;


            // Wait for authenticated profile
            if (
                !window.currentUserProfile
            ) {

                if (
                    attempts >= maxAttempts
                ) {

                    clearInterval(
                        settingsInterval
                    );

                }

                return;
            }


            clearInterval(
                settingsInterval
            );


            // Apply role permissions
            const accessGranted =
                applySettingsRoleAccess();


            if (!accessGranted) {
                return;
            }


            // Only Branch Manager needs branch data
            if (
                window.currentUserProfile.role ===
                "Branch Manager"
            ) {

                await loadBranchSettings();

            }

        }, 200);

}


// =====================================================
// SETTINGS - DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeSettingsPage();


        const latitude =
            document.getElementById(
                "settingsLatitude"
            );

        const longitude =
            document.getElementById(
                "settingsLongitude"
            );

        const radius =
            document.getElementById(
                "settingsRadius"
            );


        if (latitude) {

            latitude.addEventListener(
                "input",
                updateSettingsLocationPreview
            );

        }


        if (longitude) {

            longitude.addEventListener(
                "input",
                updateSettingsLocationPreview
            );

        }


        if (radius) {

            radius.addEventListener(
                "input",
                updateSettingsLocationPreview
            );

        }


        updateSettingsLocationPreview();

    }
);