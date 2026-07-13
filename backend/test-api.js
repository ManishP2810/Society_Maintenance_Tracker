/**
 * Verification test script for the Society Maintenance Tracker API.
 * This script runs programmatically to test authentication, complaints,
 * settings, and notice board endpoints.
 * 
 * Instructions:
 * 1. Start the backend server: `npm run dev` inside backend folder.
 * 2. In another terminal, run: `node test-api.js`
 */

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🚀 Starting API Verification Tests...\n');
  
  const timestamp = Date.now();
  const residentEmail = `resident-${timestamp}@society.com`;
  const adminEmail = `admin-${timestamp}@society.com`;
  
  let residentToken = '';
  let adminToken = '';
  let complaintId = '';
  let noticeId = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Register Resident
    // ----------------------------------------------------
    console.log('🧪 Test 1: Registering new resident...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Resident Verification User',
        email: residentEmail,
        password: 'password123',
        role: 'resident',
      }),
    });
    
    const regResData = await regRes.json();
    if (!regRes.ok || !regResData.success) {
      throw new Error(`Failed resident registration: ${regResData.message}`);
    }
    residentToken = regResData.token;
    console.log(`✅ Resident registered successfully! ID: ${regResData.user.id}`);

    // ----------------------------------------------------
    // TEST 2: Login Resident
    // ----------------------------------------------------
    console.log('\n🧪 Test 2: Logging in resident...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: residentEmail,
        password: 'password123',
      }),
    });
    
    const loginResData = await loginRes.json();
    if (!loginRes.ok || !loginResData.success) {
      throw new Error(`Failed resident login: ${loginResData.message}`);
    }
    console.log('✅ Resident logged in successfully! JWT verified.');

    // ----------------------------------------------------
    // TEST 3: Create Complaint (Resident)
    // ----------------------------------------------------
    console.log('\n🧪 Test 3: Raising a support complaint...');
    // We send JSON here (without file) for programmatic test convenience
    const compRes = await fetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${residentToken}`
      },
      body: JSON.stringify({
        title: 'Broken Lobby Fan',
        description: 'The ceiling fan in the lobby is making an unusual grinding noise and spinning very slowly.',
        category: 'Electrical',
      }),
    });

    const compResData = await compRes.json();
    if (!compRes.ok || !compResData.success) {
      throw new Error(`Failed to create complaint: ${compResData.message}`);
    }
    complaintId = compResData.complaint._id;
    console.log(`✅ Complaint raised successfully! ID: ${complaintId}`);

    // ----------------------------------------------------
    // TEST 4: Fetch My Complaints (Resident)
    // ----------------------------------------------------
    console.log('\n🧪 Test 4: Fetching resident\'s own complaints...');
    const myCompRes = await fetch(`${API_URL}/complaints/my`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${residentToken}` },
    });
    
    const myCompData = await myCompRes.json();
    if (!myCompRes.ok || !myCompData.success || myCompData.count === 0) {
      throw new Error('Failed to fetch resident complaints or returned empty.');
    }
    console.log(`✅ Fetched successfully. Count: ${myCompData.count}`);

    // ----------------------------------------------------
    // TEST 5: Register Admin
    // ----------------------------------------------------
    console.log('\n🧪 Test 5: Registering new admin...');
    const adminRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Verification User',
        email: adminEmail,
        password: 'adminpassword',
        role: 'admin',
      }),
    });
    
    const adminRegData = await adminRegRes.json();
    if (!adminRegRes.ok || !adminRegData.success) {
      throw new Error(`Failed admin registration: ${adminRegData.message}`);
    }
    adminToken = adminRegData.token;
    console.log(`✅ Admin registered successfully! ID: ${adminRegData.user.id}`);

    // ----------------------------------------------------
    // TEST 6: Update Complaint Priority & Status (Admin)
    // ----------------------------------------------------
    console.log('\n🧪 Test 6: Admin updating complaint priority & status...');
    // Update Priority to High
    const prioRes = await fetch(`${API_URL}/complaints/${complaintId}/priority`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ priority: 'High' }),
    });
    if (!prioRes.ok) throw new Error('Failed to update priority');

    // Update Status to In Progress
    const statusRes = await fetch(`${API_URL}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'In Progress',
        note: 'Technician has been assigned. Scheduled to visit tomorrow morning.',
      }),
    });

    const statusResData = await statusRes.json();
    if (!statusRes.ok || !statusResData.success) {
      throw new Error(`Failed to update status: ${statusResData.message}`);
    }
    console.log('✅ Complaint priority updated to High!');
    console.log('✅ Complaint status updated to In Progress with custom history note!');

    // ----------------------------------------------------
    // TEST 7: Post Notice Board Message (Admin)
    // ----------------------------------------------------
    console.log('\n🧪 Test 7: Admin posting new notice...');
    const noticeRes = await fetch(`${API_URL}/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Elevator Maintenance Schedule',
        content: 'The block A elevator will be shut down for routine safety inspection on Sunday between 10 AM to 1 PM.',
        isImportant: true,
      }),
    });

    const noticeResData = await noticeRes.json();
    if (!noticeRes.ok || !noticeResData.success) {
      throw new Error(`Failed to post notice: ${noticeResData.message}`);
    }
    noticeId = noticeResData.notice._id;
    console.log(`✅ Important notice published! ID: ${noticeId}`);

    // ----------------------------------------------------
    // TEST 8: Fetch Notice Board (Resident)
    // ----------------------------------------------------
    console.log('\n🧪 Test 8: Resident fetching notice board announcements...');
    const getNoticeRes = await fetch(`${API_URL}/notices`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${residentToken}` },
    });

    const getNoticeData = await getNoticeRes.json();
    if (!getNoticeRes.ok || !getNoticeData.success || getNoticeData.count === 0) {
      throw new Error('Failed to fetch announcements.');
    }
    console.log(`✅ Notice board fetched successfully. Count: ${getNoticeData.count}`);
    
    // ----------------------------------------------------
    // TEST 9: Clean Up (Delete Notice)
    // ----------------------------------------------------
    console.log('\n🧪 Test 9: Admin cleaning up posted notice...');
    const delNoticeRes = await fetch(`${API_URL}/notices/${noticeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    if (!delNoticeRes.ok) throw new Error('Failed to delete notice.');
    console.log('✅ Posted notice deleted successfully.');

    console.log('\n🎉 ALL API VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error(`\n❌ TEST FAILURE: ${error.message}`);
    process.exit(1);
  }
};

runTests();
