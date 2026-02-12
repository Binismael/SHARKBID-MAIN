import { supabase } from "./supabase";

function formatError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return `${error.message} - ${error.details}`;
  return JSON.stringify(error);
}

// Utility function for retries with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export interface Asset {
  id: string;
  title: string;
  type: string;
  project_id?: string;
  company_id?: string;
  file_path: string;
  file_size?: number;
  campaign?: string;
  usage?: string;
  format?: string;
  created_at?: string;
  uploaded_by: string;
  tags?: string[];
  drive_link?: string;
  frame_io_link?: string;
  description?: string;
  asset_type?: string;
}

// Upload a file to Supabase Storage and create asset record
export async function uploadAsset(
  file: File,
  title: string,
  projectId?: string,
  companyId?: string,
  metadata?: {
    tags?: string[];
    description?: string;
    campaign?: string;
    usage?: string;
  }
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id) throw new Error("User not authenticated");

    // Determine file type based on MIME type
    const mimeType = file.type;
    let assetType = "document";
    if (mimeType.startsWith("image/")) assetType = "image";
    else if (mimeType.startsWith("video/")) assetType = "video";
    else if (
      mimeType.includes("illustrator") ||
      mimeType.includes("photoshop") ||
      mimeType.includes("figma") ||
      file.name.endsWith(".ai") ||
      file.name.endsWith(".psd") ||
      file.name.endsWith(".fig")
    )
      assetType = "design";

    // Create unique file path - simplified for better compatibility
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const bucketPath = `${fileName}`;

    console.log("Uploading to bucket path:", bucketPath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assets")
      .upload(bucketPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    if (!uploadData || !uploadData.path) {
      throw new Error("Storage upload succeeded but no path returned");
    }

    console.log("File uploaded successfully to:", uploadData.path);

    // Create asset record in database
    const assetRecord: any = {
      title,
      type: assetType,
      file_path: uploadData.path,
      file_size: file.size,
      campaign: metadata?.campaign,
      usage: metadata?.usage,
      format: file.name.split(".").pop(),
      uploaded_by: userData.user.id,
      tags: metadata?.tags || [],
      description: metadata?.description,
      asset_type: assetType,
    };

    // Only include optional fields if provided
    if (projectId) assetRecord.project_id = projectId;
    if (companyId) assetRecord.company_id = companyId;

    console.log("Creating asset record:", assetRecord);

    const { data: assetData, error: assetError } = await supabase
      .from("assets")
      .insert([assetRecord])
      .select()
      .single();

    if (assetError) {
      console.error("Asset record error:", assetError);
      throw assetError;
    }

    console.log("Asset record created successfully");
    return { success: true, asset: assetData };
  } catch (error) {
    const message = formatError(error);
    console.error("Error uploading asset:", message);
    return { success: false, error: message };
  }
}

// Get asset download URL
export async function getAssetDownloadUrl(filePath: string) {
  try {
    const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting asset URL:", message);
    return { success: false, error: message };
  }
}

// Get assets by project
export async function getProjectAssets(projectId: string) {
  try {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, assets: data || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching project assets:", message);
    return { success: false, error: message, assets: [] };
  }
}

// Get assets by company
export async function getCompanyAssets(companyId: string) {
  try {
    const { data, error } = await withRetry(
      () => supabase
        .from("assets")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
    );

    if (error) throw error;
    return { success: true, assets: data || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching company assets:", message);
    // Return empty array gracefully on error
    return { success: true, assets: [] };
  }
}

// Get all assets for user (by uploaded_by)
export async function getUserAssets(userId: string) {
  try {
    const { data, error } = await withRetry(
      () => supabase
        .from("assets")
        .select("*")
        .eq("uploaded_by", userId)
        .order("created_at", { ascending: false })
    );

    if (error) throw error;
    return { success: true, assets: data || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching user assets:", message);
    return { success: false, error: message, assets: [] };
  }
}

// Delete asset
export async function deleteAsset(assetId: string, filePath: string) {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("assets")
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete database record
    const { error: dbError } = await supabase
      .from("assets")
      .delete()
      .eq("id", assetId);

    if (dbError) throw dbError;

    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error deleting asset:", message);
    return { success: false, error: message };
  }
}

// Update asset metadata
export async function updateAsset(
  assetId: string,
  updates: Partial<Asset>
) {
  try {
    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", assetId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, asset: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error updating asset:", message);
    return { success: false, error: message };
  }
}
