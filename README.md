EduLens: MERN Stack Course Management System
Project Overview
EduLens is a full-stack Learning Management System (LMS) designed for teachers to securely manage, organize, and deliver curriculum-aligned resources to students. This application demonstrates complex integration between a modern frontend framework (React) and a Node.js API, featuring robust user authentication and dynamic data handling.

Key Features Implemented 🚀
Full-Stack Course Management (CRUD): Teachers can create, view, edit, and delete course units.

Dynamic Syllabus Upload: Supports conditional resource storage, allowing teachers to either upload a PDF/document file or paste/type plain text syllabus content.

Secure Authentication (JWT): Implements JSON Web Token (JWT) based login and registration with bcrypt password hashing for security.

External API Integration (YouTube Data API): The "View Resources" page dynamically searches and recommends YouTube videos based on the course's subject and unit title.

Pagination & Search: Efficiently displays course listings with pagination and a full-text search capability across Class, Subject, and Unit Title.

File Handling & Cleanup: Uses Multer to manage file uploads and securely deletes files from the server when a course is removed.

Technical Stack
Area	Technology	Purpose
Frontend	React (Class Components)	User Interface and Dynamic Content Rendering.
Styling	Material-UI (MUI)	Component library for consistent, modern design.
Routing	React Router DOM v6	Client-side navigation between Login, Register, and Dashboard.
Backend	Node.js & Express.js	Server environment and routing/API creation.
Database	MongoDB & Mongoose	Flexible NoSQL database and Object Data Modeling (ODM).
Security	JWT & bcrypt	Token-based user authentication and password hashing.

Export to Sheets
Setup and Installation Guide
Follow these steps to get the project running locally on your machine.

Prerequisites
You must have the following installed:

Node.js & npm (Node Package Manager)

MongoDB Community Server (running locally on port 27017)

YouTube Data API Key (from Google Cloud Console)

Step 1: Clone the Repository
Open your terminal or command prompt and clone the project:

Bash

git clone https://github.com/pranjalsharmaaaa/CollegeProject.git
cd CollegeProject
Step 2: Configure the API Key
Open the backend/server.js file and locate the YOUTUBE_API_KEY variable.

JavaScript

// Change this line:
const YOUTUBE_API_KEY = 'YOUR_API_KEY_HERE';

// To your actual key:
const YOUTUBE_API_KEY = 'AIzaSyDFjBotODaBr7-N3tQWXbEpWX-WYE7_4yw'; 
(Note: In a production environment, this key would be stored in a .env file for security, but direct inclusion is fine for a college demo.)

Step 3: Install Dependencies
You must install dependencies for both the backend server and the frontend application.

Bash

# 1. Install Backend dependencies
cd backend
npm install

# 2. Install Frontend dependencies (using the necessary legacy flag)
cd ../frontend 
npm install --legacy-peer-deps
Step 4: Run the Application
You need to run both servers simultaneously in two separate terminal windows.

Server	Terminal Command	Status
Backend (API)	cd backend then npm start	Runs on http://localhost:2000
Frontend (UI)	cd frontend then npm start	Runs on http://localhost:3000

Export to Sheets
Testing and Initial Use
Open your browser to http://localhost:3000.

Click Register to create a new user account (e.g., testuser / 123456).

The system will automatically log you in and redirect you to the Teacher Dashboard.

Click "Add Course" to test the conditional file and text submission feature.

### Do not forget to leave a star! :hugs:
