from fastapi import UploadFile, HTTPException
from app.core.supabase_client import supabase
import os
import tempfile
from uuid import uuid4

try:
    from pdf2image import convert_from_path
    _PDF2IMAGE_AVAILABLE = True
except ImportError:
    _PDF2IMAGE_AVAILABLE = False


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

        # --- PDF preview conversion ---
        # If file is a PDF, convert first page to PNG and upload as preview
        preview_url = public_url  # default: preview == original file
        is_pdf = file_ext.lower() == "pdf"

        if is_pdf:
            if not _PDF2IMAGE_AVAILABLE:
                raise HTTPException(
                    status_code=500,
                    detail="pdf2image is not installed. Run: pip install pdf2image (requires poppler on PATH)"
                )
            # Write PDF bytes to a temp file so convert_from_path can read it
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
                tmp_pdf.write(file_bytes)
                tmp_pdf_path = tmp_pdf.name

            try:
                images = convert_from_path(tmp_pdf_path)
                preview_path = tmp_pdf_path.replace(".pdf", ".png")
                images[0].save(preview_path, "PNG")

                # Upload the PNG preview to Supabase storage
                preview_storage_path = path.replace(f".{file_ext}", ".png")
                with open(preview_path, "rb") as png_file:
                    png_bytes = png_file.read()

                preview_result = supabase.storage.from_(bucket_name).upload(
                    preview_storage_path, png_bytes, {"content-type": "image/png"}
                )
                if hasattr(preview_result, "error") and preview_result.error:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to upload PDF preview: {preview_result.error}"
                    )

                preview_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{preview_storage_path}"
            finally:
                # Clean up temp files
                if os.path.exists(tmp_pdf_path):
                    os.remove(tmp_pdf_path)
                if os.path.exists(preview_path):
                    os.remove(preview_path)

        # Return file URL only - no database save
        # Uploaded templates are session-only workspace previews
        return {
            "file_url": public_url,
            "preview_url": preview_url,
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
