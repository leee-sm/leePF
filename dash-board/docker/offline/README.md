# 폐쇄망 배포

인터넷 가능한 Linux/WSL PC에서 앱을 빌드하고, 백엔드 이미지와 소스를 번들로 만듭니다. Nginx·PostgreSQL 이미지는 포함하지 않고 Nginx 설정도 번들에서 제외합니다. 대상 서버는 이미지를 로드하므로 npm/pip 다운로드나 Docker 빌드가 필요 없습니다. 기존 PostgreSQL 16 컨테이너와 볼륨, 서버 `.env`를 유지합니다. 앱은 배포 중 잠깐 중단됩니다.

호스트 Nginx가 `http://127.0.0.1:8280`으로 백엔드 컨테이너에 직접 연결합니다. 서버 `.env`는 `HOST_BIND_ADDRESS=127.0.0.1`, `HTTP_PORT=8280`, `PUBLIC_BASE_URL=https://dstrb-dev.ktis.co.kr`을 유지합니다. 컨테이너의 8080 포트를 호스트 8280으로 연결하며 호스트 Nginx 설정은 변경하지 않습니다. 이전 Compose proxy 컨테이너가 실행 중이면 포트를 확보하기 위해 중지하고, 다시 생성하거나 시작하지 않습니다.

## 빌드 PC

Docker가 실행 중이어야 합니다. 기본 대상 아키텍처는 `linux/amd64`입니다. ARM 서버는 `PLATFORM=linux/arm64`를 지정합니다. 사내 CA가 필요한 빌드는 `deploy.conf`에서 `BUILD_CA_CERT_FILE=/path/to/ca.pem`을 지정합니다. 서버 `.env`는 빌드 PC에서 읽지 않습니다.

빌드·전송 설정은 로컬 `docker/offline/deploy.conf` 하나에 저장합니다. `BUILD_VERSION`으로 이미지 태그와 번들 이름을 정하고 `OUTPUT_DIR`로 출력 폴더를 지정합니다. 상대 경로는 저장소 루트를 기준으로 해석합니다. 설정 파일은 Bash 문법을 사용합니다. Git, Docker 빌드 컨텍스트, 소스 번들에서 제외합니다.

대상 서버에는 Bash, tar, sha256sum, Docker와 `up --wait`를 지원하는 Docker Compose 플러그인이 필요합니다. 대상 서버의 아키텍처는 `uname -m`으로 확인합니다. 빌드 PC에서 Docker 권한이 없으면 sudo 인증을 요청합니다.

```bash
cp docker/offline/deploy.conf.example docker/offline/deploy.conf
# 현재 설정: chatbot@10.221.16.182:1022 → tomcat@10.21.11.30:22
# 대상 프로젝트: /docker_tmp/ax-dstrb-dev
# deploy.conf의 BUILD_VERSION=202610, OUTPUT_DIR=dist-offline 사용
bash docker/offline/build.sh
bash docker/offline/upload.sh
```

빌드부터 전송·설치까지 한 번에 실행하려면 아래 명령을 사용합니다. 버전을 생략하면 `202610`을 사용합니다. 재빌드·재배포하면 같은 이름의 번들과 서버 소스를 덮어씁니다. 빌드가 실패하면 이전 번들은 유지합니다.

```bash
bash docker/offline/deploy.sh
# 또는 버전 지정
bash docker/offline/deploy.sh 202610
```

`upload.sh`는 SSH ProxyJump로 대상 서버에 직접 전송하고 설치합니다. SSH 비밀번호를 저장한 경우 로컬 설정 파일에서 읽으며 서버에는 해당 파일을 전송하지 않습니다. 서버에서는 모든 Docker 명령을 sudo로 실행하고 설치 중 sudo 비밀번호를 입력합니다(root로 실행한 경우는 제외). 여러 점프 서버는 `JUMP_HOST=user@jump1,user@jump2`로 지정할 수 있습니다. 점프 서버에서 SSH TCP forwarding을 허용해야 합니다.

SSH 비밀번호 자동 입력은 `deploy.conf`의 `JUMP_PASSWORD`, `TARGET_PASSWORD`에 값을 넣으면 활성화됩니다. 빈 값은 직접 입력합니다. OpenSSH의 `SSH_ASKPASS_REQUIRE=force`를 사용하므로 sshpass 설치는 필요하지 않습니다. 비밀번호는 명령 인자와 로그에 넣지 않습니다. 최초 호스트 키 확인과 sudo 비밀번호는 직접 입력합니다. 비밀번호는 평문으로 저장되므로 설정 파일을 공유하지 말고 `chmod 600 docker/offline/deploy.conf`를 적용합니다. 점프 서버가 여러 개면 저장한 점프 비밀번호는 첫 서버에만 자동 입력합니다.

## 수동 전송이 필요한 망

ProxyJump가 금지된 환경에서는 번들 파일 하나를 승인된 경로로 대상 서버까지 옮기고 다음을 실행합니다. 배포 파일에 소스와 업무 데이터가 들어 있으므로 접근 가능한 사람을 제한합니다.

```bash
mkdir -m 700 /tmp/ax-distribution-manual
tar -xzf ax-distribution-202610.tar.gz -C /tmp/ax-distribution-manual
bash /tmp/ax-distribution-manual/install.sh /absolute/path/to/ax-dstrb-dev docker
```

## 대상 서버 설정과 확인

`DEPLOY_ROOT/.env`는 서버에서 미리 준비합니다. 기존 서버 `.env`와 비밀번호는 전송하거나 덮어쓰지 않습니다. SSO 서버·교환 API에 대한 대상 서버의 네트워크 접근은 별도로 필요합니다.

기존 컨테이너 `docker-backend-1`은 Compose 프로젝트 이름이 `docker`입니다. 이름이 다르면 기존 프로젝트 이름으로 `COMPOSE_PROJECT`를 지정해야 기존 DB를 사용합니다. 아래 명령으로 확인합니다.

```bash
sudo docker inspect docker-backend-1 --format '{{index .Config.Labels "com.docker.compose.project"}}'
sudo docker logs -f --tail=100 docker-backend-1
```

설치 스크립트는 체크섬과 CPU 아키텍처를 확인하고 이미지 다운로드·빌드 없이 백엔드만 교체한 뒤 헬스체크를 기다립니다. 백엔드 전용 `docker/offline/compose.yaml`을 사용하고 기존 `docker_default` 네트워크에 연결합니다(프로젝트 이름을 바꾸면 해당 프로젝트의 기본 네트워크). 기존 PostgreSQL은 업그레이드하거나 다시 생성하지 않습니다. DB 컨테이너나 기존 네트워크가 없으면 배포를 중단합니다. 서버의 원래 `docker/compose.yaml`은 덮어쓰지 않습니다.

배포 소스는 `DEPLOY_ROOT/releases/202610/source`에 남고, 성공한 릴리스는 `DEPLOY_ROOT/current`가 가리킵니다. 같은 버전의 소스와 이미지 태그를 덮어쓰고 백엔드를 매번 다시 생성합니다. 서버 `.env`와 DB는 유지합니다. 자동 롤백과 이전 소스 보관은 하지 않습니다. 스크립트는 외부 Nginx 설정을 바꾸지 않습니다.
