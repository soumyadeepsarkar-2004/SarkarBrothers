<div align="center">
</div>

# 🎁 ToyWonder - Unwrap the Magic of Play

A modern, AI-powered e-commerce platform for toys and gifts built with React, TypeScript, and Google Gemini AI.

## ✨ Features

- 🛍️ **Modern E-Commerce**: Browse, search, and purchase toys with an intuitive interface
- 🤖 **AI Gift Assistant**: Get personalized gift recommendations using Google Gemini AI
- 🎨 **AI Image Generator**: Create custom toy images with AI (placeholder for API integration)
- 🗣️ **Voice Assistant**: Voice-powered shopping experience
- 📱 **WhatsApp Ordering**: Quick order placement via WhatsApp
- 🌐 **Bilingual Support**: Full support for English and Bengali (বাংলা)
- 🌓 **Dark Mode**: Beautiful dark mode support
- 📦 **Order Tracking**: Real-time order status updates
- 👤 **User Profiles**: Manage addresses, orders, and preferences
- 🔐 **Admin Dashboard**: Manage products, orders, and settings

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (optional, uses mock data by default)
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/soumyadeepsarkar-2004/ToyWonder.git
   cd ToyWonder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   MONGODB_URI=mongodb://localhost:27017/toywonder
   PORT=5000
   ```

4. **Start the development servers**

   Terminal 1 - Frontend:
   ```bash
   npm run dev
   ```

   Terminal 2 - Backend:
   ```bash
   npm run server
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
ToyWonder/
├── components/          # Reusable React components
│   ├── Navbar.tsx
│   ├── LoginModal.tsx
│   └── admin/          # Admin dashboard components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── LanguageContext.tsx
│   └── WishlistContext.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Shop.tsx
│   ├── Cart.tsx
│   ├── AiAssistant.tsx
│   └── Admin.tsx
├── services/           # API and external services
│   ├── api.ts          # API client
│   └── gemini.ts       # Google Gemini AI integration
├── server/             # Express backend
│   ├── index.js        # Server entry point
│   ├── models.js       # MongoDB models
│   └── data.js         # Mock data
├── utils/              # Utility functions
├── data.ts             # Frontend data
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main app component
```

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- React Router v7
- Tailwind CSS 4
- Vite

**Backend:**
- Node.js
- Express 5
- MongoDB (Mongoose)
- CORS

**AI/ML:**
- Google Gemini AI API

## 🌐 Deployment

### Vercel (Recommended for Frontend)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Add environment variables in Netlify dashboard

### Backend Deployment (Railway/Render)

1. Deploy the `server/` folder to Railway or Render
2. Add environment variables:
   - `GEMINI_API_KEY`
   - `MONGODB_URI`
   - `PORT`

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes (for AI features) |
| `MONGODB_URI` | MongoDB connection string | No (uses mock data if not set) |
| `PORT` | Backend server port | No (defaults to 5000) |

## 📝 Available Scripts

```bash
npm run dev          # Start frontend dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start backend server
npm run server:dev   # Start backend with nodemon
```

## 🎨 Features in Detail

### AI Gift Assistant
- Powered by Google Gemini AI
- Provides personalized gift recommendations
- Supports English and Bengali
- Context-aware product suggestions

### Shopping Experience
- Product search with AI-powered suggestions
- Category filtering
- Price range filters
- Wishlist functionality
- Shopping cart with persistence

### Admin Dashboard
- Product management (CRUD operations)
- Order management and tracking
- User analytics
- Settings configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Soumyadeep Sarkar**
- GitHub: [@soumyadeepsarkar-2004](https://github.com/soumyadeepsarkar-2004)

## 🙏 Acknowledgments

- Google Gemini AI for AI capabilities
- Unsplash for images
- Material Icons for icons
- Tailwind CSS for styling

## 📞 Support

For support, email shannking969@gmail.com or open an issue on GitHub.

---

Made with ❤️ for toy lovers everywhere!
