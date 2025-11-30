# interview-cheater

An Electron-based Interview Helper application built with React, TypeScript, and Vite.

## Features

- 🔐 **Authentication System** - Secure login/signup with persistent sessions
- 📊 **Dashboard** - Track your interview preparation progress
- ❓ **Questions Bank** - Practice common interview questions
- 📝 **Notes** - Keep track of important interview tips
- 💼 **Modern UI** - Beautiful dark theme with glassmorphism effects

## Tech Stack

- **Electron** - Cross-platform desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Default Credentials

- **Email**: testing@gmail.com
- **Password**: testing

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts
└── renderer/       # React application
    ├── components/ # React components
    ├── App.tsx     # Main app component
    └── index.css   # Global styles
```

## License

MIT
