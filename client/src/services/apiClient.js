const API_BASE_URL = "/api";


async function request(endpoint, options = {}) {

    const token = localStorage.getItem("token");


    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };


    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }


    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    const data = await response.json()
        .catch(() => null);


    if (!response.ok) {
        throw new Error(
            data?.message || "Server error"
        );
    }


    return data;
}



export function get(endpoint) {
    return request(endpoint);
}



export function post(endpoint, body) {
    return request(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
    });
}



export function patch(endpoint, body) {
    return request(endpoint, {
        method: "PATCH",
        body: JSON.stringify(body)
    });
}



export function remove(endpoint) {
    return request(endpoint, {
        method: "DELETE"
    });
}