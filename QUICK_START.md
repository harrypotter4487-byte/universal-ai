# Universal AI Assistant - Quick Start Guide

## Project Overview

A production-ready AI assistant web application built with Next.js, featuring:
- **Chat Interface** - ChatGPT-like conversations with multiple AI models
- **Image Generator** - Text-to-image generation using Stable Diffusion
- **Settings Management** - API key configuration and model selection
- **Dark Mode UI** - Modern, minimal design similar to ChatGPT
- **Responsive Design** - Optimized for mobile and desktop

## Technology Stack

- **Framework**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS + Custom CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **AI Models**: Multiple providers (Groq, Gemini, Claude, GPT)
- **State Management**: React Hooks + Supabase

## Project Structure

```
app/
├── page.tsx                    # Home page - landing with hero section
├── chat/page.tsx               # Chat interface (advanced with file upload, voice)
├── images/page.tsx             # Image generator UI
├── settings/page.tsx           # Settings page
├── login/page.tsx              # Authentication page
├── api/
│   ├── chat/route.ts           # Chat completion endpoint
│   └── generate-image/route.ts # Image generation endpoint
└── layout.tsx                  # Root layout with navigation

components/
├── chat/                       # Chat-related components
├── ui/                         # shadcn/ui components
└── nav-bar.tsx                 # Navigation bar

lib/
├── supabase.ts                 # Supabase client setup
└── utils.ts                    # Utility functions

supabase/
└── migrations/                 # Database migrations
    └── create_ai_assistant_schema.sql

public/                         # Static assets

styles/                         # Global styles
```

## Setup Instructions

### 1. Environment Variables

The following environment variables are already configured in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://orfkowtpsqlreodyupmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cTe4j8_nBOwlV63oyWzONg_8qhWzmF2
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyBJff8P7VFh3RdH_ENC3peLqmXBz7i-Ajs
NVIDIA_API_KEY=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
HUGGINGFACE_API_KEY=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
```

### 2. Running the App

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# The app will be available at http://localhost:3000
```

### 3. Using the App

#### Home Page (`/`)
- Landing page with feature overview
- Model showcase and pricing information
- Links to chat and image generation

#### Chat Page (`/chat`)
- **Features**:
  - Switch between AI models (Groq, Gemini, Claude, GPT-OSS)
  - Upload files and images for analysis
  - Voice input (microphone)
  - Chat history saved to database
  - Markdown support in responses
  - Copy message functionality
  - Typing animations

- **Keyboard Shortcuts**:
  - `Enter` - Send message
  - `Shift+Enter` - New line
  - `☰` - Toggle sidebar

#### Image Generator (`/images`)
- **Features**:
  - Text-to-image generation
  - Multiple style options (photorealistic, cinematic, anime, oil painting, etc.)
  - Suggested prompts for quick generation
  - Lightbox preview with download
  - Prompt history
  - Real-time progress indicator

#### Settings (`/settings`)
- Configure API keys
- Select default AI model
- Save preferences to database

## Database Schema

### Tables

1. **conversations**
   - `id` - UUID primary key
   - `title` - Conversation title
   - `model` - AI model used
   - `created_at` - Timestamp
   - `updated_at` - Last updated timestamp

2. **messages**
   - `id` - UUID primary key
   - `conversation_id` - Foreign key to conversations
   - `role` - 'user' or 'assistant'
   - `content` - Message text
   - `created_at` - Timestamp

3. **generated_images**
   - `id` - UUID primary key
   - `prompt` - Image generation prompt
   - `image_url` - Generated image URL
   - `created_at` - Timestamp

4. **user_settings**
   - `id` - UUID primary key
   - `api_key` - Stored API key
   - `preferred_model` - Default model
   - `created_at` - Timestamp
   - `updated_at` - Last updated

## API Routes

### `/api/chat` (POST)
Handles AI chat completions.

**Request**:
```json
{
  "message": "Your question here",
  "model": "groq|gemini|deepseek|nemotron|gptoss",
  "images": ["base64_image_urls"],
  "wantsCanvas": false
}
```

**Response**:
```json
{
  "reply": "AI response here"
}
```

### `/api/generate-image` (POST)
Handles image generation.

