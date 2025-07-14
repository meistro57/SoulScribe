# 🐳 SoulScribe Docker Setup

This guide will help you run SoulScribe using Docker with everything pre-configured except for API keys.

## 📋 Prerequisites

- Docker installed on your machine
- Docker Compose installed
- OpenAI API key (required for story generation)
- Anthropic API key (optional, for Claude model)

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
git clone https://github.com/meistro57/SoulScribe.git
cd SoulScribe/soulscribe
```

### 2. Configure Environment Variables
Copy the Docker environment template:
```bash
cp .env.docker .env.local
```

Edit `.env.local` and add your API keys:
```env
# Required - Add your OpenAI API key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional - Add your Anthropic API key for Claude model
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Optional - OAuth providers for social login
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. Start the Application
```bash
docker-compose up -d
```

### 4. Access the Application
- **SoulScribe App**: http://localhost:3000
- **Database Admin (Adminer)**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## 🛠️ What's Included

The Docker setup includes:

- **Next.js Application** (Port 3000)
- **PostgreSQL Database** (Port 5432)
- **Adminer Database UI** (Port 8080)
- **Automatic Database Migration**
- **Pre-configured Environment**

## 📦 Docker Services

### App Service
- Builds and runs the Next.js application
- Automatically waits for database to be ready
- Runs database migrations on startup
- Includes all dependencies and configurations

### Database Service
- PostgreSQL 15 with Alpine Linux
- Pre-configured with SoulScribe database
- Includes initialization script with sample data
- Persistent data storage with Docker volume

### Adminer Service
- Web-based database administration tool
- Access database at http://localhost:8080
- Login: `soulscribe` / `soulscribe_password`

## 🔧 Common Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up --build
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes database data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Database Management
```bash
# Access database directly
docker-compose exec db psql -U soulscribe -d soulscribe

# Reset database (WARNING: This deletes all data)
docker-compose down
docker volume rm soulscribe_postgres_data
docker-compose up -d
```

## 🐛 Troubleshooting

### Application Won't Start
1. Check if all required environment variables are set
2. Ensure Docker and Docker Compose are running
3. Check logs: `docker-compose logs -f app`

### Database Connection Issues
1. Wait for database to fully initialize (first run takes longer)
2. Check database logs: `docker-compose logs -f db`
3. Verify database is healthy: `docker-compose ps`

### API Keys Not Working
1. Verify API keys are correctly set in `.env.local`
2. Ensure no extra spaces or quotes around keys
3. Check if API keys have proper permissions

### Port Already in Use
If ports 3000, 5432, or 8080 are already in use, modify the `docker-compose.yml` file:
```yaml
ports:
  - "3001:3000"  # Change external port
```

## 📁 File Structure

```
soulscribe/
├── Dockerfile                 # App container definition
├── docker-compose.yml        # Multi-container orchestration
├── docker-entrypoint.sh      # App startup script
├── .env.docker               # Environment template
├── .dockerignore             # Docker build exclusions
├── docker/
│   └── postgres/
│       └── init.sql          # Database initialization
└── DOCKER.md                 # This file
```

## 🔒 Security Notes

- Change `NEXTAUTH_SECRET` in production
- Use strong database passwords in production
- Don't commit `.env.local` to version control
- Consider using Docker secrets for sensitive data

## 🌟 Features Ready to Use

Once started, you can:
- ✅ Create user accounts (with OAuth if configured)
- ✅ Generate AI stories with OpenAI GPT-4
- ✅ Use Claude AI if Anthropic key is provided
- ✅ Manage and organize stories
- ✅ View database through Adminer
- ✅ All database tables and relationships pre-configured

## 📚 Next Steps

1. Visit http://localhost:3000
2. Create an account or sign in
3. Start generating your first transformative story!

For development setup or manual installation, see the main README.md file.