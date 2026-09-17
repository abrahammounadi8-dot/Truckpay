export async function deleteSession(request: typeof fetch = fetch): Promise<void> {
  const response = await request("/api/session", { method: "DELETE", credentials: "same-origin" });
  if (!response.ok) throw new Error("Could not delete your data. Please try again.");
  const result = await response.json();
  if (result?.ok !== true) throw new Error("Deletion was not confirmed. Please try again.");
}
