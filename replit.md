# Overview

This is a comprehensive supply chain management system called "Qortoba Supplies System" (نظام قرطبة للتوريدات) built for the Egyptian company "Qortoba for General Supplies and Contracting". The system handles the complete quotation-to-purchase-order workflow, managing RFQs (Request for Quotations), supplier pricing, customer pricing, and purchase orders. It features a modern web interface with Arabic language support, role-based access control, and integrates with Google Sheets for data persistence and AI-powered item matching via DeepSeek API.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development
- **UI Components**: Shadcn/ui components library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Arabic RTL support and neutral color scheme
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Custom role-based authentication system
- **File Storage**: Google Cloud Storage for file uploads
- **API Design**: RESTful endpoints with proper error handling and logging

## Data Storage Architecture
- **Primary Database**: PostgreSQL via Neon Database serverless
- **Secondary Storage**: Google Sheets integration for data synchronization and backup
- **File Storage**: Google Cloud Storage bucket for document attachments
- **Session Store**: PostgreSQL-based session storage for user authentication

## Authentication & Authorization
- **User Roles**: Multi-tier system with manager, IT admin, data entry, and purchasing roles
- **Session-based Authentication**: Server-side sessions with secure cookie handling
- **Password Security**: bcrypt hashing for password storage
- **Role-based Access Control**: Different UI components and API endpoints based on user roles

## Key Business Logic Components
- **Smart Item Unification**: DeepSeek AI integration for intelligent item matching and duplicate detection
- **Quotation Workflow**: Complete RFQ to PO lifecycle management
- **Pricing Management**: Separate supplier and customer pricing with margin calculations
- **Multi-language Support**: Arabic primary interface with English technical terms
- **Real-time Synchronization**: Automatic Google Sheets sync for data consistency

# External Dependencies

## Cloud Services
- **Neon Database**: PostgreSQL serverless database hosting
- **Google Cloud Platform**: Service account authentication and Cloud Storage
- **Railway/Vercel**: Application deployment platforms
- **DeepSeek API**: AI-powered text analysis for item matching

## Third-party APIs & Services
- **Google Sheets API**: Data synchronization and backup storage
- **Google Cloud Storage**: File and document storage
- **SendGrid**: Email notification service (optional)
- **Resend**: Alternative email service
- **Anthropic SDK**: AI integration capabilities
- **Telegram Bot API**: External user management and notifications

## Key Libraries & Frameworks
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack React Query**: Server state management and caching
- **Zod**: Runtime type validation and schema definition
- **Multer**: File upload handling middleware
- **XLSX**: Excel file processing for data import/export

## Development & Build Tools
- **Vite**: Frontend development server and build tool
- **esbuild**: Fast JavaScript bundler for server-side code
- **TypeScript**: Type-safe development environment
- **ESLint**: Code quality and style enforcement