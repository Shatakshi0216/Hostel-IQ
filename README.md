# HostelIQ 🏨
### Smart Room & Roommate Allocation Platform

HostelIQ is an automated, MERN-stack hostel room allocation platform designed with a modern, clean, Vercel-inspired interface. It replaces traditional manual placement with an intelligent matching algorithm that pairs students based on lifestyle compatibility, academic year occupancy rules, and merit-based criteria.

---

## 🌟 Key Features

### 🔑 Role-Based Access Scoping
* **SuperAdmin (Council of Wardens)**: Global access to manage all hostels, adjust allocation rules, and trigger the matching engine.
* **HostelAdmin (Warden)**: Association restricted specifically to their `managedHostelId` (e.g., Tagore Hall Warden cannot access Sarojini Hall rooms or student data).

### 🎓 Academic Year Occupancy Rules
The matching engine automatically groups and allocates rooms based on academic year capacity limits:
* **1st Year Students**: Placed in 3-sharing rooms (Capacity = 3)
* **2nd & 3rd Year Students**: Placed in 2-sharing rooms (Capacity = 2)
* **4th Year Students**: Placed in single-occupancy rooms (Capacity = 1)

### 👥 Compatibility & Roommate Preference Warnings
* **Merit Difference Warning**: If a student selects a preferred roommate with a CGPA mismatch of $\ge 2.0$, a warning alert is displayed:
  > ⚠️ *High merit difference. They might not qualify for the same hostel block.*
* **Compatibility Scoring (Max 100)**: Evaluates sleeping schedule, wake-up times, cleanliness habits, study methods, social tendencies, and music preferences to pair compatible peers.

### 📊 Regional Priority Score
* Calculates student priority rankings based on weight criteria including CGPA, Academic Year, Special Category status, and **Regional Contribution** (weighted distance mapping).

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Lucide React, Recharts
* **Backend**: Node.js, Express.js, Mongoose
* **Database**: MongoDB (Local / Atlas Cloud)
* **Hosting**: Vercel (Frontend) & Render (Backend)

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/ankit1824/Hostel-IQ.git
cd Hostel-IQ
```

### 2. Set up the Backend
Create a `.env` file inside the `backend/` folder:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/hosteliq
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```
Install dependencies and seed the database:
```bash
cd backend
npm install
node utils/seeder.js  # Seeds default hostels, rooms, wardens, and 15 students
npm run dev           # Starts API server on port 5001
```

### 3. Set up the Frontend
Open a new terminal window at the root folder:
```bash
cd frontend
npm install
npm run dev           # Starts React frontend on port 3000
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔐 Default Credentials for Testing

Use the following seeded accounts to log in:
* **Super Admin (Council of Wardens)**: 
  * Email: `admin@hosteliq.com` | Password: `admin123`
* **Warden (Tagore Hall)**: 
  * Email: `warden_tagore@hosteliq.com` | Password: `warden123`
* **Student**: 
  * Email: `rahul@gmail.com` | Password: `password123`

---

## ☁️ Cloud Deployment Configuration

This project is configured for split MERN stack hosting:

### Backend (Render)
* **Root Directory**: `backend`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Environment Variables**:
  * `NODE_ENV`: `production`
  * `MONGODB_URI`: `<your_mongodb_atlas_connection_string>`
  * `JWT_SECRET`: `<your_production_secret>`

### Frontend (Vercel)
* **Root Directory**: `frontend`
* **Environment Variables**:
  * `VITE_API_URL`: `<your_render_backend_url>/api`
