export async function uploadToApi(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const token = localStorage.getItem("token");

  const resp = await fetch("/store/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !data?.ok) {
    throw new Error(data?.error || data?.message || "Falha no upload");
  }

  return data.url as string;
}