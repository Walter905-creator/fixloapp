export async function uploadFile(file, path = "fixlo/uploads") {
  if (!file) return null;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", path);
  const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
  const ctype = res.headers.get("content-type") || "";
  let data;
  if (ctype.includes("application/json")) data = await res.json(); else data = { url: await res.text() };
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
  return data?.url || null;
}
