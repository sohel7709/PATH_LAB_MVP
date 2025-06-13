# Patient Controller Documentation

## Overview
The Patient Controller manages patient-related operations, including creating, retrieving, updating, and deleting patient records.

## Endpoints

### Create Patient
- **Route**: `POST /api/patients`
- **Access**: Private (super-admin, admin, technician)
- **Description**: Creates a new patient record.
- **Request Body**:
  - `labId` (String, required): The ID of the lab associated with the patient.
  - Other patient details (e.g., name, age, gender, etc.)
- **Response**: Returns the created patient object.

### Get All Patients
- **Route**: `GET /api/patients`
- **Access**: Private (super-admin, admin, technician)
- **Description**: Retrieves a list of patients, filtered by lab if the user is not a super-admin.
- **Response**: Returns an array of patient objects.

### Get Single Patient
- **Route**: `GET /api/patients/:id`
- **Access**: Private (super-admin, admin, technician)
- **Description**: Retrieves a single patient record by ID.
- **Response**: Returns the patient object.

### Update Patient
- **Route**: `PUT /api/patients/:id`
- **Access**: Private (super-admin, admin, technician)
- **Description**: Updates an existing patient record.
- **Request Body**: Patient details to update.
- **Response**: Returns the updated patient object.

### Delete Patient
- **Route**: `DELETE /api/patients/:id`
- **Access**: Private (super-admin, admin)
- **Description**: Deletes a patient record by ID.
- **Response**: Returns a success message.
