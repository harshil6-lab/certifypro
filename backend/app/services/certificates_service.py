from typing import Any, Dict, List
from ._supabase_helpers import call_rpc, select_table


def generate_certificate(template_id: str, student_id: str, issuer_id: str, payload: Dict[str, Any]) -> str:
    """Call Supabase RPC `create_certificate` to create certificate and token.

    The DB function `create_certificate` returns the new certificate uuid.
    """
    params = {
        "template_uuid": template_id,
        "student_uuid": student_id,
        "issuer_uuid": issuer_id,
        "payload": payload,
    }
    data, err = call_rpc("create_certificate", params)
    if err:
        raise RuntimeError(err)
    # RPC may return {'data': uuid} or direct value
    if isinstance(data, list) and data:
        return data[0]
    return data


def list_certificates() -> List[Dict[str, Any]]:
    data, err = select_table("certificates")
    if err:
        raise RuntimeError(err)
    return data or []
