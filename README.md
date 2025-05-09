# ywl-stuff
Notes For Internship

## Getting Mac and IP

sven@sventan:~$ ip a

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: enp4s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 30:5a:3a:08:d9:36 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.26/24 brd 192.168.1.255 scope global noprefixroute enp4s0
       valid_lft forever preferred_lft forever
    inet6 fe80::325a:3aff:fe08:d936/64 scope link 
       valid_lft forever preferred_lft forever
3: virbr0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default qlen 1000
    link/ether 52:54:00:85:b5:c8 brd ff:ff:ff:ff:ff:ff
    inet 192.168.122.1/24 brd 192.168.122.255 scope global virbr0
       valid_lft forever preferred_lft forever

## Editing network Config

sven@sventan:~$ sudo nvim /etc/netplan/50-cloud-init.yaml

network:
  ethernets:
    enp4s0:
      addresses:
      - 192.168.1.26/24
      nameservers:
        addresses:
        - 192.168.1.253
        search:
        - 192.168.1.253
      routes:
      - to: default
        via: 192.168.1.253
  version: 2

sudo netplan apply

- Checking for SSH
- nmap localhost -p 22

- Installing VSC
- sudo snap install code --classic

- Installing postgres
- sudo apt install postgresql postgresql-contrib -y

- Logs for putty
- sudo journalctl -u xrdp -f

- installing nextjs
- pnpm dlx shadcn@latest init



Using smb windows share

~/.pgpass
192.168.1.26:5432:logs_database:admin:host-machine

sven@sventan:~$ sudo PGPASSFILE=~/.pgpass pg_dump -h 192.168.1.26 -U admin -d logs_database -F c -b -v -f "/mnt/nas/sven.tan/MyDocs/new.sql"


sudo nano /usr/local/bin/db_backup.sh
#!/bin/bash
export PGPASSFILE=/home/sven/.pgpass
sudo /usr/bin/pg_dump -h 192.168.1.26 -U admin -d logs_database -F c -b -v -f "/mnt/nas/sven.tan/MyDocs/backup-$(date +'%Y-%m-%d_%H-%M-%S').sql"
sudo chmod +x /usr/local/bin/db_backup.sh


todo: change all prisma to db.



#!/bin/bash

SCRIPT_URL="http://192.168.1.102:3000/latest_script.sh"  # Update with actual URL
INSTALL_PATH="/usr/local/bin/install.sh"
CRON_JOB="*/10 * * * * root /bin/bash $INSTALL_PATH"  # Runs every 10 minutes

# Download the script
echo "[INFO] Downloading the latest script..."
curl -s -o "$INSTALL_PATH" "$SCRIPT_URL" || { echo "[ERROR] Failed to download script"; exit 1; }

# Make it executable
chmod +x "$INSTALL_PATH"

# Add cron job (if not already present)
if ! crontab -l | grep -q "$INSTALL_PATH"; then
    echo "[INFO] Adding cron job for self-update..."
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
fi

echo "[SUCCESS] Installation complete!"


bash install.sh


FOr logout /etc/gdm3/PostSession/Default

#!/bin/bash

SCRIPT_URL="http://192.168.1.26:3000/latest_script.sh"
INSTALL_PATH="/usr/local/bin/install.sh"

# Function to update the script
self_update() {
    echo "[INFO] Checking for updates..."
    TMP_PATH="/tmp/install_new.sh"

    # Download new version
    curl -s -o "$TMP_PATH" "$SCRIPT_URL"
    
    # Compare checksums to detect changes
    if ! cmp -s "$INSTALL_PATH" "$TMP_PATH"; then
        echo "[INFO] New version detected. Updating..."
        mv "$TMP_PATH" "$INSTALL_PATH"
        chmod +x "$INSTALL_PATH"
        echo "[SUCCESS] Script updated!"
        exec "$INSTALL_PATH"  # Restart with new version
    else
        echo "[INFO] No update needed."
        rm "$TMP_PATH"
    fi
}

# Run self-update before executing main tasks
self_update

# ✅ Run your main script logic here
echo "[INFO] Running main script tasks..."


curl -o ~/Desktop/script.sh http://192.168.1.102:3000/script.sh


sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo -i -u postgres
psql

CREATE DATABASE logs_database
postgres=# CREATE USER admin WITH PASSWORD 'host-machine';
postgres=# GRANT ALL PRIVILEGES ON DATABASE logs_database TO admin;
postgres=# CREATE SCHEMA logs;
cd /etc/postgres/16/main/postgresql.conf
listen_addresses = '*'

cd /etc/postgres/16/main/pg_hba.conf


Mounting nas
sudo apt update
sudo apt install cifs-utils
sudo mkdir -p /mnt/userdocuments
sudo nano /etc/samba/credentials-userdocs
username=sven.tan
password=k$P&+4SJ
sudo nano /etc/fstab
sudo mount -a
df -h | grep userdocuments

# Mount NAS share
//192.168.1.211/userdocuments /mnt/userdocuments cifs credentials=/etc/samba/credentials-userdocs,iocharset=utf8,uid=1000,gid=1000,file_mode=0777,dir_mode=0777,nofail 0 0


ALTER DATABASE logs_database OWNER TO admin;
PGPASSFILE=~/.pgpass dropdb -h 192.168.1.26 -U admin logs_database

createdb -h 192.168.1.26 -U postgres logs_database
pg_restore -h 192.168.1.26 -U postgres -d logs_database /path/to/backup-file.sql


file /mnt/userdocuments/sven.tan/MyDocs/backup-*.sql


model Suggestion {
  id           String      @id @default(cuid())
  title        String
  content      String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  author       user        @relation(fields: [authorId], references: [id])
  authorId     String
  isUseful     Boolean     @default(false) // Marked by admin
  votes        SuggestionVote[]
  comments     SuggestionComment[]
}

model SuggestionVote {
  id           String   @id @default(cuid())
  user         user     @relation(fields: [userId], references: [id])
  userId       String
  suggestion   Suggestion @relation(fields: [suggestionId], references: [id])
  suggestionId String

  createdAt    DateTime @default(now())

  @@unique([userId, suggestionId]) // Prevent multiple votes by same user
}


model SuggestionComment {
  id           String      @id @default(cuid())
  content      String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  author       user        @relation(fields: [authorId], references: [id])
  authorId     String
  suggestion   Suggestion  @relation(fields: [suggestionId], references: [id])
  suggestionId String
}

https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases
Unblock-File "C:\Users\sven.tan.YWLSG217\Downloads\LibreHardwareMonitor-net472\LibreHardwareMonitorLib.dll"


Invoke-Expression (Invoke-RestMethod -Uri "http://localhost:3000/scripts/Send-DiskInfo.ps1")

run-hidden.bat
C:\Users\sven.tan.YWLSG217\AppData\Roaming\Spark\user\sven.tan@genesis.ywleng\transcripts

todo: make ip dynamic
192.168.1.183 -> AD domain
For perm access

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
    return
  }
  const perm = await checkUserPermission(currentUser.id, "/chat")
  if (perm.hasPermission === false) {
    return notFound()
  }
  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }

  #ToDO frequent backups

  text, csv, pdf, world, xlsx




sudo apt install postresql-server-dev-16
git clone https://github .com/pgvector/pgvector.git
cd pgvector
make
sudo make install

sudo docker run -d --name pgvector-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=host-machine -e POSTGRES_DB=logs_database -p 5433:5432 ankane/pgvector