# farmasiKu - Mobile App Prototype

A symptom-based medication recommendation mobile app prototype built with React + Vite + Supabase.

## Features

1. **Symptom Selection**
   - Body part selection (Skin, Feet, Head, etc.)
   - Multiple symptom selection
   - Support for adding more symptoms
   - Symptom intensity and duration assessment

2. **Symptom Confirmation**
   - Display all selected symptoms
   - Ask about symptom severity
   - Redirect severe cases to online doctor consultation

3. **Medication Recommendation**
   - Intelligent medication recommendation based on symptoms and age
   - Multi-select medications
   - Age-specific safety warnings
   - Display medication names and prices (RM)

4. **Payment System**
   - Credit/Debit card payment
   - E-Wallet payment options
   - Batch payment for multiple medications

5. **Order Confirmation**
   - Display order success information
   - Estimated delivery time (30 minutes)
   - Detailed usage instructions for each medication

6. **Database Integration**
   - Supabase backend for data persistence
   - Consultation history
   - Order history
   - Symptom assessment records

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool
- **Supabase** - Backend as a Service (Database, Auth)
- **CSS3** - Mobile-first Responsive Design

## Installation and Running

### Prerequisites

- Node.js 14+
- npm or yarn
- Supabase account (free tier available)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the database schema SQL (see `database/schema.sql`) in Supabase SQL Editor

For detailed setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 3. Development Mode

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
farmasiKu/
├── src/
│   ├── components/          # React Components
│   │   ├── AgeInput.jsx
│   │   ├── BodyPartSelection.jsx
│   │   ├── SymptomSelection.jsx
│   │   ├── SymptomAssessment.jsx
│   │   ├── SymptomConfirmation.jsx
│   │   ├── MedicationRecommendation.jsx
│   │   ├── Payment.jsx
│   │   ├── OrderSuccess.jsx
│   │   └── ...
│   ├── data/
│   │   └── appData.js       # App data (body parts, symptoms, medications)
│   ├── lib/
│   │   └── supabase.js      # Supabase client configuration
│   ├── services/
│   │   └── databaseService.js  # Database service functions
│   ├── styles/              # Global styles
│   ├── App.jsx              # Main app component
│   └── main.jsx             # App entry point
├── database/
│   └── schema.sql           # Database schema
├── index.html
├── package.json
├── vite.config.js
├── .env.example            # Environment variables template
└── README.md
```

## User Flow

1. **Enter Age** - User enters their age for personalized recommendations
2. **Select Body Part** - User selects the body part where they feel discomfort
3. **Select Symptoms** - Choose from the symptom list for that body part (multiple selections allowed)
4. **Assess Symptoms** - Optionally assess symptom intensity, duration, and frequency
5. **Add More Symptoms** - Option to select other body parts to add more symptoms
6. **Confirm Symptoms** - Confirm selected symptoms and assess severity
7. **Medication Recommendation** - Recommend medications based on symptoms and age
8. **Select Medications** - Multi-select medications to purchase
9. **Payment** - Complete payment for selected medications
10. **Success Page** - Display order success and medication usage instructions

## Database Schema

The application uses the following Supabase tables:

- `user_profiles` - User profile information
- `symptom_assessments` - Symptom assessment records
- `consultations` - Consultation records for severe cases
- `orders` - Order records
- `order_items` - Individual medication items in orders

See `database/schema.sql` for complete schema definition.

## Mobile Adaptation

- Responsive design supporting various screen sizes
- Touch-friendly buttons and interactions
- Mobile-first UI design
- Smooth page transition animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Future Development Suggestions

- [ ] Add user authentication
- [ ] Implement real payment gateway integration
- [ ] Add order history page
- [ ] Implement medication search
- [ ] Add user rating system
- [ ] Integrate real doctor consultation platform
- [ ] Add push notification functionality
- [ ] Implement order tracking
- [ ] Add medication stock management

## License

MIT License
