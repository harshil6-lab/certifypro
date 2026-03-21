"""Enhanced template gallery seeding system for CertifyPro.

Generates 60 official certificate templates (10 per category, 6 categories)
with unique design variants, proper category filtering, and duplicate protection.

Categories (exactly 10 templates each):
- Academic
- Corporate
- Internship
- Event
- Compliance
- Training

Design Styles (unique per template):
1. Classic (navy background)
2. Modern (slate background)
3. Minimal (white background)
4. Bordered (gray background)
5. Gradient (indigo background)
6. Signature Heavy (amber background)
7. Left Aligned (teal background)
8. Centered (cyan background)
9. Gold Accent (yellow background)
10. Dark Theme (black background)

Each template includes unique preview images and properly formatted slugs.
Templates marked as is_official=true for landing page read-only display.
"""

from typing import List, Dict, Any
from ._supabase_helpers import select_table, insert_table


# Style definitions with colors and descriptions
DESIGN_STYLES = [
    {"name": "classic", "color": "000080", "display": "Classic"},         # navy
    {"name": "modern", "color": "708090", "display": "Modern"},           # slate
    {"name": "minimal", "color": "ffffff", "display": "Minimal"},         # white
    {"name": "bordered", "color": "808080", "display": "Bordered"},       # gray
    {"name": "gradient", "color": "4B0082", "display": "Gradient"},       # indigo
    {"name": "signature-heavy", "color": "FFBF00", "display": "Signature Heavy"},  # amber
    {"name": "left-aligned", "color": "008080", "display": "Left Aligned"},  # teal
    {"name": "centered", "color": "00FFFF", "display": "Centered"},       # cyan
    {"name": "gold-accent", "color": "FFFF00", "display": "Gold Accent"}, # yellow
    {"name": "dark-theme", "color": "000000", "display": "Dark Theme"},   # black
]

# Categories with proper capitalization (MUST match database filtering)
CATEGORIES = [
    "Academic",
    "Corporate",
    "Internship",
    "Event",
    "Compliance",
    "Training",
]


def generate_template_batch() -> List[Dict[str, Any]]:
    """Generate complete batch of 60 official CertifyPro templates.
    
    Creates 10 unique templates per category with:
    - Design style variants
    - Unique slugs
    - Distinct preview images
    - Consistent metadata
    - Official status marking
    
    Returns:
        List of 60 template dictionaries ready for database insertion
    """
    templates = []
    
    # Standard editable fields for all certificates
    editable_fields = {
        "name": True,
        "course": True,
        "date": True,
        "certificate_id": True,
        "qr_code": True,
        "issuer_signature": True,
    }
    
    # Generate templates for each category
    for category in CATEGORIES:
        category_lower = category.lower()
        
        # Generate 10 templates per category (one for each design style)
        for style_def in DESIGN_STYLES:
            style_name = style_def["name"]
            style_display = style_def["display"]
            color = style_def["color"]
            
            # Create unique slug: {category-lowercase}-{style}
            slug = f"{category_lower}-{style_name}"
            
            # Create descriptive title
            title = f"{category} {style_display}"
            
            # Build unique preview image URL
            image_url = (
                f"https://dummyimage.com/600x400/{color}/ffffff"
                f"?text={category}+{style_display.replace(' ', '+')}"
            )
            
            # Create category-specific description
            description = (
                f"{title} certificate template. "
                f"Professional design with {style_name} styling. "
                f"Suitable for recognizing {category_lower} achievements and credentials. "
                f"Includes QR code verification, digital signatures, and customizable fields."
            )
            
            template = {
                "title": title,
                "slug": slug,
                "category": category,  # Use proper capitalization
                "description": description,
                "image_url": image_url,
                "style_type": style_name,  # Store style for filtering/customization
                "is_official": True,
                "editable_fields": editable_fields,
            }
            
            templates.append(template)
    
    return templates


