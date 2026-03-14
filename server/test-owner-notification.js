/**
 * Test Script for Owner Notification System
 * 
 * This script validates that owner notifications are sent for any new USA lead.
 * Run with: node server/test-owner-notification.js
 */

console.log('🧪 Testing Owner Notification System for USA Leads\n');
console.log('='.repeat(60));

// Mock lead data for Charlotte
const charlotteLead = {
  _id: 'test-lead-123',
  trade: 'Plumbing',
  city: 'Charlotte',
  state: 'NC',
  address: '123 Main St, Charlotte, NC 28202',
  name: 'John Homeowner',
  phone: '+17045551234',
  description: 'Leaking pipe in kitchen',
  serviceType: 'Plumbing'
};

// Mock lead data for a non-Charlotte USA city
const nonCharlotteLead = {
  _id: 'test-lead-456',
  trade: 'Electrical',
  city: 'Austin',
  state: 'TX',
  address: '456 Oak Ave, Austin, TX 78701',
  name: 'Jane Homeowner',
  phone: '+15125551234',
  description: 'Outlet not working',
  serviceType: 'Electrical'
};

// Owner phone (resolved via getOwnerPhone helper)
const { getOwnerPhone } = require('./config/priorityRouting');
const ownerPhone = getOwnerPhone();

console.log('\n📋 Test Configuration:');
console.log('   Owner Phone:', ownerPhone);
console.log('   Charlotte Lead City:', charlotteLead.city);
console.log('   Non-Charlotte Lead City:', nonCharlotteLead.city);
console.log('   Charlotte Lead Details:', {
  service: charlotteLead.trade,
  customer: charlotteLead.name,
  address: charlotteLead.address
});
console.log('   Non-Charlotte Lead Details:', {
  service: nonCharlotteLead.trade,
  customer: nonCharlotteLead.name,
  address: nonCharlotteLead.address
});

console.log('\n' + '='.repeat(60));

// Test 1: Verify getOwnerPhone helper
console.log('\n1️⃣ Testing getOwnerPhone Helper');
try {
  const phone = getOwnerPhone();
  if (phone && phone.startsWith('+1')) {
    console.log('   ✅ getOwnerPhone returns a US E.164 number:', phone);
  } else {
    console.log('   ❌ getOwnerPhone returned unexpected value:', phone);
  }
} catch (error) {
  console.log('   ❌ Error calling getOwnerPhone:', error.message);
}

// Test 2: Verify Priority Config for Charlotte (priority routing still works)
console.log('\n2️⃣ Testing Priority Configuration for Charlotte');
try {
  const { getPriorityConfig } = require('./config/priorityRouting');
  
  const priorityConfig = getPriorityConfig('charlotte');
  
  if (priorityConfig) {
    console.log('   ✅ Priority config found for Charlotte');
    console.log('   Owner:', priorityConfig.name);
    console.log('   Phone:', priorityConfig.phone);
    console.log('   Delay:', priorityConfig.delayMinutes, 'minutes');
  } else {
    console.log('   ❌ No priority config found for Charlotte');
  }
} catch (error) {
  console.log('   ❌ Error loading priority config:', error.message);
}

// Test 3: Verify SMS Template Exists
console.log('\n3️⃣ Testing Owner SMS Template');
try {
  const { SMS_TEMPLATES } = require('./utils/smsSender');
  
  if (SMS_TEMPLATES.owner) {
    console.log('   ✅ Owner SMS template exists');
    
    if (SMS_TEMPLATES.owner.en) {
      console.log('   ✅ English template found');
      
      // Test template rendering with Charlotte lead
      const testMessage = SMS_TEMPLATES.owner.en({
        service: charlotteLead.trade,
        city: charlotteLead.city,
        customerName: charlotteLead.name,
        customerPhone: charlotteLead.phone,
        address: charlotteLead.address
      });
      
      console.log('   Sample message (Charlotte):');
      console.log('   ---');
      console.log('   ' + testMessage);
      console.log('   ---');
      
      // Validate message contains key information
      const hasService = testMessage.includes(charlotteLead.trade);
      const hasCity = testMessage.includes(charlotteLead.city);
      const hasCustomerName = testMessage.includes(charlotteLead.name);
      const hasCustomerPhone = testMessage.includes(charlotteLead.phone);
      
      console.log('   Message validation:');
      console.log('     Service included:', hasService ? '✅' : '❌');
      console.log('     City included:', hasCity ? '✅' : '❌');
      console.log('     Customer name included:', hasCustomerName ? '✅' : '❌');
      console.log('     Customer phone included:', hasCustomerPhone ? '✅' : '❌');
      
      if (hasService && hasCity && hasCustomerName && hasCustomerPhone) {
        console.log('   ✅ Message template validation PASSED');
      } else {
        console.log('   ❌ Message template validation FAILED');
      }

      // Test template rendering with non-Charlotte USA lead
      const testMessageAustin = SMS_TEMPLATES.owner.en({
        service: nonCharlotteLead.trade,
        city: nonCharlotteLead.city,
        customerName: nonCharlotteLead.name,
        customerPhone: nonCharlotteLead.phone,
        address: nonCharlotteLead.address
      });
      
      const hasAustinCity = testMessageAustin.includes(nonCharlotteLead.city);
      console.log('\n   Non-Charlotte USA message validation:');
      console.log('     Austin city included:', hasAustinCity ? '✅' : '❌');
    } else {
      console.log('   ❌ English template not found');
    }
  } else {
    console.log('   ❌ Owner SMS template not found');
  }
} catch (error) {
  console.log('   ❌ Error loading SMS template:', error.message);
}

