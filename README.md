# Authentication Service Application

## Project Overview

This project is an authentication service built using NestJS and MongoDB. It provides secure authentication and authorization features for applications.

## Installation Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd <project-directory>
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables by creating a `.env` file based on the `.env.example` file.

## Usage

To start the application, run:

```bash
npm run start
```

## API Documentation

- **POST /auth/login**: Authenticate a user.
- **POST /auth/register**: Register a new user.
- **GET /auth/profile**: Get the authenticated user's profile.

## Configuration

Ensure the following environment variables are set in your `.env` file:

- `MONGODB_URI`: The connection string for your MongoDB database.
- `JWT_SECRET`: The secret key for signing JWT tokens.

## Contributing

Contributions are welcome! Please follow the [contribution guidelines](CONTRIBUTING.md).

## License

This project is licensed under the MIT License.
