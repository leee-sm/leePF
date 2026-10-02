"""Exercise packaging and deployment with Docker/SSH replaced by local stubs."""
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest


SCRIPTS = Path(__file__).resolve().parent
STUB = '''#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
name = pathlib.Path(sys.argv[0]).name
with open(os.environ["CALL_LOG"], "a") as log:
    log.write(json.dumps([name, *args]) + "\\n")
if name == "sudo":
    if args == ["-v"]:
        sys.exit(0)
    os.environ.pop("AX_BACKEND_IMAGE", None)
    os.execvp(args[0], args)
if name == "docker":
    if args[0] == "build" and os.environ.get("FAIL_BUILD") == "1":
        sys.exit(1)
    if "compose" in args and "up" in args and os.environ.get("FAIL_UP") == "1":
        sys.exit(1)
    if args[:2] == ["image", "save"]:
        pathlib.Path(args[args.index("-o") + 1]).write_bytes(os.environ.get("IMAGE_CONTENT", "fake-image").encode())
    elif args[:2] == ["ps", "-aq"] and os.environ.get("EXISTING_DB", "1") == "1":
        print("existing-postgres")
    elif args[:2] == ["ps", "-q"] and os.environ.get("EXISTING_PROXY", "0") == "1":
        print("old-proxy")
elif name == "ssh" and "mktemp" in args[-1]:
    if os.environ.get("CHECK_ASKPASS") == "1":
        assert os.environ.get("SSH_ASKPASS_REQUIRE") == "force"
        assert os.path.isfile(os.environ["SSH_ASKPASS"])
    print("/tmp/ax-distribution.mock123")
'''


class OfflineDeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        for name in ("docker", "ssh", "scp", "sudo"):
            tool = self.bin / name
            tool.write_text(STUB)
            tool.chmod(0o755)
        self.log = self.root / "calls.jsonl"
        self.config = self.root / "config.env"
        self.config.touch()
        self.env = dict(os.environ, PATH=f"{self.bin}:{os.environ['PATH']}",
                        CALL_LOG=str(self.log), OUTPUT_DIR=str(self.root / "output"),
                        PLATFORM="linux/amd64", BUILD_CA_CERT_FILE="", OFFLINE_CONFIG=str(self.config))

    def run_script(self, name, *args, success=True):
        result = subprocess.run(["bash", str(SCRIPTS / name), *map(str, args)],
                                env=self.env, text=True, capture_output=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def calls(self):
        return [call for line in self.log.read_text().splitlines()
                if (call := json.loads(line))[0] != "sudo"]

    def bundle(self):
        self.run_script("build.sh", "test-release")
        extracted = self.root / "bundle"
        extracted.mkdir()
        with tarfile.open(self.root / "output/ax-distribution-test-release.tar.gz") as archive:
            archive.extractall(extracted, filter="data")
        return extracted

    def test_bundle_excludes_secrets_and_installer_preserves_database(self):
        bundle = self.bundle()
        with tarfile.open(bundle / "source.tar.gz") as source:
            names = source.getnames()
        self.assertIn("backend/app/auth/sso.py", names)
        self.assertIn("docker/offline/install.sh", names)
        self.assertFalse(any(Path(name).name.startswith(".env") for name in names))
        self.assertFalse(any(name.endswith("deploy.conf") for name in names))
        self.assertFalse(any("node_modules" in name or ".venv" in name for name in names))
        project = self.root / "project with spaces"
        project.mkdir()
        env_file = project / ".env"
        env_file.write_text("POSTGRES_PASSWORD=private-test-value\n")
        self.log.write_text("")
        result = subprocess.run(["bash", str(bundle / "install.sh"), str(project), "docker"],
                                env=self.env, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(env_file.read_text(), "POSTGRES_PASSWORD=private-test-value\n")
        self.assertTrue((project / "current/source/backend/app/auth/sso.py").is_file())
        self.assertIn('image: "ax-distribution-dashboard:test-release"',
                      (project / "current/image.yaml").read_text())
        calls = self.calls()
        self.assertIn(["docker", "start", "existing-postgres"], calls)
        up = [call for call in calls if "up" in call]
        self.assertEqual(len(up), 1)
        self.assertIn("--no-build", up[0])
        self.assertIn("--no-deps", up[0])
        self.assertIn("never", up[0])
        self.assertEqual(up[0][-1], "backend")
        self.assertNotIn("proxy", up[0])
        self.assertFalse(any("pull" in call or "build" in call or "down" in call for call in calls))
        self.assertNotIn("private-test-value", result.stdout + result.stderr)
        self.assertIn('${HOST_BIND_ADDRESS:-127.0.0.1}:${HTTP_PORT:-8280}:8080',
                      (project / "current/source/docker/offline/compose.yaml").read_text())
        self.assertFalse(any("nginx" in name for name in names))
        if os.geteuid() != 0:
            raw_calls = [json.loads(line) for line in self.log.read_text().splitlines()]
            sudo_calls = [call for call in raw_calls if call[:2] == ["sudo", "docker"]]
            self.assertEqual(len(sudo_calls), len(calls))

    def test_checksum_failure_stops_before_docker(self):
        bundle = self.bundle()
        (bundle / "images.tar").write_bytes(b"corrupt")
        project = self.root / "project"
        project.mkdir()
        (project / ".env").touch()
        self.log.write_text("")
        result = subprocess.run(["bash", str(bundle / "install.sh"), str(project)],
                                env=self.env, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.log.read_text(), "")

    def test_missing_database_stops_without_creating_or_upgrading_database(self):
        bundle = self.bundle()
        project = self.root / "new-project"
        project.mkdir()
        (project / ".env").touch()
        self.log.write_text("")
        env = dict(self.env, EXISTING_DB="0")
        result = subprocess.run(["bash", str(bundle / "install.sh"), str(project)],
                                env=env, text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("never creates or upgrades the DB", result.stderr)
        up = [call for call in self.calls() if "up" in call]
        self.assertEqual(up, [])

    def test_failed_deployment_retains_previous_current_release(self):
        bundle = self.bundle()
        project = self.root / "project"
        project.mkdir()
        (project / ".env").touch()
        previous = project / "previous-release"
        previous.mkdir()
        (project / "current").symlink_to(previous)
        result = subprocess.run(["bash", str(bundle / "install.sh"), str(project)],
                                env=dict(self.env, FAIL_UP="1"), text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((project / "current").resolve(), previous)
        self.assertIn("database was retained", result.stderr)

    def test_existing_proxy_stops_before_backend_port_is_published(self):
        bundle = self.bundle()
        image_calls = self.calls()
        self.assertFalse(any(any("nginx:" in arg or "postgres:" in arg for arg in call) for call in image_calls))
        project = self.root / "project"
        project.mkdir()
        (project / ".env").touch()
        self.log.write_text("")
        result = subprocess.run(["bash", str(bundle / "install.sh"), str(project)],
                                env=dict(self.env, EXISTING_PROXY="1"), text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        calls = self.calls()
        stop_index = calls.index(["docker", "stop", "old-proxy"])
        up_index = next(index for index, call in enumerate(calls) if "up" in call)
        self.assertLess(stop_index, up_index)

    def test_upload_uses_jump_port_and_quotes_remote_paths(self):
        bundle = self.root / "bundle.tar.gz"
        bundle.touch()
        config = self.root / "deploy.conf"
        config.write_text("JUMP_HOST=chatbot@10.221.16.182:1022\n"
                          "TARGET_HOST=tomcat@10.21.11.30\nTARGET_PORT=22\n"
                          "DEPLOY_ROOT='/srv/project with spaces'\nCOMPOSE_PROJECT=docker\n")
        self.run_script("upload.sh", bundle, config)
        calls = self.calls()
        self.assertIn("ProxyJump=chatbot@10.221.16.182:1022", calls[1])
        self.assertIn("-t", calls[-1])
        self.assertIn("/srv/project\\ with\\ spaces", calls[-1][-1])
        self.assertIn("chatbot@10.221.16.182:1022", calls[-1])

    def test_combined_script_builds_then_uploads_bundle(self):
        config = self.root / "deploy.conf"
        config.write_text("JUMP_HOST=chatbot@10.221.16.182:1022\n"
                          "TARGET_HOST=tomcat@10.21.11.30\nTARGET_PORT=22\n"
                          "DEPLOY_ROOT=/docker_tmp/ax-dstrb-dev\nCOMPOSE_PROJECT=docker\n")
        self.run_script("deploy.sh", "combined-test", config)
        bundle = self.root / "output/ax-distribution-combined-test.tar.gz"
        self.assertTrue(bundle.is_file())
        calls = self.calls()
        build_index = next(index for index, call in enumerate(calls) if call[:2] == ["docker", "build"])
        upload_index = next(index for index, call in enumerate(calls) if call[0] == "scp")
        self.assertLess(build_index, upload_index)
        self.assertIn(str(bundle), calls[upload_index])

    def test_combined_script_stops_before_build_when_config_missing(self):
        self.run_script("deploy.sh", "no-config", self.root / "missing.conf", success=False)
        self.assertFalse(self.log.exists())

    def test_rebuild_replaces_same_bundle_using_fixed_default_tag(self):
        self.run_script("build.sh")
        self.env["IMAGE_CONTENT"] = "replacement-image"
        self.run_script("build.sh", "202610")
        bundle = self.root / "output/ax-distribution-202610.tar.gz"
        with tarfile.open(bundle) as archive:
            self.assertEqual(archive.extractfile("./images.tar").read(), b"replacement-image")
            self.assertEqual(archive.extractfile("./app-image.txt").read(), b"ax-distribution-dashboard:202610\n")

    def test_failed_rebuild_preserves_existing_bundle(self):
        self.run_script("build.sh", "202610")
        bundle = self.root / "output/ax-distribution-202610.tar.gz"
        previous = bundle.read_bytes()
        self.env["FAIL_BUILD"] = "1"
        self.run_script("build.sh", "202610", success=False)
        self.assertEqual(bundle.read_bytes(), previous)
        self.assertFalse(list(bundle.parent.glob(".ax-distribution-*")))

    def test_same_release_can_be_redeployed_and_removes_stale_source(self):
        bundle = self.bundle()
        project = self.root / "project"
        project.mkdir()
        env_file = project / ".env"
        env_file.write_text("POSTGRES_PASSWORD=keep-me\n")
        command = ["bash", str(bundle / "install.sh"), str(project)]
        first = subprocess.run(command, env=self.env, text=True, capture_output=True)
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        stale = project / "current/source/stale.txt"
        stale.touch()
        second = subprocess.run(command, env=self.env, text=True, capture_output=True)
        self.assertEqual(second.returncode, 0, second.stdout + second.stderr)
        self.assertFalse(stale.exists())
        self.assertEqual(env_file.read_text(), "POSTGRES_PASSWORD=keep-me\n")
        self.assertTrue((project / "current/source/backend/app/auth/sso.py").is_file())

    def test_build_and_upload_without_arguments_use_shared_config(self):
        self.config.write_text(f"BUILD_VERSION=config-tag\nOUTPUT_DIR='{self.root / 'configured output'}'\n"
                               "JUMP_HOST=chatbot@10.221.16.182:1022\n"
                               "TARGET_HOST=tomcat@10.21.11.30\nTARGET_PORT=22\n"
                               "DEPLOY_ROOT=/docker_tmp/ax-dstrb-dev\nCOMPOSE_PROJECT=docker\n"
                               "JUMP_PASSWORD='fake-jump-password'\nTARGET_PASSWORD='fake-target-password'\n")
        self.env["CHECK_ASKPASS"] = "1"
        self.run_script("build.sh")
        bundle = self.root / "configured output/ax-distribution-config-tag.tar.gz"
        self.assertTrue(bundle.is_file())
        result = self.run_script("upload.sh")
        scp = next(call for call in self.calls() if call[0] == "scp")
        self.assertIn(str(bundle), scp)
        for password in ["fake-jump-password", "fake-target-password"]:
            self.assertNotIn(password, self.log.read_text() + result.stdout + result.stderr)

    def test_askpass_selects_jump_and_target_password_without_shell_expansion(self):
        self.config.write_text("JUMP_HOST=chatbot@10.221.16.182:1022\nTARGET_HOST=tomcat@10.21.11.30\n"
                               "JUMP_PASSWORD='jump-$-!-`-password'\nTARGET_PASSWORD='target-$-!-`-password'\n")
        for identity, expected in [("chatbot@10.221.16.182", "jump-$-!-`-password"),
                                   ("tomcat@10.21.11.30", "target-$-!-`-password")]:
            with self.subTest(identity=identity):
                result = self.run_script("askpass.sh", f"{identity}'s password:")
                self.assertEqual(result.stdout, expected + "\n")
                self.assertEqual(result.stderr, "")

    def test_askpass_never_sends_saved_password_to_unknown_host(self):
        self.config.write_text("JUMP_HOST=chatbot@10.221.16.182:1022\nTARGET_HOST=tomcat@10.21.11.30\n"
                               "JUMP_PASSWORD='private-jump-test'\nTARGET_PASSWORD='private-target-test'\n")
        result = subprocess.run(["bash", str(SCRIPTS / "askpass.sh"), "other@unknown.example's password:"],
                                env=self.env, text=True, capture_output=True, start_new_session=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("private-jump-test", result.stdout + result.stderr)
        self.assertNotIn("private-target-test", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