def get_existing_slugs() -> set:
    """Fetch all existing template slugs from database.
    
    Returns:
        Set of existing slugs for duplicate detection
    """
    try:
        existing_templates, err = select_table("templates", "slug")
        if err:
            print(f"⚠️  Warning: Failed to fetch existing slugs: {err}")
            return set()
        
        slugs = set()
        if existing_templates:
            slugs = {t.get("slug") for t in existing_templates if t.get("slug")}
        
        return slugs
    except Exception as exc:
        print(f"⚠️  Warning: Error fetching existing slugs: {exc}")
        return set()


def count_category_templates(category: str, existing_slugs: set) -> int:
    """Count how many templates exist for a given category.
    
    Args:
        category: Category name (e.g., "Academic")
        existing_slugs: Set of existing slugs in database
    
    Returns:
        Count of existing templates for this category
    """
    category_lower = category.lower()
    count = sum(
        1 for slug in existing_slugs
        if slug.startswith(f"{category_lower}-")
    )
    return count


def seed_gallery_templates() -> bool:
    """Seed 60 official templates (10 per category) with duplicate protection.
    
    Flow:
    1. Fetch existing template slugs (duplicate protection)
    2. Generate batch of 60 template definitions
    3. Filter out duplicates by slug
    4. For each category: check existing count
    5. Only insert templates that don't already exist
    6. Bulk insert all new templates
    7. Log progress per category
    
    Returns:
        True if seeding succeeded or already complete, False on error
    """
    try:
        print("\n📚 Gallery Template Seeding")
        print("=" * 70)
        
        # Fetch existing slugs for duplicate protection
        existing_slugs = get_existing_slugs()
        print(f"📋 Found {len(existing_slugs)} existing templates")
        
        # Generate complete template batch
        all_templates = generate_template_batch()
        print(f"🔧 Generated {len(all_templates)} template definitions (10 per category)")
        
        # Track new templates to insert
        new_templates = []
        
        # Check each category and log status
        print("\n📊 Category Status:")
        print("-" * 70)
        
        for category in CATEGORIES:
            existing_count = count_category_templates(category, existing_slugs)
            
            if existing_count >= 10:
                print(f"✓ {category:15s} - Already complete ({existing_count}/10)")
                continue
            
            # Find templates for this category that need inserting
            category_templates = [
                t for t in all_templates
                if t.get("category") == category and t.get("slug") not in existing_slugs
            ]
            
            if category_templates:
                new_templates.extend(category_templates)
                final_count = existing_count + len(category_templates)
                print(f"🔄 {category:15s} - Inserting {len(category_templates)} templates "
                      f"({existing_count}/10 → {final_count}/10)")
            else:
                print(f"✓ {category:15s} - Already complete ({existing_count}/10)")
        
        print("-" * 70)
        
        # If all categories are complete, exit
        if not new_templates:
            total_count = len(existing_slugs)
            print(f"\n✅ Gallery already fully populated ({total_count} templates)")
            print("=" * 70)
            return True
        
        # Bulk insert all new templates
        print(f"\n💾 Bulk inserting {len(new_templates)} new templates...")
        inserted_data, err = insert_table("templates", new_templates)
        
        if err:
            print(f"❌ Failed to insert templates: {err}")
            print("=" * 70)
            return False
        
        # Count successfully inserted
        inserted_count = 0
        if isinstance(inserted_data, list):
            inserted_count = len(inserted_data)
        elif inserted_data:
            inserted_count = 1
        
        # Final summary
        print(f"\n✅ Successfully inserted {inserted_count} templates")
        print(f"📊 Gallery Status After Seeding:")
        print("-" * 70)
        
        # Recalculate counts after insertion
        new_existing_slugs = existing_slugs.copy()
        if isinstance(inserted_data, list):
            for item in inserted_data:
                if isinstance(item, dict) and "slug" in item:
                    new_existing_slugs.add(item["slug"])
        
        for category in CATEGORIES:
            final_count = count_category_templates(category, new_existing_slugs)
            status = "✓" if final_count == 10 else "⚠️"
            print(f"{status} {category:15s} - {final_count}/10 templates")
        
        print("-" * 70)
        total_final = len(new_existing_slugs)
        print(f"\n🎉 Total official templates: {total_final}")
        print("=" * 70)
        
        return True
        
    except Exception as exc:
        print(f"❌ Unexpected error during gallery seeding: {exc}")
        print("=" * 70)
        return False
