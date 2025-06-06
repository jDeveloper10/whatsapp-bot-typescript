# WhatsApp Bot with Gemini AI Integration

A WhatsApp bot built with TypeScript that integrates with Google's Gemini AI for natural language processing.

## Features

- WhatsApp messaging integration
- Natural language processing with Gemini AI
- Command system for specific actions
- Group chat support
- Audio transcription
- Reminder system
- Admin commands
- User activity tracking

## Prerequisites

- Node.js 18 or higher
- Python 3.x
- WhatsApp account
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd botwhatsapp2
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

4. Build the project:
```bash
npm run build
```

## Usage

Start the bot:
```bash
npm start
```

This will start:
- The WhatsApp bot
- The Express server for Gemini API
- The Python transcriber service

## Docker Support

You can also run the bot using Docker:

```bash
docker build -t whatsapp-bot .
docker run -d --name whatsapp-bot whatsapp-bot
```

## Available Commands

- `ayuda` - Show available commands
- `sticker` - Convert image/video to sticker
- `group` - Manage group permissions (admin only)
- And more...

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter)

Link del Proyecto: [https://github.com/tu-usuario/whatsapp-bot-ts](https://github.com/tu-usuario/whatsapp-bot-ts)
