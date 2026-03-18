from typing import Any, Dict, List
from ._supabase_helpers import insert_table, select_table
import csv
import io


def list_students() -> List[Dict[str, Any]]:
    data, err = select_table("students")
    if err:
        raise RuntimeError(err)
    return data or []


def insert_students_bulk(students: List[Dict[str, Any]]):
    # Use the insert_table helper which uses supabase.insert
    data, err = insert_table("students", students)
    if err:
        raise RuntimeError(err)
    return data


def parse_students_csv(content: bytes):
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for r in reader:
        rows.append({
            "email": r.get("email") or r.get("Email") or None,
            "full_name": r.get("full_name") or r.get("name") or r.get("Name") or None,
            "external_id": r.get("id") or r.get("external_id") or None,
            "metadata": {},
        })
    return rows
