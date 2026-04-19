# Photography Quotation Website

A full-stack responsive web application for photography businesses to collect client quotation requests and generate automatic pricing estimates. Built with React, Firebase, and Tailwind CSS.

## Features

### Client Side
- **Google Forms-like Interface**: Clean, minimal design with card-based layout
- **Structured Form Sections**:
  - Basic Details (Name, Email, Phone)
  - Event Details (Type, Date, Location)
  - Photography Requirements (Services, Duration, Budget)
  - Additional Details (Special Requests, Reference Images)
- **Auto Pricing Calculation**: Real-time price estimation based on selections
- **Responsive Design**: Works on mobile and desktop
- **File Upload**: Support for reference images (stored in Firebase Storage)

### Admin Dashboard
- **Authentication**: Secure login for administrators
- **Submissions Management**: View all quotation requests
- **Filtering & Search**: Filter by event type and date
- **Status Tracking**: Mark submissions as contacted
- **Data Export**: Export submissions to CSV
- **Statistics**: Overview of total quotations and values

### Pricing Logic
- **Base Prices**: Different rates for Wedding, Pre-wedding, Birthday, Corporate, Others
- **Service Add-ons**: Photography, Videography, Drone, Album
- **Duration Multipliers**: Half Day (×1), Full Day (×1.5), Multi-Day (×2.5)
- **Location Costs**: +₹5,000 for locations outside Hyderabad
- **Discounts**: 10% off for 3+ services
- **Seasonal Pricing**: 20% increase for Nov-Dec-Jan events

## Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Routing**: React Router
- **Build Tool**: Vite
- **Deployment**: Ready for Vercel/Netlify

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd photography-quotation
npm install
```

### 2. Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Enable Firebase Authentication (Email/Password)
4. Enable Firebase Storage
5. Get your Firebase config from Project Settings

### 3. Update Firebase Config
Edit `src/firebase.js` with your Firebase configuration:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Create Admin User
In Firebase Console > Authentication > Users, create an admin user with email/password.

### 5. Run the Application
```bash
npm run dev
```
Open http://localhost:5173 to view the client form.
Visit http://localhost:5173/admin for the admin dashboard.

### 6. Build for Production
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── QuotationForm.jsx      # Client quotation form
│   └── AdminDashboard.jsx     # Admin management interface
├── firebase.js                # Firebase configuration
├── App.jsx                    # Main app with routing
├── index.css                  # Tailwind CSS imports
└── main.jsx                   # App entry point
```

## Customization

### Pricing Logic
Modify the pricing constants in `src/components/QuotationForm.jsx`:
- `eventTypes`: Base prices for different event types
- `services`: Add-on service prices
- `durations`: Duration multipliers
- `calculatePrice` function: Business logic for price calculation

### Styling
The app uses Tailwind CSS. Customize colors and styles by modifying the Tailwind classes in the components.

### Form Fields
Add or modify form fields by updating the `formData` state and form JSX in `QuotationForm.jsx`.

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Set environment variables for Firebase config if needed

### Firebase Security Rules
Add Firestore and Storage security rules in Firebase Console:

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quotations/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reference-images/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
