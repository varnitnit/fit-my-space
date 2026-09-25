# MoveFit — Next.js + TypeScript Platform Blueprint for Cursor

## 1. Product Vision

MoveFit is a property discovery and decision platform for India.

Core problem:

> People shortlist properties based on normal factors such as rent, price, commute and location, but after moving they may discover that their existing furniture, appliances and belongings do not fit properly.

MoveFit solves this by allowing a user to:
1. Discover properties normally.
2. Shortlist a small number of properties.
3. Use "Fit My Things" only on serious candidate properties.
4. Place their saved furniture/appliances into an accurately dimensioned property floor plan.
5. Check basic fit, overlap and clearance.
6. Optionally view the room/property in 3D later.

Important product principle:

DO NOT force users to perform fit checks on every property.
The normal property-search flow comes first.

Typical funnel:

100 properties
→ shortlist 5
→ serious candidates 1–3
→ Fit My Things
→ physical visit
→ final decision


## 2. MVP Scope

The first version must be low-cost and should NOT require professional scanning equipment.

Build:

### Customer Web Application
- Authentication
- Property discovery
- Search and filters
- Property details
- Photos
- Owner-uploaded measurement video
- Dimension/floor-plan information
- Favorites / shortlist
- My Things
- 3 free Fit Checks per new user
- 2D room planner
- Furniture placement
- Rotate/move/delete furniture
- Basic collision detection
- Basic clearance warnings
- Fit Check result

### Owner Web Dashboard / Listing Flow
- Create property
- Add property type
- Add rooms
- Enter room dimensions
- Enter doors/windows
- Upload room/property video
- Upload photos
- Submit property for admin review

### Admin Web Dashboard
- Login
- Property review
- Approve/reject listings
- Review measurements
- Manage users
- Manage owners
- Manage Fit Check credits
- View reported problems

### Explicitly NOT in MVP
- LiDAR
- Professional laser measurement equipment
- 360 camera
- Automatic 3D reconstruction
- AR furniture placement
- AI-generated 3D rooms
- Photogrammetry
- NeRF/Gaussian splatting
- Complex VR
- Full payment marketplace
- Large surveyor team


## 3. Product Flow

### Customer

Login
→ Search properties
→ View property
→ Shortlist
→ Compare normal property information
→ Choose serious candidate
→ Check "Fit My Things"
→ Spend 1 Fit Check
→ Select saved things
→ Open measured floor plan
→ Place furniture
→ Check fit
→ Save result
→ Schedule physical visit


## 4. Property Discovery

Normal property marketplace behavior.

Property types:
- Room
- Flat
- Apartment
- House
- PG
- Shop
- Office
- Warehouse

Initial focus should be residential rentals.

Filters:
- City
- Area/locality
- Rent
- Deposit
- Property type
- BHK
- Furnished status
- Area
- Parking
- Floor
- Lift
- Availability
- Distance/commute information where available

Property card should be lightweight.

Example:

Property: 2 BHK Apartment
Rent: ₹25,000/month
Area: 1,100 sq.ft
Location: Sector XX
2 BHK
Parking
Furnished

Actions:
- Favorite
- Shortlist
- View


## 5. Property Detail

Property details should include:

- Photos
- Basic video
- Room list
- Dimensions
- Floor plan
- Measurement source
- Measurement status
- Owner information
- Amenities
- Rent
- Deposit
- Location
- Commute information if available

Measurement labels:

OWNER_SUBMITTED
SURVEYOR_VERIFIED
ADMIN_VERIFIED

Never call owner-submitted measurements "professionally verified".


## 6. Owner Measurement System

The initial system uses normal smartphones.

Owner enters:

Room:
- Length
- Width
- Height

Doors:
- Width
- Position
- Wall

Windows:
- Width
- Height
- Position
- Wall

Fixed objects:
- Built-in wardrobe
- Kitchen counter
- Pillar/column
- Sink
- Other permanent objects

Owner also uploads a guided measurement video.

The video is supporting visual evidence, not the authoritative geometry.

Future guided video flow:

1. Start at entrance.
2. Slowly show first wall.
3. Show door.
4. Show windows.
5. Show opposite wall.
6. Complete room walkthrough.
7. Upload.


## 7. Surveyor System — Future

For complex properties, a surveyor can visit.

Surveyor can eventually use:
- Laser distance meter
- Bluetooth measurement device
- 360 camera

But these are future additions.

The data model MUST support professional verification from day one.

Measurement source:

OWNER
SURVEYOR

Measurement status:

OWNER_SUBMITTED
UNDER_REVIEW
SURVEYOR_VERIFIED
ADMIN_VERIFIED


