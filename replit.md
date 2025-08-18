# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview
A comprehensive web application for قرطبة للتوريدات (Qurtoba Supplies) managing quotation requests, item cataloging, purchase orders, and administrative operations. It features role-based access control and AI-powered item analysis for duplicate detection. The system is designed as a demand-based procurement system without inventory management, aiming to streamline supply chain processes, improve data quality, and enhance supply chain efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.
Data source: Google Sheets ONLY - no database storage, all data must come from Google Sheets exclusively.
UI Preferences: No unification buttons in main Items page - all unification operations should be separate/programmatic.
Supplier Pricing Requirements: Enhanced supplier pricing form with detailed supplier information, VAT handling, and extended terms including contact details, payment terms, and warranty information.

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
- **Authentication**: Complete Google Sheets-based user management system with Express sessions and bcrypt password hashing. Comprehensive role-based access control (manager, it_admin, data_entry, purchasing, accounting).
- **API Design**: RESTful API with centralized error handling and activity logging.
- **Data Validation**: Zod schemas for type-safe data validation.
- **Activity Tracking**: Comprehensive logging of user actions and online status.
- **Item Numbering**: Automatic generation of P-format item numbers with mass update capability.
- **Permissions Management**: Flexible, checkbox-based permissions system allowing granular control over view, create, edit, and delete operations for various sections.
- **Profile Image System**: Displays profile images with fallback to user initials, with a file upload system supporting drag-drop, size limits, and image formats.
- **Deployment**: Comprehensive deployment packages for Windows RDP, Linux servers, and Railway.app cloud deployment, including Docker Compose setup, automated deployment scripts, and GitHub integration with CI/CD pipelines.

### Feature Specifications
- **Quotation Management**: Full lifecycle from request to completion with accurate data import.
- **Item Catalog**: AI-enhanced item management with intelligent duplicate detection, focusing on part number normalization, description similarity, and keyword extraction.
- **AI-Powered Item Unification**: Advanced Google Sheets integration for intelligent item consolidation. System processes data, analyzes part numbers and descriptions using AI similarity matching, then assigns unified item IDs to matching rows. **Updated:** Automatic AI matching has been optimized with quick matching for new items only to improve performance. Full AI matching is available manually from the admin interface to avoid long processing times during regular operations.
- **Purchase Order Details System**: Complete purchase order item viewing system with accurate column mapping and Google Sheets real-time integration.
- **Enhanced Supplier Pricing System**: Complete supplier pricing system with organized 3-tab modal (Pricing, Supplier Info, Terms), supporting 27 comprehensive fields (A-AA columns) including detailed supplier information (name, contact, phone, email, address), VAT management (inclusive/exclusive pricing, VAT rates, automatic calculations), extended terms (payment conditions, warranty periods, delivery specifications), comprehensive notes, and employee name tracking. Fully integrated with updated Google Sheets structure with Arabic column headers. Fixed critical data submission bug where form sent item.id instead of item.itemNumber. **UPDATED (Jan 18, 2025):** Fixed supplier price and name display in customer pricing page - now correctly fetches supplier price from Column O and supplier name from Column J in supplier pricing sheet, with LINE ITEM from DATA sheet Column C. **UPDATED (Jan 18, 2025):** Customer pricing now saves directly to Column I in DATA sheet instead of separate pricing sheet, with employee name saved to Column Q.
- **Purchase Order Processing**: Integration with the quotation system, including robust search capabilities.
- **User Management**: Role-based access and activity monitoring.
- **Client & Supplier Management**: Functionality for adding, editing, and deleting clients and suppliers with soft delete logic. Full supplier endpoint functionality with Google Sheets integration.
- **Data Import/Export**: IT admin-only functionality for importing quotation requests from .xlsx/.xls files (with dual header fix, data preview, and error handling) and exporting various system data to .xlsx.
- **Customer Pricing**: Enhanced customer pricing system with employee name tracking, supporting 17 comprehensive fields (A-Q columns) including pricing details, profit margin calculations, and automatic employee name logging for all pricing entries. Fully integrated with Google Sheets real-time data. **UPDATED (Jan 19, 2025):** Fixed column mapping issue in comprehensive data display - corrected reading from Google Sheets columns (DATE/RFQ from G, QTY from H) allowing proper display of all 27 DATA sheet rows for items with accurate field values.
- **Quotation Requests Management**: Complete quotation request system with automatic saving to dedicated Google Sheets tab ('طلبات_التسعير'), automatic item distribution to both supplier and customer pricing sheets, and full integration with AI item matching.
- **Database Backup**: Comprehensive backup system for IT administrators, generating executable SQL files for complete system restoration.
- **RDP Server Integration**: System for deploying on Windows RDP servers with external network access, including SSH-based connection, network diagnostics, and webhook integration for GitHub updates.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless or self-hosted).
- **Session Store**: PostgreSQL with `connect-pg-simple`.

### AI Services
- **DeepSeek API**: Used for AI-powered item analysis and duplicate detection.
- **Telegram Bot Integration**: Fully operational @Req_item_bot with comprehensive analysis notifications, advanced image search system, enhanced expiry date formatting (🔥 bold + underline), test message functionality, dynamic token management, and real-time DeepSeek API balance monitoring in dashboard supporting sales representatives with item analysis for quotations.

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