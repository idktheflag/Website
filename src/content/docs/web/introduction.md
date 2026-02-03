---
title: Introduction to Web Exploitation
description: Web security fundamentals for CTFs
---

## What is Web Exploitation?

Web exploitation involves finding and exploiting vulnerabilities in web applications. This includes everything from client-side attacks to server-side code execution.

## Common Vulnerability Types

### Cross-Site Scripting (XSS)
Injecting malicious JavaScript into web pages viewed by other users.

**Types:**
- Reflected XSS
- Stored XSS
- DOM-based XSS

### SQL Injection (SQLi)
Manipulating SQL queries through user input to access or modify database data.

**Example:**
```sql
' OR '1'='1' --
```

### Server-Side Request Forgery (SSRF)
Forcing the server to make requests to unintended locations.

### Local/Remote File Inclusion
Including files from the server (LFI) or remote sources (RFI).

### Command Injection
Executing arbitrary system commands through vulnerable application inputs.

## Essential Tools

- **Burp Suite**: Web application testing framework
- **sqlmap**: Automated SQL injection tool
- **dirb/gobuster**: Directory brute-forcing
- **curl**: Command-line HTTP client
- **Browser DevTools**: Inspect requests, responses, and client-side code

## Testing Methodology

1. **Reconnaissance**: Map the application
2. **Input fuzzing**: Test all input points
3. **Authentication testing**: Check login mechanisms
4. **Session management**: Test cookies and tokens
5. **Business logic**: Look for logical flaws
