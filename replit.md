# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview

A comprehensive web application for قرطبة للتوريدات (Qurtoba Supplies) managing quotation requests, item cataloging, purchase orders, and administrative operations. It features role-based access control and AI-powered item analysis for duplicate detection. The system is designed as a demand-based procurement system without inventory management, aiming to streamline supply chain processes and improve data quality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React with TypeScript and Vite.
- **UI Library**: Shadcn/ui (built on Radix UI) with Tailwind CSS.
- **Internationalization**: Arabic RTL (right-to-left) interface with Arabic content.
- **Design Principles**: Focus on clear, intuitive workflows for various user roles, with consistent styling and a new company branding (قرطبة للتوريدات).
- **Display Enhancements**: Consistent formatting for LINE ITEMs (e.g., "6666.001.GENRAL.0069") with blue monospace styling and RTL display correction.

### Technical Implementations
- **Frontend State Management**: TanStack Query (React Query) for server state and caching.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Backend Runtime**: Node.js with Express.js (TypeScript, ES modules).
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Authentication**: Session-based authentication using Express sessions and bcrypt for password hashing, with comprehensive role-based access control (manager, it_admin, data_entry, purchasing, accounting).
- **API Design**: RESTful API with centralized error handling and activity logging.
- **Data Validation**: Zod schemas for type-safe data validation.
- **Database Migrations**: Drizzle Kit for schema management.
- **Activity Tracking**: Comprehensive logging of user actions and online status.
- **Item Numbering**: Automatic generation of P-format item numbers (P-000001, P-000002, etc.) with mass update capability.

### Feature Specifications
- **Quotation Management**: Full lifecycle from request to completion with accurate data import from Excel.
- **Item Catalog**: AI-enhanced item management with intelligent duplicate detection, focusing on part number normalization, description similarity, and keyword extraction without external AI dependencies.
- **Purchase Order Processing**: Integration with the quotation system, including robust search capabilities and importing existing POs from Excel.
- **User Management**: Role-based access and activity monitoring.
- **Client & Supplier Management**: Functionality for adding, editing, and deleting clients and suppliers with proper foreign key constraint handling (soft delete logic).
- **Data Import/Export**: IT admin-only functionality for importing quotation requests from .xlsx/.xls files (with dual header fix, data preview, and error handling) and exporting various system data to .xlsx.
- **Customer Pricing**: Simplified interface for customer pricing without historical tables.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless or self-hosted).
- **Session Store**: PostgreSQL with `connect-pg-simple`.

### AI Services
- **DeepSeek API**: Used for AI-powered item analysis and duplicate detection.

### Development & Build Tools
- **Vite**: Frontend development and build tool.
- **esbuild**: Server-side code bundling.

### UI & Styling Libraries
- **Tailwind CSS**: Utility-first CSS framework.
- **Radix UI**: Headless UI components.
- **Lucide React**: Icon library.

### Utility Libraries
- **date-fns**: Date manipulation.
- **bcrypt**: Password hashing.
- **nanoid**: Unique ID generation.
- **clsx**: Conditional class name utilities.
- **XLSX**: For Excel file operations (import/export).

## Recent Updates

### Enhanced Excel Import System (2025-08-03)
- **Complete Data Visibility**: Full scrollable preview showing ALL imported records (not just first 5) with vertical and horizontal scrollbars
- **Flexible Part Number Requirements**: System now accepts items without Part Number - only requires LINE ITEM, Description, and Quantity > 0
- **Enhanced Table Display**: 
  - Complete text display for long descriptions with proper text wrapping
  - All columns visible including Order Number (from Source File) and Quote Expiry Date (from Response Date)
  - Color-coded columns with improved styling and hover effects
  - Sticky headers for better navigation during scroll
- **Auto-mapping Intelligence**: Recognizes real Excel column names and maps them automatically
- **Data Integrity**: Exact copying without Fill Down logic - preserves Excel data as-is

### Comprehensive Profile Image System (2025-08-03)
- **UserAvatar Component**: Displays profile images with fallback to user initials in colored circles
- **UserDisplayName Component**: Complete user information display with avatars, customizable layouts (horizontal/vertical)
- **ProfileImageUploader Component**: File upload system with drag-drop support, 5MB limit, JPG/PNG/GIF support
- **Object Storage Integration**: Secure cloud storage for profile images with public access URLs
- **System-wide Implementation**: Profile images appear in:
  - User management tables (Admin page)
  - Sidebar user information
  - Activity logs (Dashboard and Admin pages)
  - Online users list (Dashboard)
  - All user references throughout the system
- **Fallback System**: Automatic display of user initials when no profile image is available

### Role-Based Access Control Enhancement (2025-08-03)
- **New Accounting Role**: Added "موظف حسابات" (Accounting Staff) role with specific permissions
- **Accounting Permissions**: 
  - Read-only access to quotations, purchase orders, and all pricing information
  - Access to reports and dashboard for financial oversight
  - Cannot create, edit, or delete any records (view-only permissions)
  - Full access to client and supplier information for accounting purposes
- **System-wide Integration**: Accounting role appears in all user interfaces, forms, and permission checks
- **Database Schema**: Updated user role definitions to include accounting role

### Complete Database Backup System (2025-08-04)
- **Full Database Export**: Comprehensive backup system for IT administrators
- **Complete Data Coverage**: Exports all tables with real data including:
  - Users (without passwords for security)
  - Clients and suppliers with full details
  - Items with part numbers, descriptions, and specifications
  - Quotation requests with their items and details
  - Purchase orders with their items and pricing
  - Supplier pricing and quotes
  - Complete activity log (1000+ records)
- **SQL Format**: Generates executable SQL file for complete system restoration
- **Security Features**: Activity logging, role-based access (IT admin only), security warnings
- **Production Ready**: Designed for server deployment with comprehensive deployment guide