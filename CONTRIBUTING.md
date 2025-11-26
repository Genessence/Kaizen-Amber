# Contributing to QuoteFlow Pro

Thank you for your interest in contributing! This guide will help you get started.

---

## 📋 Quick Start

1. **Fork the repository**
2. **Clone your fork**
3. **Create a branch** for your changes
4. **Make your changes**
5. **Test thoroughly**
6. **Submit a pull request**

---

## 🐛 Reporting Bugs

Found a bug? Please create a [Bug Report](https://github.com/your-org/your-repo/issues/new?template=bug_report.md) with:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, OS, etc.)
- Screenshots/console errors

**Before reporting:**
- Search existing issues to avoid duplicates
- Test in the latest version
- Try in incognito mode to rule out extensions

---

## ✨ Requesting Features

Have an idea? Create a [Feature Request](https://github.com/your-org/your-repo/issues/new?template=feature_request.md) with:

- Problem statement
- Proposed solution
- Expected benefits
- User stories
- Acceptance criteria

**Before requesting:**
- Check if similar feature exists or was requested
- Consider if it fits the project scope
- Think about alternative solutions

---

## 💻 Development Setup

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 14+
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/your-repo.git
cd your-repo

# Install frontend dependencies
cd amber-best-flow
npm install

# Install backend dependencies
cd ../node-backend
npm install

# Set up database
npx prisma migrate dev
```

### Environment Setup

Create `.env` files based on `.env.example`:

```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:8080/api/v1

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
```

### Running Locally

```bash
# Terminal 1 - Backend
cd node-backend
npm run dev

# Terminal 2 - Frontend
cd amber-best-flow
npm start
```

Application will be available at `http://localhost:3000`

---

## 🔀 Git Workflow

### Branch Naming

Use descriptive branch names:

```
feat/add-savings-calculator
fix/dashboard-cache-invalidation
refactor/analytics-service
docs/update-testing-guide
```

**Prefixes:**
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add login rate limiting
fix(dashboard): resolve cache invalidation issue
docs(readme): update installation instructions
refactor(api): simplify savings calculation logic
test(analytics): add star rating boundary tests
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance
- `perf` - Performance improvement
- `style` - Code style (formatting)

---

## 🧪 Testing Requirements

### Before Submitting

Run all tests:

```bash
# Backend tests
cd node-backend
npm test

# Frontend tests
cd amber-best-flow
npm test
```

### Manual Testing

Use our testing guides:

1. **Quick Test** (~30 min): [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)
2. **Comprehensive** (~4 hours): [MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md)
3. **Performance**: [PERFORMANCE_TEST_SCRIPT.md](./PERFORMANCE_TEST_SCRIPT.md)

**Minimum requirements:**
- ✅ Login works
- ✅ Can submit best practice
- ✅ Dashboard updates immediately
- ✅ No console errors
- ✅ Mobile responsive
- ✅ All tests pass

---

## 📝 Pull Request Process

### 1. Create Your PR

Click "Compare & pull request" and fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

**Required sections:**
- Description of changes
- Type of change
- Testing checklist
- Screenshots (for UI changes)

### 2. Complete All Checklists

- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console errors
- [ ] Works on mobile

### 3. Get Reviews

- Tag appropriate reviewers
- Address all comments
- Update documentation
- Resolve conflicts

### 4. Merge

Once approved:
- Ensure CI/CD passes
- Squash commits (if needed)
- Merge to main
- Delete branch

---

## 🎨 Code Style

### Frontend (React)

**Follow:**
- ESLint configuration
- React best practices
- Functional components with hooks
- PropTypes or TypeScript
- Component structure from [DOCUMENTATION.md](./amber-best-flow/DOCUMENTATION.md)

**Example:**
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  const handleEvent = () => {
    // Handler logic
  };
  
  return (
    <div className="component-wrapper">
      {/* JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default ComponentName;
```

### Backend (Node.js/Express)

**Follow:**
- ESLint configuration
- RESTful API conventions
- Error handling patterns
- Zod validation
- Service layer architecture

**Example:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

export class Controller {
  async method(req: Request, res: Response, next: NextFunction) {
    try {
      // Validation
      // Business logic
      // Response
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 📚 Documentation

### Code Comments

**Add comments for:**
- Complex logic
- Non-obvious solutions
- Business rules
- Algorithm explanations

**JSDoc example:**
```javascript
/**
 * Calculate star rating based on monthly and YTD savings
 * 
 * @param {Decimal} monthlySavings - Monthly savings in lakhs
 * @param {Decimal} ytdSavings - Year-to-date savings in lakhs
 * @param {string} currency - Currency format ('lakhs' or 'crores')
 * @returns {number} Star rating (0-5)
 */
calculateStarRating(monthlySavings, ytdSavings, currency) {
  // Implementation
}
```

### Update Documentation

When making changes, update:
- [DOCUMENTATION.md](./amber-best-flow/DOCUMENTATION.md) - User stories, workflows
- [README.md](./README.md) - Setup, features
- API documentation - Endpoint changes
- Code comments - Function purposes

---

## 🔒 Security

### Report Security Issues

**Do NOT** create public issues for security vulnerabilities.

Instead:
1. Email: security@yourcompany.com
2. Include: Detailed description, steps to reproduce, impact
3. Wait for response before disclosure

### Security Best Practices

- Validate all inputs
- Sanitize user data
- Use parameterized queries
- Implement CSRF protection
- Follow OWASP guidelines
- Review code for vulnerabilities

---

## ✅ Code Review Guidelines

### For Authors

**Before requesting review:**
- Self-review your changes
- Run tests and linter
- Update documentation
- Add screenshots
- Complete PR checklist

### For Reviewers

**Review for:**
- Code quality and standards
- Security implications
- Performance impact
- Test coverage
- Documentation completeness

**Be constructive:**
- Point out specific issues
- Suggest improvements
- Explain reasoning
- Approve when satisfied

---

## 🎯 Contribution Levels

### Good First Issues

New contributors should look for:
- Label: `good-first-issue`
- Small scope
- Well-documented
- Mentorship available

### Help Wanted

Experienced contributors can tackle:
- Label: `help-wanted`
- Medium complexity
- Important features
- Technical challenges

### Core Development

For core team:
- Architecture decisions
- Breaking changes
- Major features
- Security fixes

---

## 📊 Recognition

### Contributors

All contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Recognized in README
- Thanked in documentation

### Top Contributors

Special recognition for:
- Consistent contributions
- Code quality
- Helpful reviews
- Community support

---

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Help others learn
- Collaborate openly

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information
- Unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to: conduct@yourcompany.com

---

## 📞 Getting Help

### Where to Ask

1. **Documentation**: Check [DOCUMENTATION.md](./amber-best-flow/DOCUMENTATION.md) first
2. **Discussions**: Use GitHub Discussions for questions
3. **Issues**: Create an issue for bugs
4. **Team Chat**: Join our Slack/Discord (if available)

### Response Time

- Issues: 1-2 business days
- PRs: 2-3 business days
- Security: Within 24 hours
- Questions: Best effort

---

## 📈 Development Process

### Sprint Cycle

We follow 2-week sprints:

1. **Planning** (Monday)
   - Review backlog
   - Assign issues
   - Set sprint goals

2. **Development** (Week 1-2)
   - Code and test
   - Daily standups
   - Continuous integration

3. **Review** (Friday)
   - Demo features
   - Retrospective
   - Planning for next sprint

4. **Release** (As needed)
   - Deploy to staging
   - QA testing
   - Production deployment

### Release Schedule

- **Major versions** (X.0.0): Quarterly
- **Minor versions** (x.X.0): Monthly
- **Patches** (x.x.X): As needed
- **Hotfixes**: Immediate

---

## 🎓 Learning Resources

### Project-Specific

- [Architecture Overview](./amber-best-flow/DOCUMENTATION.md)
- [API Documentation](#)
- [Testing Guide](./MANUAL_TESTING_GUIDE.md)
- [Performance Guide](./PERFORMANCE_TEST_SCRIPT.md)

### External Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## ✨ Thank You!

Thank you for contributing to QuoteFlow Pro! Every contribution, no matter how small, makes a difference.

**Questions?** Feel free to ask in [Discussions](https://github.com/your-org/your-repo/discussions) or reach out to the maintainers.

Happy coding! 🚀

---

**Last Updated:** 2025-01-26  
**Maintainers:** [List maintainers]

