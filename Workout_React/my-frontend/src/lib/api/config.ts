// Base URLs for the backend services this app talks to.
// Only AUTH_API_BASE_URL is consumed by FT-001; the other two are declared
// now so later features wiring exercise-service/training-planning-service
// don't have to decide where base URLs live.

export const AUTH_API_BASE_URL = 'http://localhost:8000';
export const EXERCISE_API_BASE_URL = 'https://localhost:7225';
export const PLANNING_API_BASE_URL = 'https://localhost:7226';
