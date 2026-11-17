import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const node1Count = new Counter('node1_responses');
const node2Count = new Counter('node2_responses');
const node3Count = new Counter('node3_responses');

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '25s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  // Test health endpoint (shows nodeId for load balancing verification)
  const healthRes = http.get('http://localhost/api/health');
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health has nodeId': (r) => JSON.parse(r.body).nodeId !== undefined,
  });

  const healthBody = JSON.parse(healthRes.body);
  if (healthBody.nodeId === 'Node-1') node1Count.add(1);
  if (healthBody.nodeId === 'Node-2') node2Count.add(1);
  if (healthBody.nodeId === 'Node-3') node3Count.add(1);

  // Test routes/active endpoint (cached)
  const routesRes = http.get('http://localhost/api/routes/active');
  check(routesRes, {
    'routes status 200': (r) => r.status === 200,
    'routes has data': (r) => JSON.parse(r.body).success === true,
  });

  sleep(0.5);
}

export function handleSummary(data) {
  const n1 = data.metrics.node1_responses ? data.metrics.node1_responses.values.count : 0;
  const n2 = data.metrics.node2_responses ? data.metrics.node2_responses.values.count : 0;
  const n3 = data.metrics.node3_responses ? data.metrics.node3_responses.values.count : 0;
  const total = n1 + n2 + n3;

  console.log('\n=== DISTRIBUCIÓN DE CARGA ===');
  console.log(`Node-1: ${n1} peticiones (${((n1/total)*100).toFixed(1)}%)`);
  console.log(`Node-2: ${n2} peticiones (${((n2/total)*100).toFixed(1)}%)`);
  console.log(`Node-3: ${n3} peticiones (${((n3/total)*100).toFixed(1)}%)`);
  console.log(`Total:  ${total} peticiones`);
  console.log('=============================\n');

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
