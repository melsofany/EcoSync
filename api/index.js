// Vercel serverless function wrapper
export default async function handler(req, res) {
  // Import the main app dynamically to avoid build issues
  const { default: app } = await import('../dist/index.js');
  
  // Handle the request
  return app(req, res);
}