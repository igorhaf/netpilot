# NetPilot - Frontend Documentation

## Blueprint Maintenance Protocol
- ID: frontend.md@v1
- Purpose: Ensure consistent, incremental updates without overwriting existing sections.
- Stable Anchors: Preserve section headings (e.g., "## Project Structure", "## Layout System"). New UI features should use headings like "### [N]. [Feature]" within their category.
- Update Policy: Prefer additive notes and examples. When altering component APIs, include version tags and migration notes.
- Regeneration Rules:
  - Only regenerate sections explicitly mentioned by a prompt.
  - Do not remove unrelated components/pages. Keep file path references accurate (e.g., `resources/js/Pages/Sync.vue`).
  - Keep examples short; point to real files under `resources/js/`.
- Cross-File Contracts: Keep flash message usage in sync with `app/Http/Middleware/HandleInertiaRequests.php` and routes in `routes/web.php`.
- Change Log: Track edits under "## Change Log".

## Overview
NetPilot uses Vue.js 3 with Inertia.js for a modern, reactive single-page application experience. The frontend provides comprehensive management interfaces for domains, proxy rules, SSL certificates, and system monitoring.

## Technology Stack
- **Framework**: Vue.js 3 with Composition API
- **Routing**: Inertia.js (server-side routing)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Vue 3 Reactivity API
- **HTTP Client**: Inertia.js (built-in)

## Project Structure

```
resources/js/
├── Components/           # Reusable Vue components
├── Composables/         # Vue composition functions
├── Layouts/             # Page layout components
├── Pages/               # Page components (Inertia pages)
│   ├── Dashboard.vue    # Main dashboard
│   ├── Domains/         # Domain management pages
│   ├── Proxy/           # Proxy rules pages
│   ├── SSL/             # SSL certificate pages
│   ├── Redirects/       # Redirect rules pages
│   ├── Routes/          # Route rules pages
│   ├── Upstreams/       # Upstream services pages
│   ├── Logs/            # Deployment logs pages
│   └── Sync.vue         # Configuration sync page
├── app.js               # Main application entry
└── bootstrap.js         # Application bootstrap
```

## Layout System

### AppLayout
**File**: `resources/js/Layouts/AppLayout.vue`

**Purpose**: Main application layout with navigation, header, and content areas.

**Features**:
- Responsive navigation sidebar
- User authentication status
- Flash message display
- Mobile-friendly hamburger menu
- Breadcrumb navigation

**Structure**:
```vue
<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navigation Sidebar -->
    <nav class="bg-white shadow-sm">
      <!-- Navigation items -->
    </nav>
    
    <!-- Main Content -->
    <main class="py-10">
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>
```

## Page Components

### 1. Dashboard
**File**: `resources/js/Pages/Dashboard.vue`

**Purpose**: Main dashboard with system overview and quick actions.

**Features**:
- System status cards
- Recent activity feed
- Quick action buttons
- Statistics overview
- Real-time updates

**Key Sections**:
- Domain count and status
- SSL certificate status
- Recent deployment logs
- Proxy rule statistics
- System health indicators

---

### 2. Domain Management

#### Domains Index
**File**: `resources/js/Pages/Domains/Index.vue`

**Features**:
- Paginated domain list
- Search and filtering
- Bulk actions
- Status indicators
- Quick actions (edit, delete, toggle)

**Data Table Columns**:
- Domain name
- Status (active/inactive)
- SSL status
- Proxy rules count
- Last updated
- Actions

#### Domain Create/Edit
**Files**: 
- `resources/js/Pages/Domains/Create.vue`
- `resources/js/Pages/Domains/Edit.vue`

**Form Fields**:
- Domain name (required)
- Description (optional)
- Active status toggle
- Auto SSL toggle
- DNS records (JSON editor)

**Validation**:
- Domain name format validation
- Uniqueness checking
- DNS record validation

---

### 3. Proxy Rules Management

#### Proxy Rules Index
**File**: `resources/js/Pages/Proxy/Index.vue`

**Features**:
- Filterable proxy rules list
- Domain-based grouping
- Priority sorting
- Status toggles
- Bulk deployment actions

**Table Structure**:
- Source (host:port)
- Target (host:port)
- Protocol
- Priority
- Status
- Actions

