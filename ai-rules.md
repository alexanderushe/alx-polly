
# AI Assistant Rules for alx-polly

This document outlines the structure and conventions of the alx-polly project to guide AI assistants in making accurate and consistent code modifications.

## 1. Folder Structure (Next.js App Router)

The project uses the Next.js App Router.

-   **/app**: Contains all routes and UI.
    -   **/app/polls**: Pages related to polls (listing, creating, viewing).
    -   **/app/api**: All backend API routes. Each sub-folder is an API endpoint.
    -   **/app/layout.tsx**: The main app layout.
    -   **/app/page.tsx**: The homepage.
-   **/components**: Shared React components used across the app.
    -   **/components/ui**: UI components from `shadcn/ui`. Do not modify these directly.
-   **/lib**: Contains helper functions, utility code, and external service integrations.
    -   **/lib/supabase.ts**: Supabase client initialization.
    -   **/lib/auth.ts**: Authentication-related functions.
    -   **/lib/polls.ts**: Functions for interacting with the `polls` table.

## 2. UI Components and Styling

-   **UI Library**: The project uses `shadcn/ui` for UI components. When creating new UI, prefer composing existing components from `/components/ui`.
-   **Styling**: Tailwind CSS is used for styling. Use `clsx` and `tailwind-merge` for conditional and combined classes.
-   **New Components**: Create new, reusable components in the `/components` directory.

## 3. Database and Authentication

-   **Backend**: Supabase is the primary backend for database and authentication.
-   **Supabase Client**: The Supabase client is initialized in `/lib/supabase.ts`. Import the client from this file whenever you need to interact with Supabase.
-   **Authentication**: User authentication is handled via Supabase Auth. See `/lib/auth.ts` for existing auth functions.
-   **Database Interaction**: All database operations should be performed using the Supabase client.

## 4. API Routes

-   **Location**: API routes are located in `/app/api`.
-   **Structure**: Each API endpoint is a `route.ts` file within a dedicated folder (e.g., `/app/api/items/route.ts`).
-   **Handlers**: Use the standard Next.js API route handlers (`GET`, `POST`, `PUT`, `DELETE`).

## Example Task

**User Request**: "Create a form to submit a new poll"

**AI Action**:
1.  Create a new component `PollForm.tsx` in `/components`.
2.  Use `shadcn/ui` components (`Input`, `Button`, `Label`) for the form fields.
3.  The form should take a function as a prop to handle form submission.
4.  The submission handler will call a server action or an API route (e.g., `/api/polls`) to create the new poll in the Supabase database.
