\
# Shoppr - Full-Stack POS & Inventory Management Application

> A comprehensive Point-of-Sale (POS) and inventory management system built with the MERN stack (MongoDB, Express, React, Node.js) and styled with Tailwind CSS.

<!-- Optional: Add a screenshot or GIF demo here -->
<!-- ![Shoppr Dashboard Demo](link-to-your-screenshot.png) -->

## Table of Contents

*   [Overview](#overview)
*   [Features](#features)
    *   [Frontend](#frontend)
    *   [Backend](#backend)
*   [Tech Stack](#tech-stack)
    *   [Frontend](#frontend-1)
    *   [Backend](#backend-1)
*   [Project Structure](#project-structure)
*   [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
    *   [Running Locally](#running-locally)
*   [API Endpoints Overview](#api-endpoints-overview)
*   [Deployment](#deployment)

## Overview

Shoppr is a web application designed to help businesses manage their inventory, process sales transactions, track customer data, and gain insights into their sales performance. It features a responsive user interface with dark mode support, built using React and Tailwind CSS, communicating with a robust Node.js/Express backend API connected to a MongoDB database.

## Features

### Frontend

*   **Dashboard:** Overview of key metrics (sales, customers), sales trends chart, recent transactions, and trending items.
*   **Inventory Management:** CRUD operations for products (Add, View, Edit, Delete). Real-time search functionality.
*   **Billing:** Create new invoices by selecting products from inventory, adding customer details, applying extra charges, and calculating totals.
*   **Print Invoice:** Generate and print invoices for completed transactions.
*   **Transactions:** View transaction history with filtering options (date range, payment mode, search by customer/ID).
*   **Accounts:** Detailed view of sales metrics, including total sales, transaction count, unique customers, average transaction value, and sales distribution by payment mode (visualized with a Doughnut chart).
*   **Profile Management:** View and update admin user profile details.
*   **Authentication:** Secure JWT-based login and registration for admin users.
*   **Responsive Design:** UI adapts to different screen sizes (desktop, tablet, mobile).
*   **Dark Mode:** Theme toggling for user preference (implementation likely via ThemeContext and Tailwind's `dark:` variants).

### Backend

*   **RESTful API:** Built with Express.js and Node.js.
*   **Authentication & Authorization:** JWT-based authentication middleware to protect routes. Handles admin registration and login.
*   **Database:** MongoDB with Mongoose ODM for data modeling and interaction.
*   **CRUD Operations:** API endpoints for managing Products, Transactions, and User Profiles.
*   **Error Handling:** Centralized error handling middleware.
*   **Environment Variables:** Configuration managed via `.env` files.

## Tech Stack

### Frontend

*   **React:** JavaScript library for building user interfaces.
*   **React Router:** For client-side routing.
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **React Context API:** For global state management (e.g., Authentication, Theme).
*   **Chart.js & react-chartjs-2:** For data visualization (Line and Doughnut charts).
*   **React Icons:** For UI icons.
*   **Axios/Fetch API:** For making HTTP requests to the backend.
*   **(Build Tool):** Likely Create React App (`react-scripts`) or Parcel.

### Backend

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web framework for Node.js.
*   **MongoDB:** NoSQL database.
*   **Mongoose:** Object Data Modeling (ODM) library for MongoDB.
*   **JSON Web Token (JWT):** For generating authentication tokens.
*   **bcrypt:** For password hashing.
*   **cors:** Middleware for enabling Cross-Origin Resource Sharing.
*   **dotenv:** For loading environment variables from `.env` files.

## Project Structure

```
/FullStack
|-- /frontend
|   |-- /node_modules
|   |-- /public
|   |-- /src
|   |   |-- /assets
|   |   |-- /components        # Reusable UI components (DashboardSidePanel, InvoiceTemplate, Modal, Notification, etc.)
|   |   |-- /context         # React Context files (AuthContext, ThemeContext)
|   |   |-- /hooks           # Custom hooks (if any)
|   |   |-- /pages           # Page-level components (Dashboard, Inventory, Billing, etc.)
|   |   |-- App.js           # Main application component with routing
|   |   |-- index.css        # Global styles / Tailwind base
|   |   |-- index.js         # Entry point
|   |-- .env               # Frontend environment variables (API URL)
|   |-- .postcssrc         # PostCSS configuration (for Tailwind)
|   |-- package.json
|   |-- package-lock.json
|   `-- tailwind.config.js # Tailwind configuration
|
`-- /backend
    |-- /node_modules
    |-- /config            # Database connection, etc.
    |-- /controllers       # Request handling logic
    |-- /middlewares       # Authentication, error handling, etc.
    |-- /models            # Mongoose schemas (User, Product, Transaction)
    |-- /routes            # API route definitions
    |-- .env               # Backend environment variables (DB URI, JWT Secret, Port)
    |-- package.json
    |-- package-lock.json
    `-- server.js          # Backend entry point
```

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   **Node.js:** v18.x or later recommended (Ensure npm is also installed).
*   **MongoDB:** A running MongoDB instance (local or cloud-based like MongoDB Atlas).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd FullStack
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

### Environment Variables

Environment variables are required for both the frontend and backend. Create `.env` files in the respective directories and add the necessary variables.

**1. Backend (`backend/.env`):**

   Create a `.env` file in the `/backend` directory:

   ```env
   PORT=4000
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_strong_jwt_secret>
   ```

   *   Replace `<your_mongodb_connection_string>` with your actual MongoDB connection string.
   *   Replace `<your_strong_jwt_secret>` with a secure, random string for signing JWTs.

**2. Frontend (`frontend/.env`):**

   Create a `.env` file in the `/frontend` directory:

   ```env
   REACT_APP_API_BASE_URL=http://localhost:4000
   ```

   *   This should point to where your backend server is running. Use `http://localhost:4000` for local development.

### Running Locally

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm start
    # Or potentially: npm run dev (if you have a dev script with nodemon)
    ```
    The backend server should start, typically on port 4000 (or the one specified in `backend/.env`).

2.  **Start the Frontend Development Server:**
    Open a *new* terminal window/tab.
    ```bash
    cd frontend
    npm start
    ```
    The frontend development server should start, typically on port 3000, and open the application in your browser.

## API Endpoints Overview

The backend provides the following main API routes:

*   `/api/admin/register`: (POST) Register a new admin user.
*   `/api/admin/login`: (POST) Log in an admin user, returns JWT.
*   `/api/admin/profile`: (GET, PUT) Get or update the logged-in admin's profile.
*   `/api/products`: (GET, POST) Get all products or add a new product.
*   `/api/products/:id`: (GET, PUT, DELETE) Get, update, or delete a specific product.
*   `/api/transactions`: (GET, POST) Get all transactions or create a new transaction (bill).
*   `/api/transactions/:id`: (GET, DELETE) Get or delete a specific transaction.

*(Note: Routes are protected by JWT authentication where appropriate).*

## Deployment

*   **Frontend:** Designed for deployment on platforms like Vercel or Netlify. Remember to set the `REACT_APP_API_BASE_URL` environment variable in the deployment platform's settings to point to your *deployed* backend URL. If build fails due to memory (SIGSEGV), set the `NODE_OPTIONS` environment variable to `--max-old-space-size=4096` (or higher if needed) in the platform settings.
*   **Backend:** Can be deployed on platforms like Render, Heroku, or any Node.js hosting service. Ensure the `PORT`, `MONGO_URI`, and `JWT_SECRET` environment variables are set correctly on the deployment platform.

---

*Feel free to add more sections like Contributing Guidelines, License, or detailed API documentation.*
