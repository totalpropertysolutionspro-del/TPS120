# Total Property Solutions Pro

A complete property management application built with React, TypeScript, Express, and SQLite.

## Features

- **Dashboard** - Real-time statistics on properties, tenants, work orders, invoices, and revenue
- **Properties Management** - Create, read, update, and delete properties with detailed information
- **Tenants Management** - Complete tenant lifecycle management with lease tracking
- **Work Orders** - Maintenance and repair task tracking with priority and status management
- **Invoices** - Rent collection and payment tracking with due date alerts
- **Staff Management** - Employee management with role assignments
- **Notifications** - Real-time in-app notifications with email and SMS alerts
- **Auto-Backup** - Automatic database backups on server startup
- **Data Persistence** - SQLite database with automatic backup to JSON

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons
- Axios for API calls

### Backend
- Express.js
- TypeScript
- SQLite with Drizzle ORM
- Nodemailer for email notifications
- Twilio for SMS alerts
- Better SQLite 3 for high-performance database operations

## Project Structure

```
property-manager/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── db/             # Database schema and initialization
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (notifications, email, SMS)
│   │   ├── seed.ts         # Database seeding
│   │   └── server.ts       # Express server setup
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/            # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── package.json             # Root package with workspaces
├── docker-compose.yml       # Docker Compose configuration
└── Dockerfile              # Multi-stage build
```

## Installation

### Prerequisites
- Node.js 18+ (for Apple Silicon: ensure you have the correct build tools)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   cd property-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   > **Note on Apple Silicon:** If you encounter compilation errors with `better-sqlite3`, install build tools:
   > ```bash
   > xcode-select --install
   > ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   - SMTP settings for email notifications
   - Twilio credentials for SMS alerts
   - Admin contact information

4. **Seed sample data (optional)**
   ```bash
   npm run seed --workspace=backend
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

This starts both the backend API server (port 5000) and frontend development server (port 3000) concurrently.

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up
```

## API Endpoints

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create tenant (triggers notification)
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Work Orders
- `GET /api/work-orders` - List all work orders
- `POST /api/work-orders` - Create work order (triggers notification)
- `GET /api/work-orders/:id` - Get work order details
- `PUT /api/work-orders/:id` - Update work order (triggers notification on status change)
- `DELETE /api/work-orders/:id` - Delete work order

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice (triggers notification)
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice (triggers notification on status change)
- `DELETE /api/invoices/:id` - Delete invoice

### Staff
- `GET /api/staff` - List all staff
- `POST /api/staff` - Create staff member
- `GET /api/staff/:id` - Get staff details
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread` - Get unread notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/all/read` - Mark all as read

## Notification Events

The application automatically creates notifications for:

1. **Work Order Created** - Email notification to admin
2. **Work Order Status Changed** - Email notification, SMS on completion
3. **Invoice Created** - Email notification to tenant
4. **Invoice Paid** - Email notification to admin
5. **Invoice Overdue** - Email and SMS notification to tenant
6. **Tenant Added** - Email notification to new tenant

## Database

The application uses SQLite with the following tables:
- `properties` - Property listings
- `tenants` - Tenant information
- `work_orders` - Maintenance and repair tasks
- `invoices` - Rent invoices
- `staff` - Employee records
- `notifications` - System notifications

### Database Files
- `property_manager.db` - Main SQLite database
- `backup.json` - Automatic JSON backup (created on server startup)

## Environment Variables

```env
# Server
PORT=5000

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@propertysolutions.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1-555-0000

# Admin Contact
ADMIN_EMAIL=admin@propertysolutions.com
ADMIN_PHONE=+1-555-0000
```

## Development Tips

### Frontend Development
- The frontend proxies `/api` requests to the backend server
- Hot reload is enabled via Vite
- Tailwind CSS is included for styling

### Backend Development
- Use `tsx` for instant reloading during development
- Database changes take effect immediately
- Check `.env` for configuration

### Testing
Visit http://localhost:3000 after running `npm run dev`

Sample credentials created during seeding:
- Admin User: "Admin User" (Manager role)
- Properties: Downtown Apartments, Riverside Homes, Tech Plaza
- Sample data automatically populated

## Troubleshooting

### better-sqlite3 Build Issues
If you encounter compilation errors:
1. Install Xcode command line tools: `xcode-select --install`
2. Clear npm cache: `npm cache clean --force`
3. Remove node_modules: `rm -rf node_modules`
4. Reinstall: `npm install`

### Port Already in Use
- Backend uses port 5000
- Frontend uses port 3000
- Modify `backend/.env` or `frontend/vite.config.ts` if ports are in use

### Database Issues
- Delete `property_manager.db` to reset the database
- Run `npm run seed --workspace=backend` to repopulate sample data
- Check `backup.json` for automatic backups

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables in production environment

3. Run with Docker:
   ```bash
   docker-compose up -d
   ```

4. Access at the configured URL

## License

MIT

## Support

For issues, suggestions, or feature requests, please open an issue on GitHub.
