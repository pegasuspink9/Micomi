# Import Path Resolution Guide

## React Native Import Path Best Practices

### Understanding Relative Paths in React Native

When working with React Native and Expo, proper import path resolution is crucial for successful bundling. Here's a guide based on the recent fix:

### Directory Structure and Import Patterns

```
Frontend/app/
├── services/           # API services and utilities
├── hooks/             # Custom React hooks  
├── Components/
│   ├── Map/           # Map-related components
│   ├── Test/          # Testing components
│   └── ...
└── (tabs)/            # Tab navigation components
```

### Import Path Rules

1. **From `hooks/` to `services/`**: Use `../services/`
   ```jsx
   // In: app/hooks/useMaps.js
   import { simpleApiService } from '../services/simpleApi';
   ```

2. **From `Components/Test/` to `services/`**: Use `../../services/`
   ```jsx
   // In: app/Components/Test/ConnectionTest.jsx  
   import { simpleApiService } from '../../services/simpleApi';
   ```

3. **From `Components/Map/` to `hooks/`**: Use `../../hooks/`
   ```jsx
   // In: app/Components/Map/MapNavigate.jsx
   import { useMaps } from '../../hooks/useMaps';
   ```

4. **From `(tabs)/` to `Components/`**: Use `../Components/`
   ```jsx
   // In: app/(tabs)/Profile.jsx
   import MapHeader from '../Components/Map/mapHeader';
   ```

### Common Mistakes

❌ **Incorrect**: Using one `../` when two are needed
```jsx
// From app/Components/Test/ConnectionTest.jsx
import { simpleApiService } from '../services/simpleApi'; // WRONG
```

✅ **Correct**: Using proper number of `../` to traverse directory structure
```jsx
// From app/Components/Test/ConnectionTest.jsx  
import { simpleApiService } from '../../services/simpleApi'; // CORRECT
```

### Debugging Import Issues

1. **Count directory levels**: Manually count how many levels up you need to go
2. **Use absolute paths temporarily**: Test with absolute paths first, then convert to relative
3. **Check file extensions**: Ensure you're importing `.js` files correctly (extension usually omitted)
4. **Verify file existence**: Confirm the target file actually exists at the expected location

### Metro Bundler Specifics

React Native's Metro bundler is strict about import resolution:
- Must use exact relative paths
- Case-sensitive file names
- No automatic resolution of index files in some cases

### Project-Specific Notes

- All API services are in `app/services/`
- Custom hooks are in `app/hooks/`
- Reusable components are organized in `app/Components/`
- Page components use tab navigation in `app/(tabs)/`

### Verification Commands

```bash
# Check file structure
tree Frontend/app /F

# Clear Metro cache if having issues
npx expo start --clear

# Check for import issues in specific files
npx expo start --clear --no-dev
```
