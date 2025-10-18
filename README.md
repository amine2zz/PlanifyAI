# PlanifyAI - Smart Calendar with Voice Commands

Advanced calendar application with MySQL database, enhanced voice recognition, and intelligent analytics.

## 🚀 Features

- **Multi-View Calendar**: Month, Week, and Day views
- **Advanced Voice AI**: Natural language event creation
- **Smart Analytics**: Time tracking and category insights
- **Event Management**: Click to edit, drag to reschedule
- **Category Colors**: Visual organization by event type
- **Priority System**: High, medium, low priority indicators
- **Real-time Database**: Direct MySQL connection (no caching)

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- XAMPP (MySQL)

### Installation

1. **Start XAMPP**
   ```bash
   # Start Apache and MySQL services
   # Open phpMyAdmin: http://localhost/phpmyadmin
   # Create database: planifyai
   # Import: database/setup.sql
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ng serve
   ```

4. **Quick Start**
   ```bash
   # Or use the startup script
   start.bat
   ```

## 🎤 Voice Commands

- "Schedule meeting with John tomorrow at 2 PM"
- "Add 20 October Class Meeting 3:00 P.M."
- "Create workout session Monday at 6 AM"
- "Book doctor appointment next week"

## 🎨 Category Colors

- **Blue**: Meetings & Calls
- **Green**: Work & Projects  
- **Orange**: Personal & Social
- **Red**: Health & Medical
- **Purple**: Education & Learning
- **Gray**: General Events

## 📊 Analytics Dashboard

- Total events tracking
- Weekly activity summary
- Category breakdown charts
- Time distribution analysis

## 🔧 Technology Stack

**Backend:**
- Flask (Python)
- MySQL + SQLAlchemy
- Advanced NLP Voice Processing

**Frontend:**
- Angular 17
- TypeScript
- Responsive CSS Grid

## 🌐 API Endpoints

- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/analytics` - Get analytics data
- `POST /api/ai/process-voice` - Process voice command

## 📱 Browser Support

- Chrome (Recommended for voice features)
- Edge
- Firefox
- Safari (limited voice support)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Demo**: [Live Demo](https://planifyai.demo.com)
- **Issues**: [GitHub Issues](https://github.com/amine2zz/PlanifyAI/issues)
- **Docs**: [Documentation](https://docs.planifyai.com)