# Quocgia Admin Service

A backend service for creating and managing heritage resources. This service provides a comprehensive REST API for administering heritage-related data with geographic, economic, and literary information.

## About

Quocgia Admin Service is a service designed to create and manage resources related to heritages (cultural, historical, and geographical heritage). It provides a complete backend infrastructure for handling heritage data with proper database management and containerization support.

## Technology Stack

### Backend
- **JavaScript** (Express)

### Key Technologies
- Runtime: Node.js
- Database: PostgreSQL
- Containerization: Docker & Docker Compose
- Version Control: Git

## Features

### Heritage Resource Management

Create and manage heritage resources with support for multiple heritage types:

- **Geographic Heritage** — Regional and geographic information
- **Economic Heritage** — Economic and trade heritage data
- **Literary Heritage** — Literature and cultural works

### Database Management

Automated database initialization and maintenance with specialized data modules:

- Geography data management
- Economic data management
- Literature data management
- Database update scripts for maintaining data integrity

### Containerization & Deployment

Docker support for consistent deployment across environments with Docker Compose configuration for multi-container orchestration. This enables easy setup and teardown of development environments.

### File Management

Uploads directory for managing user-uploaded resources with support for heritage resource attachments and media.

### Environment Configuration

Environment variable support via .env configuration with sample environment file (.env.sample) for quick setup.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- PostgreSQL (if running without Docker)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/longxayda/quocgia-admin-service.git
   cd quocgia-admin-service
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   ```bash
   cp .env.sample .env
   ```

4. Start the application with Docker Compose
   ```bash
   docker-compose up
   ```
