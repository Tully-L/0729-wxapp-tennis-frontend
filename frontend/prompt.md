# English Prompt for AI  
You are a professional WeChat Mini Program developer specializing in sports event applications. Please analyze the requirements exclusively from the document *requirement.md* and provide technical solutions focused on the following core points:  

1. **UI/UX Design**:  
   - Adopt a design style similar to Roland-Garros, with the specified color scheme (primary color: deep green #0A4A39 for navigation bars, event status labels like "FINAL", and key action buttons).  
   - Implement a partitioned layout (left: match data; right: entry section) to clearly distinguish event status and core data.  
   - Use concise event-related icons for visual consistency and reserve support for two themes.  

2. **Core Function Modules**:  
   - **Homepage**: Classify and display events by status (completed/ongoing/upcoming) with pagination to avoid lag from large datasets.  
   - **Filtering**: Enable filtering by event type (Men's Singles, Women's Doubles, etc.), region (city-level precision), and date range (with a bottom-floating selector).  
   - **Match Details**: Show event type, players (avatars, names, rankings), set scores (with tiebreak details if 6:6 in the final set), duration, and status (completed/ongoing/registration).  
   - **User Center**: Display personal info (custom unchangeable ID, editable avatar), club lists with points, and match statistics (wins/losses, participation count, win rate).  
   - **Event Registration & Publishing**: Show registrable events; restrict permissions (players: private events only; clubs: private/public events).  

3. **Data Structure**:  
   Design 3 related tables for matches, sets, and events, with key fields including:  
   - Event type, status, organizer, match name, stage (e.g., 16-to-8), region, duration.  
   - Player info (avatars, names, rankings) for singles/doubles.  
   - Set scores (e.g., 4:6, 6:2) with default game scores (40:0 for winners/losers per game) and tiebreak details if applicable.  

4. **Technical Requirements**:  
   Ensure responsive design, smooth filtering interactions, clear role-based permission control (players vs. clubs), and pagination for match data to optimize performance.  

Please provide a structured technical solution in English, strictly aligned with the requirements in *requirement.md* and excluding references to any other documents.
I'll analyze the requirements from requirement.md and provide a technical solution for the WeChat Mini Program.
Read file: requirement.md
Read file: account.md
# Technical Solution for Tennis Heat WeChat Mini Program

## 1. Development Architecture

### Technology Stack
- **Frontend**: WeChat Mini Program (WXML, WXSS, JavaScript)
- **Backend**: Node.js
- **Database**: MongoDB

## 2. UI/UX Design Implementation

### Color Scheme
- **Primary Color**: Deep green (#0A4A39) for:
  - Navigation bars
  - Event status labels (FINAL, SEMI-FINAL)
  - Key action buttons
  - Card headers
- **Text on Primary**: White (#FFFFFF) for navigation text
- **Button Interaction**: Darker shade (#083A2F) for button press feedback

### Layout Structure
- **Navigation**: Tab-based navigation with fixed tabs:
  - Live
  - Completed
  - Upcoming
  - Events
  - Players
  - Days
- **Homepage Split Layout**:
  - Left section: Match data display
  - Right section: Entry/registration area
- **Responsive Design**: Adaptable to different mobile screen sizes

### Visual Components
- **Card Design**: Event cards with consistent styling
- **Icons**: Clean, sports-focused icons maintaining visual consistency
- **Theme Support**: Two theme options (default Roland-Garros inspired)

## 3. Core Function Modules

### Homepage Module
```javascript
// Event listing with pagination
Page({
  data: {
    events: [],
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    status: 'all', // 'completed', 'ongoing', 'upcoming'
    filters: {
      eventType: null,
      player: null,
      region: null,
      dateRange: null
    }
  },
  
  onLoad() {
    this.loadEvents();
  },
  
  loadEvents() {
    // Fetch events with pagination and applied filters
  },
  
  applyFilter(filterType, value) {
    // Apply filters and reload events
  }
})
```

### Filtering System
- **Event Type Filter**: Men's/Women's Singles/Doubles, Mixed Doubles
- **Player Search**: Text-based player search functionality
- **Region Filter**: City-level precision location filtering
- **Date Range**: Bottom-floating date range selector

### Match Detail Module
```javascript
// Match detail data structure
{
  eventId: "string",
  eventType: "string", // Men's Singles, Women's Doubles, etc.
  matchName: "string",
  stage: "string", // FINAL, SEMI-FINAL, 16-to-8, etc.
  status: "string", // completed, ongoing, registration
  region: "string",
  venue: "string",
  duration: "string", // Format: "2h15"
  format: "string", // 1-set, 3-set, 5-set
  players: [
    {
      id: "string",
      name: "string",
      avatar: "string",
      ranking: number,
      team: number // For doubles matches
    }
  ],
  sets: [
    {
      setNumber: number,
      score: {
        team1: number,
        team2: number
      },
      tiebreak: {
        played: boolean,
        team1: number,
        team2: number
      }
    }
  ]
}
```

### User Center Module
```javascript
// User profile data structure
{
  id: "string", // Unchangeable after registration
  nickname: "string", // Editable
  avatar: "string", // Editable, can use WeChat avatar
  signature: "string", // Max 30 chars
  backgroundImage: "string",
  gender: "string",
  stats: {
    participationCount: number,
    wins: number,
    losses: number,
    championships: number,
    runnerUps: number,
    winRate: number,
    etaPoints: number
  },
  clubs: [
    {
      id: "string",
      name: "string",
      points: number
    }
  ]
}
```

### Event Registration & Publishing Module
```javascript
// Event publishing form structure
{
  name: "string",
  id: "string",
  coverImage: "string",
  venue: "string",
  court: "string",
  organizer: {
    id: "string",
    name: "string",
    type: "string" // player or club
  },
  description: "string",
  eventDate: "date",
  registrationDeadline: "date",
  isPublic: boolean, // Only true if organizer is club
  status: "string" // registration, ongoing, completed, cancelled
}
```

## 4. Data Structure Design

### Database Schema

#### Event Collection
```javascript
{
  _id: ObjectId,
  name: String,
  eventType: String, // Men's Singles, Women's Doubles, etc.
  organizer: {
    id: String,
    name: String,
    type: String // player or club
  },
  status: String, // registration, ongoing, completed, cancelled
  venue: String,
  region: String,
  coverImage: String,
  description: String,
  eventDate: Date,
  registrationDeadline: Date,
  isPublic: Boolean,
  matches: [ObjectId], // References to Match collection
  createdAt: Date,
  updatedAt: Date
}
```

#### Match Collection
```javascript
{
  _id: ObjectId,
  eventId: ObjectId, // Reference to Event collection
  matchName: String,
  stage: String, // FINAL, SEMI-FINAL, etc.
  status: String, // completed, ongoing, scheduled
  duration: String, // Format: "2h15"
  format: String, // 1-set, 3-set, 5-set
  players: [
    {
      id: String,
      name: String,
      avatar: String,
      ranking: Number,
      team: Number // For doubles matches
    }
  ],
  sets: [ObjectId], // References to Set collection
  createdAt: Date,
  updatedAt: Date
}
```

#### Set Collection
```javascript
{
  _id: ObjectId,
  matchId: ObjectId, // Reference to Match collection
  setNumber: Number,
  score: {
    team1: Number,
    team2: Number
  },
  games: [
    {
      gameNumber: Number,
      winner: Number, // 1 or 2
      score: {
        team1: Number, // Default 0 for loser, 40 for winner
        team2: Number
      }
    }
  ],
  tiebreak: {
    played: Boolean,
    team1: Number,
    team2: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### User Collection
```javascript
{
  _id: ObjectId,
  id: String, // Custom ID, unchangeable
  nickname: String,
  avatar: String,
  signature: String,
  backgroundImage: String,
  gender: String,
  role: String, // player or club
  stats: {
    participationCount: Number,
    wins: Number,
    losses: Number,
    championships: Number,
    runnerUps: Number,
    winRate: Number,
    etaPoints: Number
  },
  clubs: [
    {
      id: String,
      name: String,
      points: Number
    }
  ],
  matchHistory: [ObjectId], // References to Match collection
  createdAt: Date,
  updatedAt: Date
}
```

## 5. Technical Implementation Details

### State Management
- Use WeChat Mini Program's built-in data binding and event system
- Implement a global state management pattern for cross-page data

### API Design
```javascript
// Core API endpoints
const API = {
  events: {
    list: '/api/events',
    detail: '/api/events/:id',
    create: '/api/events',
    update: '/api/events/:id',
    delete: '/api/events/:id'
  },
  matches: {
    list: '/api/matches',
    detail: '/api/matches/:id',
    create: '/api/matches',
    update: '/api/matches/:id',
    delete: '/api/matches/:id'
  },
  users: {
    profile: '/api/users/:id',
    update: '/api/users/:id',
    stats: '/api/users/:id/stats',
    matches: '/api/users/:id/matches'
  },
  clubs: {
    list: '/api/clubs',
    detail: '/api/clubs/:id',
    members: '/api/clubs/:id/members',
    leaderboard: '/api/clubs/:id/leaderboard'
  }
}
```

### Performance Optimization
- Implement lazy loading for images
- Use pagination for all list views (10 items per page)
- Cache frequently accessed data
- Optimize MongoDB queries with proper indexing

### Permission Control
- Role-based access control for players vs clubs
- Secure API endpoints with appropriate authorization checks
- Implement validation for all form submissions

## 6. Development Phases

### Phase 1: Setup and Core Structure
- Project initialization and configuration
- UI component library development
- Basic navigation and layout implementation

### Phase 2: Core Functionality
- Homepage with event listing and filtering
- Match detail page with complete data display
- User authentication and profile management

### Phase 3: Advanced Features
- Event registration and publishing system
- Club management functionality
- Match statistics and history

### Phase 4: Optimization
- Performance improvements
- UI/UX refinements
- Theme support implementation
- Testing and bug fixes

Each phase will include comprehensive testing to ensure all features work correctly before proceeding to the next phase.