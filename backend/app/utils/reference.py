"""Human-friendly reference / ticket number generators."""
import random
import string


def generate_reference(prefix: str = "TMP") -> str:
    """e.g. TMP-8F2K9Q31 — short, unique enough with a DB uniqueness check on insert."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=8))
    return f"{prefix}-{suffix}"


def generate_ticket_number() -> str:
    return generate_reference("TCK")


def generate_policy_number() -> str:
    return generate_reference("INS")