**Request**:
```json
{
  "prompt": "Image description here"
}
```

**Response**:
```json
{
  "imageUrl": "generated_image_url"
}
```

## Available AI Models

1. **Groq (Llama 3.3)**
   - Speed: 500+ tokens/sec
   - Best for: Quick responses, coding
   - Free tier: Generous

2. **Gemini (Flash 2.5)**
   - Speed: Fast
   - Best for: Analysis, complex questions
   - Free tier: Generous

3. **DeepSeek Chat**
   - Speed: Balanced
   - Best for: Reasoning, step-by-step answers
   - Pricing: Pay-as-you-go (~$0.001/msg)

4. **NVIDIA Nemotron**
   - Speed: Balanced
   - Best for: STEM, technical topics
   - Pricing: Pay-as-you-go

5. **OpenAI GPT-OSS 120B**
   - Speed: Balanced
   - Best for: General tasks
   - Pricing: Pay-as-you-go

## Features Explained

### Chat Capabilities
- **Multi-model support**: Switch between different AI models instantly
- **File uploads**: Analyze PDFs, Excel, Word docs, images
- **Image analysis**: Upload and analyze images with vision models
- **Canvas/Diagrams**: Request visual diagrams (auto-generated)
- **Conversation history**: Stored in Supabase, searchable by date
- **Voice input**: Speak your message (browser feature)
- **Text-to-speech**: AI reads responses aloud
- **Markdown rendering**: Formatted text, code blocks, tables

### Image Generation
- **Multiple styles**: Photorealistic, cinematic, anime, oil painting, watercolor, 3D render, sketch
- **SDXL engine**: High-quality image generation
- **Download**: Save generated images
- **Regenerate**: Re-generate with same prompt
- **History**: View all generated images

### Settings & Personalization
- **API key management**: Store and retrieve API keys
- **Model selection**: Choose default model
- **Persistent settings**: Saved to database

## Performance Optimizations

- **Build size**: ~192KB for chat page (optimized bundles)
- **Lazy loading**: Images load on demand
- **Code splitting**: Route-based code splitting
- **CDN-optimized**: CSS and images optimized
- **Response streaming**: Fast initial load

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to Git first
git add .
git commit -m "Initial commit"
git push

# Then deploy to Vercel
# Connect your repo at https://vercel.com/new
```

### Deploy to Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Issue: API key not working
**Solution**:
- Verify API key format (should start with `sk-or-v1-` for OpenRouter)
- Check API key has sufficient credits
- Ensure API key is correct in Settings page

### Issue: Images not generating
**Solution**:
- Check Hugging Face API key has credits
- Verify prompt is descriptive enough
- Try simpler prompt or specific style

### Issue: Chat not responding
**Solution**:
- Check if Groq/Gemini API is available
- Verify network connection
- Try different model in Settings
- Check browser console for errors

### Issue: Build errors
**Solution**:
```bash
# Clean build cache
rm -rf .next node_modules
npm install
npm run build
```

## Code Organization Best Practices

1. **Components**: Reusable UI components in `/components`
2. **Pages**: Route-specific pages in `/app`
3. **APIs**: Backend logic in `/app/api`
4. **Utils**: Shared utilities in `/lib`
5. **Types**: TypeScript interfaces in relevant files
6. **Styles**: Global styles in `/app/globals.css`, component styles inline

## Security Considerations

- ✅ API keys stored in secure environment
- ✅ Database RLS policies enabled
- ✅ No sensitive data logged
- ✅ CORS properly configured
- ✅ SQL injection prevention via Supabase
- ✅ Input validation on forms

## Future Enhancements

- [ ] Chat sharing and collaboration
- [ ] Custom prompt templates
- [ ] Model comparison side-by-side
- [ ] Advanced file processing (OCR, etc.)
- [ ] Export conversations as PDF
- [ ] Mobile app (React Native)
- [ ] Custom API endpoint configuration
- [ ] Rate limiting and usage tracking

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Groq API**: https://console.groq.com
- **Gemini API**: https://ai.google.dev
- **OpenRouter**: https://openrouter.ai/docs

## License

MIT License - Free to use and modify

---

**Built with ❤️ using Next.js, React, and Supabase**
