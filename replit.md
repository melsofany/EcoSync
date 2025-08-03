# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview

A comprehensive business management system for قرطبة للتوريدات (Qurtoba Supplies). This web application manages quotation requests, item cataloging, purchase orders, and administrative operations with role-based access control. The system integrates AI-powered item analysis through DeepSeek API to identify duplicate items and enhance data quality. Built as a demand-based procurement system without inventory management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: Arabic RTL (right-to-left) interface with Arabic content
- **Form Handling**: React Hook Form with Zod validation schemas
- **Authentication**: Session-based authentication with role-based access control

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL session store
- **Authentication**: bcrypt for password hashing with session-based auth
- **API Design**: RESTful API with centralized error handling and activity logging
- **Development**: Hot module replacement via Vite integration

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Structure**: 
  - Users table with role-based permissions (manager, it_admin, data_entry, purchasing)
  - Clients table for customer management
  - Quotation requests with status tracking
  - Items catalog with AI processing status
  - Purchase orders linked to quotations
  - Activity logging for audit trail
- **Data Validation**: Zod schemas for type-safe data validation
- **Migrations**: Drizzle Kit for database schema management

### Authentication & Authorization
- **Session-based Authentication**: Express sessions with PostgreSQL storage
- **Role-based Access Control**: Four user roles with different permission levels
- **Activity Tracking**: Comprehensive logging of user actions with IP addresses
- **Online Status**: Real-time tracking of user login/logout status
- **Password Security**: bcrypt hashing with salt rounds

## Recent Critical Updates (August 3, 2025)

### Company Rebranding
- **✅ Company Name Updated**: Changed from "الخديوي" to "قرطبة للتوريدات" throughout the system
- **✅ New Logo Integration**: Added company logo to login page and sidebar
- **✅ UI Updates**: Updated all references to company name in Arabic interface

### Purchase Order Search Fix (August 3, 2025)
- **✅ Fixed Search Issue**: Resolved problem where quotation number "25R00002" was not found in purchase order creation
- **✅ Enhanced Search Logic**: Updated search to include both `requestNumber` and `customRequestNumber` fields
- **✅ Improved Display**: Modified UI to show custom request numbers (like 25R00002) as primary display with system numbers as secondary
- **✅ Type Definitions**: Added `customRequestNumber` field to Quotation TypeScript interface
- **✅ User Experience**: Users can now successfully search and create purchase orders for all quotation numbers

## Recent Critical Fixes (August 3, 2025)

### Data Import Corrections
- **✅ Fixed All Quotation Data**: Corrected 1,405 quotation requests to match original Excel data exactly
- **✅ Item Linking Issues Resolved**: Fixed incorrect item-to-quotation associations during import process
- **✅ Complete Data Import**: Final correction included all items from Excel, including zero-quantity items
- **✅ Final Statistics**: 89 quotations corrected, 556 items removed, 805 items added for perfect data integrity
- **✅ Zero Quantity Items**: Now includes all items from Excel even with qty=0 for complete data matching
- **✅ Data Integrity Verified**: All quotation items now match source Excel file with correct LINE ITEM codes
- **✅ Quotation Number Display**: Shows original Excel column F numbers throughout the system

### Data Reset and Cleanup (August 3, 2025)
- **✅ User Data Cleaned**: Removed all manually entered data by users while preserving Excel imports
- **✅ Purchase Orders Reset**: Deleted 258 user-created purchase orders and 372 items
- **✅ Preserved Excel Data**: Maintained all 1,541 imported quotation requests and 5,323 items
- **✅ Clean State**: System now contains only authentic data from original Excel imports
- **✅ Database Integrity**: Clean database ready for fresh user operations on imported data

### Customer Pricing Interface Simplification (August 3, 2025)
- **✅ Removed All Pricing Tables**: Completely removed complex historical pricing tables from customer pricing interface
- **✅ Simplified Customer Pricing**: Redesigned CustomerPricingNew.tsx with clean, simple interface without tables
- **✅ Clean Workflow**: Streamlined customer pricing process with basic form inputs only
- **✅ No Historical Data**: Eliminated all historical pricing displays as requested by user
- **✅ User Satisfaction**: Interface now meets user requirements for simplicity

### Item Numbering System Update (August 3, 2025)
- **✅ New P- Format**: Changed all item numbers from ELEK format to P-000001 format
- **✅ Database Function**: Created generate_p_number() function for automatic P- number generation
- **✅ Mass Update**: Updated all 2,040 existing items to use new P- numbering format
- **✅ Schema Update**: Modified items table to use new default numbering function
- **✅ UI Updates**: Updated all screens to reflect new P- format in forms and displays
- **✅ Standardization**: Unified item numbering across all system components

### Purchase Orders Import Recovery (August 3, 2025)
- **✅ Import Issue Identified**: Found that purchase orders were missing after data cleanup
- **✅ Custom Import Script**: Created specialized import script for purchase orders from Excel data
- **✅ Purchase Orders Imported**: Successfully imported 257 purchase orders from original data
- **✅ PO Items Linked**: Imported 657 purchase order items with proper item linking
- **✅ Status Mapping**: Mapped delivery status based on "condition" field from Excel
- **✅ Complete Recovery**: Purchase orders page now shows all authentic data from Excel

### LINE ITEM Display Enhancement (August 3, 2025)
- **✅ Standardized Format**: Implemented consistent LINE ITEM display format "6666.001.GENRAL.0069" across all screens
- **✅ Items Catalog**: Added dedicated LINE ITEM column in items table with blue monospace formatting
- **✅ Quotation Details**: Added LINE ITEM column in quotation items display with enhanced visibility
- **✅ Purchase Orders**: Updated purchase order creation and details screens to prominently show LINE ITEM
- **✅ Supplier Pricing**: Added LINE ITEM column to pricing tables for clear item identification
- **✅ Consistent Styling**: Applied uniform blue monospace font styling for all LINE ITEM displays

### Intelligent Item Matching System
- **Approach**: Manual intelligent analysis without external AI dependencies
- **Purpose**: Duplicate detection and item unification using advanced text matching
- **Core Features**: Part number normalization, description similarity analysis, keyword extraction
- **Processing Flow**: Items analyzed using custom algorithms for pattern recognition
- **Unification System**: Creates normalized identifiers for grouping similar items
- **Performance**: High-confidence matching with detailed similarity scoring

### System Features
- **Multi-role Dashboard**: Customized views based on user permissions
- **Quotation Management**: Full lifecycle from request to completion
- **Item Catalog**: AI-enhanced item management with duplicate detection
- **Purchase Order Processing**: Integration with quotation system
- **Comprehensive Reporting**: Role-based report access with export capabilities
- **Real-time Activity Monitoring**: Live user status and action tracking
- **Arabic Interface**: Complete RTL support with Arabic content

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless or self-hosted)
- **Session Store**: PostgreSQL with connect-pg-simple

### AI Services
- **DeepSeek API**: For item analysis and duplicate detection
- **API Configuration**: Configurable API key storage in system settings

### Development & Build Tools
- **Vite**: Frontend development server and build tool
- **Replit Integration**: Development environment plugins for Replit platform
- **esbuild**: Server-side code bundling for production

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library for consistent iconography

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **bcrypt**: Password hashing and verification
- **nanoid**: Unique ID generation
- **clsx**: Conditional class name utilities

### File Processing
- **Excel Integration**: Support for Excel file operations (via xlsx types)
- **File Upload**: Attachment handling for company assets

### Development Dependencies
- **TypeScript**: Static type checking
- **ESLint/Prettier**: Code formatting and linting
- **PostCSS**: CSS processing with Autoprefixer