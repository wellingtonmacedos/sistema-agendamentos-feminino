const bcrypt = require('bcryptjs');

const run = async () => {
    const password = 'super123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Match (should be true):', isMatch);
};

run();
