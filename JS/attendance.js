// =====================================================
// ATTENDANCE
// =====================================================


// =====================================================
// LOAD ATTENDANCE PAGE
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


    if (!employeeId) {
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


        records.forEach(
            record => {

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

            }
        );


        // =================================================
        // CHECK-IN
        // =================================================

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


        // =================================================
        // CHECK-OUT
        // =================================================

        if (checkOut) {

            document.getElementById(
                "myCheckOutTime"
            ).textContent =

                new Date(
                    checkOut.recorded_at
                ).toLocaleTimeString();
        }


        // =================================================
        // BUTTONS
        // =================================================

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
        (resolve, reject) => {

            if (
                !navigator.geolocation
            ) {

                reject(
                    new Error(
                        "GPS is not supported by this device."
                    )
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    resolve({

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy

                    });

                },


                error => {

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
            result.message;


        if (result.success) {

            statusBox.className =
                "status success";

        } else {

            statusBox.className =
                "status";
        }


        await loadTodayAttendance();


    } catch (error) {

        console.error(error);


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
            result.message;


        if (result.success) {

            statusBox.className =
                "status success";

        } else {

            statusBox.className =
                "status";
        }


        await loadTodayAttendance();


    } catch (error) {

        console.error(error);


        statusBox.textContent =
            error.message;

        statusBox.className =
            "status error";
    }
}