# Neurapath
<img width="987" height="859" alt="image" src="https://github.com/user-attachments/assets/2c0905e0-a9f0-417e-9efb-f8e23adfb2b6" />
Neurapath is a web-based learning platform designed for evidence-based effective studying. It implements proven methods such as spaced repetition (SM-2), interleaved practice, and incremental reading to optimize learning outcomes.

Discord: https://discord.gg/2xkMPmcGZh

## Features

- **Spaced Repetition**: Implements the SM-2 algorithm for optimal review scheduling
- **Cloze Deletions**: Create flashcards by hiding parts of text
- **Image Occlusions**: Create flashcards from images by hiding parts of them
- **Incremental Reading**: Process large texts by extracting key information
- **Similar Content**: Automatically fetch related information from Oxford and Wikipedia APIs
- **Customizable Interface**: Dark mode, zen mode, and adjustable layouts
- **Keyboard Shortcuts**: Fully customizable keyboard shortcuts for efficient workflow
- **Data Export/Import**: Save and restore your learning database
- **Hierarchical Organization**: Folder-based structure for organizing learning materials

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- Node.js (v18 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/neurapath.git
   cd neurapath
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file to add your configuration values.

4. Run the development server:
   ```bash
   bun run dev
   ```

5. Build for production:
   ```bash
   bun run build
   ```

### Usage

1. **Creating an Account**
   - Visit the login page
   - Enter a username and password
   - The system will automatically create an account if it doesn't exist

2. **Creating Learning Items**
   - **Cloze Deletions**: Select text and press `Ctrl+C` (default)
   - **Text Extracts**: Select text and press `Ctrl+X` (default)
   - **Image Occlusions**: 
     1. Drag and drop an image into the main window
     2. Draw rectangles over areas to hide
     3. Press `Ctrl+Z` (default) to create the occlusion

3. **Learning Mode**
   - Click the "Engage!" button in the left sidebar
   - Review items using the spacebar to reveal answers
   - Rate your recall with `Ctrl+1` (very hard) to `Ctrl+5` (very easy)

4. **Organizing Content**
   - Right-click in the left sidebar to create folders
   - Drag and drop items to reorganize
   - Right-click items to rename or delete them

### Configuration

The application can be configured through environment variables in your `.env` file:

- `JWT_SECRET`: Secret key for JWT token generation
- `SIMULATE_LOGGED_IN_USER`: Set to 'true' for development testing
- Database configuration variables for SQLite, PostgreSQL, or MySQL

### API Documentation

Neurapath uses a Cloudflare Worker backend for data storage and user management. The API endpoints include:

- `POST /user/register`: Register a new user
- `GET /user/data`: Fetch user's database
- `POST /user/data`: Save user's database
- `GET /public/data`: Fetch public databases
- `GET /user/data/{username}`: Fetch another user's public database
- `POST /leaderboard`: Get leaderboard data

For detailed API documentation, please refer to the backend service implementation.

### Contributing

We welcome contributions to Neurapath! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

### Reporting Issues

If you find a bug or have a feature request, please:

1. Check if the issue already exists in our GitHub issues
2. If not, create a new issue with:
   - A clear title and description
   - Steps to reproduce (for bugs)
   - Expected and actual behavior
   - Screenshots (if applicable)

### License

This project is licensed under the Apache-2.0 license.

### Contact

For support, feature requests, or general questions:

- Email: hi@neurapath.io
- Discord: [Join our channel](https://discord.gg/2xkMPmcGZh)
- Report bugs in the bugs channel on Discord

### Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Uses [Tailwind CSS](https://tailwindcss.com/) for styling
- Implements [Quill.js](https://quilljs.com/) for rich text editing
- Leverages [pdfjs-dist](https://mozilla.github.io/pdf.js/) for PDF processing
- Inspired by evidence-based learning research
