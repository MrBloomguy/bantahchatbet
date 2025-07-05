# Bantah - Social Betting Platform

## Overview

Bantah is a modern social betting platform built with React, TypeScript, and Node.js. The application allows users to create and participate in events, challenges, and social betting activities. It features real-time chat, payment processing, and comprehensive user management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system using Radix UI components
- **State Management**: React Context API for global state (Auth, Wallet, Toast, etc.)
- **Routing**: React Router for client-side navigation
- **Real-time**: WebSocket connections for live updates and chat functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Custom phone/email authentication with Supabase integration
- **File Storage**: Supabase Storage for user uploads and media
- **Payment Processing**: Paystack integration for deposits and withdrawals

### Mobile-First Design
- Responsive design optimized for mobile devices
- Progressive Web App (PWA) capabilities with service worker
- Touch-friendly interface with gesture support

## Key Components

### Authentication System
- Multi-provider authentication (phone, email, social)
- Custom OTP verification system
- Admin authentication with separate context
- JWT-based session management

### Real-time Chat System
- Private messaging between users
- Group chat functionality
- Challenge-specific chat rooms
- Message reactions and emoji support
- File/media sharing capabilities

### Event Management
- Public and private event creation
- Category-based event organization
- Betting pools with entry amounts
- Real-time participant tracking
- Event lifecycle management (pending, active, completed)

### Challenge System
- User-to-user gaming challenges
- Platform support (PS5, Xbox, PC)
- Evidence submission (screenshots, videos)
- Automated scoring and payouts
- Social sharing of challenge results

### Wallet & Payments
- Dual balance system (real money and bonus points)
- Paystack integration for deposits/withdrawals
- Bank account verification
- Transaction history and receipts
- Platform fee management

### Admin Dashboard
- Comprehensive admin panel for platform management
- User management and moderation tools
- Event oversight and control
- Financial reporting and analytics
- Broadcast messaging system
- Audit logging for compliance

## Data Flow

### User Authentication Flow
1. User initiates login with phone/email
2. OTP verification sent via SMS/email
3. User verification creates/updates profile in database
4. JWT token issued and stored in local storage
5. User context updated across application

### Event Participation Flow
1. User browses available events
2. Selects event and confirms participation
3. Wallet balance validated and deducted
4. User added to event participants
5. Real-time updates sent to all participants
6. Event outcome determines payouts

### Payment Processing Flow
1. User initiates deposit/withdrawal
2. Paystack payment gateway handles transaction
3. Webhook confirms payment status
4. Wallet balance updated in database
5. Transaction record created for audit trail

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Supabase**: Authentication, storage, and real-time subscriptions
- **Paystack**: Payment processing for Nigerian market
- **Vercel/Railway**: Application hosting and deployment

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast JavaScript bundling for production
- **TypeScript**: Type safety and developer experience

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **React Query**: Server state management and caching
- **Date-fns**: Date manipulation and formatting

## Deployment Strategy

### Development Environment
- Local development with Vite dev server
- Hot module replacement for rapid iteration
- Environment variables for API keys and configuration
- Database migrations handled via Drizzle Kit

### Production Deployment
- Frontend: Static site generation with Vite build
- Backend: Express server bundled with ESBuild
- Database: Managed PostgreSQL on Neon
- CDN: Static assets served via Vercel Edge Network

### Environment Configuration
- Separate configurations for development, staging, and production
- Secure environment variable management
- Database connection pooling for scalability
- Error monitoring and logging

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Successfully migrated from Bolt to Replit - PostgreSQL database with Drizzle ORM, API secrets configured, application running successfully