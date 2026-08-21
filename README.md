# TravelMate Pro

TravelMate Pro is a full-stack travel management and booking platform designed to help customers discover destinations, hotels, tours, activities, and transportation while providing administrators and travel agents with tools to manage the travel business.

The application includes travel booking, payments, refunds, customer support, messaging, notifications, AI-powered travel assistance, agent management, and business analytics.

## 🚀 Key Features

### 👤 Customer

- User registration and login
- JWT-based authentication
- Browse travel destinations
- Explore hotels and accommodations
- Explore tours and activities
- Book hotels, tours, activities, and transportation
- Online payment through Stripe
- View booking history
- Cancel bookings
- Request refunds
- Track refund status
- Customer support ticket creation
- Communicate through messaging
- Notifications
- AI travel assistant
- AI-powered itinerary generation
- Travel recommendations

### 🛠️ Admin

- Admin dashboard
- User management
- Customer management
- Hotel management
- Tour management
- Activity management
- Transportation management
- Booking management
- Payment management
- Refund request management and processing
- Customer support ticket management
- Reply to customer support tickets
- Messaging management
- Notification management
- Coupon management
- Membership management
- Travel agent management
- Lead management
- Commission tracking
- Business analytics
- Reports and analytics

### 🧳 Travel Agent

- Agent profile
- Agency information
- Verification status
- Customer management
- Customer-agent linking
- Lead management
- Destination interests
- Lead follow-up tracking
- Booking-related commission tracking
- Commission status management

## 🤖 AI Integration

TravelMate Pro integrates a local AI assistant using **Ollama**.

The AI assistant is designed specifically for travel-related conversations.

It can help users with:

- Destination recommendations
- Hotel recommendations
- Tour recommendations
- Activity suggestions
- Trip planning
- Itinerary generation
- Transportation guidance
- Travel budgets
- Travel tips
- Places to visit
- Travel-related food recommendations

The AI is restricted to TravelMate-related use cases and does not operate as a general-purpose chatbot.

### AI Technology

- Ollama
- Qwen 3 model
- Local AI inference
- FastAPI AI service integration
- Structured JSON generation for itineraries

The AI integration helps keep travel assistance local while allowing TravelMate Pro to provide personalized travel guidance.

## 💳 Payment & Refund System

TravelMate Pro uses **Stripe** for online payments.

The payment system supports:

- Checkout
- Payment status tracking
- Payment history
- Stripe payment intents
- Stripe checkout sessions
- Transaction records
- Refund requests
- Admin refund approval/rejection
- Stripe refund processing
- Partial refunds
- Full refunds
- Refund notifications

## 🛠️ Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- MySQL
- Pydantic
- JWT Authentication
- Python-Jose
- Passlib / Bcrypt
- Uvicorn
- Alembic
- HTTPX

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- Lucide React
- React Hot Toast

### Database

- MySQL
- SQLAlchemy ORM
- Alembic migrations

### Payment

- Stripe

### AI

- Ollama
- Qwen 3

### Development Tools

- Git
- GitHub
- VS Code
- MySQL Workbench
- Postman

## 👥 Application Roles

TravelMate Pro uses role-based access control.

### CUSTOMER

Customers can:

- Browse travel services
- Create bookings
- Make payments
- Cancel bookings
- Request refunds
- Create support tickets
- Send messages
- Use the AI travel assistant
- Manage their profile and travel activity

### TRAVEL AGENT

Travel agents can:

- Manage their agent profile
- Manage customers
- Manage leads
- Track follow-ups
- Track commissions
- Assist customers with travel services

### ADMIN

Administrators manage the complete TravelMate Pro platform.

Admins can:

- Manage users
- Manage travel services
- Manage bookings
- Manage payments
- Process refunds
- Resolve support tickets
- Manage agents
- Manage leads
- Manage commissions
- Manage coupons
- Manage memberships
- View business analytics
- Manage platform operations

## 📁 Project Structure

```text
travelmate-pro/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── dependencies/
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── README.md
└── .gitignore
