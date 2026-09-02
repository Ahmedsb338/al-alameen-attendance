async function supabaseRequest(
    endpoint,
    options = {}
) {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );

    const normalizedEndpoint =
        endpoint.startsWith("/")
            ? endpoint
            : "/" + endpoint;

    const apiEndpoint =
        normalizedEndpoint.startsWith("/rest/v1/")
            ? normalizedEndpoint
            : "/rest/v1" + normalizedEndpoint;

    const response =
        await fetch(
            SUPABASE_URL + apiEndpoint,
            {

                method:
                    options.method || "GET",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        "Bearer " +
                        (
                            accessToken ||
                            SUPABASE_KEY
                        ),

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                },

                body:
                    options.body || undefined

            }
        );

    const text =
        await response.text();

    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status +
            ": " +
            text
        );

    }

    if (!text) {
        return [];
    }

    return JSON.parse(text);
}