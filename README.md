# Pathology Lab SaaS Backend

## Description
Backend API for Pathology Lab SaaS Application.

## Installation Instructions
1. Ensure you have Node.js version 14.0.0 or higher installed.
2. Clone the repository and navigate to the backend directory.
3. Run the following command to install dependencies:
   ```bash
   npm install
   ```

## Deployment
The backend is deployed at: [https://path-lab-mvp.onrender.com](https://path-lab-mvp.onrender.com)

## Usage
- To start the application, run:
  ```bash
  npm start
  ```
- For development mode, use:
  ```bash
  npm run dev
  ```

## API Endpoints
- **GET /api/labs**: Retrieve a list of labs.
- **POST /api/labs**: Create a new lab.
- **GET /api/patients**: Retrieve a list of patients.
- **POST /api/patients**: Create a new patient.
- Refer to the routes defined in the backend for detailed information.

## Frontend Overview
The frontend is built using React and includes the following key components:
- **CreateLab**: Component for creating new labs.
- **CreateUser**: Component for creating new users.
- **ProtectedRoute**: Component for protecting routes that require authentication.

## Dependencies
- **Express**: Web framework for Node.js.
- **Mongoose**: MongoDB object modeling tool.
- **Bcryptjs**: Password hashing library.
- **Cors**: Middleware for enabling CORS.
- **Dotenv**: Module for loading environment variables.
- **Helmet**: Security middleware for Express.
- **Morgan**: HTTP request logger middleware.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the ISC License.

## Contact Information
For inquiries, please reach out to the project maintainer.
