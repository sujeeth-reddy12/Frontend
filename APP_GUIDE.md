# Buying Web App

A modern, responsive shopping web application built with React and designed with a clean, professional UI.

## Features

### 🔐 Authentication
- **Login/Register Page**: Centered card design with gradient background
  - Welcome title: "Welcome to Your Dashboard"
  - Green Register button
  - Login link for existing users
  - Form validation with error messages
  - Responsive design for all screen sizes

### 🏠 Home/Dashboard Page (After Login)
- **Top Navigation Bar**: Logo and logout button
- **Search Bar**: Search products by name or keyword
- **Advanced Filters**:
  - Type dropdown (Electronics, Clothing, Food, Other)
  - Weight filter (in kgs) for product filtering
- **Clean, Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Navigation Links**: Quick access to view products, update profile, and account management

## Technology Stack

- **Frontend**: React 19
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Styling**: CSS3 with responsive design
- **UI Framework**: Bootstrap 5 (optional for additional components)

## Getting Started

### Prerequisites
- Node.js and npm installed
- Backend API running on `http://localhost:8080`

### Installation

1. Clone or navigate to the project directory:
```bash
cd something
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## Project Structure

```
src/
├── App.js                 # Main app routing
├── DashBoard.jsx          # Login/Register landing page
├── DashBoard.css          # Landing page styles
├── Login.jsx              # Login component
├── Register.jsx           # Register component
├── Auth.css               # Login/Register styles
├── Home.jsx               # Home page with search and filters
├── Home.css               # Home page styles
├── App.css                # App-wide styles
├── index.css              # Global styles
└── index.js               # React DOM entry point
```

## Usage

### First-Time User
1. Visit the app at `http://localhost:3000`
2. Click the **Register** button
3. Fill in username, email, and password
4. Submit to register
5. Use your credentials to login

### Existing User
1. Visit the app
2. Click the **Login** link
3. Enter your credentials
4. Access the home page with search and filter functionality

### Search and Filter
- Use the **search bar** to find products by name
- Select a **type** from the dropdown to filter by category
- Enter a **weight limit** to filter products by maximum weight
- Combine filters for more specific results

## Backend API Requirements

The app expects the following API endpoints:

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /view?data=username` - Get user details
- `GET /viewAll` - Get all products (for View All link)
- Other endpoints for delete and update operations

## Responsive Design Features

- ✅ Mobile-first design
- ✅ Optimized for screens 480px and above
- ✅ Tablet-friendly layout (768px+)
- ✅ Desktop experience (1200px+)
- ✅ Touch-friendly buttons and inputs
- ✅ Smooth transitions and animations

## Styling Highlights

- **Color Scheme**: Purple gradient (Primary: #667eea, Secondary: #764ba2, Accent: #22c55e)
- **Typography**: Clean, modern sans-serif fonts
- **Spacing**: Consistent padding and margins
- **Shadows**: Subtle depth with professional shadows
- **Interactions**: Hover effects, focus states, and smooth transitions

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Environment Variables

If you need to change the API endpoint, update the axios calls in:
- `Login.jsx` (line 32)
- `Register.jsx` (line 29)
- `Home.jsx` (line 18)

## Future Enhancements

- [ ] Product listing and details view
- [ ] Shopping cart functionality
- [ ] Order history
- [ ] User profile management
- [ ] Payment integration
- [ ] Product reviews and ratings
- [ ] Wishlist feature
- [ ] Admin dashboard

## Troubleshooting

### "Cannot POST /login" error
- Ensure your backend API is running on port 8080
- Check that the API endpoints match the application

### Login/Register not working
- Verify the backend API is responding correctly
- Check browser console for detailed error messages

### Styling not loading
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Ensure CSS files are in the src/ directory

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check:
1. Browser console (F12) for error messages
2. Network tab to verify API calls
3. LocalStorage for authentication tokens
