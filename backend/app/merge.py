from .models import PRD, PRDPatch

def _append_unique(base_list: list[str], add_list: list[str]) -> list[str]:
    seen = set(base_list)
    out = list(base_list)
    for item in add_list:
        norm = item.strip()
        if norm and norm not in seen:
            out.append(norm)
            seen.add(norm)
    return out


def merge_prd(current: PRD, patch: PRDPatch) -> PRD:
    cur = current.model_dump()
    p = patch.model_dump()

    # overwrite scalar fields if patch provides non-null values
    for k in ["title", "problem", "proposed_solution", "status"]:
        if p.get(k) is not None:
            cur[k] = p[k]

    # append-unique for list fields
    list_fields = [
        "requirements",
        "success_metrics",
        "open_questions",
    ]
    for k in list_fields:
        if p.get(k):
            cur[k] = _append_unique(cur.get(k, []), p[k])

    return PRD(**cur)