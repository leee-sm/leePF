"""Read-only sample-data profiler and response fingerprints for refactoring."""
import cProfile
import hashlib
import io
import json
import os
import pstats
import time
from pathlib import Path
from unittest.mock import patch

from app.dashboard import inventory
from app.dashboard.schemas import DashboardConfig

config = DashboardConfig.model_validate(inventory.inventory_template())
samples = []
for _ in range(5):
    with patch.object(inventory, "load_rows", wraps=inventory.load_rows) as reads:
        started = time.perf_counter()
        inventory.query_widgets(config, {})
        samples.append({"elapsed_ms": (time.perf_counter() - started) * 1000, "snapshot_loads": reads.call_count})

fingerprints = {}
for name, filters in {
    "all": {},
    "manufacturer": {"manufacturer": ["삼성전자(주)"]},
    "model": {"model": ["SM-A175NK"]},
    "combined": {"manufacturer": ["삼성전자(주)"], "model": ["SM-A175NK"]},
    "zero": {"manufacturer": ["삼성전자(주)"], "model": ["Z2339K"]},
    "empty": {"as_of_date": "2026-09-08"},
}.items():
    for sort in ("value_desc", "value_asc", "label_asc"):
        widgets, meta = inventory.query_widgets(config, filters, {"w_table": {"page": 2, "sort": sort}})
        meta.pop("fetched_at")
        canonical = json.dumps({"widgets": widgets, "meta": meta}, ensure_ascii=False, sort_keys=True)
        fingerprints[f"{name}/{sort}"] = hashlib.sha256(canonical.encode()).hexdigest()

profiler = cProfile.Profile()
profiler.runcall(inventory.query_widgets, config, {})
stream = io.StringIO()
pstats.Stats(profiler, stream=stream).sort_stats("cumulative").print_stats(15)
result = {"samples": samples, "median_ms": sorted(sample["elapsed_ms"] for sample in samples)[2], "fingerprints": fingerprints, "profile": stream.getvalue()}
output = Path(os.environ.get("PERF_OUTPUT", "/tmp/hotspots/backend.json"))
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"median_ms": result["median_ms"], "snapshot_loads": samples[0]["snapshot_loads"], "fingerprints": len(fingerprints)}))
print(result["profile"])
