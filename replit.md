# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview
A comprehensive web application for قرطبة للتوريدات (Qurtoba Supplies) managing quotation requests, item cataloging, purchase orders, and administrative operations. It features role-based access control and AI-powered item analysis for duplicate detection. The system is designed as a demand-based procurement system without inventory management, aiming to streamline supply chain processes and improve data quality. The project vision includes enhancing supply chain efficiency, providing robust data management, and leveraging AI for intelligent item analysis.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React with TypeScript and Vite.
- **UI Library**: Shadcn/ui (built on Radix UI) with Tailwind CSS.
- **Internationalization**: Arabic RTL (right-to-left) interface with Arabic content.
- **Design Principles**: Focus on clear, intuitive workflows for various user roles, with consistent styling and new company branding.
- **Display Enhancements**: Consistent formatting for LINE ITEMs with blue monospace styling and RTL display correction. Fully responsive design optimized for smartphones and tablets.

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
- **Item Numbering**: Automatic generation of P-format item numbers with mass update capability.
- **Permissions Management**: Flexible, checkbox-based permissions system allowing granular control over view, create, edit, and delete operations for various sections.
- **Profile Image System**: Displays profile images with fallback to user initials, with a file upload system supporting drag-drop, size limits, and image formats.
- **Deployment**: Comprehensive deployment packages for Windows RDP and Linux servers, including Docker Compose setup, automated deployment scripts, and GitHub integration with CI/CD pipelines.

### Feature Specifications
- **Quotation Management**: Full lifecycle from request to completion with accurate data import from Excel, following a unified workflow with stages like pending, sent_for_pricing, pricing_received, customer_pricing, quoted, and completed.
- **Item Catalog**: AI-enhanced item management with intelligent duplicate detection, focusing on part number normalization, description similarity, and keyword extraction without external AI dependencies.
- **Purchase Order Processing**: Integration with the quotation system, including robust search capabilities and importing existing POs from Excel.
- **User Management**: Role-based access and activity monitoring.
- **Client & Supplier Management**: Functionality for adding, editing, and deleting clients and suppliers with soft delete logic.
- **Data Import/Export**: IT admin-only functionality for importing quotation requests from .xlsx/.xls files (with dual header fix, data preview, and error handling) and exporting various system data to .xlsx. The Excel import system features complete data visibility, flexible part number requirements, enhanced table display, and auto-mapping intelligence.
- **Customer Pricing**: Simplified interface for customer pricing without historical tables, integrated with supplier pricing for a comprehensive workflow.
- **Database Backup**: Comprehensive backup system for IT administrators, generating executable SQL files for complete system restoration.
- **RDP Server Integration**: System for deploying on Windows RDP servers with external network access, including SSH-based connection, network diagnostics, and webhook integration for GitHub updates.

## Security

### Recent Security Fixes
- **2025-01-08**: Fixed hardcoded credentials vulnerability in `ONE_CLICK_DEPLOY.bat`. Replaced hardcoded database passwords and session secrets with environment variables and interactive prompts. This addresses the static code analysis alert for "Username And Password In URI detected."
- **2025-01-08**: Resolved compilation errors and JSX syntax issues in SidebarOld.tsx and usePricingPermissions.tsx. Fixed missing div closures and converted TypeScript files with JSX to .tsx extension for proper React support.
- **2025-01-08**: Applied npm audit fixes to address dependency vulnerabilities while maintaining application functionality. Updated security documentation with comprehensive fix details.

### Security Measures
- Environment variable-based credential management
- Interactive password prompts for deployment scripts
- Session-based authentication with bcrypt password hashing
- Role-based access control with granular permissions
- Comprehensive activity logging and monitoring

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