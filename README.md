# Friend-Party

A lightweight social web application where users create parties, answer questionnaires about themselves and each other, and receive calculated D&D-style character sheets based on collective input.

## Overview

Friend-Party is a fun, engaging way for friends to see how they perceive each other through gamified personality profiling using D&D-style stats and classes. Users create parties, answer questionnaires about themselves and each other, and receive calculated D&D-style character sheets based on collective input.

## Features

- **Party Creation**: Create and join parties with unique 6-letter codes
- **Questionnaire System**: Self-assessment and peer-assessment questionnaires
- **D&D-Style Results**: Calculated character sheets with stats and classes
- **Real-time Updates**: Live party status and member updates
- **Social Features**: Adventurer name proposals, party mottos, hirelings
- **Achievement System**: Unlock achievements and customize avatars
- **Responsive Design**: Works on desktop and mobile devices
- **Shareable Results**: Public links to share party results

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
git clone https://github.com/your-org/friend-party.git
cd friend-party
npm install
```

### Configuration

Create an `.env` file at the repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For Supabase local stack:
```bash
# after `npx supabase start`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_LOCAL_ANON_KEY
```

### Development

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Gameplay

1. **Create Party**: Start a new party and get a unique 6-letter code
2. **Invite Friends**: Share the code with friends to join your party
3. **Answer Questions**: Complete self-assessment and peer-assessment questionnaires
4. **View Results**: See everyone's D&D-style character sheets
5. **Share Results**: Share your party's results with others

### Advanced Features

- **Adventurer Names**: Propose and vote on cool names for party members
- **Party Mottos**: Create and vote on a motto for your party
- **Hirelings**: Include non-participating friends in assessments
- **Achievements**: Unlock achievements and customize avatars
- **Party Morale**: Track party morale and affect leader decisions

## Project Structure

```
/friend-party
  ├── src/                    # Source code
  │   ├── app/               # Next.js App Router pages
  │   │   ├── api/           # API endpoints
  │   │   ├── party/         # Party management pages
  │   │   └── profile/       # User profile pages
  │   ├── components/        # React components
  │   │   ├── common/        # Shared components
  │   │   └── ui/            # UI components
  │   ├── hooks/             # Custom React hooks
  │   ├── lib/               # Utilities and services
  │   └── types/             # TypeScript type definitions
  ├── database/              # Database migrations and seeds
  ├── docs/                  # Documentation
  │   ├── prd.md            # Product Requirements Document
  │   └── todo.md           # Project TODO list
  ├── README.md              # Project overview (this file)
  ├── prd.md                 # Product Requirements Document
  └── task-list.md           # Task list and progress tracking
```

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

MIT License

## Acknowledgements

- D&D 5e rules and classes for inspiration
- Next.js and React communities for excellent tooling
- Supabase for database and authentication services
- Tailwind CSS for the utility-first approach
