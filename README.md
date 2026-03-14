# Universal AI Assistant

A modern AI chatbot web application similar to ChatGPT, built with Next.js, featuring chat conversations, image generation, and multi-model AI support.

## Features

- **AI Chat Interface**: ChatGPT-like interface with message bubbles and chat history
- **Multiple AI Models**: Support for GPT-4, GPT-3.5, Claude 3.5 Sonnet, and Gemini Pro via OpenRouter
- **Image Generation**: Create images from text descriptions using AI
- **Dark Mode**: Modern dark interface
- **Responsive Design**: Works on mobile and desktop
- **Chat History**: Conversations stored in Supabase database
- **Markdown Support**: Rich text formatting in messages
- **Copy Messages**: One-click copy for AI responses

## Technology Stack

- **Framework**: Next.js 13 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **AI API**: OpenRouter (unified access to multiple AI models)
- **Icons**: Lucide React

## Getting Started

### 1. Get an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

### 2. Add Your API Key

1. Navigate to the Settings page in the app
2. Paste your OpenRouter API key
3. Select your preferred AI model
4. Click "Save Settings"

### 3. Start Using the App

**Chat Page**:
- Type your message in the input box
- Press Enter or click Send
- Switch between AI models using the dropdown
- Start new conversations with the "New Chat" button

**Image Generator**:
- Enter a description of the image you want
- Click "Generate Image"
- Download generated images

## Pages

- **Home** (`/`) - Landing page with app overview
- **Chat** (`/chat`) - AI conversation interface
- **Images** (`/images`) - Image generation tool
- **Settings** (`/settings`) - Configure API key and preferences

## Database Schema

The app uses Supabase with the following tables:

- `conversations` - Chat sessions
- `messages` - Individual chat messages
- `generated_images` - Generated image history
- `user_settings` - API keys and preferences

## Available AI Models

- **GPT-4** - Most capable OpenAI model
- **GPT-3.5 Turbo** - Faster and more cost-effective
- **Claude 3.5 Sonnet** - Anthropic's advanced reasoning model
- **Gemini Pro** - Google's AI model

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Chat API endpoint
│   │   └── generate-image/route.ts # Image generation endpoint
│   ├── chat/page.tsx               # Chat interface
│   ├── images/page.tsx             # Image generator
│   ├── settings/page.tsx           # Settings page
│   ├── layout.tsx                  # Root layout with navigation
│   └── page.tsx                    # Home page
├── components/
│   ├── chat/
│   │   ├── chat-message.tsx        # Message bubble component
│   │   └── chat-input.tsx          # Message input component
│   ├── nav-bar.tsx                 # Navigation bar
│   └── ui/                         # shadcn/ui components
├── lib/
│   └── supabase.ts                 # Supabase client and types
└── supabase/
    └── migrations/                 # Database migrations
```

## Security

- API keys are stored in the Supabase database
- Row Level Security (RLS) is enabled on all tables
- API keys are never exposed in client-side code
- All requests are authenticated through the API routes

## Notes

- The app uses OpenRouter's unified API to access multiple AI models
- Images are generated using DALL-E 3 through OpenRouter
- Chat history is automatically saved to the database
- Settings are persisted in the database

## Support

For issues or questions:
- Check [OpenRouter Documentation](https://openrouter.ai/docs)
- Review [available models](https://openrouter.ai/models)
- Ensure your API key has sufficient credits
# universal-ai
