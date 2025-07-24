# Manyla Client-Side Implementation Guide

## Overview

Manyla's client-side implementation uses React with TypeScript, Material-UI for components, and implements zero-trust encryption for data security. This guide covers the complete frontend architecture.

## Project Structure

```
/src/
├── components/
│   ├── Dialogs/           # Unified dialogs for add/edit operations
│   ├── Forms/             # Entry form components
│   ├── Layout/            # Header and layout components
│   ├── Onboarding/        # Welcome and setup screens
│   ├── Profile/           # Profile display and management
│   ├── Settings/          # Category and quick info managers
│   ├── Sharing/           # Share dialog and shared views
│   └── Sync/              # Sync dialog and status
├── context/
│   ├── SyncContext.tsx    # Sync state management
│   └── ThemeContext.tsx   # Theme provider with persistence
├── hooks/
│   └── useMobileDialog.tsx # Mobile-responsive dialog hook
├── services/
│   └── sync/
│       └── manylaEncryptionService.js # Encryption implementation
├── types/
│   └── ChildProfile.ts    # TypeScript interfaces
├── utils/
│   ├── defaultCategories.ts # Default category configurations
│   └── defaultQuickInfo.ts  # Default quick info panels
└── theme/
    └── theme.ts           # Material-UI theme configuration
```

## Core Components

### 1. App Component (`App.tsx`)

The main application component handles routing and state management:

```typescript
function App() {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isSharedView, setIsSharedView] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);

  useEffect(() => {
    // Check for share parameter
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('share');
    
    if (code) {
      setShareCode(code);
      setIsSharedView(true);
      setShowOnboarding(false);
    } else {
      // Load existing profile from localStorage
      const storedProfile = localStorage.getItem('manyla_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        // Parse dates
        parsed.dateOfBirth = new Date(parsed.dateOfBirth);
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        parsed.entries = parsed.entries.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
        setProfile(parsed);
        setShowOnboarding(false);
      }
    }
  }, []);

  // Routing logic
  if (isSharedView && shareCode) {
    return <SharedView shareCode={shareCode} />;
  }
  
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }
  
  return <MainApp profile={profile} />;
}
```

### 2. Data Types (`types/ChildProfile.ts`)

Core data structures for the application:

```typescript
export interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: Date;
  preferredName?: string;
  pronouns?: string;
  photo?: string;
  entries: Entry[];
  categories: CategoryConfig[];
  quickInfoPanels: QuickInfoConfig[];
  createdAt: Date;
  updatedAt: Date;
  themeMode?: 'light' | 'dark';
}

export interface Entry {
  id: string;
  category: string;
  title: string;
  description: string;
  date: Date;
  visibility: 'all' | 'family' | 'education' | 'medical';
}

export interface CategoryConfig {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isVisible: boolean;
  order: number;
  isCustom: boolean;
}

export interface QuickInfoConfig {
  id: string;
  displayName: string;
  value: string;
  isVisible: boolean;
  order: number;
}
```

### 3. Theme Context (`context/ThemeContext.tsx`)

Provides theme management with persistence:

```typescript
export const ManylaThemeProvider: React.FC<{
  children: ReactNode;
  initialThemeMode?: 'light' | 'dark';
  onThemeChange?: (mode: 'light' | 'dark') => void;
}> = ({ children, initialThemeMode = 'light', onThemeChange }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(
    initialThemeMode || (prefersDarkMode ? 'dark' : 'light')
  );

  const theme = useMemo(
    () => createTheme(getTheme(mode)),
    [mode]
  );

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    onThemeChange?.(newMode);
  };

  return (
    <ColorModeContext.Provider value={{ toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
```

### 4. Profile Overview (`components/Profile/ProfileOverview.tsx`)

Main profile display component:

