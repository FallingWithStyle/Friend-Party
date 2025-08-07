# Database Initialization (init.sql) Guide

This guide provides instructions for maintaining the `init.sql` file to ensure it remains idempotent and easy to manage, especially when dealing with mock data for development and testing.

## 1. Idempotency

The `init.sql` script is designed to be **idempotent**, which means it can be run multiple times without changing the result beyond the initial application. This is crucial for creating a consistent database state across all development and testing environments.

### Key Principles for Idempotency:

*   **Use `IF NOT EXISTS` for Creation**: When creating tables, functions, or other database objects, always use the `IF NOT EXISTS` clause to prevent errors if the object already exists.
    ```sql
    CREATE TABLE IF NOT EXISTS public.parties (
        -- columns...
    );
    ```

*   **Use `IF EXISTS` for Deletion**: When dropping objects, use `IF EXISTS` to avoid errors if the object is already gone.
    ```sql
    DROP TABLE IF EXISTS public.answers;
    ```

*   **Clear Data Before Seeding**: When seeding data, it's often best to clear any existing data from the table to ensure a clean slate. This prevents duplicate entries and maintains consistency.
    ```sql
    -- Clear existing data first
    DELETE FROM public.questions;

    -- Then, insert the new data
    INSERT INTO public.questions (question_text, question_type, ...) VALUES (...);
    ```

*   **Use `ON CONFLICT` for Inserts**: For data that should be updated if it already exists (based on a primary key or unique constraint), use the `ON CONFLICT` clause.
    ```sql
    INSERT INTO public.stats (id, name) VALUES
    ('STR', 'Strength'),
    ('DEX', 'Dexterity')
    ON CONFLICT (id) DO NOTHING; -- or DO UPDATE SET ...
    ```

## 2. Managing Mock Data

Mock data is essential for testing, but it should be managed carefully to avoid conflicts with production or other developers' environments.

### Best Practices for Mock Data:

*   **Separate Seed Files**: Keep core schema definitions in `init.sql` and place mock data in separate seed files (e.g., `seeds/01_users.sql`, `seeds/02_parties.sql`). This makes it easier to manage and selectively run seeds. The `supabase/seed.sql` file can be used to orchestrate the execution of these files.

*   **Clear and Descriptive Naming**: Use clear names for your mock users and data so they are easily identifiable (e.g., `test_user_1`, `mock_party_alpha`).

*   **Document Mock Data**: Add comments to your seed files explaining the purpose of the mock data. For example, if a user is intended to test a specific scenario (like an incomplete assessment), document it.

### Example: Updating Mock Users

If you need to update a mock user, it's often best to follow the idempotent pattern: delete the user and then re-insert them with the updated information.

```sql
-- In a mock data seed file (e.g., seeds/development/01_mock_users.sql)

-- Remove the specific mock user to ensure a clean state
DELETE FROM public.users WHERE email = 'test.user@example.com';

-- Re-insert the mock user with desired properties
INSERT INTO public.users (id, email, ...)
VALUES ('auth-guid-for-user', 'test.user@example.com', ...);
```

By following these guidelines, you can ensure the `init.sql` script and related seed files are robust, maintainable, and easy for all current and future developers to work with.