# rewards-service

#### Clone the repository

```bash
git clone https://github.com/communcom/rewards-service.git
cd rewards-service
```

#### Create .env file

```bash
cp .env.example .env
```

Add variables

```bash
GLS_BLOCKCHAIN_BROADCASTER_CONNECT=nats://user:password@ip
GLS_FACADE_CONNECT=http://facade-node:3000
```

#### Create docker-compose file

```bash
cp docker-compose.example.yml docker-compose.yml
```

#### Run

```bash
docker-compose up -d --build
```
