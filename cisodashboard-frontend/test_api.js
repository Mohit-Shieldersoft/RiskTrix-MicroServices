import vendorApi from '../src/utils/vendorApi.js';

// Test script to verify vendor API integration
const testVendorApi = async () => {
  console.log('🧪 Testing Vendor API Integration...\n');

  try {
    // Test 1: Get compliance standards
    console.log('1️⃣ Testing compliance standards...');
    const standards = await vendorApi.getComplianceStandards();
    console.log('✅ Standards loaded:', standards.standards?.length || 0);

    // Test 2: Get existing vendors
    console.log('\n2️⃣ Testing vendor list...');
    const vendors = await vendorApi.getVendors();
    console.log('✅ Vendors loaded:', vendors.vendors?.length || 0);
    
    // Test 3: Create a new vendor
    console.log('\n3️⃣ Testing vendor creation...');
    const newVendorData = {
      name: `Test Vendor ${Date.now()}`,
      description: 'A test vendor for API integration verification',
      category: 'security_vendor',
      contact_email: 'test@example.com',
      website: 'https://example.com',
      standard: 'ISO27001'
    };

    const newVendor = await vendorApi.createVendor(newVendorData);
    console.log('✅ Vendor created:', newVendor.name, `(ID: ${newVendor.id})`);

    // Test 4: Update the vendor
    console.log('\n4️⃣ Testing vendor update...');
    const updatedVendor = await vendorApi.updateVendor(newVendor.id, {
      ...newVendorData,
      description: 'Updated test vendor description',
      risk_level: 'low'
    });
    console.log('✅ Vendor updated:', updatedVendor.name);

    // Test 5: Get vendor details
    console.log('\n5️⃣ Testing vendor details...');
    const vendorDetails = await vendorApi.getVendorById(newVendor.id);
    console.log('✅ Vendor details loaded:', vendorDetails.name);

    console.log('\n🎉 All tests passed! API integration is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testVendorApi();