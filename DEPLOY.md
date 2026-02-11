# Deploying SwanyThree services (guide)

This document shows how to publish Docker images to GitHub Container Registry (GHCR) using the included GitHub Actions workflow, and how to deploy the images to a remote server running Docker Compose.

1) Build & push images (GitHub Actions)

- The workflow `.github/workflows/publish-and-push-images.yml` runs on `push` to `main` or via `workflow_dispatch`.
- It builds and pushes images to `ghcr.io/${{ github.repository_owner }}` with tags `:latest` and `:<sha>`.

If you want to run it manually, go to the repository Actions tab and run the `Publish and Push Docker images` workflow.

1) Prepare remote server

- Ensure Docker Engine is installed and running on your remote server.
- Log in to GHCR on the server (use a PAT with `read:packages` if required):

```bash
echo $CR_PAT | docker login ghcr.io -u <github-username> --password-stdin
```

1) Example `docker-compose.deploy.yml`

Create a compose file on the remote host that references the pushed images instead of building locally. Example:

```yaml
version: '3.8'
services:
  api:
    image: ghcr.io/<owner>/swanythree-api:latest
    env_file: .env
    ports:
      - "4000:4000"
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: swanythree
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "yourpassword"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx-rtmp:
    image: ghcr.io/<owner>/swanythree-nginx-rtmp:latest
    ports:
      - "1935:1935"
      - "8080:8080"

  avatar-controller:
    image: ghcr.io/<owner>/swanythree-avatar:latest
    ports:
      - "8011:8011"

volumes:
  postgres_data:
  redis_data:
```

1) Deploy on server

```bash
# pull images
docker-compose -f docker-compose.deploy.yml pull
# bring up
docker-compose -f docker-compose.deploy.yml up -d
```

1) Notes

- If you use GHCR private packages, ensure the server `docker login` is configured with a token that can read packages.
- The workflow uses `GITHUB_TOKEN` by default which can push packages when `packages: write` permission is available to the workflow. If you encounter permission errors, create a Personal Access Token and store it in `secrets.GHCR_PAT` and update the workflow to use that secret.

If you want, I can:

- Update the `docker-compose.yml` to reference published images (for prod compose).
- Create a second workflow that SSHes to your server and runs `docker-compose pull && docker-compose up -d` (requires server SSH secrets).