```typescript
export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profile,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onUpdateQuickInfo,
  onUpdateCategories,
  onUpdateProfile,
}) => {
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [quickInfoManagerOpen, setQuickInfoManagerOpen] = useState(false);

  // Calculate age
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={profile.photo}
              sx={{ width: 80, height: 80 }}
            >
              {profile.preferredName?.[0] || profile.name[0]}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4">
              {profile.preferredName || profile.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profile.pronouns} • {calculateAge(profile.dateOfBirth)} years old
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Info Panels */}
      {profile.quickInfoPanels.filter(p => p.isVisible).length > 0 && (
        <QuickInfoDisplay
          panels={profile.quickInfoPanels}
          onManage={() => setQuickInfoManagerOpen(true)}
        />
      )}

      {/* Category Sections */}
      {profile.categories
        .filter(cat => cat.isVisible)
        .sort((a, b) => a.order - b.order)
        .map(category => (
          <CategorySection
            key={category.id}
            category={category}
            entries={profile.entries.filter(e => e.category === category.name)}
            onAddEntry={() => onAddEntry(category.name)}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
          />
        ))}

      {/* Management Dialogs */}
      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={profile.categories}
        onSave={onUpdateCategories}
      />
      
      <QuickInfoManager
        open={quickInfoManagerOpen}
        onClose={() => setQuickInfoManagerOpen(false)}
        panels={profile.quickInfoPanels}
        onSave={onUpdateQuickInfo}
      />
    </Box>
  );
};
```

### 5. Mobile Dialog Hook (`hooks/useMobileDialog.tsx`)

Provides responsive dialog behavior:

```typescript
export const useMobileDialog = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const mobileDialogProps = isMobile
    ? {
        fullScreen: true,
        TransitionComponent: SlideTransition,
        sx: {
          '& .MuiDialog-paper': {
            m: 0,
            borderRadius: 0,
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
          },
        },
      }
    : {
        fullWidth: true,
        maxWidth: 'sm' as const,
      };

  return { mobileDialogProps, isMobile };
};
```

## State Management

### 1. Local Storage

Profile data is persisted to localStorage:

```typescript
const saveProfile = (profile: ChildProfile) => {
  localStorage.setItem('manyla_profile', JSON.stringify(profile));
};

const loadProfile = (): ChildProfile | null => {
  const stored = localStorage.getItem('manyla_profile');
  if (!stored) return null;
  
  const parsed = JSON.parse(stored);
  // Convert date strings back to Date objects
  parsed.dateOfBirth = new Date(parsed.dateOfBirth);
  parsed.createdAt = new Date(parsed.createdAt);
  parsed.updatedAt = new Date(parsed.updatedAt);
  parsed.entries = parsed.entries.map((e: any) => ({
    ...e,
    date: new Date(e.date)
  }));
  
  return parsed;
};
```

### 2. Share Storage

Temporary shares stored locally for development:

```typescript
interface ShareData {
  profile: ChildProfile;
  createdAt: Date;
  expiresAt: Date;
  recipientName?: string;
  note?: string;
}

const saveShare = (token: string, data: ShareData) => {
  const shares = JSON.parse(localStorage.getItem('manyla_shares') || '{}');
  shares[token] = data;
  localStorage.setItem('manyla_shares', JSON.stringify(shares));
};

const getShare = (token: string): ShareData | null => {
  const shares = JSON.parse(localStorage.getItem('manyla_shares') || '{}');
  const data = shares[token];
  
  if (!data) return null;
  
  // Check expiration
  if (new Date(data.expiresAt) < new Date()) {
    delete shares[token];
    localStorage.setItem('manyla_shares', JSON.stringify(shares));
    return null;
  }
  
  return data;
};
```

## Encryption Service

### Zero-Knowledge Encryption (`services/sync/manylaEncryptionService.js`)

