// =====================================================
// BRANCH MANAGEMENT
// =====================================================


// =====================================================
// CREATE BRANCH
// =====================================================

async function createBranch() {

    const branchName =
        document
            .getElementById("branchNameInput")
            .value
            .trim();


    const branchCode =
        document
            .getElementById("branchCodeInput")
            .value
            .trim();


    const managerName =
        document
            .getElementById("managerNameInput")
            .value
            .trim();


    const managerEmail =
        document
            .getElementById("managerEmailInput")
            .value
            .trim();


    const managerPhone =
        document
            .getElementById("managerPhoneInput")
            .value
            .trim();


    const latitude =
        document
            .getElementById("branchLatitudeInput")
            .value;


    const longitude =
        document
            .getElementById("branchLongitudeInput")
            .value;


    const radius =
        document
            .getElementById("branchRadiusInput")
            .value;


    const status =
        document.getElementById(
            "createBranchStatus"
        );


    if (!branchName) {

        status.textContent =
            "Branch Name is required.";

        status.className =
            "status error";

        return;
    }


    if (!branchCode) {

        status.textContent =
            "Branch Code is required.";

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


    if (!radius || Number(radius) <= 0) {

        status.textContent =
            "Allowed Radius must be greater than zero.";

        status.className =
            "status error";

        return;
    }


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    if (!accessToken) {

        status.textContent =
            "Your session has expired. Please login again.";

        status.className =
            "status error";

        return;
    }


    try {

        status.textContent =
            "Creating branch and manager account...";

        status.className =
            "status loading";


        const response =
            await fetch(

                SUPABASE_URL +
                "/functions/v1/create-branch",

                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            "Bearer " +
                            accessToken,

                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            branch_name:
                                branchName,

                            branch_code:
                                branchCode,

                            manager_name:
                                managerName,

                            manager_email:
                                managerEmail,

                            manager_phone:
                                managerPhone,

                            latitude:
                                Number(latitude),

                            longitude:
                                Number(longitude),

                            allowed_radius_meters:
                                Number(radius),

                            redirect_to:
                                window.location.origin +
                                "/reset-password.html"

                        })

                }
            );


        const result =
            await response.json();


        console.log(
            "Create branch response:",
            result
        );


        if (!response.ok) {

            throw new Error(
                result.error ||
                result.message ||
                "Failed to create branch."
            );
        }


        // =================================================
        // SUCCESS
        // =================================================

        status.textContent =
            "Branch created successfully.";

        status.className =
            "status success";


        const resultBox =
            document.getElementById(
                "branchActivationResult"
            );


        if (resultBox) {

            resultBox.style.display =
                "block";
        }


        document.getElementById(
            "createdBranchName"
        ).textContent =
            result.branch?.name ||
            branchName;


        document.getElementById(
            "createdBranchCode"
        ).textContent =
            result.branch?.store_id ||
            branchCode;


        document.getElementById(
            "createdManagerLogin"
        ).textContent =
            result.manager?.login_id ||
            branchCode;


        document.getElementById(
            "createdManagerName"
        ).textContent =
            result.manager?.full_name ||
            managerName;


        document.getElementById(
            "managerActivationLink"
        ).value =
            result.activation_link ||
            "Activation link was not generated.";


        // =================================================
        // CLEAR FORM
        // =================================================

        document.getElementById(
            "branchNameInput"
        ).value = "";


        document.getElementById(
            "branchCodeInput"
        ).value = "";


        document.getElementById(
            "managerNameInput"
        ).value = "";


        document.getElementById(
            "managerEmailInput"
        ).value = "";


        document.getElementById(
            "managerPhoneInput"
        ).value = "";


        document.getElementById(
            "branchLatitudeInput"
        ).value = "";


        document.getElementById(
            "branchLongitudeInput"
        ).value = "";


        document.getElementById(
            "branchRadiusInput"
        ).value = "50";


        // =================================================
        // Refresh branches
        // =================================================

        await loadBranches();


    } catch (error) {

        console.error(
            "createBranch error:",
            error
        );


        status.textContent =
            error.message;

        status.className =
            "status error";
    }
}


// =====================================================
// COPY ACTIVATION LINK
// =====================================================

async function copyManagerActivationLink() {

    const input =
        document.getElementById(
            "managerActivationLink"
        );


    if (!input || !input.value) {

        alert(
            "No activation link is available."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            input.value
        );


        alert(
            "Activation link copied successfully."
        );


    } catch (error) {

        input.select();

        document.execCommand(
            "copy"
        );


        alert(
            "Activation link copied."
        );
    }
}


// =====================================================
// BRANCHES - LOAD BRANCHES
// =====================================================