#### Proxy Rule Create/Edit
**Files**:
- `resources/js/Pages/Proxy/Create.vue`
- `resources/js/Pages/Proxy/Edit.vue`

**Form Components**:
- Domain selection dropdown
- Source host/port inputs
- Target host/port inputs
- Protocol selection
- Priority slider
- Headers editor (JSON)
- Active status toggle

---

### 4. Route Rules Management

#### Route Rules Index
**File**: `resources/js/Pages/Routes/Index.vue`

**Features**:
- Advanced routing rules display
- Path pattern visualization
- HTTP method filtering
- Upstream service linking
- Rule priority management

#### Route Rule Create/Edit
**Files**:
- `resources/js/Pages/Routes/Create.vue`
- `resources/js/Pages/Routes/Edit.vue`

**Advanced Fields**:
- Path pattern with regex support
- HTTP method selection
- Upstream service dropdown
- Middleware configuration
- Timeout settings
- Load balancing options

---

### 5. Upstream Services

#### Upstreams Index
**File**: `resources/js/Pages/Upstreams/Index.vue`

**Features**:
- Service health monitoring
- Load balancing weights
- Health check configuration
- Service grouping by domain

#### Upstream Create/Edit
**Files**:
- `resources/js/Pages/Upstreams/Create.vue`
- `resources/js/Pages/Upstreams/Edit.vue`

**Configuration Options**:
- Service name and description
- Target URL validation
- Health check endpoint
- Check interval settings
- Load balancing weight
- Active status management

---

### 6. SSL Certificate Management

#### SSL Index
**File**: `resources/js/Pages/SSL/Index.vue`

**Features**:
- Certificate status dashboard
- Expiration date tracking
- Auto-renewal settings
- Bulk renewal actions
- Certificate details modal

**Status Indicators**:
- Valid (green)
- Expiring soon (yellow)
- Expired (red)
- Failed (red)
- Pending (blue)

#### SSL Certificate Create
**File**: `resources/js/Pages/SSL/Create.vue`

**Certificate Request Form**:
- Domain selection
- SAN domains (multi-input)
- Challenge type selection
- Email override
- Staging environment toggle

---

### 7. Redirect Rules

#### Redirects Index
**File**: `resources/js/Pages/Redirects/Index.vue`

**Features**:
- Redirect rules table
- Pattern matching preview
- Redirect type indicators
- Test redirect functionality

#### Redirect Create/Edit
**Files**:
- `resources/js/Pages/Redirects/Create.vue`
- `resources/js/Pages/Redirects/Edit.vue`

**Redirect Configuration**:
- Source pattern (regex support)
- Target URL with variables
- Redirect type (301/302)
- Query preservation toggle
- Priority settings

---

### 8. Deployment Logs

#### Logs Index
**File**: `resources/js/Pages/Logs/Index.vue`

**Features**:
- Real-time log streaming
- Log level filtering
- Search functionality
- Export capabilities
- Auto-refresh toggle

**Log Display**:
- Timestamp
- Operation type
- Status (success/failed/running)
- Duration
- Output/Error details
- Expandable details view

---

### 9. Configuration Sync

#### Sync Page
**File**: `resources/js/Pages/Sync.vue`

**Features**:
- One-click configuration sync
- Progress indicators
- Sync results display
- Operation status feedback
- Next steps guidance

**Sync Process**:
1. User clicks "Run Sync" button
2. Loading spinner appears
3. POST request to `/sync` endpoint
4. Results displayed in success/error format
5. Instructions for next steps

## Reusable Components

### Form Components
- `FormInput.vue` - Styled input fields
- `FormSelect.vue` - Dropdown selections
- `FormTextarea.vue` - Multi-line text inputs
- `FormToggle.vue` - Boolean toggle switches
- `FormButton.vue` - Consistent button styling

### UI Components
- `Modal.vue` - Overlay dialogs
- `Alert.vue` - Success/error messages
- `Badge.vue` - Status indicators
- `Card.vue` - Content containers
- `Table.vue` - Data tables with sorting
- `Pagination.vue` - Page navigation

