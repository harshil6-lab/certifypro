from ._supabase_helpers import call_rpc


def verify_by_token(token: str):
    """Call DB function `verify_certificate_by_token` and return result JSONB."""
    data, err = call_rpc("verify_certificate_by_token", {"token_text": token})
    if err:
        raise RuntimeError(err)
    return data
