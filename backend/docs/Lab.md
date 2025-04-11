# Lab Model Documentation

## Overview
The Lab model defines the schema for lab records in the database. It includes various fields that capture essential information about each lab.

## Schema Fields

- **name** (String, required): The name of the lab.
  - Validation: Must not exceed 100 characters.

- **location** (String, optional): The physical location of the lab.
  - Validation: Must not exceed 200 characters.

- **contactNumber** (String, optional): The contact number for the lab.
  - Validation: Must not exceed 20 characters.

- **email** (String, optional): The email address for the lab.
  - Validation: Must be a valid email format.

- **createdAt** (Date): The date when the lab record was created.
  - Default: Current date and time.

- **updatedAt** (Date): The date when the lab record was last updated.
  - Default: Current date and time.

## Indexes
- An index is created on `name` for faster queries.
