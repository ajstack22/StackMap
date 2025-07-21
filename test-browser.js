
// Copy and paste this into browser console at localhost:8080

async function testStackMap() {
  console.log('🧪 Testing StackMap Web Version...');
  
  // Test 1: Check if onboarding shows for new user
  localStorage.clear();
  location.reload();
  await new Promise(r => setTimeout(r, 2000));
  
  const hasOnboarding = document.querySelector('[class*="onboarding"]');
  console.log('✓ Onboarding shows:', !!hasOnboarding);
  
  // Test 2: Check PWA
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    console.log('✓ Service Worker:', reg ? 'Registered' : 'Not registered');
  }
  
  // Test 3: Check responsive
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  console.log('✓ Viewport width:', vw, vw < 768 ? '(Mobile)' : '(Desktop)');
  
  console.log('\n📋 Manual checks needed:');
  console.log('- Carousel swipe/navigation works');
  console.log('- Buttons are properly spaced');
  console.log('- Import/Export functions work');
  console.log('- PIN rate limiting works (try 6 rapid attempts)');
}

testStackMap();
