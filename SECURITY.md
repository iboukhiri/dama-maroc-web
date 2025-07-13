# Security Policy

## 🔒 Supported Versions

We actively support the following versions of Dama Maroc:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 📧 Private Disclosure

**Please do NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities privately by:

1. **Email**: Send details to [iliassboukhiri@gmail.com](mailto:iliassboukhiri@gmail.com)
2. **Subject**: Include "SECURITY" in the subject line
3. **Details**: Provide as much information as possible about the vulnerability

### 📋 What to Include

Please include the following information in your report:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** and severity
- **Affected versions** (if known)
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### 🔄 Response Process

1. **Acknowledgment**: We will acknowledge receipt within 48 hours
2. **Investigation**: We will investigate and validate the report
3. **Updates**: We will provide regular updates on our progress
4. **Resolution**: We will work to fix the issue as quickly as possible
5. **Disclosure**: We will coordinate public disclosure after the fix is deployed

### ⏰ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Updates**: Every 72 hours until resolved
- **Fix Timeline**: We aim to resolve critical issues within 7 days

## 🛡️ Security Measures

### Current Security Practices

- **Firebase Security Rules**: Proper database access controls
- **Input Validation**: Client-side and server-side validation
- **XSS Prevention**: Proper HTML escaping and sanitization
- **CSRF Protection**: Secure token handling
- **HTTPS**: All communications encrypted in transit

### 🔍 Security Considerations

#### Client-Side Security
- Game state validation on both client and server
- Secure Firebase configuration
- Proper error handling without information leakage

#### Firebase Security
- Authenticated access for multiplayer features
- Rate limiting for API calls
- Secure database rules

#### Privacy Protection
- Minimal data collection
- No personal information storage
- Secure session management

## 🏆 Recognition

We appreciate security researchers who help keep Dama Maroc safe. Contributors who report valid security vulnerabilities will be:

- **Acknowledged** in our security advisories (with permission)
- **Credited** in our changelog
- **Thanked** publicly (if desired)

## 📚 Security Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security)
- [Web Application Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [JavaScript Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JavaScript_Security_Cheat_Sheet.html)

## 🔄 Security Updates

Security updates will be:
- **Prioritized** over feature development
- **Deployed** as soon as possible
- **Documented** in our changelog
- **Communicated** to users through appropriate channels

## 📞 Contact Information

For security-related questions or concerns:

- **Email**: [iliassboukhiri@gmail.com](mailto:iliassboukhiri@gmail.com)
- **GitHub**: [@iboukhiri](https://github.com/iboukhiri)

---

Thank you for helping keep Dama Maroc secure! 🔒 