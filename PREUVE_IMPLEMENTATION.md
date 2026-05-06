# Billetix — Dossier de Preuve d'Implémentation pour le Jury

Ce document centralise les éléments techniques prouvant que le projet **Billetix** respecte l'ensemble des contraintes du cahier des charges : architecture microservices, communication synchrone/asynchrone, sécurité RBAC et déploiement conteneurisé.

---

## 1. Preuve de Déploiement (Infrastructure)

L'application est entièrement dockérisée et orchestrée via **Docker Compose**.

### Commandes de lancement
```bash
# Lancement de l'écosystème complet
docker-compose up --build -d

# Vérification du statut des microservices
docker-compose ps
```

### Accès aux interfaces d'infrastructure
| Service | Rôle | URL / Port |
| :--- | :--- | :--- |
| **Traefik** | API Gateway / Dashboard | [http://localhost:8080](http://localhost:8080) |
| **Consul** | Service Discovery | [http://localhost:8500](http://localhost:8500) |
| **RabbitMQ** | Message Broker | [http://localhost:15674](http://localhost:15674) (guest/guest) |
| **Frontend** | Application Web | [http://localhost:8090](http://localhost:8090) |

---

## 2. Scénarios de Validation Fonctionnelle

### Scénario A : Sécurité et RBAC (Role-Based Access Control)
*Objectif : Prouver que l'authentification JWT fonctionne et que les rôles sont respectés.*

1.  **Inscription Organisateur** : Création d'un compte avec le rôle `ORGANIZER`.
2.  **Inscription Client** : Création d'un compte avec le rôle `CLIENT`.
3.  **Test de restriction** :
    *   Tenter de créer un événement avec un token `CLIENT` -> **Réponse attendue : `403 Forbidden`**.
    *   Tenter de créer un événement avec un token `ORGANIZER` -> **Réponse attendue : `201 Created`**.

### Scénario B : Communication Synchrone (API REST & Traefik)
*Objectif : Prouver que les services communiquent via la Gateway.*

1.  Le **Frontend** appelle `/api/events` (acheminé par Traefik vers le `event-service`).
2.  Le **Booking-Service** appelle le `event-service` pour vérifier les places disponibles avant de confirmer une réservation.

### Scénario C : Communication Asynchrone (RabbitMQ)
*Objectif : Prouver le découplage via RabbitMQ.*

1.  L'utilisateur réserve un billet sur le site.
2.  Le `booking-service` répond immédiatement (`201 Created`).
3.  Un message est envoyé dans la file `email.send` de RabbitMQ.
4.  Le `email-worker` (service indépendant) consomme le message et simule l'envoi de l'email.
    *   *Preuve visuelle dans les logs :* `docker-compose logs -f email-worker`

---

## 3. Matrice de Conformité des Contraintes

| Contrainte Technique | Solution Implémentée | État |
| :--- | :--- | :--- |
| **Architecture Microservices** | 8 services distincts (Auth, Event, Booking, Worker...) | ✅ |
| **Gateway / Reverse Proxy** | Traefik v2 avec routage dynamique par labels | ✅ |
| **Service Discovery** | HashiCorp Consul pour l'enregistrement des services | ✅ |
| **Authentification Sécurisée** | JWT (JSON Web Tokens) avec durée de vie limitée | ✅ |
| **Contrôle d'accès (RBAC)** | Distinction Client / Organisateur au niveau API | ✅ |
| **Communication Synchrone** | Requêtes HTTP/REST entre services | ✅ |
| **Communication Asynchrone** | RabbitMQ (Bus de messages AMQP) | ✅ |
| **Design Premium** | UI React avec Tailwind, Framer Motion et Glassmorphism | ✅ |

---

## 4. Script de Démonstration Live (Oral)

Voici le déroulé recommandé pour épater le jury en 5 minutes :

1.  **Le Dashboard Traefik** : Montrez l'interface [http://localhost:8080](http://localhost:8080) pour prouver que Traefik détecte automatiquement les services Docker.
2.  **L'Expérience Client (Frontend)** : Connectez-vous en tant que client, parcourez les événements (design glassmorphic), et réservez une place.
3.  **La Preuve de Backend** : Ouvrez un terminal et montrez les logs du `booking-service` et du `email-worker` simultanément pour montrer le passage du message.
4.  **La Sécurité** : Montrez qu'un client ne peut pas voir le bouton "Ajouter Événement" (ou qu'il reçoit une erreur 403 s'il force l'URL).
5.  **Consul** : Un rapide coup d'œil à [http://localhost:8500](http://localhost:8500) pour montrer le registre de services.

---

### Contact de l'équipe
*   Hadji Mehdi
*   Talamahcen Warda
*   Ziane Khaoula
