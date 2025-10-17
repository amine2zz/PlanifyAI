# PlanifyAI Project Structure

```
PlanifyAI/
├── 📁 frontend/                    # Angular Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 components/
│   │   │   │   └── 📁 calendar/
│   │   │   │       └── 📄 calendar.component.ts    # Main calendar component
│   │   │   ├── 📁 services/
│   │   │   │   └── 📄 calendar.service.ts          # API service layer
│   │   │   ├── 📄 app.component.ts                 # Root component
│   │   │   └── 📄 app.routes.ts                    # Routing configuration
│   │   ├── 📁 assets/                              # Static assets
│   │   ├── 📁 environments/                        # Environment configs
│   │   ├── 📄 index.html                           # Main HTML file
│   │   ├── 📄 main.ts                              # Bootstrap file
│   │   └── 📄 styles.css                           # Global styles
│   ├── 📄 angular.json                             # Angular configuration
│   ├── 📄 package.json                             # Node.js dependencies
│   ├── 📄 tsconfig.json                            # TypeScript config
│   └── 📄 tsconfig.app.json                        # App-specific TS config
│
├── 📁 backend/                     # Python Flask Backend
│   ├── 📄 app.py                                   # Main Flask application
│   ├── 📄 database.py                              # Database models (SQLAlchemy)
│   ├── 📄 ai_engine.py                             # AI intelligence engine
│   ├── 📄 requirements.txt                         # Python dependencies
│   └── 📄 .env.example                             # Environment variables template
│
├── 📁 database/                    # Database Setup & Configuration
│   └── 📄 setup.sql                                # MySQL database setup script
│
├── 📄 README.md                                    # Project documentation
├── 📄 PROJECT_STRUCTURE.md                         # This file
├── 📄 setup.bat                                    # Windows setup script
└── 📄 start.bat                                    # Windows startup script
```

## 📁 Directory Descriptions

### Frontend (`/frontend/`)
The Angular frontend provides the user interface for PlanifyAI with the following key components:

- **`src/app/components/calendar/`**: Main calendar component with multi-view support (Year/Month/Week/Day)
- **`src/app/services/`**: Service layer for API communication and data management
- **`src/assets/`**: Static files like images, icons, and other resources
- **`src/environments/`**: Environment-specific configuration files

### Backend (`/backend/`)
The Python Flask backend handles API requests, database operations, and AI processing:

- **`app.py`**: Main Flask application with all API endpoints
- **`database.py`**: SQLAlchemy models for database tables
- **`ai_engine.py`**: Intelligent algorithms for scheduling optimization and suggestions
- **`requirements.txt`**: Python package dependencies

### Database (`/database/`)
Database setup and configuration files:

- **`setup.sql`**: Complete MySQL database schema with sample data

## 🔧 Key Files Explained

### Frontend Files

#### `calendar.component.ts`
The heart of the application - a comprehensive calendar component featuring:
- Multi-view calendar (Year, Month, Week, Day)
- Today highlighting and navigation
- Event management and display
- AI suggestions integration
- Responsive design with smooth transitions

#### `calendar.service.ts`
Service layer providing:
- HTTP client for API communication
- Event management methods
- AI feature integration
- Data caching and state management
- Utility functions for date operations

#### `app.component.ts`
Root component that:
- Sets up the main application layout
- Provides global styling and theming
- Integrates the calendar component
- Handles application-wide state

### Backend Files

#### `app.py`
Main Flask application featuring:
- RESTful API endpoints for events, AI features, and analytics
- CORS configuration for frontend communication
- Database initialization and management
- Error handling and logging
- Health check endpoints

#### `database.py`
SQLAlchemy models including:
- **Events**: Calendar events with categories and priorities
- **TimeBlocks**: Dedicated time blocks for focused work
- **UserPreferences**: User-specific settings and preferences
- **ProductivityMetrics**: Analytics and productivity tracking
- **AIInsights**: AI-generated insights and suggestions

#### `ai_engine.py`
Intelligent AI engine providing:
- Smart scheduling suggestions
- Productivity pattern analysis
- Optimal meeting time finding
- Duration prediction algorithms
- Calendar optimization recommendations
- Energy-based scheduling
- Conflict resolution

### Configuration Files

#### `package.json`
Angular project configuration with:
- Angular 17 framework and dependencies
- Development and build scripts
- TypeScript and testing tools

#### `requirements.txt`
Python dependencies including:
- Flask web framework
- SQLAlchemy ORM
- MySQL database connector
- CORS support
- AI and analytics libraries

#### `angular.json`
Angular CLI configuration for:
- Build and serve configurations
- Asset management
- Development server settings

## 🚀 Getting Started

1. **Setup**: Run `setup.bat` to install all dependencies
2. **Database**: Import `database/setup.sql` into MySQL via phpMyAdmin
3. **Start**: Run `start.bat` to launch both frontend and backend
4. **Access**: Open http://localhost:4200 in your browser

## 🔄 Data Flow

```
User Interface (Angular) 
    ↕️ HTTP Requests
Calendar Service 
    ↕️ REST API
Flask Backend 
    ↕️ SQL Queries
MySQL Database
    ↕️ AI Processing
AI Engine
```

## 🎯 Key Features by Component

### Calendar Component
- ✅ Multi-view calendar (Year/Month/Week/Day)
- ✅ Today highlighting
- ✅ Smooth navigation and zoom
- ✅ Event creation and management
- ✅ Responsive design

### AI Engine
- ✅ Smart scheduling suggestions
- ✅ Productivity analysis
- ✅ Pattern recognition
- ✅ Optimal time finding
- ✅ Duration prediction

### Database
- ✅ Comprehensive event storage
- ✅ User preferences
- ✅ Productivity metrics
- ✅ AI insights tracking
- ✅ Performance optimization

## 🛠️ Development Workflow

1. **Frontend Development**: 
   - Modify components in `frontend/src/app/`
   - Test with `ng serve`
   - Build with `ng build`

2. **Backend Development**:
   - Update API endpoints in `backend/app.py`
   - Modify AI algorithms in `backend/ai_engine.py`
   - Test with `python app.py`

3. **Database Changes**:
   - Update models in `backend/database.py`
   - Create migration scripts
   - Update `database/setup.sql`

## 📈 Future Enhancements

The project structure is designed to easily accommodate:
- Additional calendar views
- More AI algorithms
- External calendar integrations
- Mobile app development
- Advanced analytics
- Team collaboration features