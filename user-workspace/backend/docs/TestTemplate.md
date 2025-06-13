# Test Template Model Documentation

## Overview
The Test Template model defines the schema for test template records in the database. It includes various fields that capture essential information about each test template.

## Schema Fields

- **name** (String, required): The name of the test template.
  - Validation: Must not exceed 100 characters.

- **sampleType** (String, required): The type of sample required for the test (e.g., Blood, Urine).
  - Validation: Must not exceed 50 characters.

- **category** (String, required): The category of the test (e.g., hematology, biochemistry).
  - Validation: Must not exceed 50 characters.

- **description** (String, optional): A brief description of the test template.
  - Validation: Must not exceed 200 characters.

- **isDefault** (Boolean, required): Indicates whether the test template is a default template.

- **fields** (Array, required): An array of fields associated with the test template, each containing:
  - `parameter` (String, required): The name of the parameter being tested.
  - `unit` (String, required): The unit of measurement for the parameter.
  - `reference_range` (String, required): The reference range for the parameter.

- **createdAt** (Date): The date when the test template record was created.
  - Default: Current date and time.

- **updatedAt** (Date): The date when the test template record was last updated.
  - Default: Current date and time.

## Indexes
- An index is created on `name` for faster queries.
