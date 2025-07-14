# SoulScribe AI 🌟

**The Storyteller of Awakening**

SoulScribe is an AI-powered storytelling platform that weaves ancient wisdom with modern insights to create transformative stories that awaken hearts and inspire souls.

## Features

- **AI Story Generation**: Generate stories using OpenAI GPT-4 or Anthropic Claude
- **Customizable Parameters**: Choose genre, mood, theme, and creativity level
- **Story Management**: Save, edit, and organize your generated stories
- **User Authentication**: Secure login with demo account and OAuth providers
- **Responsive Design**: Beautiful, modern interface with dark mode support

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key (required for story generation)

### 1. Clone the Repository
```bash
git clone https://github.com/meistro57/SoulScribe.git
cd SoulScribe/soulscribe
```

### 2. Configure Environment Variables
```bash
cp .env.docker .env.local
```

Edit `.env.local` and add your OpenAI API key:
```env
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start the Application
```bash
docker-compose up -d
```

### 4. Access the Application
- **SoulScribe App**: http://localhost:3000
- **Database Admin**: http://localhost:8080 (Adminer)

## Demo Account

For testing, use the demo account:
- **Email**: `demo@soulscribe.com`
- **Password**: `demo`

## Usage

1. **Sign In**: Use the demo account or configure OAuth providers
2. **Create Stories**: Navigate to the dashboard and click "Create New Story"
3. **Configure Parameters**:
   - **Theme**: Enter topics like "forgiveness", "inner peace", "courage"
   - **Genre**: Choose from Fantasy, Spiritual, Wisdom, Parable, etc.
   - **Mood**: Select from Peaceful, Inspiring, Contemplative, etc.
   - **AI Model**: Choose between OpenAI GPT-4 or Anthropic Claude
   - **Creativity Level**: Adjust from focused (0.1) to creative (1.0)
4. **Generate**: Click "Generate Story" to create your transformative tale

## Development

### Local Development
```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Database Management
```bash
# Run migrations
npx prisma migrate dev

# Access database studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key for story generation
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for local)
- `NEXTAUTH_SECRET`: Random secret for NextAuth

### Optional OAuth Providers
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth
- `ANTHROPIC_API_KEY`: Anthropic Claude API key

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI GPT-4, Anthropic Claude
- **Authentication**: NextAuth.js with JWT sessions
- **Deployment**: Docker with multi-stage builds

## Story Generation

SoulScribe uses advanced AI models to create stories that:
- Blend ancient wisdom with modern insights
- Inspire personal transformation and awakening
- Provide comfort and guidance through storytelling
- Explore themes of spirituality, philosophy, and self-discovery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

*"Where ancient wisdom meets cutting-edge AI to awaken hearts and inspire souls"* ✨