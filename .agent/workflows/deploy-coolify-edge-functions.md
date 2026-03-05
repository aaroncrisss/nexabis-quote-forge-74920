---
description: How to deploy Supabase Edge Functions to a self-hosted Coolify instance
---

# Deploy Supabase Edge Functions (Coolify Self-Hosted)

Because this Supabase instance is self-hosted with Coolify, the standard `supabase functions deploy` CLI command will fail with authorization or Docker socket errors. Instead, we use a custom script to securely copy the function files to the VPS and restart the edge-functions container.

## 1. Deploy the Function Code

Run the `deploy.ps1` powershell script located in the project root. It takes the function name and the Coolify container ID.

**Command:**
```powershell
.\deploy.ps1 <function_name> <container_id>
```

**Example:**
```powershell
// turbo
.\deploy.ps1 mp-create-payment sggkw8kowco048ksgocgsc8g
```

## 2. Recreate the Docker Container (When Needed)

If the edge function is completely failing to load or caching old dependencies, it is recommended to force the edge-functions container to recreate itself from scratch via the `docker compose` definition in Coolify.

**Command:**
```powershell
// turbo
ssh root@31.97.163.113 "cd /data/coolify/services/<container_id> && docker compose up -d supabase-edge-functions && echo 'RECREADO OK'"
```

**Example:**
```powershell
ssh root@31.97.163.113 "cd /data/coolify/services/sggkw8kowco048ksgocgsc8g && docker compose up -d supabase-edge-functions && echo 'RECREADO OK'"
```

## Troubleshooting

-   **Check container logs:** `ssh root@31.97.163.113 "docker logs -f supabase-edge-functions-<container_id>"`
-   **Verify files on VPS:** `ssh root@31.97.163.113 "docker exec supabase-edge-functions-<container_id> ls -laR /home/deno/functions/"`
