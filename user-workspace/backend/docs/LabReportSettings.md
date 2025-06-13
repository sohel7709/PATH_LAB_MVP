# Lab Report Settings Model Documentation

## Overview
The Lab Report Settings model defines the schema for lab report settings records in the database. It includes various fields that capture essential information about the settings for lab reports.

## Schema Fields

- **labId** (ObjectId, required): The ID of the lab associated with the report settings.
  - Validation: Must reference a valid Lab document.

- **reportFormat** (String, required): The format of the lab report (e.g., PDF, HTML).
  - Validation: Must not exceed 50 characters.

- **defaultTemplate** (ObjectId, optional): The ID of the default test template to be used for reports.
  - Validation: Must reference a valid TestTemplate document.

- **createdAt** (Date): The date when the lab report settings record was created.
  - Default: Current date and time.

- **updatedAt** (Date): The date when the lab report settings record was last updated.
  - Default: Current date and time.

## Indexes
- An index is created on `labId` for faster queries.
