# 🎬 AI Avatar Livestream Studio

A production-grade AI-powered live streaming platform with real-time avatars, multi-platform broadcasting, intelligent scene management, and advanced AI features.

## ✨ Features

### 🎭 AI Avatars
- **HeyGen Integration** - Lifelike AI avatars with real-time streaming
- **ElevenLabs TTS** - Ultra-realistic voice synthesis
- **Custom Voice Selection** - Choose from 50+ voices
- **Emotion Control** - Neutral, happy, serious, energetic modes

### 📡 Multi-Platform Streaming
- **YouTube Live** - Full integration with chat
- **Twitch** - Support for alerts and overlays
- **Facebook Live** - Stream to your page or profile
- **TikTok Live** - Reaching Gen-Z audiences
- **Custom RTMP** - Any destination you want

### 🧠 AI-Powered Features
- **Script Generation** - AI writes avatar scripts on any topic
- **Chat Response AI** - Generate responses to viewer questions
- **Content Moderation** - Automatic chat filtering
- **Scene Suggestions** - AI recommends scene changes
- **Stream Metadata** - Auto-generate descriptions & hashtags

### 🎬 Studio Features
- **Scene Management** - Multiple scenes with transitions
- **Source Layering** - Avatar, camera, screen share, images
- **Guest Management** - Invite guests with one-click links
- **Live Preview** - See exactly what viewers see
- **Real-time Controls** - Audio, video, and effects

### 📊 Analytics
- **Live Viewer Count** - Real-time across all platforms
- **Engagement Metrics** - Chat, reactions, shares
- **Platform Breakdown** - See where viewers come from
- **Historical Data** - Track performance over time

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo>
cd ai-avatar-livestream

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development servers
npm run dev:all
```

### Running Separately

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server
```

### Environment Variables

Create `.env.local` with your API keys:

```env
# Required for AI features
HEYGEN_API_KEY=your_heygen_key
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key

# Server
PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   └── studio/
│   │       └── page.tsx          # Streaming studio
│   ├── components/
│   │   └── studio/
│   │       ├── StudioLayout.tsx  # Header & sidebar
│   │       ├── StreamControls.tsx # Preview & controls
│   │       ├── AIControlPanel.tsx # AI features UI
│   │       └── Analytics.tsx     # Live analytics
│   ├── lib/
│   │   ├── store.ts              # Zustand state
│   │   ├── socket.ts             # WebSocket hook
│   │   ├── api.ts                # API client
│   │   └── utils.ts              # Utilities
│   └── types/
│       └── index.ts              # TypeScript types
├── server/
│   ├── index.ts                  # Express & WebSocket server
│   └── services/
│       ├── heygen.ts             # HeyGen avatar service
│       ├── elevenlabs.ts         # ElevenLabs TTS service
│       ├── openai.ts             # OpenAI AI service
│       ├── stream.ts             # Multi-platform streaming
│       └── database.ts           # In-memory database
├── .env.example                  # Environment template
├── package.json
└── README.md
```

## 🔌 API Reference

### Streams
- `POST /api/streams` - Create new stream
- `GET /api/streams/:id` - Get stream details
- `POST /api/streams/:id/start` - Start streaming
- `POST /api/streams/:id/stop` - Stop streaming

### Avatars
- `GET /api/avatars` - List available avatars
- `GET /api/voices` - List available voices
- `POST /api/avatar/session` - Create avatar session
- `POST /api/avatar/speak` - Make avatar speak
- `POST /api/avatar/stop` - Stop avatar speech

### AI Features
- `POST /api/ai/moderate` - Moderate chat content
- `POST /api/ai/generate-script` - Generate avatar script
- `POST /api/ai/suggest-scene` - Get scene suggestion
- `POST /api/ai/chat-response` - Generate chat response
- `POST /api/ai/generate-metadata` - Generate stream metadata

### Guests
- `POST /api/guests` - Create guest invite
- `GET /api/guests/:streamId` - List stream guests
- `POST /api/guests/join/:code` - Join via invite code

### Scenes
- `GET /api/scenes/:streamId` - List stream scenes
- `POST /api/scenes` - Create new scene
- `POST /api/scenes/:streamId/activate/:sceneId` - Switch scene

### Analytics
- `GET /api/analytics/:streamId` - Get stream analytics

## 🛠️ Tech Stack & Production Setup

| Category | Technology |
|----------|------------|
| **Frontend** | `Next.js 14`, `React 18`, `TypeScript` |
| **Styling** | `Tailwind CSS`, `Framer Motion`, `Lucide React` |
| **State** | `Zustand` (Global), `React Context` |
| **Real-time** | `Socket.io`, `WebRTC` (HeyGen & Guest Link) |
| **Backend** | `Express`, `Node.js` |
| **Database** | `Prisma ORM`, `Neon PostgreSQL` (Serverless) |
| **AI Avatar** | `HeyGen` (Streaming API) |
| **Neural TTS** | `ElevenLabs` (V2 API) |
| **AI Brain** | `OpenAI GPT-4 Turbo` |

## 🚀 Production Deployment

1. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Environment Configuration**
   Ensure `DATABASE_URL`, `HEYGEN_API_KEY`, `ELEVENLABS_API_KEY`, and `OPENAI_API_KEY` are configured.

3. **Build & Optimize**
   ```bash
   npm run build
   npm run start
   ```

## 🎨 Design System
The platform utilizes a **High-Fidelity Cyber-Studio** aesthetic:
- **Neon Glassmorphism**: Frosted layers with vibrant `#00f5ff` and `#a855f7` glows.
- **Dynamic Micro-Animations**: Powered by `Framer Motion` for layout shifts.
- **Responsive Studio**: Custom multi-panel layout optimized for dual-monitor setups.

## 📝 Development Notes

### Mock Data
The platform runs with mock data in development. AI services return simulated responses when API keys are not configured.

### WebSocket Events
- `stream:join` - Join a stream room
- `stream:started` - Stream went live
- `stream:ended` - Stream ended
- `chat:message` - New chat message
- `scene:switched` - Scene changed
- `avatar:speaking` - Avatar started speaking
- `avatar:finished` - Avatar stopped speaking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the future of live streaming**