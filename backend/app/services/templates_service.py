from typing import Any, Dict, List
from ._supabase_helpers import select_table, insert_table, delete_table


def list_templates() -> List[Dict[str, Any]]:
    data, err = select_table("templates")
    if err:
        raise RuntimeError(err)
    return data or []


def create_template(payload: Dict[str, Any]) -> Dict[str, Any]:
    data, err = insert_table("templates", payload)
    if err:
        raise RuntimeError(err)
    # supabase insert returns inserted row(s)
    if isinstance(data, list) and data:
        return data[0]
    return data


def remove_template(template_id: str):
    data, err = delete_table("templates", "id", template_id)
    if err:
        raise RuntimeError(err)
    return data


def seed_default_templates() -> bool:
    """Seed default CertifyPro templates if table is empty.
    
    Inserts 5 official templates: Academic, Corporate, Internship, Training, Compliance.
    Only inserts if templates table has 0 rows. This ensures no duplicates.
    
    Returns:
        True if templates were inserted or table already has data, False if seeding failed.
    """
    try:
        # Check if templates table is empty
        existing, err = select_table("templates", "id")
        if err:
            print(f"⚠️  Warning: Failed to check templates count: {err}")
            return False
        
        # If templates already exist, skip seeding
        if existing and len(existing) > 0:
            print(f"✓ Templates table already populated ({len(existing)} templates found)")
            return True
        
        # Default templates to seed
        default_templates = [
            {
                "slug": "academic",
                "title": "Academic Achievement",
                "category": "education",
                "description": "Certificate for academic achievements, degrees, and coursework completion.",
                "image_url": "https://via.placeholder.com/400x300?text=Academic+Certificate",
                "style_type": "classic",
                "editable_fields": ["recipient_name", "course_name", "completion_date", "grade"],
                "is_official": True,
            },
            {
                "slug": "corporate",
                "title": "Corporate Recognition",
                "category": "business",
                "description": "Professional certificate for employee recognition, training completion, and milestones.",
                "image_url": "https://via.placeholder.com/400x300?text=Corporate+Certificate",
                "style_type": "modern",
                "editable_fields": ["employee_name", "achievement", "date_awarded", "manager_name"],
                "is_official": True,
            },
            {
                "slug": "internship",
                "title": "Internship Completion",
                "category": "education",
                "description": "Certificate recognizing successful completion of an internship program.",
                "image_url": "https://via.placeholder.com/400x300?text=Internship+Certificate",
                "style_type": "professional",
                "editable_fields": ["intern_name", "position", "duration", "supervisor_name"],
                "is_official": True,
            },
            {
                "slug": "training",
                "title": "Training Certification",
                "category": "professional-development",
                "description": "Certificate of completion for professional training and skill development programs.",
                "image_url": "https://via.placeholder.com/400x300?text=Training+Certificate",
                "style_type": "elegant",
                "editable_fields": ["trainee_name", "training_program", "hours_completed", "trainer_name"],
                "is_official": True,
            },
            {
                "slug": "compliance",
                "title": "Compliance Certification",
                "category": "compliance",
                "description": "Certificate for compliance training, certifications, and regulatory requirements.",
                "image_url": "https://via.placeholder.com/400x300?text=Compliance+Certificate",
                "style_type": "formal",
                "editable_fields": ["participant_name", "compliance_program", "expiration_date", "audit_id"],
                "is_official": True,
            },
        ]
        
        # Insert all default templates
        data, err = insert_table("templates", default_templates)
        if err:
            print(f"⚠️  Warning: Failed to seed default templates: {err}")
            return False
        
        inserted_count = len(data) if isinstance(data, list) else (1 if data else 0)
        print(f"✓ Successfully seeded {inserted_count} default templates into database")
        return True
        
    except Exception as exc:
        print(f"⚠️  Warning: Unexpected error during template seeding: {exc}")
        return False