```javascript
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import scrypt from 'scrypt-js';

class ManylaEncryptionService {
  constructor() {
    this.keyPair = null;
    this.recoveryPhrase = null;
  }

  generateRecoveryPhrase() {
    // Child-friendly word list
    const words = [
      'apple', 'happy', 'sunny', 'flower', 'bunny',
      'cookie', 'puppy', 'rainbow', 'smile', 'star',
      // ... more words
    ];
    
    // Generate 6 random words
    const phrase = [];
    for (let i = 0; i < 6; i++) {
      const index = Math.floor(Math.random() * words.length);
      phrase.push(words[index]);
    }
    
    return phrase.join(' ');
  }

  async initialize(recoveryPhrase) {
    this.recoveryPhrase = recoveryPhrase;
    
    // Derive key from phrase
    const salt = new TextEncoder().encode('manyla-salt-v1');
    const password = new TextEncoder().encode(recoveryPhrase);
    
    const derivedKey = await scrypt.scrypt(
      password,
      salt,
      16384, // N
      8,     // r
      1,     // p
      32     // key length
    );
    
    // Generate deterministic keypair
    this.keyPair = nacl.box.keyPair.fromSecretKey(derivedKey);
    
    // Generate sync ID
    const syncId = naclUtil.encodeBase64(
      nacl.hash(this.keyPair.publicKey).slice(0, 32)
    );
    
    // Store in secure storage
    await this.secureStore('manyla_keypair', this.keyPair);
    await this.secureStore('manyla_phrase', recoveryPhrase);
    
    return { syncId };
  }

  async encryptData(data) {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized');
    }
    
    const message = new TextEncoder().encode(JSON.stringify(data));
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    
    const encrypted = nacl.secretbox(
      message,
      nonce,
      this.keyPair.secretKey
    );
    
    // Combine nonce + encrypted data
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);
    
    return naclUtil.encodeBase64(combined);
  }

  async decryptData(encryptedBase64) {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized');
    }
    
    const combined = naclUtil.decodeBase64(encryptedBase64);
    
    // Extract nonce and encrypted data
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const encrypted = combined.slice(nacl.secretbox.nonceLength);
    
    const decrypted = nacl.secretbox.open(
      encrypted,
      nonce,
      this.keyPair.secretKey
    );
    
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    
    const message = new TextDecoder().decode(decrypted);
    return JSON.parse(message);
  }

  async secureStore(key, value) {
    // In production, use platform-specific secure storage
    // For web, use encrypted localStorage
    const encrypted = await this.encryptForStorage(value);
    localStorage.setItem(key, encrypted);
  }

  async secureRetrieve(key) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    return await this.decryptFromStorage(encrypted);
  }
}

export default new ManylaEncryptionService();
```

## UI Components

### 1. Entry Form (`components/Forms/EntryForm.tsx`)

```typescript
export const EntryForm: React.FC<EntryFormProps> = ({
  open,
  onClose,
  onSave,
  category,
  entry,
}) => {
  const { mobileDialogProps, isMobile } = useMobileDialog();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    visibility: 'all' as Entry['visibility'],
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        description: entry.description,
        date: entry.date,
        visibility: entry.visibility,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: new Date(),
        visibility: 'all',
      });
    }
  }, [entry, open]);

  const handleSubmit = () => {
    onSave({
      ...formData,
      category,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} {...mobileDialogProps}>
      {isMobile ? (
        <AppBar position="sticky">
          <Toolbar>
            <IconButton edge="start" onClick={onClose}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {entry ? 'Edit Entry' : 'New Entry'}
            </Typography>
            <Button color="inherit" onClick={handleSubmit}>
              Save
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle>
          {entry ? 'Edit Entry' : 'New Entry'}
        </DialogTitle>
      )}
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={4}
            fullWidth
            required
          />
          
          <DatePicker
            label="Date"
            value={formData.date}
            onChange={(date) => date && setFormData({ ...formData, date })}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
          
          <FormControl fullWidth>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as Entry['visibility'] })}
              label="Visibility"
            >
              <MenuItem value="all">Everyone</MenuItem>
              <MenuItem value="family">Family Only</MenuItem>
              <MenuItem value="education">Education Team</MenuItem>
              <MenuItem value="medical">Medical Team</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      
      {!isMobile && (
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
```

