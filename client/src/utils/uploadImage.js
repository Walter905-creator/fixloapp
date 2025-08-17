export async function uploadToCloudinary(file) {
  const cloud = process.env.REACT_APP_CLOUDINARY_CLOUD;
  const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "fixlo_unsigned"); // or use a signed endpoint you already have
  // optimization hints
  form.append("folder", "fixlo/profiles");

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json(); // returns { secure_url, ... }
}

export function cld(url, w=800, h=600) {
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w},h_${h}/`);
}