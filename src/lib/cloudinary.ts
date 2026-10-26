/** Upload unsigned vers Cloudinary (navigateur → Cloudinary, sans passer par Vercel). */

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    throw new Error(
      "Cloudinary non configuré (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / UPLOAD_PRESET)",
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier doit être une image");
  }

  // ~10 Mo : marge sous le plafond free Cloudinary
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image trop lourde (max 10 Mo)");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", preset);
  body.append("folder", "wainsera");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error?.message === "string"
        ? data.error.message
        : "Échec de l'upload Cloudinary",
    );
  }

  const url = data.secure_url as string | undefined;
  if (!url) throw new Error("Cloudinary n'a pas renvoyé d'URL");
  return url;
}
