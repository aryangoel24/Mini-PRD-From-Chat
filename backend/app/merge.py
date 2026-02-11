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
    p = patch.model_dump(exclude_unset=True)

    for k in ["title", "problem", "proposed_solution", "status"]:
        if k in p and p[k] is not None:
            cur[k] = p[k]

    # overwrite snapshot lists when present
    for k in ["requirements", "success_metrics"]:
        if k in p and p[k] is not None:
            cur[k] = [s.strip() for s in p[k] if s and s.strip()]

    # append backlog list when present
    if "open_questions" in p and p["open_questions"]:
        cur["open_questions"] = _append_unique(cur.get("open_questions", []), p["open_questions"])

    return PRD(**cur)