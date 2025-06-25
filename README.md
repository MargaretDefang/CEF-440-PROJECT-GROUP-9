# ROAD-MOBILE-APP

A comprehensive React Native mobile application for road sign management and real-time road condition notifications, with a PostgreSQL/Express.js backend.

## 🚀 Features

### Frontend (React Native)
- **User Authentication**: Secure login/registration with JWT
- **Profile Management**: Edit profile, change password, upload avatar
- **Role-based Access**: User and Admin interfaces
- **Real-time Notifications**: Road condition alerts and updates
- **Report System**: Submit and track road issues
- **Interactive Maps**: View road signs and conditions
- **Modern UI**: Beautiful, responsive design with animations

### Backend (Node.js/Express)
- **RESTful API**: Complete CRUD operations
- **JWT Authentication**: Secure token-based auth
- **File Upload**: Avatar image upload with multer
- **PostgreSQL Database**: Robust data storage
- **CORS Support**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error management

## 📱 Screenshots

*Add screenshots of your app here*

## 🛠️ Tech Stack

### Frontend
- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **Expo Image Picker** - Image selection
- **AsyncStorage** - Local storage
- **React Native Animatable** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin support

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Expo CLI
- React Native development environment

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ROAD-MOBILE-APP.git
cd ROAD-MOBILE-APP
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb roadapp

# Run the schema
psql -U postgres -d roadapp -f database/schema.sql

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials
```

### 4. Frontend Setup
```bash
cd ../
npm install
```

### 5. Environment Configuration
Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roadapp
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

## 🏃‍♂️ Running the Application

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## 📊 Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `road_signs` - Road sign reference data
- `road_sign_instances` - Actual signs in the field
- `road_state_notifications` - Real-time road conditions
- `reports` - User-submitted reports
- `notifications` - User-specific notifications

## 🔐 Authentication

The app uses JWT tokens for authentication:
- Tokens are stored in AsyncStorage
- Automatic token refresh
- Server-side logout support
- Role-based access control

## 📁 Project Structure

```
ROAD-MOBILE-APP/
├── app/                    # React Native frontend
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   ├── (admin)/           # Admin screens
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── backend/               # Node.js backend
│   ├── config/           # Database configuration
│   ├── database/         # Database schema and setup
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   └── uploads/          # File uploads
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/avatar` - Upload avatar

### Reports
- `GET /api/reports` - Get reports
- `POST /api/reports` - Create report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React Native community
- Expo team
- PostgreSQL community
- All contributors and testers

## 📞 Support

For support, email support@roadapp.com or create an issue in this repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added avatar upload functionality
- **v1.2.0** - Enhanced UI and performance improvements
