import bcrypt from 'bcryptjs';

const verifyPassword = (plainPassword: string, hashedPassword: string) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

console.log(verifyPassword("123", "$2b$12$7xYnvUMcZ/vW73KDbW1C8OZxSftI.KiRk83KbUI/urKJMFWX2wjWO"));
