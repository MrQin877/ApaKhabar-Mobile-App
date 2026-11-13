import { Platform } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";
import api from "./api";
import { getProfile, getToken, type UserProfile } from "./authService";

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export function profilePhotoError(asset: ImagePickerAsset): string {
  if (asset.fileSize && asset.fileSize > PROFILE_PHOTO_MAX_BYTES) return "Foto maksimum 5 MB.";
  if (asset.mimeType && !["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) return "Pilih foto JPG, PNG atau WebP.";
  if (asset.width > 4096 || asset.height > 4096) return "Dimensi foto maksimum 4096 ? 4096 piksel.";
  return "";
}

export async function saveProfilePhoto(asset: ImagePickerAsset | null): Promise<UserProfile> {
  const token = await getToken();
  if (!token) throw new Error("Sila log masuk semula.");
  if (asset) {
    const invalid = profilePhotoError(asset);
    if (invalid) throw new Error(invalid);
    const data = new FormData();
    if (Platform.OS === "web") {
      if (!asset.file) throw new Error("Pilih semula foto dari galeri.");
      data.append("photo", asset.file);
    } else {
      data.append("photo", { uri: asset.uri, name: asset.fileName || "profile.jpg",
        type: asset.mimeType || "image/jpeg" } as unknown as Blob);
    }
    await api.post("/profile/photo", data, { timeout: 30000, headers: { "Content-Type": "multipart/form-data" } });
  } else {
    await api.delete("/profile/photo", { timeout: 15000 });
  }
  // Do not let a completed upload overwrite a different account's cached profile.
  if (await getToken() !== token) throw new Error("Sesi telah berubah. Sila log masuk semula.");
  return getProfile();
}

export function photoSubmissionError(error: unknown): string {
  const data = (error as { response?: { data?: { message?: string; errors?: { photo?: string[] } } } })?.response?.data;
  return data?.errors?.photo?.[0] || data?.message || (error instanceof Error ? error.message : "Foto tidak dapat disimpan. Sila cuba lagi.");
}
