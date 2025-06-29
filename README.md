# Road Mobile App 🛣️

A comprehensive mobile application for road sign recognition, real-time notifications, and road issue reporting built with React Native, Expo, and Node.js.

## 🚀 Features

### For Users
- **Road Sign Recognition**: Identify and learn about road signs using camera
- **Real-time Notifications**: Get instant updates about road conditions and issues
- **Report System**: Submit road issues with images, location, and descriptions
- **User Authentication**: Secure login/registration system
- **Profile Management**: Update profile information and avatar
- **Location-based Services**: Get notifications relevant to your location

### For Admins
- **Admin Dashboard**: Comprehensive management interface
- **Sign Management**: Add, edit, and delete road signs and categories
- **Report Management**: Review, approve, or reject user reports
- **User Management**: Monitor and manage user accounts
- **Real-time Statistics**: View connected users and system stats
- **Notification Broadcasting**: Send notifications to all users

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Router** for navigation
- **Socket.IO Client** for real-time communication
- **Expo Notifications** for local notifications
- **React Native Animated** for smooth animations
- **Linear Gradient** for beautiful UI effects

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Socket.IO** for real-time notifications
- **JWT** for authentication
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests
- **Helmet** for security headers

## 📱 Screenshots

### User Interface
- Home Screen with road sign recognition
- Report submission with image upload
- Real-time notifications
- User profile management

### Admin Interface
- Dashboard with statistics
- Sign category management
- Report approval system
- User management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- PostgreSQL database
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd ROAD-MOBILE-APP-main
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/road_app
   JWT_SECRET=your-secret-key-here
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Set up the database**
   ```bash
   cd backend
   # Run the database schema
   psql -U username -d road_app -f database/schema.sql
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

7. **Start the frontend**
   ```bash
   # In a new terminal
   npm start
   ```

8. **Run on device/simulator**
   - Scan the QR code with Expo Go app
   - Or press 'a' for Android emulator
   - Or press 'i' for iOS simulator

## 📊 Database Schema

### Users Table
- User authentication and profile information
- User types: user, admin, moderator
- Avatar upload support

### Signs Table
- Road sign information
- Categories and meanings
- Image storage

### Reports Table
- User-submitted road issues
- Status tracking (pending, approved, rejected)
- Image attachments

### Notifications Table
- Real-time notification system
- Multiple notification types
- Read/unread status

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `POST /api/auth/avatar` - Upload avatar

### Reports
- `GET /api/reports` - Get all reports (with pagination)
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report (admin only)
- `DELETE /api/reports/:id` - Delete report (admin only)
- `POST /api/reports/upload-image` - Upload report image

### Signs
- `GET /api/signs` - Get all signs
- `GET /api/signs/categories` - Get sign categories
- `POST /api/signs` - Create new sign (admin only)
- `PUT /api/signs/:id` - Update sign (admin only)
- `DELETE /api/signs/:id` - Delete sign (admin only)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/stats` - Get user statistics
- `GET /api/admin/connected-users` - Get connected users count
- `POST /api/admin/test-notification` - Send test notification

## 🔌 Real-time Features

### Socket.IO Events
- `new_notification` - Receive real-time notifications
- `update_location` - Update user location
- `unread_count` - Get unread notification count

### Notification Types
- `road_sign` - New road sign notifications
- `road_issue_resolved` - Approved report notifications
- `status_update` - Report status changes
- `road_state` - Road condition updates

## 🎨 UI/UX Features

- **Modern Design**: Clean and intuitive interface
- **Smooth Animations**: React Native Animated for fluid transitions
- **Gradient Backgrounds**: Beautiful visual effects
- **Responsive Layout**: Works on different screen sizes
- **Dark/Light Themes**: Adaptive theming
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Server-side validation
- **File Upload Security**: Secure image upload handling
- **Rate Limiting**: API rate limiting protection

## 📱 Mobile Features

- **Camera Integration**: Road sign recognition
- **Location Services**: GPS-based features
- **Push Notifications**: Local notification system
- **Image Upload**: Photo capture and upload
- **Offline Support**: Basic offline functionality
- **Background Sync**: Data synchronization

## 🚀 Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Configure environment variables
3. Deploy to your preferred hosting service (Heroku, AWS, etc.)
4. Set up SSL certificates for HTTPS

### Frontend Deployment
1. Build the app for production
2. Deploy to app stores (Google Play Store, Apple App Store)
3. Configure app signing certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Frontend Development**: React Native & Expo
- **Backend Development**: Node.js & Express
- **Database Design**: PostgreSQL
- **Real-time Features**: Socket.IO
- **UI/UX Design**: Modern mobile design principles

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

### v1.0.0 (Current)
- Complete road sign recognition system
- Real-time notification system
- User report submission
- Admin dashboard
- Image upload functionality
- Socket.IO integration
- PostgreSQL database
- JWT authentication
- Modern UI/UX design

---

**Road Mobile App** - Making roads safer, one sign at a time! 🛣️✨
