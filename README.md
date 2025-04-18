# AWS S3 Bucket Explorer

This is a NextJS application that acts as an S3 file browser. It allows you to configure and browse files in your S3 buckets directly through a user-friendly interface.

## Core Features:

- **Configuration Upload:** Upload a JSON configuration file containing S3 bucket details (bucket name, region, access key ID, secret access key). The configuration is saved in local storage so that user does not have to enter it every time.
- **File Tree Display:** Display files and folders in a clear, collapsible tree structure. The left pane has a collapsible tree structure, and the right pane shows all the children (files and folders) of the selected path.
- **File Download:** Download files directly from the S3 bucket. Allows downloading multiple files.
- **Folder Navigation:** Easy folder navigation with clickable folder paths in the breadcrumb.
- **File Information:** Show file size and last modified date for each file. Preview selected files.
- **File Upload:** Ability to upload new files to the current folder.
- **Folder Creation:** Ability to create new folders in the current directory.
- **File Deletion:** Ability to delete files directly from the interface.
- **View Mode:** Option to switch between grid view and list view.
- **Breadcrumb Navigation:** Clickable folder paths to easily navigate through the bucket.

## Installation Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Configure environment variables:**

    Create a `.env` file in the root directory (if you don't have it already).

4.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
5.  **Upload S3 Configuration**
    *   Prepare your S3 configuration in JSON format. A sample structure is given in the application.
    *   Upload the JSON configuration file in the sidebar
## Sample JSON Structure
```json
{
  "bucketName": "",
  "region": "",
  "accessKeyId": "",
  "secretAccessKey": ""
}
```
## UI Style Guidelines:

-   Primary color: White (#FFFFFF) for a clean look.
-   Secondary color: Light gray (#F0F0F0) for backgrounds and dividers.
-   Accent: Teal (#008080) for interactive elements and highlights.
-   Clean and readable sans-serif font for all text elements.
-   Simple and clear icons for file types and actions.
-   Use a sidebar for navigation and a main content area for file display.