async function loadBranches() {

    const table =
        document.getElementById("branchesTable");

    const status =
        document.getElementById("branchesStatus");

    if (!table || !status) {
        return;
    }


    try {

        status.textContent =
            "Loading branches...";

        status.className =
            "status loading";


        const branches =
            await supabaseRequest(
                "/rest/v1/branches" +
                "?select=id,name,store_id,manager_name,manager_phone,manager_email,active" +
                "&order=id.asc"
            );


        table.innerHTML = "";


        branches.forEach(
            (branch, index) => {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            branch.store_id || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            branch.name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            branch.manager_name || "-"
                        )}
                    </td>

                    <td class="${
                        branch.active
                            ? "success"
                            : "error"
                    }">

                        ${
                            branch.active
                                ? "Active"
                                : "Inactive"
                        }

                    </td>

                    <td>

                        <button
                            type="button"
                            class="secondary"
                            onclick="editBranch(${branch.id})"
                        >

                            <i class="fa-solid fa-pen-to-square"></i>

                            Edit

                        </button>

                    </td>

                `;


                table.appendChild(row);

            }
        );


        status.textContent =
            branches.length +
            " branches loaded.";

        status.className =
            "status success";


    } catch (error) {

        console.error(
            "loadBranches error:",
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
// BRANCHES - OPEN EDIT PAGE
// =====================================================

function editBranch(branchId) {

    if (!branchId) {
        return;
    }


    window.location.href =
        "edit-branch.html?id=" +
        encodeURIComponent(branchId);

}

// =====================================================
// EDIT BRANCH - GET BRANCH ID
// =====================================================

function getEditBranchId() {

    const selector =
        document.getElementById("editBranchSelector");

    // If a branch was selected from dropdown
    if (selector && selector.value) {
        return selector.value;
    }

    // Otherwise get ID from URL
    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");
}

// =====================================================
// EDIT BRANCH - LOAD DATA
// =====================================================

async function loadEditBranch(branchId = null) {

    const page =
        document.getElementById("editBranchPage");

    if (!page) {
        return;
    }

    const status =
        document.getElementById("editBranchStatus");

    const formCard =
        document.getElementById("editBranchFormCard");

    const selector =
        document.getElementById("editBranchSelector");


    // Get branch ID
    if (!branchId) {
        branchId = getEditBranchId();
    }


    if (!branchId) {

        if (formCard) {
            formCard.style.display = "none";
        }

        if (status) {
            status.textContent =
                "Please select a branch.";

            status.className =
                "status";
        }

        return;
    }


    console.log(
        "Loading selected branch:",
        branchId
    );


    try {

        if (status) {

            status.textContent =
                "Loading branch information...";

            status.className =
                "status loading";
        }


        const branches =
            await supabaseRequest(
                "/rest/v1/branches" +
                "?select=id,name,store_id,manager_name,manager_phone,manager_email,latitude,longitude,allowed_radius_meters,active" +
                "&id=eq." +
                encodeURIComponent(branchId)
            );


        console.log(
            "Selected branch data:",
            branches
        );


        if (
            !branches ||
            branches.length === 0
        ) {

            throw new Error(
                "Branch not found."
            );
        }


        const branch =
            branches[0];


        // =============================================
        // SET SELECTED BRANCH
        // =============================================

        if (selector) {
            selector.value =
                String(branch.id);
        }


        // =============================================
        // SHOW EDIT FORM
        // =============================================

        if (formCard) {
            formCard.style.display = "block";
        }


        // =============================================
        // FILL FORM
        // =============================================

        document.getElementById(
            "editBranchName"
        ).value =
            branch.name || "";


        document.getElementById(
            "editBranchCode"
        ).value =
            branch.store_id || "";


        document.getElementById(
            "editManagerName"
        ).value =
            branch.manager_name || "";


        document.getElementById(
            "editManagerEmail"
        ).value =
            branch.manager_email || "";


        document.getElementById(
            "editManagerPhone"
        ).value =
            branch.manager_phone || "";


        document.getElementById(
            "editBranchLatitude"
        ).value =
            branch.latitude ?? "";


        document.getElementById(
            "editBranchLongitude"
        ).value =
            branch.longitude ?? "";


        document.getElementById(
            "editBranchRadius"
        ).value =
            branch.allowed_radius_meters ?? 50;


        // =============================================
        // SUCCESS
        // =============================================

        if (status) {

            status.textContent =
                "Branch information loaded.";

            status.className =
                "status success";
        }


        console.log(
            "Edit form displayed successfully."
        );

    } catch (error) {

        console.error(
            "loadEditBranch error:",
            error
        );


        if (formCard) {
            formCard.style.display = "none";
        }


        if (status) {

            status.textContent =
                "Error: " +
                error.message;

            status.className =
                "status error";
        }
    }
}
// =====================================================
// EDIT BRANCH - SAVE CHANGES
// =====================================================

async function saveEditedBranch() {

    const status =
        document.getElementById(
            "editBranchStatus"
        );


    const button =
        document.getElementById(
            "saveEditBranchButton"
        );


    const branchId =
        getEditBranchId();


    if (!branchId) {

        status.textContent =
            "Branch ID is missing.";

        status.className =
            "status error";

        return;
    }


    const branchName =
        document
            .getElementById(
                "editBranchName"
            )
            .value
            .trim();


    const managerName =
        document
            .getElementById(
                "editManagerName"
            )
            .value
            .trim();


    const managerEmail =
        document
            .getElementById(
                "editManagerEmail"
            )
            .value
            .trim();


    const managerPhone =
        document
            .getElementById(
                "editManagerPhone"
            )
            .value
            .trim();


    const latitude =
        document.getElementById(
            "editBranchLatitude"
        ).value;


    const longitude =
        document.getElementById(
            "editBranchLongitude"
        ).value;


    const radius =
        document.getElementById(
            "editBranchRadius"
        ).value;


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


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    if (!accessToken) {

        status.textContent =
            "Your session has expired. Please login again.";

        status.className =
            "status error";

        return;
    }


    try {

        status.textContent =
            "Saving branch changes...";

        status.className =
            "status loading";


        if (button) {

            button.disabled =
                true;

            button.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
                `;
        }


        await supabaseRequest(
            "/rest/v1/branches" +
            "?id=eq." +
            encodeURIComponent(branchId),
            {

                method:
                    "PATCH",

                headers: {

                    "Prefer":
                        "return=representation"

                },

                body:
                    JSON.stringify({

                        name:
                            branchName,

                        manager_name:
                            managerName,

                        manager_email:
                            managerEmail,

                        manager_phone:
                            managerPhone,

                        latitude:
                            Number(latitude),

                        longitude:
                            Number(longitude),

                        allowed_radius_meters:
                            Number(radius)

                    })

            }
        );


        status.textContent =
            "Branch updated successfully.";

        status.className =
            "status success";


        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                `
                <i class="fa-solid fa-floppy-disk"></i>
                Save Changes
                `;
        }


        // Return to branches page
        setTimeout(
            function () {

                window.location.href =
                    "branches.html";

            },
            800
        );


    } catch (error) {

        console.error(
            "saveEditedBranch error:",
            error
        );


        status.textContent =
            "Error: " +
            error.message;

        status.className =
            "status error";


        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                `
                <i class="fa-solid fa-floppy-disk"></i>
                Save Changes
                `;
        }
    }
}

