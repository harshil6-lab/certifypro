from fastapi import UploadFile, HTTPException
from app.core.supabase_client import supabase
import os


def _ensure_bucket_exists(bucket_name: str = "certificate-templates"):
    """Ensure Supabase bucket exists and is public."""
    try:
        # Newer supabase client API
        bucket_response = supabase.storage.list_buckets()
    except Exception:
        try:
            bucket_response = supabase.storage.get_buckets()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to list storage buckets: {exc}")

    bucket_list = []
    if hasattr(bucket_response, "data"):
        bucket_list = bucket_response.data or []
    elif isinstance(bucket_response, dict):
        bucket_list = bucket_response.get("data") or []

    if not any(b.get("name") == bucket_name for b in bucket_list if isinstance(b, dict)):
        try:
            # Create bucket as public if missing
            supabase.storage.create_bucket(bucket_name, public=True)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to create storage bucket '{bucket_name}': {exc}")


async def upload_template_file(file: UploadFile, filename: str, user_id: str | None = None):
    bucket_name = "certificate-templates"
    _ensure_bucket_exists(bucket_name)

    # namespace by user when provided
    if user_id:
        path = f"templates/{user_id}/{filename}"
    else:
        path = f"templates/{filename}"

    try:
        file_bytes = await file.read()
        result = supabase.storage.from_(bucket_name).upload(path, file_bytes)

        # Check for upload error
        if hasattr(result, "error") and result.error:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {result.error}")
        if isinstance(result, dict) and result.get("error"):
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {result['error']}")

        # Build public URL for storage object. Supabase public object URL pattern:
        # {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
        public_url = None
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            if supabase_url:
                public_url = f"{supabase_url.rstrip('/')}/storage/v1/object/public/{bucket_name}/{path}"
        except Exception:
            public_url = None

        # insert template row
        insert_payload = {
            "name": filename,
            "file_url": public_url,
            "created_by": user_id,
            "category": "custom",
            "is_custom": True,
        }

        resp = supabase.table("templates").insert(insert_payload).execute()
        if hasattr(resp, "error") and resp.error:
            raise HTTPException(status_code=500, detail=f"Failed to create template row: {resp.error}")

        data = getattr(resp, "data", None)
        # Return inserted row or data wrapper
        if isinstance(data, list) and data:
            return data[0]
        return data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


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
