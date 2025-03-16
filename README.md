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