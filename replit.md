# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview
A comprehensive web application for قرطبة للتوريدات (Qurtoba Supplies) managing quotation requests, item cataloging, purchase orders, and administrative operations. It features role-based access control and AI-powered item analysis for duplicate detection. The system is designed as a demand-based procurement system without inventory management, aiming to streamline supply chain processes, improve data quality, and enhance supply chain efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.
Data source: Google Sheets ONLY - no database storage, all data must come from Google Sheets exclusively.
UI Preferences: No unification buttons in main Items page - all unification operations should be separate/programmatic.
Authentication: Successfully converted to Google Sheets-based user management system (August 13, 2025) - user authentication, creation, and management now fully operational using Google Sheets instead of PostgreSQL database. Default admin credentials: admin/admin123. System includes comprehensive error handling and user guidance for authentication issues.

## System Architecture

### UI/UX Decisions
- **Framework**: React with TypeScript and Vite.
- **UI Library**: Shadcn/ui (built on Radix UI) with Tailwind CSS.
- **Internationalization**: Arabic RTL (right-to-left) interface with Arabic content.
- **Design Principles**: Focus on clear, intuitive workflows for various user roles, with consistent styling and new company branding. Fully responsive design optimized for smartphones and tablets.

### Technical Implementations
- **Frontend State Management**: TanStack Query (React Query) for server state and caching.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Backend Runtime**: Node.js with Express.js (TypeScript, ES modules).
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Authentication**: Complete Google Sheets-based user management system with Express sessions and bcrypt password hashing. Comprehensive role-based access control (manager, it_admin, data_entry, purchasing, accounting). Successfully migrated from PostgreSQL to Google Sheets for user storage (August 13, 2025). All user data including credentials, permissions, and activity tracking now stored in Google Sheets with full functionality maintained.
- **API Design**: RESTful API with centralized error handling and activity logging.
- **Data Validation**: Zod schemas for type-safe data validation.
- **Database Migrations**: Drizzle Kit for schema management.
- **Activity Tracking**: Comprehensive logging of user actions and online status.
- **Item Numbering**: Automatic generation of P-format item numbers with mass update capability.
- **Permissions Management**: Flexible, checkbox-based permissions system allowing granular control over view, create, edit, and delete operations for various sections.
- **Profile Image System**: Displays profile images with fallback to user initials, with a file upload system supporting drag-drop, size limits, and image formats.
- **Deployment**: Comprehensive deployment packages for Windows RDP, Linux servers, and Railway.app cloud deployment, including Docker Compose setup, automated deployment scripts, and GitHub integration with CI/CD pipelines.

### Feature Specifications
- **Quotation Management**: Full lifecycle from request to completion with accurate data import from Excel, following a unified workflow with stages.
- **Item Catalog**: AI-enhanced item management with intelligent duplicate detection, focusing on part number normalization, description similarity, and keyword extraction.
- **AI-Powered Item Unification**: Advanced Google Sheets integration for intelligent item consolidation. System processes data starting from row 2, analyzes part numbers (column D) and descriptions using AI similarity matching, then assigns unified item IDs (column A) to matching rows. Real-time unification tracking available at /monitor with comprehensive progress monitoring (August 2025).
- **Purchase Order Details System**: Complete purchase order item viewing system with proper column mapping. LineItem field reads from Column C, partNumber from Column D, poQuantity reads from Column M, poPrice reads from Column N based on exact item ID and PO number matching. Accurate data display for all 5 items in P25E02726. System displays detailed item information including descriptions, quantities, and pricing from Google Sheets API with intelligent data mapping based on item identifier and purchase order correlation (August 13, 2025).
- **Purchase Order Processing**: Integration with the quotation system, including robust search capabilities and importing existing POs from Excel.
- **User Management**: Role-based access and activity monitoring.
- **Client & Supplier Management**: Functionality for adding, editing, and deleting clients and suppliers with soft delete logic.
- **Data Import/Export**: IT admin-only functionality for importing quotation requests from .xlsx/.xls files (with dual header fix, data preview, and error handling) and exporting various system data to .xlsx.
- **Customer Pricing**: Simplified interface for customer pricing integrated with supplier pricing.
- **Database Backup**: Comprehensive backup system for IT administrators, generating executable SQL files for complete system restoration.
- **RDP Server Integration**: System for deploying on Windows RDP servers with external network access, including SSH-based connection, network diagnostics, and webhook integration for GitHub updates.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless or self-hosted).
- **Session Store**: PostgreSQL with `connect-pg-simple`.

### AI Services
- **DeepSeek API**: Used for AI-powered item analysis and duplicate detection.
- **Telegram Bot Integration**: Fully operational @Req_item_bot with comprehensive analysis notifications and advanced image search system, supporting sales representatives with item analysis for quotations.

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
```