# قرطبة للتوريدات - نظام إدارة التوريدات

## Overview

A comprehensive business management system for قرطبة للتوريدات. This web application manages quotation requests, item cataloging, purchase orders, and administrative operations with role-based access control. The system integrates AI-powered item analysis through DeepSeek API to identify duplicate items and enhance data quality. Built as a demand-based procurement system without inventory management.

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

## Recent Critical Fixes (August 3, 2025)

### Data Import Corrections
- **✅ Fixed All Quotation Data**: Corrected 1,405 quotation requests to match original Excel data exactly
- **✅ Item Linking Issues Resolved**: Fixed incorrect item-to-quotation associations during import process
- **✅ Complete Data Import**: Final correction included all items from Excel, including zero-quantity items
- **✅ Final Statistics**: 89 quotations corrected, 556 items removed, 805 items added for perfect data integrity
- **✅ Zero Quantity Items**: Now includes all items from Excel even with qty=0 for complete data matching
- **✅ Data Integrity Verified**: All quotation items now match source Excel file with correct LINE ITEM codes
- **✅ Quotation Number Display**: Shows original Excel column F numbers throughout the system

### Purchase Orders Import (August 3, 2025)
- **✅ Purchase Orders Imported**: Successfully imported 257 purchase orders from Excel data
- **✅ PO-RFQ Linking**: Properly linked purchase orders to their corresponding quotation requests
- **✅ PO Items**: Imported 332 purchase order items with quantities and prices from Excel
- **✅ Order Status**: Imported order status (delivered/pending) based on Excel condition field
- **✅ Total Value**: ₹7,787,932 total value across all purchase orders imported

### Customer Pricing Interface Simplification (August 3, 2025)
- **✅ Removed All Pricing Tables**: Completely removed complex historical pricing tables from customer pricing interface
- **✅ Simplified Customer Pricing**: Redesigned CustomerPricingNew.tsx with clean, simple interface without tables
- **✅ Clean Workflow**: Streamlined customer pricing process with basic form inputs only
- **✅ No Historical Data**: Eliminated all historical pricing displays as requested by user
- **✅ User Satisfaction**: Interface now meets user requirements for simplicity

### AI Integration Architecture
- **AI Provider**: DeepSeek API integration for item analysis
- **Purpose**: Duplicate detection and item categorization
- **Processing Flow**: Items are sent to AI after entry for similarity analysis
- **Data Enhancement**: AI results stored alongside item data for decision making
- **Fallback Handling**: System continues operation if AI service is unavailable

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