import re
from typing import Dict, List, Tuple

# CMS national peer averages: billing frequency per provider per 30 days
# Source: CMS Medicare Provider Utilization data (hardcoded for demo)
CPT_BENCHMARKS: Dict[str, dict] = {
    # Emergency Department E&M
    "99281": {"description": "ED Visit, Level 1",           "monthly_avg": 8},
    "99282": {"description": "ED Visit, Level 2",           "monthly_avg": 12},
    "99283": {"description": "ED Visit, Level 3",           "monthly_avg": 18},
    "99284": {"description": "ED Visit, Level 4",           "monthly_avg": 15},
    "99285": {"description": "ED Visit, Level 5 (highest)", "monthly_avg": 10},
    # Office E&M
    "99211": {"description": "Office Visit, Level 1", "monthly_avg": 30},
    "99212": {"description": "Office Visit, Level 2", "monthly_avg": 60},
    "99213": {"description": "Office Visit, Level 3", "monthly_avg": 80},
    "99214": {"description": "Office Visit, Level 4", "monthly_avg": 50},
    "99215": {"description": "Office Visit, Level 5", "monthly_avg": 20},
    # Hospital
    "99231": {"description": "Subsequent Hospital Care, Low",      "monthly_avg": 40},
    "99232": {"description": "Subsequent Hospital Care, Moderate", "monthly_avg": 25},
    "99233": {"description": "Subsequent Hospital Care, High",     "monthly_avg": 10},
    "99291": {"description": "Critical Care, first 30-74 min",     "monthly_avg": 5},
    # Surgery
    "27447": {"description": "Total Knee Arthroplasty",  "monthly_avg": 3},
    "27130": {"description": "Total Hip Arthroplasty",   "monthly_avg": 3},
    "43239": {"description": "EGD with Biopsy",          "monthly_avg": 10},
    # Radiology
    "70553": {"description": "MRI Brain w/ and w/o contrast",  "monthly_avg": 15},
    "72148": {"description": "MRI Lumbar Spine w/o contrast",   "monthly_avg": 20},
    "93000": {"description": "ECG with interpretation",         "monthly_avg": 60},
    # Therapy
    "97110": {"description": "Therapeutic Exercises",    "monthly_avg": 30},
    "97035": {"description": "Ultrasound Therapy",       "monthly_avg": 20},
    "90837": {"description": "Psychotherapy, 60 minutes","monthly_avg": 40},
    # Lab
    "36415": {"description": "Venipuncture",                  "monthly_avg": 100},
    "80053": {"description": "Comprehensive Metabolic Panel", "monthly_avg": 50},
}

_CPT_RE = re.compile(r'\b(?:CPT\s*:?\s*)?(\d{5})\b', re.IGNORECASE)


def extract_cpt_counts(transactions: List[dict]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for txn in transactions:
        text = " ".join(str(v) for v in txn.values())
        for match in _CPT_RE.finditer(text):
            code = match.group(1)
            if code in CPT_BENCHMARKS:
                counts[code] = counts.get(code, 0) + 1
    return counts


def build_benchmark_context(cpt_counts: Dict[str, int]) -> Tuple[str, Dict[str, dict]]:
    """
    Returns (prompt_context_string, deviation_map).
    deviation_map: cpt_code -> {cpt_code, description, provider_count, national_avg, deviation_multiplier}
    """
    if not cpt_counts:
        return "", {}

    lines = [
        "CMS PEER BENCHMARK DATA (30-day national averages per provider):",
        f"{'CPT':>6}  {'Description':<42}  {'Provider':>10}  {'Nat Avg':>9}  {'Deviation':>10}",
        "-" * 88,
    ]
    deviation_map: Dict[str, dict] = {}

    for code, count in sorted(cpt_counts.items(), key=lambda x: -x[1]):
        bench = CPT_BENCHMARKS[code]
        avg = bench["monthly_avg"]
        deviation = round(count / avg, 1) if avg > 0 else None
        deviation_map[code] = {
            "cpt_code": code,
            "description": bench["description"],
            "provider_count": count,
            "national_avg": avg,
            "deviation_multiplier": deviation,
        }
        flag = "  <- STATISTICAL OUTLIER" if deviation and deviation >= 2.0 else ""
        lines.append(
            f"{code:>6}  {bench['description']:<42}  {count:>10}  {avg:>9}  {f'{deviation}x':>10}{flag}"
        )

    return "\n".join(lines), deviation_map