## 8. My Things

This is a core product feature.

Users create their personal inventory once.

Categories:
- Bed
- Sofa
- Wardrobe
- Table
- Chair
- Refrigerator
- Washing machine
- TV
- TV unit
- Desk
- Appliance
- Other furniture

Each item has:

- id
- user_id
- name
- category
- length_cm
- width_cm
- height_cm
- image_url
- model_asset_url (future)
- created_at
- updated_at

Example:

My Bed
Length: 200 cm
Width: 160 cm
Height: 50 cm

The user should NOT have to recreate/upload the same item for every property.


## 9. Fit Check Credits

New user receives:

3 free Fit Checks

A Fit Check means:
- One property is unlocked for detailed fit checking.
- User can return to that property without spending another credit.
- User can add/remove/rotate their saved things multiple times.

Do NOT charge every time the user opens the property.

Future monetization may include:
- Credit packs
- Premium subscription
- Owner-paid verified listings
- Other marketplace revenue

Initial pricing should remain configurable, not hardcoded.


## 10. 2D Room Planner

This is the most important technical MVP feature.

Do NOT start with full 3D.

Room has real dimensions.

Example:

Room:
420 cm × 350 cm

Furniture:
Bed:
200 × 160 cm

Represent objects using real-world dimensions.

Capabilities:
- Drag
- Move
- Rotate
- Delete
- Add from My Things
- Snap to wall
- Show dimensions
- Detect overlap
- Detect basic clearance issues

Coordinate system:

Use centimeters or millimeters internally.

Recommended:
- Store dimensions in centimeters.
- Use floating point where necessary.
- Keep a consistent world coordinate system.


## 11. Fit Engine

Initial checks:

### A. Room boundary
Does the furniture rectangle stay inside the usable room?

### B. Furniture collision
Do two furniture objects overlap?

### C. Fixed object collision
Does furniture overlap:
- Door
- Window
- Kitchen counter
- Built-in wardrobe
- Pillar
- Other fixed objects?

### D. Door clearance
Flag if furniture blocks the door opening.

### E. Basic walking clearance
Warn if furniture leaves an unusually narrow passage.

Example result:

Bed:
PASS

Sofa:
PASS

Wardrobe:
FAIL — overlaps fixed wardrobe

Dining table:
WARNING — limited walking clearance


## 12. Fit Check Result

Example:

PROPERTY #123

Things checked: 5

Bed
PASS

Sofa
PASS

Refrigerator
PASS

Wardrobe
FAIL

Dining table
WARNING

Overall:
Some selected items need a different arrangement.

Important:
Do NOT give a subjective "best property" score.

Show factual measurements and warnings.


## 13. Comparison Flow

Users first compare properties normally.

Example:

Property A
Property B
Property C
Property D
Property E

Normal comparison:
- Rent
- Deposit
- Location
- BHK
- Area
- Amenities
- Commute
- Furnishing

Only after shortlisting should Fit My Things become prominent.

The platform should NOT require expensive 3D processing for every property.


## 13A. Next.js + TypeScript Frontend Architecture

This project is a WEB PLATFORM, not a Flutter mobile app.

Use:
- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui or equivalent
- TanStack Query for API/server state
- Zod for client-side and shared validation where practical

Use responsive layouts so the same application works on:
- Desktop
- Laptop
- Tablet
- Mobile browser

Main web areas:

### Public
- Home
- Search
- Property listing
- Property details
- Login/register

### Customer
- Dashboard
- Shortlisted properties
- My Things
- Fit Checks
- Saved room arrangements
- Profile

### Owner
- Dashboard
- Create/edit property
- Rooms and measurements
- Upload photos/videos
- Listing status

### Admin
- Dashboard
- Property moderation
- Measurement review
- Owner/user management
- Credit management
- Reports

### Room Planner
The planner should be a client-side interactive feature.
Recommended approach:
- HTML/SVG or Canvas for the first 2D planner
- Keep geometry calculations framework-independent
- Store room and furniture geometry as plain TypeScript data
- Do not introduce a 3D engine in MVP

## 14. Architecture

Recommended initial stack:

### Web Application
Next.js + TypeScript

### Backend
Go
Fiber or Gin

### Database
PostgreSQL

### Cache / temporary state
Redis

### Object storage
S3-compatible object storage or cloud object storage

Store:
- Photos
- Videos
- Future 360 images
- Future GLB models

Do NOT store large videos/images directly in PostgreSQL.

### Admin
Flutter Web or a lightweight web application.

### API
REST initially.

Use WebSocket only when actually required.


## 15. Core Database Entities

