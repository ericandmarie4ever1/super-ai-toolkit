import { AutonomousService } from './AutonomousService';

const service = new AutonomousService(3000);
service.start();

// --- SIMULATION: Trigger a webhook ---
setTimeout(async () => {
  console.log('\n--- 🧪 Simulating incoming GitHub Webhook ---');
  
  // We use a simple fetch to simulate a real webhook call from GitHub
  try {
    const response = await fetch('http://localhost:3000/webhook/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'opened',
        issue: {
          title: 'Production API returning 500s',
          labels: [{ name: 'critical' }]
        }
      })
    });
    const data = await response.json();
    console.log('Webhook Response:', data);
  } catch (e) {
    console.error('Simulation failed:', e);
  }
}, 2000);
