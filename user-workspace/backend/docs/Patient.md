# Patient Model Documentation

## Overview
The Patient model defines the schema for patient records in the database. It includes various fields that capture essential information about each patient.

## Schema Fields

- **fullName** (String, required): The full name of the patient.
  - Validation: Must not exceed 100 characters.
  
- **age** (Number, required): The age of the patient.
  - Validation: Must be a positive number and cannot exceed 150.

- **gender** (String, required): The gender of the patient.
  - Validation: Must be one of the following values: 'male', 'female', 'other'.

- **phone** (String, required): The phone number of the patient.
  - Validation: Must not exceed 20 characters.

- **email** (String, optional): The email address of the patient.
  - Validation: Must be a valid email format.

- **address** (String, optional): The address of the patient.
  - Validation: Must not exceed 200 characters.

- **labId** (ObjectId, required): The ID of the lab associated with the patient.
  - Validation: Must reference a valid Lab document.

- **lastTestType** (String, optional): The type of the last test conducted for the patient.

- **createdAt** (Date): The date when the patient record was created.
  - Default: Current date and time.

- **updatedAt** (Date): The date when the patient record was last updated.
  - Default: Current date and time.

## Indexes
- An index is created on `labId` for faster queries.
- An index is created on `phone` for faster queries.
- An index is created on `email` for faster queries.