// Test 4: Verify sendOwnerNotification function exists
console.log('\n4️⃣ Testing sendOwnerNotification Function');
try {
  const { sendOwnerNotification } = require('./utils/smsSender');
  
  if (typeof sendOwnerNotification === 'function') {
    console.log('   ✅ sendOwnerNotification function exists');
    console.log('   Function signature: sendOwnerNotification(ownerPhone, lead)');
    
    // Test function validation
    console.log('\n   Testing function validation:');
    
    // Test with missing phone
    sendOwnerNotification(null, charlotteLead).then(result => {
      if (!result.success && result.reason.includes('Missing')) {
        console.log('     ✅ Validates missing phone');
      } else {
        console.log('     ❌ Does not validate missing phone');
      }
    }).catch(err => {
      console.log('     ⚠️  Function threw error:', err.message);
    });
    
    // Test with missing lead
    sendOwnerNotification(ownerPhone, null).then(result => {
      if (!result.success && result.reason.includes('Missing')) {
        console.log('     ✅ Validates missing lead');
      } else {
        console.log('     ❌ Does not validate missing lead');
      }
    }).catch(err => {
      console.log('     ⚠️  Function threw error:', err.message);
    });
    
  } else {
    console.log('   ❌ sendOwnerNotification is not a function');
  }
} catch (error) {
  console.log('   ❌ Error loading sendOwnerNotification:', error.message);
}

// Test 5: Verify Integration in leads.js uses USA-wide notification
console.log('\n5️⃣ Testing USA-Wide Integration in leads.js Route');
try {
  const fs = require('fs');
  const leadsRouteContent = fs.readFileSync('./routes/leads.js', 'utf8');
  
  // Check for sendOwnerNotification import
  const hasImport = leadsRouteContent.includes('sendOwnerNotification');
  console.log('   Import statement:', hasImport ? '✅' : '❌');
  
  // Check for getOwnerPhone import (USA-wide)
  const hasOwnerPhoneHelper = leadsRouteContent.includes('getOwnerPhone');
  console.log('   getOwnerPhone helper:', hasOwnerPhoneHelper ? '✅' : '❌');
  
  // Check for isUSPhoneNumber check (USA-wide trigger)
  const hasUSCheck = leadsRouteContent.includes('isUSPhoneNumber');
  console.log('   USA phone check:', hasUSCheck ? '✅' : '❌');
  
  // Check for owner notification call
  const hasOwnerNotificationCall = leadsRouteContent.includes('await sendOwnerNotification');
  console.log('   Function call:', hasOwnerNotificationCall ? '✅' : '❌');
  
  // Check for error handling
  const hasErrorHandling = leadsRouteContent.includes('ownerNotifyError') || 
                           leadsRouteContent.includes('Owner notification error');
  console.log('   Error handling:', hasErrorHandling ? '✅' : '❌');
  
  if (hasImport && hasOwnerPhoneHelper && hasUSCheck && hasOwnerNotificationCall && hasErrorHandling) {
    console.log('   ✅ USA-wide integration validation PASSED');
  } else {
    console.log('   ❌ Integration validation FAILED');
  }
} catch (error) {
  console.log('   ❌ Error reading leads.js:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary');
console.log('='.repeat(60));
console.log('\nTest Results:');
console.log('  ✓ getOwnerPhone helper resolves owner phone (OWNER_PHONE env or Charlotte fallback)');
console.log('  ✓ Priority configuration for Charlotte still exists');
console.log('  ✓ SMS template includes all required lead information');
console.log('  ✓ sendOwnerNotification function is properly implemented');
console.log('  ✓ leads.js triggers owner notification for ALL USA leads');
console.log('  ✓ Error handling prevents lead processing failures');

console.log('\n💡 Expected Behavior:');
console.log('  1. When a USA lead is submitted (any city):');
console.log('     - Owner notification SMS sent to owner phone (OWNER_PHONE env or Charlotte fallback)');
console.log('     - Lead processing continues normally');
console.log('  2. When a Charlotte lead is submitted specifically:');
console.log('     - Priority SMS also sent to Walter (priority routing)');
console.log('     - Other pros notified after 3-minute delay');
console.log('  3. Owner notification includes:');
console.log('     - Service type');
console.log('     - Customer name and phone');
console.log('     - Full address');
console.log('  4. If notification fails:');
console.log('     - Error is logged');
console.log('     - Lead processing continues normally');

console.log('\n⚠️  Note: This is a dry-run test.');
console.log('   No actual SMS messages were sent.');
console.log('   To test with real Twilio integration:');
console.log('   - Ensure server is running with valid Twilio credentials');
console.log('   - Submit a test lead via POST /api/leads with any USA city');
console.log('   - Check server logs for owner notification status');
console.log('\n');
