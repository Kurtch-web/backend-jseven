🛡️ Auth API Boilerplate (Express + Zod + JWT + Rate Limiting)
This project is a production-ready boilerplate for building secure, scalable authentication systems using Node.js, Express, TypeScript, Zod, JWT, and Rate Limiting.

It includes:

Input validation using zod

Rate limiting to protect against abuse

Hashed passwords with bcrypt

JWT-based authentication

Modular folder structure

Custom error handling

📁 Project Structure
python
Copy
Edit
src/
│
├── controllers/            # Business logic (route handlers)
│   └── auth.controller.ts
│
├── middlewares/           # Express middlewares
│   ├── rateLimit.middleware.ts
│   └── validation.middleware.ts
│
├── models/                # Type definitions / ORM models
│   ├── user.model.ts
│   └── role.model.ts
│
├── routes/                # Route registration
│   └── auth.routes.ts
│
├── services/              # Core business logic (non-Express-specific)
│   └── auth.services.ts
│
├── utils/                 # Utility functions
│   ├── errors.ts
│   ├── hash.ts
│   └── jwt.ts
│
├── validators/            # Zod schemas for validation
│   └── auth.validator.ts
│
└── index.ts               # Entry point
🚀 Getting Started
1. Clone the project
bash
Copy
Edit
git clone https://github.com/your-repo/auth-api-boilerplate
cd auth-api-boilerplate
2. Install dependencies
bash
Copy
Edit
npm install
3. Setup your .env file
Create a backend/.env file:

env
Copy
Edit
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
🔐 Features Explained
✅ Validation Middleware (middlewares/validation.middleware.ts)
Uses Zod to validate incoming request bodies. Example:

ts
Copy
Edit
router.post("/login", validate(loginValidator), login);
If the request does not match the schema, it returns:

json
Copy
Edit
{
  "message": "Validation Error",
  "errors": [...]
}
🧊 Rate Limiting Middleware (middlewares/rateLimit.middleware.ts)
Prevents brute-force or abusive login attempts. Example:

ts
Copy
Edit
router.post("/login", apiLimiter, validate(loginValidator), login);
If an IP sends too many requests, it will be temporarily blocked.

🔒 Auth Service (services/auth.services.ts)
Handles the actual login logic:

Finds the user by email

Compares the password using bcrypt

If valid, returns a JWT token

🔑 JWT Helpers (utils/jwt.ts)
signJWT(payload): Signs and returns a token

verifyJWT(token): Verifies a token and returns the decoded payload

🔐 Password Hashing (utils/hash.ts)
hashPassword(password): Encrypts the password before storing it

compareHash(plain, hash): Compares raw input with hashed password

🧱 Zod Validators (validators/auth.validator.ts)
ts
Copy
Edit
export const loginValidator = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
🧠 Role Model (models/role.model.ts)
Defines accepted roles for users:

ts
Copy
Edit
export type Role = "user" | "admin" | "superadmin";
Used to control access and permissions.

🧾 Error Classes (utils/errors.ts)
Custom errors with HTTP status codes:

UnauthorizedError → 401

ForbiddenError → 403

BadRequestError → 400

This helps in centralized error handling across services.

🌐 Routes (routes/auth.routes.ts)
Combines everything:

ts
Copy
Edit
router.post("/login", apiLimiter, validate(loginValidator), login);
Limits spam (rate limiter)

Validates request body

If valid, calls controller to login

🎮 Controller (controllers/auth.controller.ts)
Calls the service and sends back the response:

ts
Copy
Edit
export const login = async (req, res) => {
  const token = await AuthService.login(req.body.email, req.body.password);
  res.json({ message: "Login successful", token });
};
🧪 Example Login Flow
Client sends POST /login with email + password.

Rate limiter checks for abuse.

Zod validator checks request format.

Controller passes data to service.

Service:

Finds user

Validates password

Signs JWT token

Response sent back:

json
Copy
Edit
{
  "message": "Login successful",
  "token": "JWT_TOKEN"
}
🛠️ How to Extend the Structure
You can easily expand this structure:

Add /register, /logout, /me, etc.

Add a UserService and UserController

Add auth.middleware.ts to protect routes via JWT

Add permissions using the role.model.ts

📚 Summary
Feature	Tool
Validation	Zod
Rate Limiting	Express-rate-limit
Password Hashing	bcrypt
JWT Token Auth	jsonwebtoken
Error Handling	Custom Error Classes
Types + Structure	TypeScript

🧙 Final Tips
Structure follows separation of concerns (clean architecture)

Keep logic in services, not in controllers

Always validate and sanitize user input

Handle all edge cases with custom error classes

Easily test services as pure functions

🏁 Quick Test (Postman/cURL)
http
Copy
Edit
POST /login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
Response:

json
Copy
Edit
{
  "message": "Login successful",
  "token": "..."
}