async function loadEditBranchSelector() {
    const selector = document.getElementById("editBranchSelector");
    const status = document.getElementById("editBranchSelectorStatus");

    if (!selector) {
        console.error("editBranchSelector not found");
        return;
    }

    try {
        if (status) {
            status.className = "status loading";
            status.textContent = "Loading branches...";
        }

        const branches = await supabaseRequest(
            "/rest/v1/branches" +
            "?select=id,name,store_id,active" +
            "&order=id.asc"
        );

        console.log("Edit page branches:", branches);

        if (!Array.isArray(branches)) {
            throw new Error("Invalid branches response");
        }

        // Reset selector
        selector.innerHTML =
            '<option value="">Select a branch</option>';

        // Add all branches
        branches.forEach(function (branch) {
            const option = document.createElement("option");

            option.value = branch.id;

            option.textContent =
                (branch.store_id || "") +
                " - " +
                (branch.name || "Unnamed Branch");

            selector.appendChild(option);
        });

        if (status) {
            status.className = "status success";
            status.textContent =
                branches.length +
                " branch(es) loaded successfully.";
        }

        console.log(
            "Branch selector populated:",
            branches.length
        );

    } catch (error) {

        console.error(
            "loadEditBranchSelector error:",
            error
        );

        if (status) {
            status.className = "status error";
            status.textContent =
                "Failed to load branches.";
        }
    }
}

async function handleEditBranchSelection() {
    const selector = document.getElementById("editBranchSelector");

    if (!selector) {
        return;
    }

    const branchId = selector.value;

    const formCard = document.getElementById("editBranchFormCard");

    if (!branchId) {
        if (formCard) {
            formCard.style.display = "none";
        }
        return;
    }

    console.log("Selected branch ID:", branchId);

    await loadEditBranch();
}

// =====================================================
// INITIALIZE BRANCH PAGES
// =====================================================

document.addEventListener("DOMContentLoaded", async function () {

    console.log("branches.js loaded");

    // Branches Management page
    const branchesTable = document.getElementById("branchesTable");

    if (branchesTable) {
        console.log("Loading branches list...");
        await loadBranches();
    }

    // Edit Branch page
    const editBranchPage = document.getElementById("editBranchPage");

    if (editBranchPage) {
        console.log("Edit Branch page detected");

        const selector = document.getElementById("editBranchSelector");

        if (selector) {
            console.log("Branch selector found");

            try {
                await loadEditBranchSelector();

                console.log(
                    "Branch selector options:",
                    selector.options.length
                );

                selector.addEventListener(
                    "change",
                    handleEditBranchSelection
                );

            } catch (error) {
                console.error(
                    "Error loading branch selector:",
                    error
                );
            }
        } else {
            console.error("editBranchSelector NOT found");
        }
    }
});