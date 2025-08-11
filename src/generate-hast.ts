// generate-hash.ts
import bcrypt from "bcrypt";

(async () => {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);
  console.log("✅ Hash for 'admin123':", hash);
})();
