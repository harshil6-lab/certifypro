"""Template gallery seeding system for CertifyPro.

This module generates and seeds 60 official certificate templates (10 per category)
into the templates table on first startup. Implements duplicate protection and
efficient bulk insert.

Categories (10 templates each):
- Academic
- Corporate
- Internship
- Event
- Compliance
- Training

Each template is marked as is_official=true for read-only display on landing page.
Dashboard users can create workspace-editable copies (is_official=false) as needed.
"""

from typing import List, Dict, Any
from ._supabase_helpers import select_where, insert_table


# Color mapping for placeholder images
CATEGORY_COLORS = {
    "academic": "0066cc",          # blue
    "corporate": "333333",         # dark gray
    "internship": "ff9900",        # orange
    "event": "9933cc",             # purple
    "compliance": "009900",        # green
    "training": "00cccc",          # teal
}

# Template categories and display names
CATEGORIES = [
    "academic",
    "corporate",
    "internship",
    "event",
    "compliance",
    "training",
]


def generate_template_batch() -> List[Dict[str, Any]]:
    """Generate complete batch of 60 official CertifyPro templates.
    
    Creates 10 templates per category with:
    - Unique slug validation
    - Consistent metadata
    - Official status marking
    - Placeholder images
    - Editable field specifications
    
    Returns:
        List of 60 template dictionaries ready for database insertion
    """
    templates = []
    
    editable_fields = {
        "name": True,
        "course": True,
        "date": True,
        "certificate_id": True,
        "qr_code": True,
        "issuer_signature": True,
    }
    
    for category in CATEGORIES:
        color = CATEGORY_COLORS.get(category, "0066cc")
        category_display = category.title()
        
        for i in range(1, 11):  # 10 templates per category
            title = f"{category_display} Certificate {i}"
            slug = f"{category}-certificate-{i}"
            
            # Build placeholder image URL
            image_url = f"https://dummyimage.com/600x400/{color}/ffffff?text={title.replace(' ', '+')}"
            
            description = (
                f"Professional {category_display.lower()} certificate template {i}. "
                f"Suitable for recognition, achievement, and credential validation. "
                f"Includes QR code verification and digital signatures."
            )
            
            template = {
                "title": title,
                "slug": slug,
                "category": category,
                "description": description,
                "image_url": image_url,
                "style_type": "certifypro-official",
                "is_official": True,
                "editable_fields": editable_fields,
            }
            
            templates.append(template)
    
    return templates


def seed_gallery_templates() -> bool:
    """Seed 60 official templates if gallery is not yet populated.
    
    Flow:
    1. Check count of official templates (is_official=true)
    2. If count >= 60, exit safely (already seeded)
    3. Generate batch of 60 templates
    4. Check each slug for existence (duplicate protection)
    5. Filter out any duplicates
    6. Bulk insert remaining templates
    7. Log results clearly
    
    Returns:
        True if seeding succeeded or already populated, False on error
    """
    try:
        print("\n📚 Checking gallery templates...")
        print("=" * 60)
        
        # Check existing official templates
        existing_templates, err = select_where(
            "templates",
            {"is_official": True},
            "id,slug"
        )
        
        if err:
            print(f"⚠️  Warning: Failed to check existing templates: {err}")
            return False
        
        existing_count = len(existing_templates) if existing_templates else 0
        
        if existing_count >= 60:
            print(f"✓ Gallery already populated ({existing_count} official templates)")
            print("=" * 60)
            return True
        
        # Generate complete template batch
        templates_to_insert = generate_template_batch()
        print(f"📋 Generated {len(templates_to_insert)} template definitions")
        
        # Get existing slugs for duplicate check
        existing_slugs = set()
        if existing_templates:
            existing_slugs = {t.get("slug") for t in existing_templates if t.get("slug")}
        
        # Filter out duplicates
        new_templates = [
            t for t in templates_to_insert
            if t.get("slug") not in existing_slugs
        ]
        
        if not new_templates:
            print(f"✓ All templates already exist (duplicate check returned 0 new)")
            print("=" * 60)
            return True
        
        print(f"🔍 Found {len(new_templates)} new templates to insert")
        print(f"   (Skipped {len(templates_to_insert) - len(new_templates)} duplicates)")
        
        # Bulk insert all new templates
        inserted_data, err = insert_table("templates", new_templates)
        
        if err:
            print(f"❌ Failed to insert templates: {err}")
            print("=" * 60)
            return False
        
        # Count successfully inserted
        inserted_count = 0
        if isinstance(inserted_data, list):
            inserted_count = len(inserted_data)
        elif inserted_data:
            inserted_count = 1
        
        print(f"✅ Successfully inserted {inserted_count} templates")
        print(f"   Total official templates now: {existing_count + inserted_count}")
        
        # Summary by category
        print("\n📊 Template inventory by category:")
        for category in CATEGORIES:
            category_count = sum(
                1 for t in new_templates if t.get("category") == category
            )
            print(f"   • {category.title()}: {category_count}")
        
        print("=" * 60)
        return True
        
    except Exception as exc:
        print(f"❌ Unexpected error during gallery seeding: {exc}")
        print("=" * 60)
        return False
