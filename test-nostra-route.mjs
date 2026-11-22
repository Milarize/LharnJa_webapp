const key = process.env.NOSTRA_ROUTE_API_KEY?.trim();
if (!key || key === 'REPLACE_WITH_YOUR_WEB_SERVICE_KEY') {
  console.error('กรอก NOSTRA_ROUTE_API_KEY ในไฟล์ .env');
  process.exit(1);
}

const stops = [
  { name: 'A', lat: 13.7466, lon: 100.5347 },
  { name: 'B', lat: 13.7379, lon: 100.5601 },
];
const url = new URL('https://api.nostramap.com/Service/V2/Network/Route');
url.search = new URLSearchParams({
  key, stops: JSON.stringify(stops), country: 'TH', mode: 'car',
  impedance: 'Time', tollroad: 'True', findBestSequence: 'False',
  useHistorical: 'False', useRealtime: 'False',
  returnedRouteDetail: 'True', outSR: '4326',
});

try {
  const response = await fetch(url, {
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const route = data.results;
  if (data.error || data.errorMessage || !route?.route) {
    throw new Error('ตรวจสิทธิ์ Route Service, Public IP และพิกัด A/B');
  }
  console.log({ totalLength: route.totalLength, totalTime: route.totalTime });
  console.log('ได้รับข้อมูลเส้นทางจาก NOSTRA');
} catch (error) {
  const message = error.message.startsWith('HTTP ')
    ? error.message
    : 'ขอเส้นทางไม่สำเร็จ ตรวจเครือข่าย, คีย์, สิทธิ์ Route Service และพิกัด';
  console.error(message);
  process.exitCode = 1;
}