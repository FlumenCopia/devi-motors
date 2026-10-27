# DEVI MOTORS — Database Backup, Restore & First-Admin Operations

This guide provides operational instructions for database management, backup routines, first-admin creation, and production deployments.

---

## 1. Initial Admin Creation

The system includes two methods for first-admin creation:

### Method A: Automated CLI Seed (Recommended)
```bash
npm run seed
```
This initializes:
- Email: `admin@devimotors.in`
- Password: `admin123`
- Role: `super_admin`

### Method B: One-time API Setup Endpoint
If the database has zero users, the setup endpoint is open for one-time initialization:
```bash
curl -X POST http://localhost:5000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin", "email": "admin@devimotors.in", "password": "YourStrongPassword"}'
```
Once any user exists in the database, this endpoint permanently returns `400 Bad Request`.

---

## 2. MongoDB Backup Procedure (`mongodump`)

To create a point-in-time snapshot of the database:

```bash
# Windows PowerShell / CMD
mongodump --db=devi_motors --out="C:\backups\devi_motors_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### Automated Nightly Backup Script (PowerShell)
Save as `backup.ps1` and run via Windows Task Scheduler:
```powershell
$backupDir = "C:\backups\devi_motors"
$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = "$backupDir\backup_$dateStr"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force }

mongodump --db=devi_motors --out=$dest

# Retain last 30 days of backups
Get-ChildItem -Path $backupDir | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force
```

---

## 3. Database Restoration Procedure (`mongorestore`)

To restore from a backup directory:
```bash
mongorestore --db=devi_motors --drop "C:\backups\devi_motors\backup_YYYYMMDD_HHMMSS\devi_motors"
```
*(The `--drop` flag safely removes existing collections before restoring the snapshot).*
