# Club Management System

A comprehensive web-based admin panel for club management with role-based access control and modern UI.

## Features

### 🔐 User Authentication & Authorization

- JWT-based authentication
- Role-based access control (Admin, Senior Council, Junior Council, Board Members)
- Secure password management
- Session management

### 🧭 Role-Based Dashboard

- **Admin**: Full system access, user management, performance monitoring
- **Senior Council**: Team oversight, task management, performance reports
- **Junior Council**: Domain-specific management, team coordination
- **Board Members**: Task viewing, personal performance tracking

### 📊 Core Modules

#### Dashboard

- Performance metrics with 7/30 day filters
- Activity summaries and engagement levels
- Attendance graphs and task completion rates
- Role-specific content rendering

#### Tasks Management

- Create, edit, delete tasks with role-based permissions
- Priority levels (Low, Medium, High)
- Status tracking (Pending, In Progress, Completed, Overdue)
- Domain-specific filtering
- Due date management and notifications

#### Users Management

- Complete user lifecycle management
- Role-based user visibility
- Profile management with avatars
- Account status monitoring

#### People Tracking

- Team progress monitoring
- Performance metrics
- Attendance tracking
- Task assignment capabilities

#### Notes System

- Create and manage notes with permissions
- Purpose categorization (Meeting, Project, General, Announcement)
- Priority levels and tagging
- Public/private visibility controls

#### Reports & Analytics

- Performance reports with role-based access
- Team and individual analytics
- Task submission trends
- Event attendance tracking
- Export capabilities

#### Settings

- Profile customization
- Theme preferences (Light/Dark/System)
- Language settings
- Notification preferences
- Security settings

## 🛠️ Technical Stack

### Backend

- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Authentication**: Django Simple JWT 5.3.0
- **Database**: SQLite
- **CORS**: django-cors-headers 4.3.1
- **Image Processing**: Pillow 10.1.0

### Frontend

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **UI Library**: ShadCN UI with Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router DOM 6.26.2
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts 2.12.7
- **Animations**: Framer Motion

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd guild-hub-control-main

```

2. **Backend Setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

python manage.py runserver
```

3. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev

```

4. **Access the Application**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

## 📁 Project Structure

```ini
guild-hub-control-main/
├── backend/
│   ├── clubManagement/          # Django project settings
│   ├── users/                   # User management app
│   ├── tasks/                   # Task management app
│   ├── notes/                   # Notes system app
│   ├── reports/                 # Reports and analytics app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React contexts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and API client
│   │   ├── pages/               # Page components
│   │   └── App.tsx              # Main application component
│   └── package.json
└── README.md

```

## 🎨 UI/UX Features

### Design System

- **Light Theme**: White primary, Orange/Blue/Green accents
- **Dark Theme**: Dark Navy Blue primary, Light Blue/Muted Orange accents
- **Typography**: Clean sans-serif fonts (Inter, Poppins)
- **Components**: Professional UI with soft shadows, 2xl rounded corners
- **Responsive**: Desktop, tablet, and mobile support

### User Experience

- Intuitive navigation with role-specific sidebars
- Real-time data updates and loading states
- Toast notifications for user feedback
- Form validation and error handling
- Accessibility features

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Token refresh

### Users

- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `GET /api/auth/users/` - List users (role-based)
- `PUT /api/auth/users/{id}/` - Update user

### Tasks

- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task

### Notes

- `GET /api/notes/` - List notes
- `POST /api/notes/` - Create note
- `GET /api/notes/{id}/` - Get note details
- `PUT /api/notes/{id}/` - Update note
- `DELETE /api/notes/{id}/` - Delete note

### Reports

- `GET /api/reports/` - List reports
- `GET /api/reports/dashboard-metrics/` - Dashboard metrics
- `GET /api/reports/user-performance/` - User performance
- `GET /api/reports/team-performance/` - Team performance

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection protection
- XSS protection

## 📈 Performance

- Optimized database queries
- Efficient API responses
- Frontend code splitting
- Lazy loading of components
- Caching strategies

## 🧪 Testing

### Backend Testing

```bash
cd backend
python manage.py test

```

### Frontend Testing

```bash
cd frontend
npm test

```

## 🚀 Deployment

### Backend Deployment

1. Set `DEBUG = False` in settings.py
2. Configure production database
3. Set up environment variables
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- Role-based access control
- Task management system
- User management
- Reports and analytics
- Modern responsive UI
