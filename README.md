# PlanifyAI - Intelligent Calendar & Planning Assistant

PlanifyAI is a smart calendar application that combines Angular frontend with Python Flask backend and MySQL database to provide intelligent scheduling, productivity analysis, and AI-powered planning assistance.

## 🚀 Features

### Smart Calendar
- **Multi-View Calendar**: Year, Month, Week, and Day views with smooth transitions
- **Today Highlighting**: Automatically highlights current date across all views
- **Zoom Navigation**: Intuitive zoom in/out between different time scales
- **Event Management**: Create, edit, and delete events with categories and priorities

### AI Intelligence
- **Smart Suggestions**: AI-powered recommendations for optimal scheduling
- **Productivity Analysis**: Track and analyze your productivity patterns
- **Optimal Meeting Times**: Find the best time slots for meetings with multiple participants
- **Duration Prediction**: AI predicts event duration based on type and description
- **Pattern Recognition**: Identifies your most productive hours and days

### Time Management
- **Time Blocking**: Create dedicated focus blocks for deep work
- **Break Reminders**: Smart reminders for breaks and wellness
- **Conflict Resolution**: Automatic detection and resolution of scheduling conflicts
- **Energy-Based Scheduling**: Schedule tasks based on your energy levels

### Analytics & Insights
- **Productivity Metrics**: Comprehensive productivity tracking and scoring
- **Calendar Insights**: Deep analysis of your scheduling patterns
- **Trend Analysis**: Identify trends in your work and meeting patterns
- **Performance Optimization**: Suggestions to improve your calendar efficiency

## 🛠️ Technology Stack

### Frontend
- **Angular 17**: Modern web framework with standalone components
- **TypeScript**: Type-safe development
- **CSS3**: Custom styling with responsive design
- **RxJS**: Reactive programming for data management

### Backend
- **Python Flask**: Lightweight web framework
- **SQLAlchemy**: ORM for database operations
- **Flask-CORS**: Cross-origin resource sharing
- **AI Engine**: Custom AI algorithms for intelligent features

### Database
- **MySQL**: Relational database with XAMPP
- **Optimized Schema**: Efficient database design with proper indexing
- **Sample Data**: Pre-populated with demonstration data

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- XAMPP (for MySQL database)
- Angular CLI (`npm install -g @angular/cli`)

### Database Setup
1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Import the database setup script:
   ```sql
   -- Run the contents of database/setup.sql
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend will run on http://localhost:5000

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```
   The frontend will run on http://localhost:4200

## 🎯 Usage

### Basic Calendar Operations
1. **View Navigation**: Use the view buttons (Year/Month/Week/Day) to switch between different calendar views
2. **Date Navigation**: Click the arrow buttons or use the "Today" button to navigate through dates
3. **Event Creation**: Click on any day or time slot to create a new event
4. **Event Management**: Click on existing events to edit or delete them

### AI Features
1. **Smart Suggestions**: Check the AI suggestions panel for intelligent recommendations
2. **Productivity Analysis**: View your productivity patterns in the analytics section
3. **Optimal Scheduling**: Use the AI to find the best meeting times
4. **Pattern Insights**: Review AI-generated insights about your calendar usage

### Time Management
1. **Focus Blocks**: Create dedicated time blocks for focused work
2. **Break Scheduling**: Let AI suggest optimal break times
3. **Meeting Optimization**: Cluster meetings to preserve focus time
4. **Energy Alignment**: Schedule tasks based on your energy patterns

## 🔧 Configuration

### Database Configuration
Update the database connection in `backend/app.py`:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/planifyai'
```

### AI Engine Settings
Customize AI behavior in `backend/ai_engine.py`:
- Productivity scoring algorithms
- Suggestion generation rules
- Pattern recognition parameters

### Frontend Configuration
Modify API endpoints in `frontend/src/app/services/calendar.service.ts`:
```typescript
private apiUrl = 'http://localhost:5000/api';
```

## 📊 API Endpoints

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event
- `GET /api/events/date/{date}` - Get events by date

### AI Features
- `GET /api/ai/suggestions` - Get AI suggestions
- `POST /api/ai/optimize-schedule` - Optimize schedule
- `GET /api/ai/productivity-analysis` - Get productivity analysis
- `POST /api/ai/find-meeting-time` - Find optimal meeting time

### Analytics
- `GET /api/analytics/productivity` - Get productivity metrics
- `GET /api/analytics/insights` - Get calendar insights

## 🎨 Customization

### Styling
- Modify `frontend/src/styles.css` for global styles
- Update component styles in individual `.component.ts` files
- Customize color scheme and themes

### AI Algorithms
- Enhance pattern recognition in `ai_engine.py`
- Add new suggestion types
- Implement machine learning models for better predictions

### Database Schema
- Add new tables for additional features
- Modify existing tables as needed
- Update the ORM models in `database.py`

## 🚀 Deployment

### Production Setup
1. Build the Angular app:
   ```bash
   cd frontend
   ng build --prod
   ```

2. Configure Flask for production:
   ```python
   app.run(debug=False, host='0.0.0.0', port=5000)
   ```

3. Set up a production database
4. Configure web server (nginx, Apache)
5. Set up SSL certificates

### Environment Variables
Create a `.env` file for production settings:
```
DATABASE_URL=mysql://user:password@localhost/planifyai
SECRET_KEY=your-secret-key
FLASK_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- Integration with Google Calendar, Outlook
- Mobile app development
- Advanced machine learning models
- Team collaboration features
- Voice commands and natural language processing
- Calendar sharing and permissions
- Advanced reporting and analytics
- Integration with productivity tools (Slack, Trello, etc.)

---

**PlanifyAI** - Making your calendar smarter, one event at a time! 🎯