users
owners
properties
property_rooms
room_walls
room_doors
room_windows
room_fixed_objects
property_media
property_measurements
user_furniture
fit_checks
fit_check_items
fit_check_results
favorites
property_views
admin_reviews
fit_credits
credit_transactions


## 16. Suggested Database Relationships

User
  ├── UserFurniture
  ├── Favorites
  ├── FitCredits
  └── FitChecks

Owner
  └── Properties

Property
  ├── Rooms
  ├── Media
  ├── Measurements
  └── AdminReview

Room
  ├── Walls
  ├── Doors
  ├── Windows
  └── FixedObjects

FitCheck
  ├── Property
  ├── User
  ├── SelectedFurniture
  └── Results


## 17. Geometry Model

Do NOT make the 3D renderer the source of truth.

The source of truth is geometry data.

Example:

Room:
- width_cm
- length_cm
- height_cm

Wall:
- x1
- y1
- x2
- y2
- height_cm

Door:
- x
- y
- width_cm
- rotation
- wall_id

Window:
- x
- y
- width_cm
- height_cm
- rotation
- wall_id

Furniture placement:
- furniture_id
- x
- y
- rotation
- scale_x
- scale_y

Later the same geometry can power:
- 2D
- 3D
- AR
- VR


## 18. Future 3D

Do NOT implement initially.

When MVP is validated:
- Use GLB/glTF for 3D assets.
- Create reusable generic furniture models.
- Scale models using user's real dimensions.
- Generate/render rooms from stored geometry.

Example:

Generic sofa model
+
User dimensions 220 × 90 × 85 cm
=
Scaled sofa in room.


## 19. Future 360° Tours

Property can contain:

Living Room 360
Bedroom 1 360
Bedroom 2 360
Kitchen 360
Bathroom 360

Room-to-room navigation can be added later.

360 is visualization only.
Measured geometry remains the source of truth.


## 20. API Modules

Suggested API groups:

/api/v1/auth
/api/v1/users
/api/v1/properties
/api/v1/properties/{id}/rooms
/api/v1/rooms/{id}/walls
/api/v1/rooms/{id}/doors
/api/v1/rooms/{id}/windows
/api/v1/properties/{id}/media
/api/v1/furniture
/api/v1/fit-checks
/api/v1/credits
/api/v1/favorites
/api/v1/owners
/api/v1/admin


## 21. Example Fit Check API

POST /api/v1/fit-checks

Request concept:

property_id
selected_furniture_ids

Response concept:

fit_check_id
property_id
status
remaining_credits

Then:

GET /api/v1/fit-checks/{id}

Returns:
- room results
- furniture results
- collision warnings
- clearance warnings
- saved arrangements


## 22. Security

Must have:
- Authentication
- Authorization
- Owner/user/admin roles
- Property ownership checks
- File upload validation
- File size limits
- Rate limiting
- API validation
- Secure object-storage access
- No direct public write access to storage

Never trust dimensions or coordinates directly from the client.


## 23. Media Strategy

MVP:
- Compress photos
- Limit video size
- Generate thumbnails
- Store original separately if required
- Use CDN later

Do not process huge videos synchronously in API requests.

Use background jobs for:
- Video processing
- Thumbnail generation
- Future 3D processing


## 24. Development Phases

### Phase 1 — Foundation
- Go project
- PostgreSQL
- Authentication
- User/owner/admin roles
- Property CRUD

### Phase 2 — Property Marketplace
- Search
- Filters
- Property details
- Photos
- Favorites
- Shortlist

### Phase 3 — Owner Listing
- Add rooms
- Add dimensions
- Add doors/windows
- Upload videos
- Upload photos
- Admin approval

### Phase 4 — My Things
- Furniture CRUD
- Categories
- Dimensions
- Images

### Phase 5 — Fit Credits
- Free credits
- Credit transaction table
- Unlock one property per Fit Check
- Credit validation

### Phase 6 — 2D Planner
- Room geometry
- Furniture rendering
- Drag
- Rotate
- Snap
- Save layout

### Phase 7 — Fit Engine
- Boundary check
- Collision detection
- Door/window collision
- Basic clearance warnings
- Fit result

### Phase 8 — Testing
- Test with real rooms
- Test with real furniture dimensions
- Test inaccurate owner measurements
- Test irregular room shapes
- Improve UX

### Phase 9 — 360 / 3D
Only after the MVP proves demand.


## 25. Low-Cost Principle

Initial goal:

Spend as little as possible.

Do NOT buy:
- 360 camera
- LiDAR device
- professional laser scanner
- expensive 3D software
- surveyor equipment
- large cloud infrastructure

