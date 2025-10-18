# Contributing to Exit Interview Application

First off, thank you for considering contributing to the Exit Interview Application! It's people like you that make this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR-USERNAME/exit-interview-app-os.git
   cd exit-interview-app-os
   ```
3. **Set up the upstream remote**
   ```bash
   git remote add upstream https://github.com/amitlyzr/exit-interview-os.git
   ```
4. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How Can I Contribute?

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in the required values (see README.md for details)

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)

### Types of Contributions

- **Bug Fixes**: Fix issues reported in GitHub Issues
- **New Features**: Add new functionality (please discuss in an issue first)
- **Documentation**: Improve README, add code comments, write guides
- **Testing**: Add unit tests, integration tests, or E2E tests
- **Performance**: Optimize code, reduce bundle size, improve loading times
- **UI/UX**: Improve design, accessibility, or user experience

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow the existing code style (we use ESLint)
- Use **functional components** with React Hooks
- Prefer **const** over let, avoid var
- Use **async/await** over Promise chains
- Add **JSDoc comments** for complex functions

```typescript
/**
 * Send an interview invitation email to an employee
 * @param employeeId - The unique identifier of the employee
 * @param emailTemplate - The email template to use
 * @returns Promise resolving to send status
 */
async function sendInvitation(
  employeeId: string,
  emailTemplate: EmailTemplate
): Promise<SendResult> {
  // Implementation
}
```

### React Components

- Use **named exports** for components
- Keep components **small and focused** (single responsibility)
- Use **custom hooks** to extract reusable logic
- Add **PropTypes** or TypeScript interfaces for props

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  // Implementation
}
```

### File Naming

- **Components**: PascalCase (e.g., `EmailTemplate.tsx`)
- **Utilities**: camelCase (e.g., `emailService.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **API Routes**: kebab-case (e.g., `send-invitation/route.ts`)

### Styling

- Use **Tailwind CSS** utility classes
- Follow the existing design system
- Ensure **responsive design** for all screen sizes
- Test in both **light and dark modes**

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(email): add support for custom SMTP providers

fix(auth): resolve token refresh issue on session expiry

docs(readme): update installation instructions

refactor(analytics): extract sentiment analysis to separate service
```

## Pull Request Process

1. **Update documentation** if needed (README, API docs, etc.)
2. **Add tests** for new features or bug fixes
3. **Ensure all tests pass** locally
   ```bash
   npm run lint
   npm run build
   ```
4. **Update the CHANGELOG.md** with your changes
5. **Create a pull request** with a clear title and description
6. **Link related issues** (e.g., "Closes #123")
7. **Request review** from maintainers
8. **Address feedback** and make requested changes
9. **Squash commits** if requested before merging

### Pull Request Template

Your PR should include:

- **What**: Brief description of the changes
- **Why**: Reason for the changes (link to issue if applicable)
- **How**: Technical approach and implementation details
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes (before/after)
- **Checklist**: Confirm all requirements are met

## Reporting Bugs

### Before Submitting a Bug Report

- **Check existing issues** to avoid duplicates
- **Test with the latest version** to see if it's already fixed
- **Collect relevant information**: OS, browser, Node version, error messages

### How to Submit a Bug Report

Use the **Bug Report** issue template and include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs actual behavior
- **Screenshots or videos** if applicable
- **Environment details**: OS, browser, Node version
- **Error messages** or stack traces
- **Possible solution** if you have one

## Suggesting Enhancements

### Before Submitting an Enhancement

- **Check existing issues** and discussions
- **Consider if it aligns** with the project goals
- **Think about the impact** on existing users

### How to Submit an Enhancement

Use the **Feature Request** issue template and include:

- **Clear title** and description
- **Use case**: Why is this needed?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches you thought about
- **Additional context**: Mockups, examples, references

## Development Guidelines

### Database Changes

- **Create migrations** for schema changes
- **Test with both local and cloud** MongoDB
- **Document new collections/fields** in code comments

### API Changes

- **Maintain backward compatibility** when possible
- **Version breaking changes** appropriately
- **Update API documentation** in README

### Security Considerations

- **Never commit secrets** or API keys
- **Validate all user inputs**
- **Sanitize data** before database operations
- **Follow security best practices** for authentication

### Testing

- Write **unit tests** for utilities and services
- Add **integration tests** for API routes
- Test **edge cases** and error scenarios
- Ensure **test coverage** for critical paths

## Questions?

Don't hesitate to ask questions! You can:

- **Open a discussion** on GitHub Discussions
- **Comment on an existing issue**
- **Join our community** chat (if available)

## Recognition

Contributors will be:

- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes**
- **Recognized in the community**

Thank you for contributing! 🎉
