const startBtn = document.getElementById('startBtn');

const latencyEl = document.getElementById('latency');
const jitterEl = document.getElementById('jitter');
const throughputEl = document.getElementById('throughput');
const packetLossEl = document.getElementById('packetLoss');
const historyEl = document.getElementById('history');

startBtn.addEventListener('click', runNetworkTest);

async function runNetworkTest() {
  startBtn.disabled = true;
  startBtn.textContent = 'Тестування...';

  const pingResults = await measureLatency(10);
  const throughput = await measureThroughput();

  const successfulPings = pingResults.filter((item) => item !== null);
  const lostPackets = pingResults.length - successfulPings.length;

  const latency = calculateAverage(successfulPings);
  const jitter = calculateJitter(successfulPings);
  const packetLoss = (lostPackets / pingResults.length) * 100;

  latencyEl.textContent = `${latency.toFixed(2)} ms`;
  jitterEl.textContent = `${jitter.toFixed(2)} ms`;
  throughputEl.textContent = `${throughput.toFixed(2)} Mbps`;
  packetLossEl.textContent = `${packetLoss.toFixed(2)} %`;

  addHistoryItem(latency, jitter, throughput, packetLoss);

  startBtn.disabled = false;
  startBtn.textContent = 'Почати тест';
}

async function measureLatency(count) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const startTime = performance.now();

    try {
      await fetch(`/ping?nocache=${Date.now()}`);
      const endTime = performance.now();

      results.push(endTime - startTime);
    } catch (error) {
      results.push(null);
    }
  }

  return results;
}

async function measureThroughput() {
  const startTime = performance.now();

  const response = await fetch(`/download?nocache=${Date.now()}`);
  const data = await response.blob();

  const endTime = performance.now();

  const durationSeconds = (endTime - startTime) / 1000;
  const sizeBits = data.size * 8;

  return sizeBits / durationSeconds / 1_000_000;
}

function calculateAverage(values) {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((acc, value) => acc + value, 0);

  return sum / values.length;
}

function calculateJitter(values) {
  if (values.length < 2) {
    return 0;
  }

  let totalDifference = 0;

  for (let i = 1; i < values.length; i++) {
    totalDifference += Math.abs(values[i] - values[i - 1]);
  }

  return totalDifference / (values.length - 1);
}

function addHistoryItem(latency, jitter, throughput, packetLoss) {
  const item = document.createElement('li');

  item.textContent =
    `Latency: ${latency.toFixed(2)} ms | ` +
    `Jitter: ${jitter.toFixed(2)} ms | ` +
    `Throughput: ${throughput.toFixed(2)} Mbps | ` +
    `Packet Loss: ${packetLoss.toFixed(2)} %`;

  historyEl.prepend(item);
}