const BASE_URL = import.meta.env.VITE_API_URL;

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }

  return response;
}
