# Apologetics Debate Training App

A web application for practicing Christian apologetics through AI-powered debates. Built with Astro, React, and TypeScript.

## 🎯 Features

- **Interactive Debate Interface**: Engage in structured debates on various apologetic topics
- **AI-Powered Opponents**: Practice against intelligent AI responses using Google Gemini and Apologist Project APIs
- **User Authentication**: Secure sign-in with Better Auth
- **Debate History**: Track your progress and review past debates
- **Topic Selection**: Choose from a variety of apologetic topics and scenarios
- **Real-time Responses**: Dynamic AI responses that adapt to your arguments

## 🛠 Tech Stack

- **Framework**: Astro 5.8+ with SSR
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Better Auth
- **AI Services**: Google Gemini API, Apologist Project API
- **Build**: Node.js adapter for standalone deployment

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- API keys for Google Gemini and Apologist Project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd practicing-apologetics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   # Database Configuration
   TURSO_DB_URL=http://localhost:8080
   TURSO_DB_AUTH_TOKEN=your_turso_auth_token_here

   # Authentication Configuration
   BETTER_AUTH_URL=http://localhost:4321

   # Google Gemini API Configuration
   GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here

   # Apologist Project API Configuration
   APOLOGIST_PROJECT_API_KEY=your_apologist_project_api_key_here
   APOLOGIST_PROJECT_API_URL=https://api.apologistproject.com/v1
   ```

4. **Initialize the database**
   ```bash
   npm run db:auth
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4321`

## 📁 Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── debate/            # Debate interface components
│   │   └── ui/                # Reusable UI components
│   ├── layouts/
│   │   └── Layout.astro       # Main layout template
│   ├── lib/
│   │   ├── apis/              # API client configurations
│   │   ├── auth.ts            # Authentication setup
│   │   ├── config.ts          # Environment configuration
│   │   └── db/                # Database schema and client
│   ├── pages/
│   │   ├── api/               # API endpoints
│   │   ├── debate/            # Debate pages
│   │   └── *.astro            # Static pages
│   └── styles/
│       └── global.css         # Global styles
├── scripts/
│   └── init-db.ts             # Database initialization
└── drizzle.config.ts          # Database configuration
```

## 🗄️ Database Commands

| Command | Action |
|---------|--------|
| `npm run db:auth` | Generate authentication tables |
| `npm run db:seed` | Generate debate tables and seed data |

## 🔧 Development Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro ...` | Run Astro CLI commands |

## 🔑 API Configuration

### Google Gemini API
1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add to `.env` as `GOOGLE_GEMINI_API_KEY`

### Apologist Project API
1. Get credentials and API URL info by contacting the [Apologist Project team](https://apologistproject.org/contact)
2. Add API key to `.env` as `APOLOGIST_PROJECT_API_KEY`
3. Set the API URL as `APOLOGIST_PROJECT_API_URL`

## 🔐 Authentication

The app uses Better Auth for secure user authentication. Users can sign up and sign in to track their debate history and progress.

## 🎮 Using the App

1. **Sign Up/Sign In**: Create an account or sign in to access the debate features
2. **Select a Topic**: Choose from various apologetic topics and scenarios
3. **Start Debating**: Engage with AI opponents in structured debates
4. **Review History**: Access your past debates and track your improvement
5. **Continue Learning**: Practice regularly to strengthen your apologetic skills

## 🚢 Deployment

The app is configured for standalone deployment with the Node.js adapter. Build the project and deploy the `dist/` folder to your hosting provider.

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure the build passes
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
