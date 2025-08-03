# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview

A comprehensive web application for قرطبة للتوريدات (Qurtoba Supplies) managing quotation requests, item cataloging, purchase orders, and administrative operations. It features role-based access control, real-time notification system, and AI-powered item analysis for duplicate detection. The system is designed as a demand-based procurement system without inventory management, aiming to streamline supply chain processes and improve data quality.

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
- **Authentication**: Session-based authentication using Express sessions and bcrypt for password hashing, with comprehensive role-based access control (manager, it_admin, data_entry, purchasing).
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

### Real-time Notification System (2025-08-03)
- **Complete Notification Infrastructure**: Database table, API endpoints, and interactive UI components
- **Interactive Bell Icon**: Real-time unread count with automatic polling every 30 seconds
- **Rich Notification Panel**: Dropdown interface with color-coded notifications, read/unread status, and action buttons
- **Welcome Notifications**: Automatic welcome message on user login with personalized greeting
- **Admin Notifications**: System-wide announcements for permission updates and important changes
- **Role-based Permissions Update**: Data entry employees now limited to quotation entry, item management, and basic reports only

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