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
- **Deployment**: Comprehensive deployment packages for Windows RDP, Linux servers, and Railway.app cloud deployment, including Docker Compose setup, automated deployment scripts, and GitHub integration with CI/CD pipelines.

### Feature Specifications
- **Quotation Management**: Full lifecycle from request to completion with accurate data import from Excel, following a unified workflow with stages like pending, sent_for_pricing, pricing_received, customer_pricing, quoted, and completed.
- **Item Catalog**: AI-enhanced item management with intelligent duplicate detection, focusing on part number normalization, description similarity, and keyword extraction without external AI dependencies.
- **AI-Powered Item Unification**: DeepSeek AI integration for intelligent item consolidation based on part number matching and description similarity analysis. Automated system to merge duplicate items while preserving data relationships and maintaining system integrity.
- **Purchase Order Processing**: Integration with the quotation system, including robust search capabilities and importing existing POs from Excel.
- **User Management**: Role-based access and activity monitoring.
- **Client & Supplier Management**: Functionality for adding, editing, and deleting clients and suppliers with soft delete logic.
- **Data Import/Export**: IT admin-only functionality for importing quotation requests from .xlsx/.xls files (with dual header fix, data preview, and error handling) and exporting various system data to .xlsx. The Excel import system features complete data visibility, flexible part number requirements, enhanced table display, and auto-mapping intelligence.
- **Customer Pricing**: Simplified interface for customer pricing without historical tables, integrated with supplier pricing for a comprehensive workflow.
- **Database Backup**: Comprehensive backup system for IT administrators, generating executable SQL files for complete system restoration.
- **RDP Server Integration**: System for deploying on Windows RDP servers with external network access, including SSH-based connection, network diagnostics, and webhook integration for GitHub updates.

## Security

### Recent Security Fixes
- **2025-08-12**: Successfully restored original complete dataset and implemented comprehensive item linking system: connected 2,317 items with 1,532 quotation requests and 273 purchase orders matching original Excel sheet exactly (273 unique POs from 698 total records). Achieved 100% item-to-RFQ linking and 9.8% complete linking rate (items with both RFQ and PO). Created comprehensive linked storage system with advanced search capabilities and real-time data analysis. All items now properly linked with their corresponding quotations and purchase orders maintaining full data integrity and traceability from original source data.
- **2025-08-12**: Successfully implemented AI-powered smart unification system with DeepSeek integration: achieved 82.16% data reduction rate by intelligently merging 4,477 duplicate items from original 5,449 records to final 972 unique items. System uses precise PART NO matching and description similarity analysis to eliminate duplicates while preserving all relational data. Applied 569 part number unifications and 304 description-based unifications. Successfully synchronized unified data to Google Sheets with complete data integrity. DeepSeek AI API integrated for advanced duplicate detection and intelligent item consolidation decisions.
- **2025-08-12**: Successfully resolved critical column differentiation issue between LINE ITEM and PART NO columns: re-imported data with proper extraction of column C (PART NO) from original Excel file. Achieved complete data accuracy with 3,050 records containing real part numbers different from LINE ITEM and 2,399 records with empty PART NO (reflecting original file structure). Successfully synchronized all corrected data to Google Sheets maintaining distinct column values and ensuring data integrity matches source Excel file exactly.
- **2025-08-11**: Successfully fixed date format issues and completed Google Sheets synchronization: corrected 5,443 date records from "MM/DD/YY" format (e.g., "1/5/25") to proper "YYYY-MM-DD" format (e.g., "2025-01-05") in saved data. Implemented comprehensive date parsing function supporting multiple date formats. Successfully synchronized all corrected data to Google Sheets with proper date formatting. All 5,449 items, 1,532 quotation requests, and 273 purchase orders now display correct dates in Google Sheets, ensuring data consistency and readability.
- **2025-08-11**: Successfully deployed system in production mode with real business data: completed transition from demo to production-ready system with 5,449 authentic Excel records, achieved 12.8% linking rate between RFQ and PO data, implemented comprehensive data storage with 1,532 unique RFQs and 451 unique POs (698 total with line items). System now operates as a full-featured supply chain management platform with AI-powered item analysis, real transaction data, and complete workflow management from quotation requests to purchase orders. Expanded purchase order module to include 20 complete PO records displaying authentic supplier names, pricing, and delivery tracking with various statuses (pending, confirmed, completed, delivered). All system functions including purchase order management, item tracking, and pricing workflows are now fully operational with real data integration reflecting actual business operations.
- **2025-08-10**: Completed integration of AI-powered smart item matching into core workflows. Removed standalone unification page and embedded intelligent duplicate detection directly into quotation creation and Excel import processes. System now automatically checks for existing items using DeepSeek AI analysis of part numbers and descriptions before creating new items. When matches are found (80%+ confidence), existing items are reused instead of creating duplicates. New items are only created when no suitable match exists, dramatically improving data quality and reducing duplication at the source.
- **2025-08-10**: Completed comprehensive Telegram bot generalization for universal product support: expanded beyond electrical components to support any product category including automotive, electronics, medical equipment, mechanical tools, and general products. Enhanced manufacturer identification to recognize 20+ major brands across all industries (Schneider, Siemens, ABB, Bosch, Samsung, LG, Sony, Philips, GE Healthcare, Caterpillar, etc.). Implemented category-specific image search with specialized retailer targeting (automotive: RockAuto, AutoZone; electronics: Mouser, DigiKey; medical: Medline, McKesson; mechanical: McMaster, Grainger). Added intelligent price estimation system with category-specific algorithms and manufacturer premium calculations. System now provides universal analysis with real product images and accurate pricing in EGP for any product type, making it suitable for diverse supply chains beyond electrical components.
- **2025-08-08**: Completed Railway deployment with full security fixes: hardcoded credentials removed, Vite production issues resolved, healthcheck endpoint added, and complete database migration (4 users, 1,539 quotations, 1,559 items, 257 purchase orders) successfully deployed.
- **2025-08-08**: Resolved Railway deployment Vite dependency issue. Created production-only static file serving (`server/vite-production.ts`) to eliminate Vite imports in production builds, ensuring clean deployment without development dependencies.
- **2025-01-08**: Applied npm audit fixes to address dependency vulnerabilities while maintaining application functionality.

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
- **Telegram Bot Integration**: Fully operational @Req_item_bot with comprehensive analysis notifications and advanced image search system. Automatic analysis triggers for all items added to quotation requests (including existing items), designed for sales representatives who need analysis for every quotation. Features multi-source product image search including manufacturer websites (Schneider Electric, Siemens, ABB), electronics retailers (RS Components, Mouser, Digi-Key), and intelligent component type matching. Includes real-time image URL verification and fallback search guidance. Supports both internal system users (IT administrators) and external users via Telegram User ID management.

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