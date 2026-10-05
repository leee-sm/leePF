# leePF public media projects

Running / Baby 공개 정보 서비스를 포함한 루트 Docker 구성입니다.

## 실행

```bash
cp .env.example .env
docker compose --env-file .env up --build -d
```

접속 주소:

- Baby Benefits: http://baby.localhost
- Run Weather Media: http://running.localhost
- AX Distribution Dashboard: http://dash-board.localhost

Windows에서 `*.localhost` 이름이 해석되지 않으면 관리자 PowerShell에서 한 번 실행합니다:

```powershell
Add-Content -LiteralPath "$env:SystemRoot\System32\drivers\etc\hosts" -Value "`n# leePF local docker projects`n127.0.0.1 baby.localhost`n127.0.0.1 running.localhost`n127.0.0.1 dash-board.localhost dashboard.localhost" -Encoding ASCII
```

관리자 권한 없이 바로 쓸 수 있는 경로:

- Baby Benefits: http://localhost/baby/
- Run Weather Media: http://localhost/running/
- AX Distribution Dashboard: http://localhost/dash-board/

직접 포트 접속도 유지됩니다:

- Baby Benefits: http://localhost:8081
- Run Weather Media: http://localhost:3000
- AX Distribution Dashboard: http://localhost:8080
