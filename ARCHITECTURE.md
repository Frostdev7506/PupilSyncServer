# PupilSync Server Architecture (Updated for PostgreSQL)

## Overview
Production-grade Express.js API server following modern best practices with:
- JWT authentication flow
- PostgreSQL database integration
- Comprehensive security measures
- Automated testing suite

```mermaid
graph TD
    A[Express Server] --> B[Core Components]
    B --> B1[Sequelize ORM]
    B --> B2[Security Middleware]
    B --> B3[Route Versioning]
    B --> B4[Error Handling]
    
    B1 --> C1[PostgreSQL Connection]
    B1 --> C2[Migrations]
    B1 --> C3[Model Definitions]
    
    B2 --> D1[Helmet Headers]
    B2 --> D2[Rate Limiting]
    B2 --> D3[JWT Authentication]
    
    B4 --> E1[Operational Errors]
    B4 --> E2[Sequelize Error Handling]
    B4 --> E3[Production Logging]
```

## Updated Dependencies
| Package | Purpose |
|---------|---------|
| Sequelize | PostgreSQL ORM |
| pg | PostgreSQL client |
| jest | Test framework |
| supertest | HTTP assertions |

## Testing Strategy
- 100% endpoint coverage
- Database transaction rollbacks
- Security test cases
- Error scenario testing

To run tests:
```bash
npm test