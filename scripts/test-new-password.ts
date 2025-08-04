import bcrypt from 'bcrypt';

async function testNewPassword() {
  const password = 'admin123';
  const hash = '$2b$10$EjQhZKeFx4dS1JH8yrztC.NHxnl5iyHHEOQYhLK6oBOlbp6d5E6Fu';
  
  const result = await bcrypt.compare(password, hash);
  console.log('Password test result:', result);
  
  // Generate a new hash to be sure
  const newHash = await bcrypt.hash('admin123', 10);
  console.log('New hash:', newHash);
  
  const newResult = await bcrypt.compare('admin123', newHash);
  console.log('New hash test:', newResult);
}

testNewPassword().catch(console.error);