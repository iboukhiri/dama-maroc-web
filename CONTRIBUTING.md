# Contributing to Dama Maroc

Thank you for your interest in contributing to Dama Maroc! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Browser and device information**
- **Screenshots** (if applicable)
- **Console errors** (if any)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear description** of the enhancement
- **Use case** and rationale
- **Possible implementation** approach
- **Screenshots or mockups** (if applicable)

### Code Contributions

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the coding standards
4. **Test thoroughly** across different browsers and devices
5. **Commit** your changes with clear messages
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Create a Pull Request**

## 🏗️ Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js and npm (for Firebase CLI)
- Git
- Text editor or IDE

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/dama-maroc-web.git
cd dama-maroc-web

# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Start local development server
firebase emulators:start
# or
python -m http.server 8000
```

### Testing

Before submitting a PR, please test:

- **All game modes** (PvP, AI Easy/Medium/Hard, Online)
- **All themes** (Light, Dark, Wood, Neon)
- **Mobile responsiveness** on different screen sizes
- **Cross-browser compatibility**
- **Firebase multiplayer functionality**

## 📝 Coding Standards

### JavaScript

- Use **ES6+** features where appropriate
- Follow **camelCase** naming convention
- Add **comments** for complex logic
- Keep functions **focused and small**
- Use **const/let** instead of var
- Handle **errors gracefully**

### CSS

- Use **BEM methodology** for class naming
- Keep **responsive design** in mind
- Use **CSS custom properties** for theming
- Maintain **consistent spacing**
- Follow **mobile-first** approach

### HTML

- Use **semantic HTML5** elements
- Ensure **accessibility** (ARIA labels, keyboard navigation)
- Maintain **proper indentation**
- Use **meaningful class names**

## 🎨 Design Guidelines

### Themes

When adding or modifying themes:

- Ensure **sufficient contrast** for accessibility
- Test on **different screen sizes**
- Maintain **consistency** with existing themes
- Consider **color-blind users**

### UI/UX

- Keep **mobile-first** approach
- Ensure **touch-friendly** interactions
- Provide **clear visual feedback**
- Maintain **consistent spacing**
- Use **appropriate animations**

## 🔧 Technical Guidelines

### File Structure

```
dama-maroc-web/
├── index.html              # Main game interface
├── script.js               # Core game logic and AI
├── styles.css              # Responsive styling and themes
├── online-multiplayer.js   # Firebase multiplayer integration
├── firebase-config.js      # Firebase configuration
└── firebase.json           # Firebase hosting config
```

### AI Development

When working on AI improvements:

- Test **all difficulty levels**
- Ensure **reasonable response times**
- Maintain **game rule compliance**
- Consider **performance impact**
- Add **comprehensive comments**

### Firebase Integration

For multiplayer features:

- Handle **connection errors** gracefully
- Implement **proper cleanup**
- Consider **offline scenarios**
- Test **concurrent players**
- Maintain **data consistency**

## 🚀 Pull Request Process

1. **Update documentation** if needed
2. **Test thoroughly** on multiple devices/browsers
3. **Follow commit message** conventions
4. **Link related issues** in PR description
5. **Respond to feedback** promptly
6. **Ensure CI passes** (if applicable)

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add new theme selection dropdown
fix: resolve mobile touch detection issue
docs: update installation instructions
style: improve responsive layout for tablets
refactor: optimize AI decision-making algorithm
```

## 🎯 Priority Areas

We especially welcome contributions in:

- **Mobile optimization** improvements
- **AI algorithm** enhancements
- **New themes** and visual improvements
- **Accessibility** features
- **Performance** optimizations
- **Documentation** improvements
- **Test coverage** expansion

## 📞 Getting Help

- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Email**: Contact the maintainer for urgent matters

## 🏆 Recognition

Contributors will be:

- **Listed** in the README acknowledgments
- **Credited** in release notes
- **Mentioned** in project documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Dama Maroc! 🎮 