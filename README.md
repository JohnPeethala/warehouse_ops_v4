# Warehouse Ops v4

A modern, high-performance warehouse and logistics operations dashboard built with Next.js 15, React, and Supabase.

## 🚀 Features

- **Active Tickets Management**: Advanced data grid with custom filtering, sorting, and priority tagging for dispatch operations.
- **Schedule & Dispatch Planner**: Google Maps integrated route planning and dynamic assignment of tickets to vehicles and ground teams.
- **Custom Batch Processing**: Interface for managing manifest uploads and ticket batch operations.
- **Live Ground Team Tracker**: Real-time monitoring of team locations and route progression.
- **Settings & Administration**: Management of lookup tables, locations, team structures, and vehicles.
- **Modern UI**: Polished, responsive interface featuring Tailwind CSS, `lucide-react` icons, and specialized table components.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: Google Maps JavaScript API

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Supabase Project & Database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JohnPeethala/warehouse_ops_v4.git
   cd warehouse_ops_v4
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `src/app/` - Next.js App Router pages and layouts.
  - `active-tickets/` - Ticket management and filtering grid.
  - `schedule/` - Ticket scheduling and assignment tools.
  - `planner/` - Map-based route planner interface.
  - `custom-batch/` - Batch ticket processing.
  - `settings/` - Configuration for users, vehicles, and tags.
- `src/components/` - Reusable UI components.
- `src/lib/` - Utilities, Supabase clients, and database schema types.
- `supabase/migrations/` - SQL migrations for Supabase tables.

## 📄 License
Private Repository.
