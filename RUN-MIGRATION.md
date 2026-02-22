# Chạy migration trên server

File SQL **không** chạy bằng `./migrate-info-fields.sql`. Dùng một trong hai cách sau.

## Cách 1: Docker (Postgres trong docker-compose)

```bash
cd ~/code/admin-service
cat migrate-info-fields.sql | docker exec -i heritage_db psql -U heritage_user -d heritage_db
```

Hoặc (PowerShell trên Windows):

```powershell
Get-Content migrate-info-fields.sql | docker exec -i heritage_db psql -U heritage_user -d heritage_db
```

## Cách 2: PostgreSQL cài trực tiếp trên máy

```bash
psql -U heritage_user -d heritage_db -f migrate-info-fields.sql
```

(Điều chỉnh user/database nếu bạn dùng tên khác trong .env)

---

## Rebuild backend (rebuild.be.sh)

Nếu gặp lỗi "cannot execute: required file not found", file có thể đang dùng line ending Windows. Sửa:

```bash
sed -i 's/\r$//' rebuild.be.sh
chmod +x rebuild.be.sh
./rebuild.be.sh
```

Hoặc chạy trực tiếp:

```bash
docker compose up --build --force-recreate --detach api
```
