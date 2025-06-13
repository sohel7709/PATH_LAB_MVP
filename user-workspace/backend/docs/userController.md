# User Controller Documentation

## Overview
The User Controller manages user-related operations, including creating, retrieving, updating, and deleting user records.

## Endpoints

### Create User
- **Route**: `POST /api/users`
- **Access**: Private/Super Admin
- **Description**: Creates a new user record.
- **Request Body**:
  - `name` (String, required): The name of the user.
  - `email` (String, required): The email of the user.
  - `password` (String, required): The password for the user account.
  - `role` (String, required): The role of the user (super-admin, admin, technician).
  - `labId` (String, optional): The ID of the lab associated with the user (not applicable for super-admin).
- **Response**: Returns the created user object.

### Get All Users
- **Route**: `GET /api/users`
- **Access**: Private/Super Admin
- **Description**: Retrieves a list of users, filtered by lab or role if specified.
- **Response**: Returns an array of user objects.

### Get Single User
- **Route**: `GET /api/users/:id`
- **Access**: Private/Super Admin
- **Description**: Retrieves a single user record by ID.
- **Response**: Returns the user object.

### Update User
- **Route**: `PUT /api/users/:id`
- **Access**: Private/Super Admin
- **Description**: Updates an existing user record.
- **Request Body**: User details to update.
- **Response**: Returns the updated user object.

### Delete User
- **Route**: `DELETE /api/users/:id`
- **Access**: Private/Super Admin
- **Description**: Deletes a user record by ID.
- **Response**: Returns a success message.
