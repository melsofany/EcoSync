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

### Three-Stage Excel Import System (2025-08-03)
- **Stage 1**: File analysis - displays all available Excel columns (A-L) with sample data
- **Stage 2**: Manual column mapping - user specifies which Excel column maps to each database field
- **Stage 3**: Data preview and confirmation - shows processed data before final import
- **Fixed Issues**: HTTP 400 Bad Request error, corrected data flow between import stages
- **Terminology**: Corrected from "طلب الشراء" (purchase order) to "طلب التسعير" (quotation request)
- **Date Conversion**: Perfect handling of Excel serial numbers to readable dates (45844 → 2025-07-06)