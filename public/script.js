const startBtn = document.getElementById('startBtn');
const startText = document.querySelector('.network__start-text');

const latencyEl = document.getElementById('latency');
const jitterEl = document.getElementById('jitter');
const throughputEl = document.getElementById('throughput');
const packetLossEl = document.getElementById('packetLoss');
const historyEl = document.getElementById('history');

startBtn.addEventListener('click', runNetworkTest);

async function runNetworkTest() {
  startBtn.disabled = true;
  startText.textContent = 'TESTING...';

  try {
    const isServerAvailable = await checkServer();

    if (!isServerAvailable) {
      throw new Error('Server is not available');
    }

    const pingResults = await measureLatency(8);
    const throughput = await measureThroughput(2, 3);

    const successfulPings = pingResults.filter((item) => item !== null);
    const lostPackets = pingResults.length - successfulPings.length;

    const latency = calculateAverage(successfulPings);
    const jitter = calculateJitter(successfulPings);
    const packetLoss = (lostPackets / pingResults.length) * 100;

    latencyEl.textContent = latency.toFixed(2);
    jitterEl.textContent = jitter.toFixed(2);
    throughputEl.textContent = throughput.toFixed(2);
    packetLossEl.textContent = packetLoss.toFixed(2);

    addHistoryItem(latency, jitter, throughput, packetLoss);
  } catch (error) {
    console.error(error);

    latencyEl.textContent = '0.00';
    jitterEl.textContent = '0.00';
    throughputEl.textContent = '0.00';
    packetLossEl.textContent = '100.00';
  } finally {
    startBtn.disabled = false;
    startText.textContent = 'START';
  }
}

async function checkServer() {
  try {
    const response = await fetchWithTimeout(`/ping?nocache=${Date.now()}`, 3000);

    return response.ok;
  } catch {
    return false;
  }
}

async function measureLatency(count) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const startTime = performance.now();

    try {
      const response = await fetchWithTimeout(
        `/ping?nocache=${Date.now()}-${i}`,
        3000
      );

      if (!response.ok) {
        results.push(null);
        continue;
      }

      const endTime = performance.now();

      results.push(endTime - startTime);
    } catch {
      results.push(null);
    }

    await delay(30);
  }

  return results;
}

async function measureThroughput(parallelRequests = 4, fileSizeMb = 10) {
  const startTime = performance.now();

  const requests = [];

  for (let i = 0; i < parallelRequests; i++) {
    requests.push(downloadTestFile(fileSizeMb, i));
  }

  const sizes = await Promise.all(requests);

  const endTime = performance.now();

  const totalBytes = sizes.reduce((sum, size) => sum + size, 0);
  const totalBits = totalBytes * 8;
  const durationSeconds = (endTime - startTime) / 1000;

  return totalBits / durationSeconds / 1_000_000;
}

async function downloadTestFile(fileSizeMb, index) {
  const response = await fetchWithTimeout(
    `/download?size=${fileSizeMb}&nocache=${Date.now()}-${index}`,
    15000
  );

  if (!response.ok) {
    throw new Error('Download failed');
  }

  const data = await response.blob();

  return data.size;
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
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
  if (!historyEl) {
    return;
  }

  const item = document.createElement('li');

  item.textContent =
    `Latency: ${latency.toFixed(2)} ms | ` +
    `Jitter: ${jitter.toFixed(2)} ms | ` +
    `Throughput: ${throughput.toFixed(2)} Mbps | ` +
    `Packet Loss: ${packetLoss.toFixed(2)} %`;

  historyEl.prepend(item);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}