### 2. Category Section (`components/Profile/CategorySection.tsx`)

```typescript
export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper sx={{ mb: 2 }}>
      <Box
        sx={{
          p: 2,
          backgroundColor: category.color + '20',
          borderBottom: 1,
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={category.displayName}
              size="small"
              sx={{ backgroundColor: category.color, color: 'white' }}
            />
            <Typography variant="body2" color="text.secondary">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Typography>
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {entries.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No entries yet
            </Typography>
          ) : (
            <Stack spacing={2}>
              {entries
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => onEditEntry(entry)}
                    onDelete={() => onDeleteEntry(entry.id)}
                  />
                ))}
            </Stack>
          )}
          
          <Button
            startIcon={<AddIcon />}
            onClick={onAddEntry}
            fullWidth
            sx={{ mt: 2 }}
          >
            Add {category.displayName}
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};
```

## Mobile Responsiveness

### 1. Responsive Grid Layouts

```typescript
import { Grid2 as Grid } from '@mui/material';

// Responsive grid that stacks on mobile
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <QuickInfoPanel />
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <QuickInfoPanel />
  </Grid>
</Grid>
```

### 2. Mobile-First Components

```typescript
const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  if (isMobile) {
    return (
      <AppBar position="sticky">
        <Toolbar>
          <ManilaIcon />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Manyla
          </Typography>
          <IconButton onClick={(e) => setMobileMenuAnchor(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={() => setMobileMenuAnchor(null)}
          >
            <MenuItem onClick={handleShare}>Share Profile</MenuItem>
            <MenuItem onClick={handleSync}>Sync</MenuItem>
            <MenuItem onClick={toggleTheme}>Toggle Theme</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    );
  }

  // Desktop layout
  return (
    <AppBar position="sticky">
      <Toolbar>
        <ManilaIcon />
        <Typography variant="h5">Manyla</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<ShareIcon />} onClick={handleShare}>
          Share Profile
        </Button>
        <IconButton onClick={handleSync}>
          <SyncIcon />
        </IconButton>
        <IconButton onClick={toggleTheme}>
          <ThemeIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};
```

## Performance Optimization

### 1. Lazy Loading

```typescript
const ShareDialog = lazy(() => import('./components/Sharing/ShareDialog'));
const SyncDialog = lazy(() => import('./components/Sync/SyncDialog'));

// In component
<Suspense fallback={<CircularProgress />}>
  <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
</Suspense>
```

### 2. Memoization

```typescript
const ProfileOverview = memo(({ profile, ...props }) => {
  // Expensive calculations
  const statistics = useMemo(() => {
    return {
      totalEntries: profile.entries.length,
      categoryCounts: profile.categories.reduce((acc, cat) => {
        acc[cat.name] = profile.entries.filter(e => e.category === cat.name).length;
        return acc;
      }, {}),
    };
  }, [profile.entries, profile.categories]);

  return <ProfileDisplay stats={statistics} {...props} />;
});
```

### 3. Debouncing

```typescript
const SearchableList = ({ items, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <TextField
      value={searchTerm}
      onChange={handleSearchChange}
      placeholder="Search..."
    />
  );
};
```

## Build and Deployment

### 1. Environment Configuration

```bash
# .env.production
REACT_APP_API_URL=https://stackmap.app/manyla/api
REACT_APP_SHARE_DOMAIN=https://stackmap.app/manyla
PUBLIC_URL=/manyla
```

### 2. Build Process

```json
// package.json
{
  "homepage": "https://stackmap.app/manyla",
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "source-map-explorer 'build/static/js/*.js'",
    "deploy": "npm run build && rsync -avz --delete build/ server:/var/www/manyla/"
  }
}
```

### 3. Production Optimizations

```typescript
// Service worker for offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register('/manyla/service-worker.js');
}

// Error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```