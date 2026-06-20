import axios from 'axios';

const API_URL = "http://127.0.0.1:8000/api/v1/users";

const seedUsers = async () => {
  const instructor = {
    email: "instructor@stjosephs.edu",
    password: "password123",
    full_name: "Master Instructor",
    role: "instructor",
    phone_number: "9876543210"
  };

  const student = {
    email: "student@stjosephs.edu",
    password: "password123",
    full_name: "Test Student",
    role: "student",
    phone_number: "9123456789"
  };

  console.log("🌱 Seeding Database...");

  try {
    const res = await axios.post(API_URL, instructor);
    if (res.status === 201) {
      console.log("✅ Instructor Created: instructor@stjosephs.edu / securepassword");
    }
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log("⚠️ Instructor already exists.");
    } else {
      console.log(`❌ Failed to create instructor: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
  }

  try {
    const res = await axios.post(API_URL, student);
    if (res.status === 201) {
      console.log("✅ Student Created: student@stjosephs.edu / securepassword");
    }
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log("⚠️ Student already exists.");
    } else {
      console.log(`❌ Failed to create student: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
  }
};

if (require.main === module) {
  seedUsers();
}
