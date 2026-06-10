
const { adminDb } = require('./src/lib/firebase/admin');

async function debugCalendar() {
  try {
    const snapshot = await adminDb.collection('calendar_events').limit(10).get();
    console.log(`Found ${snapshot.size} events`);
    snapshot.forEach(doc => {
      console.log('ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCalendar();
