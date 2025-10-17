# 🚀 PlanifyAI Quick Start Guide

Get PlanifyAI up and running in just a few minutes!

## ⚡ Prerequisites Check

Before starting, make sure you have:
- ✅ **Node.js** (v16+) - [Download here](https://nodejs.org/)
- ✅ **Python** (v3.8+) - [Download here](https://python.org/)
- ✅ **XAMPP** - [Download here](https://www.apachefriends.org/)

## 🎯 3-Step Setup

### Step 1: Run Setup Script
```bash
# Double-click setup.bat or run in command prompt:
setup.bat
```
This will:
- Install Python dependencies
- Install Node.js dependencies
- Create virtual environment

### Step 2: Setup Database
1. **Start XAMPP** Control Panel
2. **Start MySQL** service
3. Open **phpMyAdmin** (http://localhost/phpmyadmin)
4. Create database named `planifyai`
5. Import `database/setup.sql` file

### Step 3: Start Application
```bash
# Double-click start.bat or run:
start.bat
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000
- **Database**: http://localhost/phpmyadmin

## 🎮 First Use

### 1. Explore the Calendar
- Click **Year/Month/Week/Day** buttons to switch views
- Use **← →** arrows to navigate dates
- Click **Today** to return to current date

### 2. Create Your First Event
- Click on any day in Month view
- Or click on a time slot in Week/Day view
- Fill in event details
- Save and see it appear on your calendar

### 3. Check AI Suggestions
- Look for the **AI Suggestions** panel
- See intelligent recommendations
- Click **Apply** to use suggestions

### 4. View Analytics
- Check your productivity patterns
- See time allocation insights
- Get optimization recommendations

## 🔧 Manual Setup (Alternative)

If the batch scripts don't work, follow these manual steps:

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### ❌ "MySQL not running"
**Solution**: Start XAMPP and ensure MySQL service is running

#### ❌ "Port 4200 already in use"
**Solution**: 
```bash
ng serve --port 4201
```

#### ❌ "Port 5000 already in use"
**Solution**: Change port in `backend/app.py`:
```python
app.run(debug=True, port=5001)
```

#### ❌ "Database connection error"
**Solution**: 
1. Check MySQL is running in XAMPP
2. Verify database `planifyai` exists
3. Check connection string in `app.py`

#### ❌ "Module not found" errors
**Solution**: 
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

#### ❌ Angular CLI not found
**Solution**:
```bash
npm install -g @angular/cli
```

## 📱 Using PlanifyAI

### Calendar Navigation
- **Year View**: See entire year, click months to zoom in
- **Month View**: Traditional calendar, click days for details
- **Week View**: 7-day view with hourly slots
- **Day View**: Detailed daily schedule

### Event Management
- **Create**: Click empty slots
- **Edit**: Click existing events
- **Delete**: Edit event and delete
- **Categories**: Organize with work, meeting, personal, etc.

### AI Features
- **Smart Suggestions**: Get intelligent scheduling advice
- **Productivity Analysis**: See your work patterns
- **Optimal Times**: Find best meeting slots
- **Duration Prediction**: AI estimates event length

### Time Blocking
- Create focus blocks for deep work
- Schedule breaks automatically
- Optimize meeting clusters
- Balance work and personal time

## 🎯 Pro Tips

### Maximize Productivity
1. **Use Time Blocks**: Create 90-minute focus blocks
2. **Cluster Meetings**: Group meetings in afternoons
3. **Follow AI Suggestions**: Apply recommended optimizations
4. **Review Analytics**: Check weekly productivity reports

### Best Practices
- Set realistic event durations
- Use categories consistently
- Schedule breaks between long sessions
- Review and adjust based on AI insights

### Keyboard Shortcuts
- **Today**: Quickly return to current date
- **Arrow Keys**: Navigate between dates
- **Escape**: Close modals/dialogs

## 🔄 Regular Maintenance

### Weekly Tasks
- Review productivity metrics
- Apply AI suggestions
- Clean up old events
- Adjust time blocks

### Monthly Tasks
- Analyze productivity trends
- Update preferences
- Review calendar insights
- Optimize recurring events

## 🆘 Need Help?

### Resources
- 📖 **Full Documentation**: `README.md`
- 🏗️ **Project Structure**: `PROJECT_STRUCTURE.md`
- 🔧 **Configuration**: `backend/.env.example`

### Support
- Check the console for error messages
- Verify all services are running
- Review the troubleshooting section
- Check database connections

## 🎉 You're Ready!

Congratulations! You now have PlanifyAI running with:
- ✅ Smart calendar with multiple views
- ✅ AI-powered scheduling assistance
- ✅ Productivity analytics
- ✅ Intelligent time management

Start by creating a few events and let the AI help you optimize your schedule! 🚀

---

**Happy Planning with PlanifyAI!** 📅✨