# Firebase Setup

This site uses Firebase Authentication, Cloud Firestore, Firebase Hosting, and Cloudinary for image uploads.

## 1. Create Firebase project

1. Open Firebase Console.
2. Create or select a project.
3. Add a Web app.
4. Copy the Web app config into `firebase/firebase-config.js`.

## 2. Enable Authentication

1. Go to Authentication > Sign-in method.
2. Enable Email/Password.
3. Add the admin user in Authentication > Users.
4. Use that email and password on `admin-login.html`.

## 3. Create Firestore database

Create these collections by adding records from `admin.html`:

- `articles`
- `announcements`
- `notices`
- `events`
- `massSchedules`
- `gallery`

The admin dashboard writes the required fields automatically.

## 4. Configure Cloudinary

1. Create a free Cloudinary account.
2. Open Settings > Upload.
3. Create an unsigned upload preset.
4. Add your Cloudinary cloud name and unsigned preset name in `firebase/cloudinary-config.js`.

Images are uploaded directly to Cloudinary from `admin.html`. The returned Cloudinary URL is saved in Firestore.

## 5. Publish rules

Copy `firebase/firestore.rules` into Firestore Rules and publish.

Public visitors can read published articles, announcements, notices, and events. Mass schedules and gallery images are public. Signed-in admins can manage all content.

## 6. Deploy

For Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

When asked for the public directory, use the project root because the site is plain HTML. Keep `index.html` as the main page.

For any static host, upload the project root with `index.html`, the new HTML pages, `css/`, `js/`, `firebase/`, and `images/`.
