from fastapi import UploadFile, HTTPException
from app.core.supabase_client import supabase
import os
from uuid import uuid4


async def upload_template_file(file: UploadFile, filename: str, user_id: str | None = None):
    """Upload template file to Supabase storage for session-only preview.
    
    Returns public URL only - does NOT save to database.
    Uploaded templates are session-only and disappear on page refresh.
    
    NOTE: The 'certificate-templates' bucket must exist and be set to PUBLIC
    in the Supabase dashboard. The bucket is not created dynamically because
    the Supabase Python SDK does not support the public=True parameter.
    """
    bucket_name = "certificate-templates"
    
    # Generate unique filename to avoid conflicts
    file_ext = filename.split(".")[-1] if "." in filename else "pdf"
    unique_filename = f"{uuid4()}.{file_ext}"
    
    # Namespace by user when provided
    if user_id:
        path = f"templates/{user_id}/{unique_filename}"
    else:
        path = f"templates/{unique_filename}"

    try:
        file_bytes = await file.read()
        
        # Upload to Supabase storage
        result = supabase.storage.from_(bucket_name).upload(path, file_bytes)

        # Check for upload error
        if hasattr(result, "error") and result.error:
            raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {result.error}")
        if isinstance(result, dict) and result.get("error"):
            raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {result['error']}")

        # Build public URL for the uploaded file
        # Supabase public URL format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
        supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        if not supabase_url:
            raise HTTPException(status_code=500, detail="SUPABASE_URL environment variable not configured")
        
        public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{path}"

        # Return file URL only - no database save
        # Uploaded templates are session-only workspace previews
        return {
            "file_url": public_url,
            "message": "Template uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Template upload failed: {str(exc)}")


async def save_template_layout(template_id: str, layout: dict):
    if not template_id:
        raise HTTPException(status_code=400, detail="template_id is required")

    try:
        response = supabase.table("templates").update({"layout_config": layout}).eq("id", template_id).execute()

        if hasattr(response, "error") and response.error:
            raise HTTPException(status_code=500, detail=f"Failed to save template layout: {response.error}")

        return getattr(response, "data", None)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