### Status Components
- `StatusBadge.vue` - Colored status indicators
- `LoadingSpinner.vue` - Loading animations
- `ProgressBar.vue` - Operation progress
- `HealthIndicator.vue` - Service health status

## Composables (Vue 3 Composition API)

### useFlashMessages
**Purpose**: Handles flash message display and auto-dismissal.

```javascript
const { flash, showMessage, dismissMessage } = useFlashMessages()
```

### useConfirmation
**Purpose**: Provides confirmation dialogs for destructive actions.

```javascript
const { confirm } = useConfirmation()
await confirm('Delete this domain?', 'This action cannot be undone.')
```

### usePagination
**Purpose**: Manages paginated data display and navigation.

```javascript
const { currentPage, totalPages, goToPage } = usePagination(data)
```

### useSearch
**Purpose**: Implements client-side search and filtering.

```javascript
const { searchTerm, filteredResults } = useSearch(items, searchFields)
```

## State Management

### Inertia Props
Global props shared across all pages via `HandleInertiaRequests` middleware:

```javascript
// Available in all components
$page.props.app.name        // Application name
$page.props.flash.success   // Success messages
$page.props.flash.error     // Error messages
$page.props.auth.user       // Authenticated user
```

### Local State
Components use Vue 3 reactivity for local state:

```javascript
import { ref, reactive, computed } from 'vue'

const loading = ref(false)
const form = reactive({
  name: '',
  description: ''
})
const isValid = computed(() => form.name.length > 0)
```

## Styling and Design

### Tailwind CSS Classes
Consistent design system using Tailwind utilities:

```css
/* Primary buttons */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded;
}

/* Status badges */
.badge-success { @apply bg-green-100 text-green-800; }
.badge-warning { @apply bg-yellow-100 text-yellow-800; }
.badge-error { @apply bg-red-100 text-red-800; }
```

### Responsive Design
- Mobile-first approach
- Breakpoint-specific layouts
- Touch-friendly interface elements
- Collapsible navigation for mobile

### Dark Mode Support
- CSS custom properties for theming
- System preference detection
- Manual theme toggle
- Consistent color schemes

## Form Handling

### Inertia Form Helper
Simplified form submission with validation:

```javascript
import { useForm } from '@inertiajs/vue3'

const form = useForm({
  name: '',
  description: ''
})

const submit = () => {
  form.post('/domains', {
    onSuccess: () => form.reset(),
    onError: (errors) => console.log(errors)
  })
}
```

### Validation Display
Client-side validation with server-side error display:

```vue
<template>
  <input 
    v-model="form.name"
    :class="{ 'border-red-500': form.errors.name }"
  />
  <div v-if="form.errors.name" class="text-red-500 text-sm">
    {{ form.errors.name }}
  </div>
</template>
```

## Real-time Features

### Auto-refresh
Automatic page refresh for dynamic content:

```javascript
import { router } from '@inertiajs/vue3'

// Refresh every 30 seconds
setInterval(() => {
  router.reload({ only: ['logs'] })
}, 30000)
```

### WebSocket Integration (Future)
Planned real-time features:
- Live log streaming
- Status updates
- Progress notifications
- System alerts

## Performance Optimization

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports for large components

### Caching Strategy
- Browser caching for static assets
- Inertia page caching
- Component-level caching

### Bundle Optimization
- Tree shaking for unused code
- Asset optimization
- Gzip compression

## Testing Strategy

### Component Testing
- Vue Test Utils for component testing
- Jest for test runner
- Mock Inertia for isolated testing

### E2E Testing
- Cypress for end-to-end testing
- User journey testing
- Cross-browser compatibility

## Build and Development

### Vite Configuration
**File**: `vite.config.js`

```javascript
export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            refresh: true,
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
    ],
})
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Accessibility

### WCAG Compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus trapping in modals
- Skip navigation links

## Security Considerations

### XSS Prevention
- Vue.js automatic escaping
- Sanitization of user inputs
- Content Security Policy headers

### CSRF Protection
- Laravel CSRF tokens
- Inertia automatic token handling
- Form validation

### Authentication
- Laravel Sanctum integration
- Route protection middleware
- Session management
 
## Change Log
- 2025-08-29: Added Blueprint Maintenance Protocol and Change Log to standardize safe, incremental updates.
