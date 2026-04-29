---
title: "Rapport Technique — Projet Billetix"
subtitle: "Gestion des Événements — Architecture Orientée Services"
author:
  - "Hadji Mehdi"
  - "Talamahcen Warda"
  - "Ziane Khaoula"
date: "Avril 2026 | Groupe 3 — Spécialité : Génie Logiciel | Master 1 — Architecture Orientée Services"
lang: fr
geometry: margin=2.5cm
fontsize: 11pt
toc: true
toc-depth: 3
numbersections: true
---

\newpage

# Introduction

## Contexte du Projet

**Billetix** est une plateforme de gestion et de réservation d'événements développée dans le cadre du cours d'Architecture Orientée Services (SOA). L'objectif est de concevoir une application distribuée reposant sur des microservices indépendants communicants de manière synchrone (REST) et asynchrone (RabbitMQ).

## Objectifs Techniques

| Contrainte | Technologie | Statut |
|---|---|---|
| API REST CRUD | Django REST Framework | Implémenté |
| Authentification JWT | Python / bcrypt | Implémenté |
| Service Registry / Discovery | HashiCorp Consul | Implémenté |
| Reverse Proxy / Load Balancing | Traefik v2 | Implémenté |
| Communication Asynchrone | RabbitMQ | Implémenté |
| Déploiement Multi-Conteneurs | Docker Compose | Implémenté |
| Interface Utilisateur | React + TypeScript | Implémenté |

\newpage

# Architecture du Système

## Vue d'Ensemble

L'architecture de Billetix est composée de **8 services Docker** interconnectés au sein d'un réseau bridge `billetix-network`.

- **Traefik** (port 80/8080) : point d'entrée unique, reverse proxy dynamique
- **Auth-Service** (port interne 8000) : authentification et gestion JWT
- **Event-Service** (port interne 8001) : CRUD des événements
- **Booking-Service** (port interne 8002) : gestion des réservations
- **Email-Worker** : consommateur RabbitMQ pour les notifications email
- **Frontend** : application React/TypeScript servie par Nginx
- **Consul** (port 8500) : service registry et health checks
- **RabbitMQ** (ports 5672/15672) : message broker asynchrone

## Diagramme de Séquence — Flux de Réservation

Le diagramme ci-dessous illustre les interactions entre les différents microservices lors d'un scénario complet de réservation.

![Diagramme de Séquence](sequence_diagram.png)

**Scénario :**

1. L'utilisateur s'inscrit/se connecte : **Auth-Service** retourne un JWT
2. Il consulte les événements : **Event-Service** retourne la liste
3. Il réserve un billet : **Booking-Service** crée la réservation
4. Booking-Service publie dans RabbitMQ (queue `email.send`)
5. **Email-Worker** consomme le message et envoie la confirmation

\newpage

## Diagramme d'Activité — Processus de Réservation

Ce diagramme présente le flux d'activités côté client, système API et worker email, avec les décisions et les bifurcations possibles.