Use:
- Developer's existing computer
- Flutter
- Go
- PostgreSQL
- Basic cloud hosting
- Smartphone video
- Manual dimensions
- Simple 2D geometry

Target initial software validation budget:
approximately ₹10,000–₹30,000 excluding developer time.

Do not commit to large operational spending before validating demand.


## 26. First Validation

Initial market test:
- 20–50 properties
- 50–100 potential users
- One city/region first

Measure:
- Property views
- Shortlists
- Fit Check usage
- Number of users who discover a fit problem
- Repeat Fit Check usage
- Users returning to compare another property
- Willingness to use additional Fit Checks
- Property owners willing to provide measurements

The key validation metric is NOT downloads.

The key question is:

> When a user seriously considers a property, do they actually use Fit My Things to help make the decision?


## 27. Product Positioning

Do not position MoveFit primarily as a "3D property app."

Core positioning:

> Find a property normally. Before you commit, check whether your life and belongings fit inside it.

Possible tagline:

> Know it fits before you move.

Primary CTA:

> Check My Things

Core funnel:

Discover → Shortlist → Fit Check → Visit → Move


## 28. Brand

Working brand:
MoveFit

Possible tagline:
"Know it fits before you move."

Do not assume domain/trademark/app-store availability. Verify availability before committing to the brand.


## 29. Cursor Development Rules

Cursor should:
- Keep backend and frontend modular.
- Use feature-based folders.
- Use clear naming.
- Avoid unnecessary packages.
- Keep geometry calculations in a separate domain/service layer.
- Keep UI independent from geometry calculations.
- Write tests for geometry and collision logic.
- Never put business logic directly into Flutter widgets.
- Validate all API input.
- Use migrations for database changes.
- Use environment variables for secrets.
- Never hardcode API keys.
- Never store large media blobs in PostgreSQL.
- Add TODOs only for genuinely deferred features.
- Do not implement 3D/AR unless explicitly requested.

Suggested Next.js structure:

src/
  app/
    (public)/
      page.tsx
      properties/
      search/
    (auth)/
      login/
      register/
    dashboard/
      page.tsx
      favorites/
      my-things/
      fit-checks/
    owner/
      properties/
      listings/
    admin/
      properties/
      users/
      reviews/
    api/
      ... only for lightweight Next.js-specific endpoints if needed
  components/
    ui/
    properties/
    room-planner/
    furniture/
    forms/
  features/
    auth/
    properties/
    my-things/
    fit-check/
    room-planner/
    owner/
    admin/
  lib/
    api/
    auth/
    geometry/
    storage/
    validation/
  types/
  hooks/

Important:
- Keep geometry calculations in reusable TypeScript modules.
- Keep planner state separate from React UI components.
- Do not put business logic directly inside page.tsx files.
- Use server components by default where appropriate.
- Use client components only for interactive features such as the room planner.

Suggested Go structure:

cmd/
  api/
    main.go

internal/
  auth/
  users/
  owners/
  properties/
  rooms/
  furniture/
  fitcheck/
  credits/
  media/
  admin/
  geometry/

pkg/
  response/
  validation/

migrations/

configs/


## 29A. Next.js First Coding Milestone

Create the first working vertical slice in the web application:

1. Create Next.js + TypeScript project.
2. Create responsive property listing page.
3. Create property detail page.
4. Owner creates a property.
5. Owner creates one room.
6. Owner enters room dimensions.
7. User creates one furniture item.
8. User starts one Fit Check.
9. Open the room planner in the browser.
10. Display the room at correct proportional scale.
11. Display the furniture at correct proportional scale.
12. Drag furniture.
13. Detect whether furniture is inside the room.
14. Save the arrangement to the Go API.

Then continue to multi-room properties.

## 30. First Coding Milestone

Do not start with 3D.

First working vertical slice:

1. Create user.
2. Create owner.
3. Owner creates property.
4. Owner creates one room.
5. Owner enters room dimensions.
6. User creates one furniture item.
7. User starts one Fit Check.
8. App displays room rectangle.
9. App displays furniture rectangle at correct scale.
10. User drags furniture.
11. App detects whether furniture is inside the room.
12. App saves the arrangement.

Once this works reliably, expand the system.

## End Goal

The long-term platform is:

Property marketplace
+
accurate property geometry
+
personal furniture inventory
+
fit checking
+
2D/3D visualization
+
optional professional verification

The most important technology is not 3D.

The most important foundation is:

REAL PROPERTY DIMENSIONS
+
REAL USER FURNITURE DIMENSIONS
+
RELIABLE GEOMETRY ENGINE
