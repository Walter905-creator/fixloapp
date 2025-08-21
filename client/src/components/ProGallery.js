import React, { useCallback, useMemo, useRef, useState } from "react";

/**
 * ProGallery
 * - Securely signs uploads via /api/cloudinary/sign (backend)
 * - Uploads directly to Cloudinary
 * - Displays a responsive gallery with copy/share tools
 *
 * Props:
 *   proId?: string   // if provided, will attempt to persist gallery via /api/pros/:proId/gallery
 */
export default function ProGallery({ proId }) {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]); // [{id,url,thumbUrl,caption,bytes,progress,status,error}]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canPersist = useMemo(() => typeof proId === "string" && proId.length > 6, [proId]);

  const notify = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  };

  const signUpload = useCallback(async (opts = {}) => {
    const res = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: opts.folder || "pros",
        transformation: opts.transformation || "f_auto,q_auto,w_1600,c_limit",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Sign failed (${res.status}): ${t}`);
    }
    return res.json();
  }, []);

  const uploadOne = useCallback(async (file, idx) => {
    // 1) get signature from backend
    const sig = await signUpload();

    // 2) build multipart form
    const form = new FormData();
    form.append("file", file);
    form.append("timestamp", sig.timestamp);
    form.append("api_key", sig.api_key);
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("use_filename", "true");
    form.append("unique_filename", "true");
    form.append("transformation", sig.transformation);

    // 3) upload to Cloudinary
    const controller = new AbortController();
    // NOTE: fetch doesn't expose raw progress; we opt to update
    // progress in two steps for UX (0 → 15% while signing, 15% → 100% on completion)
    setItems((cur) =>
      cur.map((it, i) => (i === idx ? { ...it, progress: 15, status: "uploading" } : it))
    );

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
      { method: "POST", body: form, signal: controller.signal }
    );

    if (!uploadRes.ok) {
      const t = await uploadRes.text();
      throw new Error(`Upload failed (${uploadRes.status}): ${t}`);
    }

    const json = await uploadRes.json();

    // 4) update item
    const secureUrl = json.secure_url;
    const thumb = json.eager?.[0]?.secure_url || secureUrl;

    setItems((cur) =>
      cur.map((it, i) =>
        i === idx
          ? {
              ...it,
              id: json.public_id,
              url: secureUrl,
              thumbUrl: thumb,
              bytes: json.bytes,
              progress: 100,
              status: "done",
              error: "",
            }
          : it
      )
    );

    return json;
  }, [signUpload]);

  const handleFiles = useCallback(
    async (fileList) => {
      setError("");
      if (!fileList || fileList.length === 0) return;
      setBusy(true);

      const startIndex = items.length;

      // Seed UI items
      const seed = Array.from(fileList).map((f) => ({
        id: `local-${crypto.randomUUID()}`,
        url: "",
        thumbUrl: URL.createObjectURL(f),
        caption: "",
        bytes: f.size,
        progress: 0,
        status: "queued",
        file: f,
        error: "",
      }));

      setItems((cur) => [...cur, ...seed]);

      // Upload sequentially for simplicity/reliability (could parallelize)
      for (let i = 0; i < seed.length; i++) {
        const idx = startIndex + i;
        const f = seed[i].file;
        try {
          await uploadOne(f, idx);
        } catch (e) {
          console.error(e);
          setItems((cur) =>
            cur.map((it, j) =>
              j === idx ? { ...it, status: "error", error: e.message, progress: 0 } : it
            )
          );
          setError("Some uploads failed. See items for details.");
        }
      }

      setBusy(false);
      notify("Upload complete");
    },
    [items.length, uploadOne]
  );

  const onFileInput = (e) => {
    handleFiles(e.target.files);
    // reset input so same file can be selected again
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (busy) return;
    const f = e.dataTransfer.files;
    handleFiles(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const removeItem = (localId) => {
    setItems((cur) => cur.filter((it) => it.id !== localId));
  };

  const updateCaption = (localId, caption) => {
    setItems((cur) => cur.map((it) => (it.id === localId ? { ...it, caption } : it)));
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      notify("Copied URL to clipboard");
    } catch {
      notify("Copy failed");
    }
  };

  const shareUrl = async (url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Fixlo – Work Photo", url });
      } else {
        await navigator.clipboard.writeText(url);
        notify("Link copied (share dialog not supported)");
      }
    } catch {
      // user cancelled share
    }
  };

  const persistGallery = async () => {
    if (!canPersist) {
      notify("No proId provided — skipping save");
      return;
    }
    const payload = {
      images: items
        .filter((it) => it.status === "done" && it.url)
        .map((it) => ({ url: it.url, caption: it.caption || "" })),
    };
    try {
      const res = await fetch(`/api/pros/${encodeURIComponent(proId)}/gallery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      notify("Gallery saved");
    } catch (e) {
      console.error(e);
      setError("Failed to save gallery");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pro Gallery</h1>
          <p className="text-slate-600 mt-1">
            Upload your best work photos. Optimized with Cloudinary (auto format/quality).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canPersist && (
            <button
              onClick={persistGallery}
              className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90 disabled:opacity-50"
              disabled={busy || items.every((it) => it.status !== "done")}
              title={busy ? "Please wait for uploads to finish" : "Save gallery to your profile"}
            >
              Save Gallery
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl px-4 py-2 border border-slate-300 hover:bg-slate-50"
            disabled={busy}
          >
            Upload Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={onFileInput}
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border border-dashed rounded-2xl p-8 text-center mb-8"
        style={{ borderColor: "#cbd5e1" }}
      >
        <p className="text-slate-600">
          Drag & drop images here, or{" "}
          <button
            className="underline underline-offset-4"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            browse
          </button>
        </p>
        {busy && <p className="mt-2 text-slate-500">Uploading…</p>}
      </div>

      {/* Notices */}
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-700 px-4 py-2 border border-emerald-200">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 px-4 py-2 border border-rose-200">
          {error}
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
        }}
      >
        {items.map((it) => (
          <figure
            key={it.id}
            className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative">
              <img
                src={it.thumbUrl || it.url}
                alt={it.caption || "Work photo"}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              {/* Progress bar */}
              {it.status === "uploading" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                  <div
                    className="h-1 bg-black transition-all"
                    style={{ width: `${Math.max(10, it.progress)}%` }}
                  />
                </div>
              )}
            </div>

            <figcaption className="p-3">
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Add a caption…"
                value={it.caption}
                onChange={(e) => updateCaption(it.id, e.target.value)}
              />

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-slate-500">
                  {it.status === "done"
                    ? `${formatBytes(it.bytes)}`
                    : it.status === "uploading"
                    ? "Uploading…"
                    : it.status === "error"
                    ? "Failed"
                    : "Ready"}
                </div>
                <div className="flex items-center gap-2">
                  {it.url && (
                    <>
                      <button
                        className="text-xs underline underline-offset-4"
                        onClick={() => copyUrl(it.url)}
                        type="button"
                        title="Copy image URL"
                      >
                        Copy URL
                      </button>
                      <button
                        className="text-xs underline underline-offset-4"
                        onClick={() => shareUrl(it.url)}
                        type="button"
                        title="Share"
                      >
                        Share
                      </button>
                    </>
                  )}
                  <button
                    className="text-xs text-rose-600 underline underline-offset-4"
                    onClick={() => removeItem(it.id)}
                    type="button"
                    title="Remove from gallery"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {it.status === "error" && it.error && (
                <p className="text-xs text-rose-600 mt-2 break-words">{it.error}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center text-slate-500 mt-10">
          No photos yet. Upload your first work photo to get started.
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const kb = 1024;
  const mb = kb * 1024;
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`;
  if (bytes >= kb) return `${(bytes / kb).toFixed(0)} KB`;
  return `${bytes} B`;
}
