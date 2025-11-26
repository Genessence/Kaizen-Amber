# GitHub Templates & Workflows

This directory contains GitHub templates and configuration files for the QuoteFlow Pro project.

---

## 📁 Contents

### Issue Templates

#### 🐛 Bug Report (`ISSUE_TEMPLATE/bug_report.md`)
Use this template when reporting bugs or issues.

**When to use:**
- Something is broken
- Getting errors
- Feature not working as expected
- Performance issues
- Security concerns

**Includes:**
- Bug description and expected vs actual behavior
- Steps to reproduce
- Environment details (browser, OS, device)
- Console and network errors
- Impact assessment (severity, affected users)
- Screenshots/videos section

---

#### ✨ Feature Request (`ISSUE_TEMPLATE/feature_request.md`)
Use this template when suggesting new features or enhancements.

**When to use:**
- New feature ideas
- Enhancement suggestions
- UI/UX improvements
- Process improvements

**Includes:**
- Problem statement and proposed solution
- User stories and acceptance criteria
- Business and user value
- Technical considerations
- Priority and effort estimates
- Success metrics

---

### Pull Request Template

#### 📝 Pull Request Template (`PULL_REQUEST_TEMPLATE.md`)
This template automatically appears when creating a new pull request.

**Sections:**
- **Description**: What, why, and related issues
- **Type of Change**: Bug fix, feature, breaking change, etc.
- **Testing Checklist**: Manual and automated testing
- **Code Quality Checklist**: Standards and best practices
- **Documentation Checklist**: Updated docs and comments
- **Deployment Checklist**: Pre and post-deployment steps
- **Screenshots/Videos**: Visual evidence of changes
- **Performance Impact**: Bundle size and metrics
- **Security Considerations**: Security review checklist
- **Pre-Merge Checklist**: Final verification steps

---

## 🎯 How to Use

### Creating an Issue

1. Go to the "Issues" tab in GitHub
2. Click "New issue"
3. Choose the appropriate template:
   - 🐛 Bug Report
   - ✨ Feature Request
4. Fill out all relevant sections
5. Mark completed items with `[x]`
6. Remove sections that don't apply
7. Add appropriate labels
8. Assign to relevant team members
9. Submit the issue

### Creating a Pull Request

1. Push your branch to GitHub
2. Click "Compare & pull request"
3. The PR template will automatically load
4. Fill out all relevant sections:
   - Provide clear description
   - Mark completed checklist items
   - Add screenshots for UI changes
   - Link related issues
   - Tag reviewers
5. Mark as "Ready for review" when complete
6. Address all review comments
7. Ensure all CI/CD checks pass
8. Merge when approved

---

## ✅ Checklists Explained

### Testing Checklist

**Purpose:** Ensure all changes are properly tested before merging

**Key Items:**
- Manual testing on multiple browsers
- Mobile responsiveness verified
- User roles tested (Plant/HQ)
- Form validation working
- No console errors
- Automated tests passing

**How to complete:**
1. Test each item locally
2. Mark with `[x]` when verified
3. Add test results in the PR description
4. Include screenshots/videos as proof

---

### Code Quality Checklist

**Purpose:** Maintain code standards and best practices

**Key Items:**
- Follows style guidelines
- Clear naming conventions
- Proper comments
- No debugging code left
- DRY principle followed
- Error handling implemented

**How to complete:**
1. Self-review your code
2. Run linter and fix all errors
3. Check for console.log() statements
4. Verify all tests pass
5. Ensure documentation is clear

---

### Documentation Checklist

**Purpose:** Keep documentation up to date

**Key Items:**
- README updated
- DOCUMENTATION.md updated
- API docs updated
- Code comments added
- CHANGELOG updated

**How to complete:**
1. Update relevant documentation files
2. Add JSDoc comments for functions
3. Update API specs if endpoints changed
4. Add examples for new features

---

## 🎨 Template Customization

### Modifying Templates

