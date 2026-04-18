export const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
            ...(options.headers || {})
        }
    });
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error("Respuesta inválida del servidor");
    }
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem("token");
            throw new Error("UNAUTHORIZED");
        }
        throw new Error(data?.error || "Error en la API");
    }
    return data;
};
