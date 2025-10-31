# farmasiKu - Mobile App Prototype

A symptom-based medication recommendation mobile app prototype built with React + Vite.

## Features

1. **Symptom Selection**
   - Body part selection (Skin, Feet, Head, etc.)
   - Multiple symptom selection
   - Support for adding more symptoms

2. **Symptom Confirmation**
   - Display all selected symptoms
   - Ask about symptom severity
   - Redirect severe cases to online doctor consultation

3. **Medication Recommendation**
   - Intelligent medication recommendation based on symptoms
   - Display medication names and prices (RM)
   - One-click ordering functionality

4. **Order Confirmation**
   - Display order success information
   - Estimated delivery time (30 minutes)

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool
- **CSS3** - Mobile-first Responsive Design

## Installation and Running

### Prerequisites

- Node.js 14+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
farmasiKu/
├── src/
│   ├── components/          # React Components
│   │   ├── BodyPartSelection.jsx
│   │   ├── SymptomSelection.jsx
│   │   ├── SymptomConfirmation.jsx
│   │   ├── MedicationRecommendation.jsx
│   │   ├── ConsultationRedirect.jsx
│   │   └── OrderSuccess.jsx
│   ├── data/
│   │   └── appData.js       # App data (body parts, symptoms, medications)
│   ├── styles/              # Global styles
│   │   ├── index.css
│   │   └── App.css
│   ├── App.jsx              # Main app component
│   └── main.jsx             # App entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## User Flow

1. **Select Body Part** - User selects the body part where they feel discomfort
2. **Select Symptoms** - Choose from the symptom list for that body part (multiple selections allowed)
3. **Add More Symptoms** - Option to select other body parts to add more symptoms
4. **Confirm Symptoms** - Confirm selected symptoms and assess severity
5. **Medication Recommendation** - Recommend medications based on symptoms
6. **Order** - Click "Order Now" to complete purchase
7. **Success Page** - Display order success and estimated delivery time

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

## Future Development Suggestions

- [ ] Add user login/registration functionality
- [ ] Implement real payment system
- [ ] Add order history
- [ ] Implement medication search
- [ ] Add user rating system
- [ ] Integrate real doctor consultation platform
- [ ] Add push notification functionality
- [ ] Implement order tracking

## License

MIT License