![Diagramme d'Activité](activity_diagram.png)

\newpage

# Description des Microservices

## Auth Service

**Port interne :** 8000 | **Route Traefik :** `/api/auth`

### Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/register/` | Inscription | Non |
| POST | `/api/auth/login/` | Connexion JWT | Non |
| POST | `/api/auth/refresh/` | Renouvellement token | Non |
| GET | `/api/auth/me/` | Profil utilisateur | Oui |
| GET | `/api/auth/health/` | Health check | Non |

### Modèle Utilisateur

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| email | String | Email (unique) |
| password | String | Hash bcrypt |
| first_name | String | Prénom |
| last_name | String | Nom |
| role | Enum | CLIENT ou ORGANIZER |
| is_active | Boolean | Compte actif |
| created_at | DateTime | Date de création |

### Sécurité

- **Hachage :** bcrypt avec salage automatique
- **Anti-brute force :** blocage après 5 tentatives échouées (300 secondes)
- **Tokens :** Access token (courte durée) + Refresh token (longue durée)

---

## Event Service

**Port interne :** 8001 | **Route Traefik :** `/api/events`

### Endpoints

| Méthode | Endpoint | Description | Rôle requis |
|---------|----------|-------------|-------------|
| GET | `/api/events/` | Lister les événements | Public |
| POST | `/api/events/` | Créer un événement | ORGANIZER |
| GET | `/api/events/{id}/` | Détail d'un événement | Public |
| PUT | `/api/events/{id}/` | Modifier un événement | ORGANIZER |
| DELETE | `/api/events/{id}/` | Supprimer | ORGANIZER |

### Modèle Événement

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| title | String | Titre (max 200 car.) |
| description | Text | Description |
| date | DateTime | Date de l'événement |
| location | String | Lieu |
| capacity | Integer | Capacité totale |
| available_seats | Integer | Places disponibles |
| price | Decimal | Prix par billet |
| category | String | Catégorie |
| status | Enum | DRAFT, PUBLISHED, CANCELLED |
| organizer_id | UUID | Référence organisateur |

---

## Booking Service

**Port interne :** 8002 | **Route Traefik :** `/api/bookings`

### Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/bookings/` | Créer une réservation | Oui |
| GET | `/api/bookings/me/` | Mes réservations | Oui |
| GET | `/api/bookings/health/` | Health check | Non |

### Modèle Réservation

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| event_id | UUID | Référence à l'événement |
| user_id | UUID | Référence à l'utilisateur |
| quantity | Integer | Nombre de billets |
| total_price | Decimal | Prix total calculé |
| status | Enum | PENDING, CONFIRMED, CANCELLED |
| created_at | DateTime | Date de création |

### Message RabbitMQ publié après réservation

```json
{
  "type": "BOOKING_CONFIRMATION",
  "to": "client@example.com",
  "booking_id": "uuid...",
  "event_title": "Festival Tech Alger 2025"
}
```

\newpage

# Modélisation UML

## Diagramme de Classes

Le diagramme de classes ci-dessous représente les entités principales du système Billetix, leurs attributs, leurs méthodes et leurs associations.

![Diagramme de Classes](class_diagram.png)

---

## Frontend

Application React + TypeScript servie via Nginx.

| Route | Description |
|-------|-------------|
| / | Liste des événements publics |
| /login | Connexion utilisateur |
| /register | Inscription |
| /events | Gestion événements (ORGANIZER) |
| /bookings | Mes réservations (CLIENT) |

\newpage

# Guide de Tests Postman

## Configuration de l'Environnement

Dans Postman, allez dans **Environments > New** et créez ces variables :

| Variable | Valeur initiale |
|----------|----------------|
| BASE_URL | http://localhost |
| ACCESS_TOKEN | (vide) |
| REFRESH_TOKEN | (vide) |
| EVENT_ID | (vide) |

---

## Tests — Auth Service

### Test 1 : Register

| Paramètre | Valeur |
|-----------|--------|
| Méthode | POST |
| URL | `{{BASE_URL}}/api/auth/register/` |
| Header | `Content-Type: application/json` |

**Body (raw > JSON) :**

```json
{
  "email": "organisateur@billetix.com",
  "password": "Secure123",
  "firstName": "Alice",
  "lastName": "Dupont",
  "role": "ORGANIZER"
}
```

**Réponse attendue :** `201 Created`

**Script Tests (onglet Tests) :**

```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));
const json = pm.response.json();
pm.environment.set("ACCESS_TOKEN", json.access);
pm.environment.set("REFRESH_TOKEN", json.refresh);
```

---

### Test 2 : Login

| Paramètre | Valeur |
|-----------|--------|
| Méthode | POST |
| URL | `{{BASE_URL}}/api/auth/login/` |
| Header | `Content-Type: application/json` |

**Body :** `{ "email": "organisateur@billetix.com", "password": "Secure123" }`

**Réponse attendue :** `200 OK`

**Script Tests :**

```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
const json = pm.response.json();
pm.environment.set("ACCESS_TOKEN", json.access);
pm.environment.set("REFRESH_TOKEN", json.refresh);
```

---

### Test 3 : Profil (Me)

| Paramètre | Valeur |
|-----------|--------|
| Méthode | GET |
| URL | `{{BASE_URL}}/api/auth/me/` |
| Header | `Authorization: Bearer {{ACCESS_TOKEN}}` |

**Réponse attendue :** `200 OK`

**Script Tests :**

```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Rôle correct", () => {
    pm.expect(pm.response.json().role).to.eql("ORGANIZER");
});
```

---

### Test 4 : Refresh Token

| Paramètre | Valeur |
|-----------|--------|
| Méthode | POST |
| URL | `{{BASE_URL}}/api/auth/refresh/` |

**Body :** `{ "refresh": "{{REFRESH_TOKEN}}" }`

**Script Tests :**

```javascript
pm.test("Nouveau token reçu", () => {
    const json = pm.response.json();
    pm.expect(json.access).to.be.a('string');
    pm.environment.set("ACCESS_TOKEN", json.access);
});
```

---

### Test 5 : Sécurité — Accès refusé sans token

| Paramètre | Valeur |
|-----------|--------|
| Méthode | GET |
| URL | `{{BASE_URL}}/api/auth/me/` |
| Header | *(aucun Authorization)* |

**Réponse attendue :** `401 Unauthorized`

---

## Tests — Event Service

### Test 6 : Créer un Événement

| Paramètre | Valeur |
|-----------|--------|
| Méthode | POST |
| URL | `{{BASE_URL}}/api/events/` |
| Headers | `Content-Type: application/json` + `Authorization: Bearer {{ACCESS_TOKEN}}` |

**Body :**

```json
{
  "title": "Festival Tech Alger 2025",
  "description": "La plus grande conférence tech d'Algérie",
  "date": "2025-09-15T10:00:00Z",
  "location": "Alger Convention Center",
  "capacity": 500,
  "price": 1500.00,
  "category": "Technologie"
}
```

**Réponse attendue :** `201 Created`

**Script Tests :**

```javascript
pm.test("Événement créé", () => pm.response.to.have.status(201));
pm.environment.set("EVENT_ID", pm.response.json().id);
```

---

### Test 7 : Lister les Événements

| Paramètre | Valeur |
|-----------|--------|
| Méthode | GET |
| URL | `{{BASE_URL}}/api/events/` |

**Réponse attendue :** `200 OK`, tableau JSON

**Script Tests :**

```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Liste non vide", () => {
    pm.expect(pm.response.json().length).to.be.above(0);
});
```

---

### Test 8 : Détail d'un Événement

| Paramètre | Valeur |
|-----------|--------|
| Méthode | GET |
| URL | `{{BASE_URL}}/api/events/{{EVENT_ID}}/` |

**Réponse attendue :** `200 OK`, objet JSON de l'événement

---

### Test 9 : Refus de Création (CLIENT)

1. Inscrivez un compte `"role": "CLIENT"` via Test 1
2. Connectez-vous et récupérez son token
3. Tentez `POST /api/events/` avec ce token CLIENT

**Réponse attendue :** `403 Forbidden`

---

## Tests — Booking Service

### Test 10 : Créer une Réservation

| Paramètre | Valeur |
|-----------|--------|
| Méthode | POST |
| URL | `{{BASE_URL}}/api/bookings/` |
| Headers | `Content-Type: application/json` + `Authorization: Bearer {{ACCESS_TOKEN}}` |

**Body :**

```json
{
  "event_id": "{{EVENT_ID}}",
  "quantity": 2
}
```

**Réponse attendue :** `201 Created`

**Script Tests :**

```javascript
pm.test("Réservation créée", () => pm.response.to.have.status(201));
pm.test("Status PENDING", () => {
    pm.expect(pm.response.json().status).to.eql("PENDING");
});
```

---

### Test 11 : Mes Réservations

| Paramètre | Valeur |
|-----------|--------|
| Méthode | GET |
| URL | `{{BASE_URL}}/api/bookings/me/` |
| Header | `Authorization: Bearer {{ACCESS_TOKEN}}` |

**Réponse attendue :** `200 OK`, liste JSON des réservations

\newpage

# Infrastructure et Déploiement

## Docker Compose

### Démarrage complet

```bash
docker-compose up --build
```

### Vérification des conteneurs actifs

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Services déployés

| Service | Image | Ports exposés |
|---------|-------|---------------|
| traefik | traefik:v2.10 | 80, 8080 |
| consul | consul:latest | 8500 |
| rabbitmq | rabbitmq:3-management | 5672, 15672 |
| auth-service | Build local (Django) | via Traefik |
| event-service | Build local (Django) | via Traefik |
| booking-service | Build local (Django) | via Traefik |
| email-worker | Build local (Python) | — |
| frontend | Build local (React/Nginx) | via Traefik |

---

## Tableau de Bord

| Service | URL | Identifiants |
|---------|-----|--------------|
| Interface Web | http://localhost | — |
| Traefik Dashboard | http://localhost:8080 | — |
| Consul UI | http://localhost:8500 | — |
| RabbitMQ Console | http://localhost:15672 | guest / guest |

---

## Consul — Service Registry

Consul assure la découverte de services dynamique. Chaque microservice s'enregistre au démarrage avec un health check HTTP. Le dashboard permet de visualiser l'état de santé en temps réel.

## Traefik — Reverse Proxy

| Préfixe URL | Service cible |
|-------------|---------------|
| /api/auth | auth-service |
| /api/events | event-service |
| /api/bookings | booking-service |
| / | frontend |

La configuration est dynamique via les labels Docker.

## RabbitMQ — Communication Asynchrone

Logs du worker email après une réservation :

```bash
docker-compose logs -f email-worker
```

Sortie attendue :

```
[x] Envoi d'email : BOOKING_CONFIRMATION à client@billetix.com
```

\newpage

# Conclusion

Le projet Billetix implémente avec succès une architecture microservices complète.

| Critère | Solution | Résultat |
|---------|----------|----------|
| API REST CRUD | Django REST (3 services) | Conforme |
| Authentification JWT | Auth-Service + bcrypt | Conforme |
| Interface UI/UX | React + TypeScript | Conforme |
| Communication asynchrone | RabbitMQ + Worker | Conforme |
| Service Registry | HashiCorp Consul | Conforme |
| Reverse Proxy | Traefik v2 | Conforme |
| Déploiement multi-conteneurs | Docker Compose (8 containers) | Conforme |

**Garanties architecturales :**

- **Scalabilité :** chaque service est scalable indépendamment
- **Résilience :** un service défaillant n'impacte pas les autres
- **Découplage :** communication via API REST et RabbitMQ
- **Sécurité :** JWT, bcrypt, protection anti-brute force
