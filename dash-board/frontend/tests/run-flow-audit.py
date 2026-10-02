"""Run the audit on a disposable local DB; preserve evidence, remove services.

From the repository root:
  python3 frontend/tests/run-flow-audit.py --output /tmp/ax-audit-results

Install locked npm dependencies and Playwright Chromium first. Browser location
and shared libraries may be supplied through PLAYWRIGHT_BROWSERS_PATH and
LD_LIBRARY_PATH. Known product defects intentionally produce a nonzero exit.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    frontend = root / "frontend"
    backend = root / "backend"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("/tmp/ax-audit-results"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    python = backend / ".venv/bin/python"
    playwright = frontend / "node_modules/.bin/playwright"
    if not python.exists() or not playwright.exists():
        parser.error("Install backend and locked frontend dependencies first.")
    exits: dict[str, int] = {}
    commands: list[dict[str, object]] = []

    def run(name: str, command: list[str], cwd: Path, env: dict[str, str]) -> None:
        commands.append({"name": name, "command": command, "cwd": str(cwd)})
        with (output / f"{name}.log").open("w", encoding="utf-8") as log:
            exits[name] = subprocess.run(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
        print(f"{name}: exit {exits[name]}", flush=True)

    with tempfile.TemporaryDirectory(prefix="ax-flow-audit-", dir="/tmp") as temporary:
        db_path = Path(temporary) / "audit.db"
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        base_url = f"http://127.0.0.1:{port}"
        env = {
            **os.environ,
            "APP_ENVIRONMENT": "development",
            "SSO_ENABLED": "false",
            "DEV_AUTO_LOGIN": "true",
            "DEV_AUTO_LOGIN_SABUN": "2210013",
            "DEV_AUTO_LOGIN_USER_SABUN": "2210014",
            "SSO_BOOTSTRAP_ADMIN_SABUN": "2210013",
            "SESSION_COOKIE_SECURE": "false",
            "ALLOWED_HOSTS": "localhost,127.0.0.1",
            "DATABASE_URL": f"sqlite:///{db_path}",
            "PUBLIC_BASE_URL": base_url,
            "AUDIT_ISOLATED": "1",
            "AUDIT_DB_PATH": str(db_path),
            "PLAYWRIGHT_BASE_URL": base_url,
            "AUDIT_OUTPUT_ROOT": str(output),
        }
        run("backend-tests", [str(python), "-m", "unittest", "discover", "-s", "tests", "-v"], backend, {**env, "PUBLIC_BASE_URL": "http://localhost"})
        run("frontend-build", ["npm", "run", "build"], frontend, env)
        if exits["frontend-build"]:
            (output / "run-summary.json").write_text(json.dumps({"exits": exits, "commands": commands}, ensure_ascii=False, indent=2), encoding="utf-8")
            return 1
        with (output / "server.log").open("w", encoding="utf-8") as log:
            server = subprocess.Popen([str(python), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port), "--no-access-log"], cwd=backend, env=env, stdout=log, stderr=subprocess.STDOUT)
            try:
                ready = False
                # Importing the backend from a mounted filesystem can be slow.
                # Local readiness must also bypass any inherited HTTP proxy.
                opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
                deadline = time.monotonic() + 60
                while time.monotonic() < deadline:
                    if server.poll() is not None:
                        raise RuntimeError("Temporary server stopped; inspect server.log")
                    try:
                        with opener.open(base_url + "/api/runtime", timeout=1) as response:
                            runtime = json.load(response)
                        if runtime != {"development_login_enabled": True, "sso_enabled": False}:
                            raise RuntimeError("Unexpected temporary service runtime")
                        ready = True
                        break
                    except (urllib.error.URLError, TimeoutError):
                        time.sleep(0.1)
                if not ready:
                    raise RuntimeError("Temporary server did not become ready")
                command = [str(playwright), "test", "--config=playwright.audit.config.ts"]
                run("baseline", [*command, "dashboard-admin.spec.ts", "dashboard-navigation.spec.ts", "dashboard-query.spec.ts", "dashboard-responsive.spec.ts"], frontend, {**env, "AUDIT_PHASE": "baseline"})
                run("extended", [*command, "dashboard-flow-audit.spec.ts"], frontend, {**env, "AUDIT_PHASE": "extended"})
            finally:
                server.terminate()
                try:
                    server.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait()
        summary = {"exits": exits, "commands": commands, "server_stopped": server.poll() is not None, "temporary_db_removed_on_exit": True, "actual_sso": "not tested", "database_engine": "SQLite"}
        (output / "run-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Evidence: {output}", flush=True)
    return int(any(exits.values()))


if __name__ == "__main__":
    raise SystemExit(main())