1. Edit the appropriate `.md` file in `.github/`
2. Test the template by creating a test issue/PR
3. Commit changes
4. Templates will update automatically

### Adding New Templates

1. Create new `.md` file in `ISSUE_TEMPLATE/`
2. Add YAML front matter:
   ```yaml
   ---
   name: Template Name
   about: Description
   title: '[PREFIX] '
   labels: label-name
   assignees: ''
   ---
   ```
3. Add template content below front matter
4. Update `config.yml` if needed

---

## 📊 Template Best Practices

### For Issue Templates

**Do:**
✅ Provide clear instructions
✅ Use checkboxes for actionable items
✅ Include examples
✅ Request all necessary information
✅ Keep it concise but comprehensive

**Don't:**
❌ Make it too long or complex
❌ Ask for unnecessary information
❌ Use jargon without explanation
❌ Leave ambiguous questions

---

### For PR Templates

**Do:**
✅ Break into logical sections
✅ Use checklists extensively
✅ Request visual proof (screenshots)
✅ Ask for test results
✅ Include deployment considerations

**Don't:**
❌ Make every section mandatory
❌ Duplicate CI/CD checks
❌ Ask for information available elsewhere
❌ Create overly bureaucratic process

---

## 🔍 Review Guidelines

### For Reviewers

When reviewing PRs, check:

1. **Description Quality**
   - Clear explanation of changes
   - All checklists completed
   - Screenshots provided (if UI change)

2. **Testing Evidence**
   - Manual testing performed
   - Test results provided
   - Edge cases considered

3. **Code Quality**
   - Follows project standards
   - Well-commented
   - No obvious issues

4. **Documentation**
   - Docs updated appropriately
   - Breaking changes documented
   - Migration guides provided (if needed)

5. **Deployment Readiness**
   - Environment variables documented
   - Migrations prepared
   - Rollback plan exists (if risky)

---

## 🚀 Automation

### GitHub Actions Integration

These templates work with GitHub Actions:

- **PR Template**: Triggers on PR creation
- **Issue Templates**: Trigger on issue creation
- **Labels**: Auto-applied based on template choice
- **Checks**: CI/CD runs based on PR checklist

### Setting Up Automation

1. Ensure GitHub Actions are enabled
2. Configure required checks in branch protection
3. Set up auto-labeling based on templates
4. Configure reviewer assignment rules

---

## 📚 Additional Resources

### Project Documentation
- [Main Documentation](../amber-best-flow/DOCUMENTATION.md)
- [Testing Guide](../MANUAL_TESTING_GUIDE.md)
- [Quick Test Checklist](../QUICK_TEST_CHECKLIST.md)
- [Performance Testing](../PERFORMANCE_TEST_SCRIPT.md)

### GitHub Guides
- [GitHub Issues](https://docs.github.com/en/issues)
- [Pull Requests](https://docs.github.com/en/pull-requests)
- [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)

---

## 💡 Tips

### For Contributors

1. **Always use templates**: Don't create blank issues/PRs
2. **Fill completely**: Don't skip sections
3. **Be specific**: Provide detailed information
4. **Add context**: Include screenshots, logs, etc.
5. **Link related items**: Reference issues and PRs
6. **Test thoroughly**: Complete all testing checklists

### For Maintainers

1. **Review templates regularly**: Keep them updated
2. **Enforce usage**: Require template completion
3. **Provide feedback**: Comment on incomplete PRs/issues
4. **Update as needed**: Templates should evolve
5. **Document changes**: Keep this README current

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-26 | Initial templates created |
| - | - | - |

---

## 📞 Questions?

If you have questions about these templates:

1. Check the [Documentation](../amber-best-flow/DOCUMENTATION.md)
2. Ask in [Discussions](https://github.com/your-org/your-repo/discussions)
3. Contact: [Team Lead Email]

---

**Remember**: These templates are here to help! They ensure quality and consistency, making collaboration easier for everyone. 🚀

